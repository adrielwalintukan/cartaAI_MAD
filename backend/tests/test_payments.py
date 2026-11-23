import pytest

from app.services import payments as svc
from tests.conftest import A, B, auth

KEY = "mid-server-key"


@pytest.fixture
def snap(monkeypatch):
    calls = []

    def fake(s, params):
        calls.append(params)
        return {"token": "snap-tok", "redirect_url": "https://app.sandbox.midtrans.com/snap/v4/redirect/snap-tok"}

    monkeypatch.setattr(svc, "_create_snap", fake)
    return calls


def new_order(client, inv, user=A):
    return client.post("/api/payments/orders", headers=auth(user), json={"invitation_id": inv["id"]})


def notif(order, status="settlement", gross="99000.00", code="200", key=KEY, **extra):
    mid = order["midtrans_order_id"]
    return {"order_id": mid, "status_code": code, "gross_amount": gross, "transaction_status": status,
            "transaction_id": "tx-1", "payment_type": "bank_transfer",
            "signature_key": svc.signature(mid, code, gross, key), **extra}


def hook(client, payload):
    return client.post("/api/payments/webhook", json=payload)


@pytest.fixture
def order(client, make_inv, snap):
    inv = make_inv()
    return inv, new_order(client, inv).json()


def test_create_order(client, make_inv, snap, db):
    inv = make_inv()
    r = new_order(client, inv)
    j = r.json()
    assert r.status_code == 201 and j["amount"] == 99000 and j["midtrans_order_id"].startswith("carta-")
    assert j["redirect_url"].startswith("https://app.sandbox.midtrans.com")
    p = snap[0]
    assert p["transaction_details"]["gross_amount"] == 99000 and "notification_url" not in p
    assert p["callbacks"]["finish"] == f"https://web.test/app/pembayaran/{j['order_id']}"


def test_pending_order_reused(client, make_inv, snap):
    inv = make_inv()
    first = new_order(client, inv).json()
    r = new_order(client, inv)
    assert r.status_code == 200 and r.json()["order_id"] == first["order_id"] and len(snap) == 1


def test_already_premium_and_other_user(client, make_inv, snap):
    r = new_order(client, make_inv(plan="premium"))
    assert r.status_code == 409 and r.json()["error"]["code"] == "already_premium"
    assert new_order(client, make_inv(slug="lain-lain"), B).status_code == 404


def test_gateway_error_marks_failed(client, make_inv, monkeypatch, db):
    monkeypatch.setattr(svc, "_create_snap", lambda *a: (_ for _ in ()).throw(RuntimeError("down")))
    r = new_order(client, make_inv())
    assert r.status_code == 502 and db.tables["orders"][0]["status"] == "failed"


def test_bad_signature_403(client, order, db):
    inv, o = order
    bad = notif(o, key="kunci-salah")
    r = hook(client, bad)
    assert r.status_code == 403 and r.json()["error"]["code"] == "invalid_signature"
    assert db.one("orders", id=o["order_id"])["status"] == "pending"
    assert hook(client, {"order_id": "x"}).status_code == 403
    assert client.post("/api/payments/webhook", content=b"bukan json").status_code == 403


def test_settlement_activates_premium(client, order, db):
    inv, o = order
    assert hook(client, notif(o)).json() == {"status": "ok"}
    row = db.one("invitations", id=inv["id"])
    assert db.one("orders", id=o["order_id"])["status"] == "paid" and row["plan"] == "premium"
    days = (__import__("datetime").datetime.fromisoformat(row["expires_at"])
            - __import__("datetime").datetime.now(__import__("datetime").timezone.utc)).days
    assert 363 <= days <= 365


def test_idempotent_double_delivery(client, order, db):
    inv, o = order
    hook(client, notif(o))
    paid_at = db.one("orders", id=o["order_id"])["paid_at"]
    exp = db.one("invitations", id=inv["id"])["expires_at"]
    assert hook(client, notif(o)).status_code == 200
    assert db.one("orders", id=o["order_id"])["paid_at"] == paid_at and db.one("invitations", id=inv["id"])["expires_at"] == exp
    assert len(db.tables["payment_events"]) == 2  # kedua kiriman tercatat sebagai audit


