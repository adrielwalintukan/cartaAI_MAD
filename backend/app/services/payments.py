"""Pembayaran Midtrans (06 §9). Webhook idempoten; aturan status satu tempat."""
import hashlib
import hmac
import logging
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from uuid import uuid4

import midtransclient

from app.config import Settings
from app.deps import AuthUser
from app.errors import AppError, not_found
from app.repos import invitations as inv_repo
from app.repos import orders as repo
from app.repos.common import is_unique_violation, now, parse_ts

log = logging.getLogger(__name__)

# Transaksi Snap berlaku 24 jam di Midtrans. Order pending dipakai ulang hanya selama masih ada >= 1 jam, agar pengguna tidak
# diberi tautan yang hampir kedaluwarsa. Order yang sudah diganti tetap bisa dibayar sampai Midtrans menutupnya; settlement
# terlambat tetap mengaktifkan Premium karena RPC mark_order_paid menerima order 'expired'.
_MIDTRANS_EXPIRY_HOURS = 24
_REUSE_HOURS = _MIDTRANS_EXPIRY_HOURS - 1
_MAX_WEBHOOK_BYTES = 64 * 1024


def signature(order_id: str, status_code: str, gross: str, server_key: str) -> str:
    return hashlib.sha512(f"{order_id}{status_code}{gross}{server_key}".encode()).hexdigest()


def verify_signature(p: dict, server_key: str) -> bool:
    try:
        want = signature(str(p["order_id"]), str(p["status_code"]), str(p["gross_amount"]), server_key)
    except KeyError:
        return False
    return hmac.compare_digest(want, str(p.get("signature_key", "")))


def _create_snap(s: Settings, params: dict) -> dict:
    return midtransclient.Snap(is_production=s.midtrans_is_production,
                               server_key=s.midtrans_server_key).create_transaction(params)


def _fetch_status(s: Settings, midtrans_order_id: str) -> dict:
    return midtransclient.CoreApi(is_production=s.midtrans_is_production,
                                  server_key=s.midtrans_server_key).transactions.status(midtrans_order_id)


def _client_status(status: str) -> str:
    """Pembayaran ganda tetap uang yang diterima dan Premium aktif: klien melihat 'paid' (rincian hanya internal)."""
    return "paid" if status == "duplicate" else status


def _view(o: dict) -> dict:
    return {"order_id": o["id"], "midtrans_order_id": o["midtrans_order_id"], "amount": o["amount"],
            "status": _client_status(o["status"]), "redirect_url": o.get("redirect_url"), "snap_token": o.get("snap_token")}


def create_order(db, s: Settings, user: AuthUser, invitation_id: str) -> tuple[dict, bool]:
    """Kembalikan (order, baru?)."""
    inv = inv_repo.get_owned(db, invitation_id, user.id)
    if not inv:
        raise not_found("Undangan")
    if inv["plan"] == "premium":
        raise AppError("already_premium", 409, "Undangan ini sudah Premium.")
    pending = repo.pending_for(db, invitation_id)
    if pending:
        if pending.get("redirect_url") and now() - parse_ts(pending["created_at"]) < timedelta(hours=_REUSE_HOURS):
            return _view(pending), False
        repo.update_if_status(db, pending["id"], "pending", {"status": "expired"})
    oid = str(uuid4())
    mid = f"carta-{oid}"
    try:
        order = repo.insert(db, {"id": oid, "midtrans_order_id": mid, "invitation_id": invitation_id,
                                 "user_id": user.id, "amount": s.premium_price_idr})
    except Exception as exc:
        if is_unique_violation(exc):  # balapan: order pending lain baru dibuat
            existing = repo.pending_for(db, invitation_id)
            if existing:
                return _view(existing), False
        raise
    params = {
        "transaction_details": {"order_id": mid, "gross_amount": s.premium_price_idr},
        "item_details": [{"id": "premium", "name": "Undangan Premium CartaAI", "price": s.premium_price_idr,
                          "quantity": 1}],
        "customer_details": {"email": user.email} if user.email else {},
        "callbacks": {"finish": f"{s.web_base_url.rstrip('/')}/app/pembayaran/{oid}"},
        "expiry": {"unit": "hours", "duration": _MIDTRANS_EXPIRY_HOURS},
    }
    try:
        res = _create_snap(s, params)
    except Exception:
        log.error("Midtrans create_transaction gagal order=%s", oid, exc_info=True)
        repo.update_if_status(db, oid, "pending", {"status": "failed"})
        raise AppError("payment_gateway_error", 502, "Gagal menghubungi layanan pembayaran.") from None
    order = repo.update_if_status(db, oid, "pending",
                                  {"snap_token": res.get("token"), "redirect_url": res.get("redirect_url")}) or order
    return _view(order), True


