from app.services import assets as svc
from tests.conftest import A, B, auth


def up(client, inv, user=A, **kw):
    body = {"kind": "cover", "content_type": "image/jpeg", "size_bytes": 1000, **kw}
    return client.post(f"/api/invitations/{inv['id']}/assets/upload-url", headers=auth(user), json=body)


def test_free_rejected(client, make_inv):
    assert up(client, make_inv()).status_code == 403


def test_not_owner_404(client, make_inv):
    assert up(client, make_inv(plan="premium"), user=B).status_code == 404


def test_mime_size_limits(client, make_inv):
    inv = make_inv(plan="premium")
    assert up(client, inv, content_type="image/gif").status_code == 415
    assert up(client, inv, content_type="audio/mpeg").status_code == 415
    assert up(client, inv, size_bytes=5 * 1024 * 1024 + 1).status_code == 413
    assert up(client, inv, kind="music", content_type="audio/mpeg", size_bytes=6 * 1024 * 1024).status_code == 201
    assert up(client, inv, kind="music", content_type="audio/mpeg", size_bytes=11 * 1024 * 1024).status_code == 413


def test_gallery_limit(client, make_inv):
    inv = make_inv(plan="premium")
    for _ in range(10):
        assert up(client, inv, kind="gallery").status_code == 201
    r = up(client, inv, kind="gallery")
    assert r.status_code == 403 and r.json()["error"]["code"] == "asset_limit_reached"


def test_upload_url_shape(client, make_inv):
    inv = make_inv(plan="premium")
    j = up(client, inv).json()
    assert j["upload"]["path"] == f"invitations/{inv['id']}/cover/{j['asset_id']}.jpg"
    assert j["upload"]["token"] == "tok" and j["upload"]["bucket"] == "invitation-assets"


def test_confirm_missing_object(client, make_inv, monkeypatch):
    inv = make_inv(plan="premium")
    aid = up(client, inv).json()["asset_id"]
    monkeypatch.setattr(svc, "_head", lambda url: None)
    r = client.post(f"/api/invitations/{inv['id']}/assets/{aid}/confirm", headers=auth(A))
    assert r.status_code == 409 and r.json()["error"]["code"] == "asset_not_uploaded"


def test_confirm_replaces_single_kind(client, make_inv, monkeypatch, db):
    inv = make_inv(plan="premium")
    monkeypatch.setattr(svc, "_head", lambda url: 500)
    a1 = up(client, inv).json()["asset_id"]
    assert client.post(f"/api/invitations/{inv['id']}/assets/{a1}/confirm", headers=auth(A)).status_code == 200
    a2 = up(client, inv).json()["asset_id"]
    r = client.post(f"/api/invitations/{inv['id']}/assets/{a2}/confirm", headers=auth(A))
    assert r.status_code == 200 and r.json()["asset"]["id"] == a2
    ready = [a for a in db.tables["invitation_assets"] if a["status"] == "ready"]
    assert [a["id"] for a in ready] == [a2] and len(db.removed) == 1


def test_confirm_too_large_deletes(client, make_inv, monkeypatch, db):
    inv = make_inv(plan="premium")
    aid = up(client, inv).json()["asset_id"]
    monkeypatch.setattr(svc, "_head", lambda url: 6 * 1024 * 1024)
    assert client.post(f"/api/invitations/{inv['id']}/assets/{aid}/confirm", headers=auth(A)).status_code == 413
    assert db.tables["invitation_assets"] == [] and db.removed


def test_delete_and_cleanup(client, make_inv, db, settings):
    inv = make_inv(plan="premium")
    aid = up(client, inv).json()["asset_id"]
    assert client.delete(f"/api/invitations/{inv['id']}/assets/{aid}", headers=auth(B)).status_code == 404
    assert client.delete(f"/api/invitations/{inv['id']}/assets/{aid}", headers=auth(A)).status_code == 204
    up(client, inv)
    db.tables["invitation_assets"][0]["created_at"] = "2020-01-01T00:00:00+00:00"
    assert svc.cleanup_pending(db, settings) == 1 and db.tables["invitation_assets"] == []