def test_B6_capture_without_fraud_status_paid(client, order, db):
    _, o = order
    hook(client, notif(o, status="capture"))
    assert db.one("orders", id=o["order_id"])["status"] == "paid"


def test_capture_challenge_stays_pending(client, order, db):
    inv, o = order
    hook(client, notif(o, status="capture", fraud_status="challenge"))
    assert db.one("orders", id=o["order_id"])["status"] == "pending" and db.one("invitations", id=inv["id"])["plan"] == "free"


def test_capture_deny_failed(client, order, db):
    _, o = order
    hook(client, notif(o, status="capture", fraud_status="deny"))
    assert db.one("orders", id=o["order_id"])["status"] == "failed"


def test_expire_after_settlement_stays_paid(client, order, db):
    _, o = order
    hook(client, notif(o))
    hook(client, notif(o, status="expire"))
    assert db.one("orders", id=o["order_id"])["status"] == "paid"


def test_pending_after_settlement_ignored(client, order, db):
    _, o = order
    hook(client, notif(o))
    hook(client, notif(o, status="pending"))
    row = db.one("orders", id=o["order_id"])
    assert row["status"] == "paid" and row["transaction_status"] == "settlement"


def test_expire_and_cancel_from_pending(client, order, db):
    _, o = order
    hook(client, notif(o, status="expire"))
    assert db.one("orders", id=o["order_id"])["status"] == "expired"


def test_amount_mismatch_ignored(client, order, db):
    inv, o = order
    assert hook(client, notif(o, gross="1000.00")).json() == {"status": "ignored"}
    assert db.one("invitations", id=inv["id"])["plan"] == "free"


def test_unknown_order_ignored(client, order):
    _, o = order
    assert hook(client, notif({"midtrans_order_id": "carta-tidak-ada"})).json() == {"status": "ignored"}


def test_db_error_returns_500(client, order, monkeypatch):
    _, o = order
    monkeypatch.setattr("app.repos.orders.mark_paid", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("db down")))
    assert hook(client, notif(o)).status_code == 500


def test_refund_marks_refunded(client, order, db):
    _, o = order
    hook(client, notif(o))
    hook(client, notif(o, status="refund"))
    assert db.one("orders", id=o["order_id"])["status"] == "refunded"


def test_get_order_syncs_with_midtrans(client, order, db, monkeypatch):
    inv, o = order
    monkeypatch.setattr(svc, "_fetch_status", lambda s, mid: {"transaction_status": "settlement", "gross_amount": "99000.00",
                                                              "payment_type": "qris", "transaction_id": "t"})
    r = client.get(f"/api/payments/orders/{o['order_id']}", headers=auth(A))
    assert r.json()["status"] == "paid" and r.json()["invitation_plan"] == "premium"
    assert db.tables["payment_events"][-1]["source"] == "sync"


def test_get_order_midtrans_down_still_pending(client, order, monkeypatch):
    _, o = order
    monkeypatch.setattr(svc, "_fetch_status", lambda *a: (_ for _ in ()).throw(RuntimeError("404")))
    assert client.get(f"/api/payments/orders/{o['order_id']}", headers=auth(A)).json()["status"] == "pending"


def test_get_order_other_user_404(client, order):
    _, o = order
    assert client.get(f"/api/payments/orders/{o['order_id']}", headers=auth(B)).status_code == 404


def test_no_hardcoded_price_or_sandbox():
    import pathlib
    root = pathlib.Path(__file__).parent.parent / "app"
    text = "\n".join(p.read_text(encoding="utf-8") for p in root.rglob("*.py") if p.name != "config.py")  # default env hanya di config.py
    assert "99000" not in text and "is_production=False" not in text


# ---- Review PR #1: pembayaran terlambat, refund/chargeback, webhook palsu
def _age_order(db, order_id, hours):
    from datetime import datetime, timedelta, timezone
    db.one("orders", id=order_id)["created_at"] = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()