def decide(tx_status: str, fraud: str | None) -> str | None:
    """Aturan status 06 §9. None = abaikan."""
    if tx_status == "settlement":
        return "paid"
    if tx_status == "capture":
        if fraud in (None, "", "accept"):
            return "paid"
        return "failed" if fraud == "deny" else "pending"
    if tx_status in ("pending", "authorize"):
        return "pending"
    if tx_status in ("deny", "cancel", "failure"):
        return "failed"
    if tx_status == "expire":
        return "expired"
    if tx_status in ("refund", "chargeback"):
        return "refunded"
    if tx_status == "partial_refund":
        return "partial_refund"  # Premium tetap aktif; dicatat untuk ditinjau manual
    return None


def apply_status(db, s: Settings, order: dict, p: dict) -> str:
    """Terapkan notifikasi/sinkronisasi secara idempoten. Kembalikan status order akhir."""
    tx = str(p.get("transaction_status", ""))
    fraud, ptype, tid = p.get("fraud_status"), p.get("payment_type"), p.get("transaction_id")
    outcome = decide(tx, fraud)
    mid = order["midtrans_order_id"]
    if outcome == "paid":
        # False bila sudah diproses ATAU pembayaran ganda (undangan sudah punya order paid lain; DB menandainya 'duplicate').
        if not repo.mark_paid(db, mid, tid, ptype, fraud, s.premium_active_days):
            cur = repo.get_by_midtrans_id(db, mid)
            if cur and cur["status"] == "duplicate" and order["status"] != "duplicate":
                log.error("PEMBAYARAN GANDA order=%s untuk undangan %s: perlu refund manual di Midtrans",
                          mid, order["invitation_id"])
    elif outcome in ("failed", "expired"):
        repo.update_if_status(db, order["id"], "pending", {"status": outcome, "transaction_status": tx,
                                                           "fraud_status": fraud, "payment_type": ptype})
    elif outcome == "refunded":
        # Atomik di DB: order -> refunded dan Premium dicabut (undangan kembali Gratis).
        if repo.refund_order(db, mid, tx, s.free_active_days):
            log.warning("order %s %s: Premium dicabut", mid, tx)
    elif outcome == "partial_refund":
        log.warning("order %s partial_refund: Premium tetap aktif, perlu tinjauan manual", mid)
    elif outcome == "pending":
        repo.update_if_status(db, order["id"], "pending", {"transaction_status": tx, "fraud_status": fraud,
                                                           "payment_type": ptype})
    latest = repo.get_by_midtrans_id(db, mid)
    return latest["status"] if latest else order["status"]


def _amount_matches(order: dict, p: dict) -> bool:
    try:
        return Decimal(str(p.get("gross_amount"))) == Decimal(order["amount"])
    except InvalidOperation:
        return False


def handle_webhook(db, s: Settings, payload: dict) -> dict:
    # Endpoint publik: tolak dulu bila signature salah; hanya notifikasi asli yang dicatat (tak ada tulisan DB tanpa autentikasi).
    if not verify_signature(payload, s.midtrans_server_key):
        log.warning("webhook ditolak: signature tidak valid order=%s", str(payload.get("order_id"))[:80])
        raise AppError("invalid_signature", 403, "Signature tidak valid.")
    repo.log_event(db, payload.get("order_id"), "webhook", payload)
    order = repo.get_by_midtrans_id(db, str(payload["order_id"]))
    if not order:
        log.info("webhook untuk order tak dikenal: %s", payload.get("order_id"))
        return {"status": "ignored"}
    if not _amount_matches(order, payload):
        log.warning("webhook nominal berbeda order=%s", order["midtrans_order_id"])
        return {"status": "ignored"}
    apply_status(db, s, order, payload)
    return {"status": "ok"}


def get_order(db, s: Settings, user: AuthUser, order_id: str) -> dict:
    order = repo.get_owned(db, order_id, user.id)
    if not order:
        raise not_found("Pesanan")
    if order["status"] == "pending":
        try:
            st = _fetch_status(s, order["midtrans_order_id"])
        except Exception:
            log.info("sinkronisasi status Midtrans gagal order=%s", order["id"], exc_info=True)
            st = None
        # Order yang belum pernah dibayar di Midtrans membalas 404 / status kosong; abaikan.
        if st and st.get("transaction_status") and _amount_matches(order, st):
            repo.log_event(db, order["midtrans_order_id"], "sync", st)
            apply_status(db, s, order, st)
            order = repo.get_owned(db, order_id, user.id) or order
    inv = inv_repo.get_owned(db, order["invitation_id"], user.id)
    return {"order_id": order["id"], "invitation_id": order["invitation_id"], "status": _client_status(order["status"]),
            "amount": order["amount"], "paid_at": order.get("paid_at"),
            "invitation_plan": inv["plan"] if inv else None}
