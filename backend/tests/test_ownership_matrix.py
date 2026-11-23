"""Matriks kepemilikan (Q24): user B memanggil SETIAP endpoint pemilik pada objek user A -> 404."""
import pytest

from tests.conftest import A, B, VALID_DATA, auth

OWNER_ENDPOINTS = [  # (method, path template, body) ; {inv} {guest} {rsvp} {job} {order} {asset}
    ("GET", "/api/invitations/{inv}", None),
    ("PATCH", "/api/invitations/{inv}", {"data": VALID_DATA}),
    ("DELETE", "/api/invitations/{inv}", None),
    ("POST", "/api/invitations/{inv}/rollback", None),
    ("POST", "/api/invitations/{inv}/generate", None),
    ("POST", "/api/invitations/{inv}/assets/upload-url", {"kind": "cover", "content_type": "image/jpeg", "size_bytes": 10}),
    ("POST", "/api/invitations/{inv}/assets/{asset}/confirm", None),
    ("DELETE", "/api/invitations/{inv}/assets/{asset}", None),
    ("GET", "/api/invitations/{inv}/guests", None),
    ("POST", "/api/invitations/{inv}/guests", {"name": "X"}),
    ("POST", "/api/invitations/{inv}/guests/bulk", {"guests": [{"name": "X"}]}),
    ("PATCH", "/api/guests/{guest}", {"name": "Y"}),
    ("DELETE", "/api/guests/{guest}", None),
    ("GET", "/api/invitations/{inv}/rsvps", None),
    ("PATCH", "/api/rsvps/{rsvp}", {"is_hidden": True}),
    ("GET", "/api/jobs/{job}", None),
    ("POST", "/api/payments/orders", {"invitation_id": "{inv}"}),
    ("GET", "/api/payments/orders/{order}", None),
]


@pytest.fixture
def world(db, make_inv):
    inv = make_inv(plan="premium")
    db.table("guests").insert({"invitation_id": inv["id"], "name": "Pak Joko"}).execute()
    db.table("rsvps").insert({"invitation_id": inv["id"], "guest_name": "Pak Joko", "attendance": "hadir"}).execute()
    db.table("generation_jobs").insert({"invitation_id": inv["id"], "user_id": A["id"], "input_snapshot": {},
                                        "status": "succeeded"}).execute()
    db.table("orders").insert({"midtrans_order_id": "carta-x", "invitation_id": inv["id"], "user_id": A["id"],
                               "amount": 99000, "status": "paid"}).execute()
    db.table("invitation_assets").insert({"invitation_id": inv["id"], "kind": "cover", "storage_path": "p/c.jpg",
                                          "content_type": "image/jpeg", "size_bytes": 1}).execute()
    return {"inv": inv["id"], "guest": db.tables["guests"][0]["id"], "rsvp": db.tables["rsvps"][0]["id"],
            "job": db.tables["generation_jobs"][0]["id"], "order": db.tables["orders"][0]["id"],
            "asset": db.tables["invitation_assets"][0]["id"]}


def fill(v, ids):
    if isinstance(v, str):
        return v.format(**ids)
    if isinstance(v, dict):
        return {k: fill(x, ids) for k, x in v.items()}
    return v


@pytest.mark.parametrize("method,path,body", OWNER_ENDPOINTS)
def test_user_b_gets_404(client, world, db, method, path, body):
    r = client.request(method, fill(path, world), headers=auth(B), json=fill(body, world))
    assert r.status_code == 404, (method, path, r.text)
    assert r.json()["error"]["code"] == "not_found"
    # tidak ada efek samping pada data A
    assert len(db.tables["invitations"]) == 1 and len(db.tables["guests"]) == 1 and len(db.tables["rsvps"]) == 1


@pytest.mark.parametrize("method,path,body", OWNER_ENDPOINTS)
def test_anonymous_gets_401(client, world, method, path, body):
    r = client.request(method, fill(path, world), json=fill(body, world))
    assert r.status_code == 401


def test_matrix_covers_all_id_routes():
    """Setiap route pemilik di OpenAPI yang memakai path-param id harus ada di matriks."""
    from app.main import app
    covered = {(m, p) for m, p, _ in OWNER_ENDPOINTS}
    norm = lambda p: p.replace("{inv_id}", "{inv}").replace("{guest_id}", "{guest}").replace(  # noqa: E731
        "{rsvp_id}", "{rsvp}").replace("{job_id}", "{job}").replace("{order_id}", "{order}").replace("{asset_id}", "{asset}")
    for path, ops in app.openapi()["paths"].items():
        if not path.startswith("/api/") or "/public/" in path or "{" not in path:
            continue
        for method in ops:
            if method.upper() not in {"GET", "POST", "PATCH", "DELETE"}:
                continue
            assert (method.upper(), norm(path)) in covered, f"{method.upper()} {path} belum ada di matriks"