def test_late_settlement_after_order_replaced_still_activates_premium(client, order, db, make_inv):
    inv, o = order
    _age_order(db, o["order_id"], 23.5)  # lewat jendela pakai-ulang, tetapi transaksi Midtrans masih berlaku
    replacement = new_order(client, inv).json()
    assert replacement["order_id"] != o["order_id"]
    assert db.one("orders", id=o["order_id"])["status"] == "expired"
    # pengguna membayar lewat tautan lama; settlement tiba setelah order internal 'expired'
    assert hook(client, notif(o)).json() == {"status": "ok"}
    assert db.one("orders", id=o["order_id"])["status"] == "paid"
    assert db.one("invitations", id=inv["id"])["plan"] == "premium"
    assert db.one("orders", id=replacement["order_id"])["status"] == "expired"  # tidak ada dua order pending


def test_late_settlement_is_idempotent(client, order, db):
    inv, o = order
    _age_order(db, o["order_id"], 23.5)
    new_order(client, inv)
    hook(client, notif(o))
    paid_at = db.one("orders", id=o["order_id"])["paid_at"]
    hook(client, notif(o))
    assert db.one("orders", id=o["order_id"])["paid_at"] == paid_at


def test_invalid_signature_writes_nothing(client, order, db):
    _, o = order
    assert hook(client, notif(o, key="kunci-salah")).status_code == 403
    assert hook(client, {"order_id": o["midtrans_order_id"]}).status_code == 403
    assert client.post("/api/payments/webhook", content=b"[]").status_code == 403
    assert db.tables["payment_events"] == []  # endpoint publik tidak boleh menulis DB tanpa signature valid


def test_valid_signature_is_logged(client, order, db):
    _, o = order
    hook(client, notif(o))
    assert len(db.tables["payment_events"]) == 1 and db.tables["payment_events"][0]["source"] == "webhook"


def test_oversized_webhook_rejected_without_db_write(client, order, db):
    _, o = order
    big = notif(o, padding="x" * 70_000)
    r = hook(client, big)
    assert r.status_code == 413 and db.tables["payment_events"] == []


@pytest.mark.parametrize("status", ["refund", "chargeback"])
def test_full_refund_and_chargeback_revoke_premium(client, order, db, status):
    inv, o = order
    hook(client, notif(o))
    assert db.one("invitations", id=inv["id"])["plan"] == "premium"
    assert hook(client, notif(o, status=status)).json() == {"status": "ok"}
    assert db.one("orders", id=o["order_id"])["status"] == "refunded"
    row = db.one("invitations", id=inv["id"])
    assert row["plan"] == "free"
    from datetime import datetime, timezone
    assert (datetime.fromisoformat(row["expires_at"]) - datetime.now(timezone.utc)).days <= 30  # masa aktif paket Gratis


def test_partial_refund_keeps_premium_and_paid_order(client, order, db):
    inv, o = order
    hook(client, notif(o))
    assert hook(client, notif(o, status="partial_refund")).json() == {"status": "ok"}
    assert db.one("orders", id=o["order_id"])["status"] == "paid"
    assert db.one("invitations", id=inv["id"])["plan"] == "premium"


def test_refund_twice_is_idempotent_and_unpaid_refund_ignored(client, order, db, make_inv, snap):
    inv, o = order
    hook(client, notif(o, status="refund"))  # belum pernah paid: tidak mengubah apa pun
    assert db.one("orders", id=o["order_id"])["status"] == "pending"
    hook(client, notif(o))
    hook(client, notif(o, status="refund"))
    hook(client, notif(o, status="refund"))
    assert db.one("orders", id=o["order_id"])["status"] == "refunded" and db.one("invitations", id=inv["id"])["plan"] == "free"


# ---- Re-review PR #1: pembayaran ganda dan batas body webhook
def _replaced_pair(client, inv, db, o):
    _age_order(db, o["order_id"], 23.5)
    replacement = new_order(client, inv).json()
    assert replacement["order_id"] != o["order_id"]
    return replacement


def test_old_order_settling_after_replacement_paid_is_flagged_duplicate_not_paid(client, order, db):
    inv, o = order
    replacement = _replaced_pair(client, inv, db, o)
    assert hook(client, notif(replacement)).json() == {"status": "ok"}  # pengganti lunas lebih dulu
    expires = db.one("invitations", id=inv["id"])["expires_at"]
    assert hook(client, notif(o)).json() == {"status": "ok"}  # settlement order lama menyusul
    assert db.one("orders", id=replacement["order_id"])["status"] == "paid"
    assert db.one("orders", id=o["order_id"])["status"] == "duplicate"
    assert [x["status"] for x in db.tables["orders"]].count("paid") == 1
    assert db.one("invitations", id=inv["id"])["expires_at"] == expires  # masa aktif tidak diperpanjang lagi


def test_duplicate_payment_is_logged_for_manual_refund_and_idempotent(client, order, db, caplog):
    inv, o = order
    replacement = _replaced_pair(client, inv, db, o)
    hook(client, notif(replacement))
    with caplog.at_level("ERROR"):
        hook(client, notif(o))
    assert "PEMBAYARAN GANDA" in caplog.text and "refund manual" in caplog.text
    caplog.clear()
    with caplog.at_level("ERROR"):
        hook(client, notif(o))  # pengiriman ulang tidak mencatat atau mengubah lagi
    assert "PEMBAYARAN GANDA" not in caplog.text and db.one("orders", id=o["order_id"])["status"] == "duplicate"


def test_client_sees_paid_for_duplicate_order(client, order, db):
    inv, o = order
    replacement = _replaced_pair(client, inv, db, o)
    hook(client, notif(replacement))
    hook(client, notif(o))
    r = client.get(f"/api/payments/orders/{o['order_id']}", headers=auth(A)).json()
    assert r["status"] == "paid" and r["invitation_plan"] == "premium"


def test_refunding_the_duplicate_does_not_revoke_valid_premium(client, order, db):
    inv, o = order
    replacement = _replaced_pair(client, inv, db, o)
    hook(client, notif(replacement))
    hook(client, notif(o))
    hook(client, notif(o, status="refund"))  # refund pembayaran ganda di Midtrans
    assert db.one("orders", id=o["order_id"])["status"] == "duplicate"
    assert db.one("orders", id=replacement["order_id"])["status"] == "paid"
    assert db.one("invitations", id=inv["id"])["plan"] == "premium"


def test_second_purchase_after_full_refund_is_not_duplicate(client, order, db, snap):
    inv, o = order
    hook(client, notif(o))
    hook(client, notif(o, status="refund"))  # undangan kembali Gratis
    again = new_order(client, inv).json()
    hook(client, notif(again))
    assert db.one("orders", id=again["order_id"])["status"] == "paid"
    assert db.one("invitations", id=inv["id"])["plan"] == "premium"


def test_chunked_oversized_webhook_is_cut_off_without_db_write(client, order, db):
    _, o = order
    chunks = (b"x" * 20_000 for _ in range(10))  # tanpa Content-Length: dibaca bertahap lalu dihentikan di batas
    r = client.post("/api/payments/webhook", content=chunks)
    assert r.status_code == 413 and db.tables["payment_events"] == []


def test_declared_oversized_content_length_rejected_early(client, order):
    import app.routers.payments as router
    from starlette.requests import Request
    import asyncio

    consumed = []

    async def stream():
        consumed.append(1)
        yield b"{}"

    req = Request({"type": "http", "headers": [(b"content-length", b"999999")]})
    req.stream = stream  # type: ignore[method-assign]
    with pytest.raises(router.AppError) as e:
        asyncio.run(router._read_limited(req, 64 * 1024))
    assert e.value.status == 413 and consumed == []  # ditolak dari header, body tidak dibaca


def test_normal_webhook_still_accepted_with_streaming_reader(client, order, db):
    _, o = order
    assert hook(client, notif(o)).json() == {"status": "ok"} and db.one("orders", id=o["order_id"])["status"] == "paid"
