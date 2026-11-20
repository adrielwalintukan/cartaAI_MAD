from tests.conftest import A, B, auth


def gpost(client, inv, name, user=A, **kw):
    return client.post(f"/api/invitations/{inv['id']}/guests", headers=auth(user), json={"name": name, **kw})


def test_guest_crud_and_link(client, make_inv):
    inv = make_inv()
    r = gpost(client, inv, "Pak Joko", phone="0812-3456-789")
    assert r.status_code == 201
    g = r.json()
    assert g["link"] == "https://web.test/u/adriel-tiara?to=Pak+Joko" and g["phone"] == "08123456789"
    assert gpost(client, inv, "pak joko").status_code == 422  # duplikat, beda huruf
    lst = client.get(f"/api/invitations/{inv['id']}/guests", headers=auth(A)).json()
    assert lst["total"] == 1 and lst["limit"] == 50
    assert client.patch(f"/api/guests/{g['id']}", headers=auth(A), json={"name": "Pak Joko S"}).json()["name"] == "Pak Joko S"
    assert client.delete(f"/api/guests/{g['id']}", headers=auth(A)).status_code == 204


def test_B3_other_user_cannot_touch_guest(client, make_inv):
    inv = make_inv()
    g = gpost(client, inv, "Bu Sari").json()
    assert client.delete(f"/api/guests/{g['id']}", headers=auth(B)).status_code == 404
    assert client.patch(f"/api/guests/{g['id']}", headers=auth(B), json={"name": "x"}).status_code == 404
    assert client.get(f"/api/invitations/{inv['id']}/guests", headers=auth(B)).status_code == 404
    assert client.delete(f"/api/guests/{g['id']}").status_code == 401  # tanpa auth


def test_bulk_all_or_nothing_free(client, make_inv, db):
    inv = make_inv()
    r = client.post(f"/api/invitations/{inv['id']}/guests/bulk", headers=auth(A),
                    json={"guests": [{"name": f"Tamu {i}"} for i in range(51)]})
    assert r.status_code == 403 and r.json()["error"]["code"] == "guest_limit_reached"
    assert db.tables["guests"] == []


def test_bulk_skips_duplicates_and_rejects_blank(client, make_inv):
    inv = make_inv()
    gpost(client, inv, "Pak Joko")
    r = client.post(f"/api/invitations/{inv['id']}/guests/bulk", headers=auth(A), json={"guests": [
        {"name": "pak joko"}, {"name": "Bu Sari"}, {"name": "BU SARI"}, {"name": "  "}, {"name": "Ani", "phone": "abc"}]})
    j = r.json()
    assert r.status_code == 201 and j["created"] == 1 and j["skipped"] == 2 and len(j["rejected"]) == 2


def test_free_guest_limit_single(client, make_inv):
    inv = make_inv()
    for i in range(50):
        assert gpost(client, inv, f"T{i}").status_code == 201
    assert gpost(client, inv, "T50").status_code == 403


def test_premium_unlimited(client, make_inv):
    inv = make_inv(plan="premium", slug="prem-prem")
    assert client.get(f"/api/invitations/{inv['id']}/guests", headers=auth(A)).json()["limit"] is None


def pub(client, slug, **kw):
    return client.post(f"/api/public/invitations/{slug}/rsvps", json={"name": "Pak Joko", "attendance": "hadir", **kw})


def test_public_rsvp_draft_404_expired_410(client, make_inv):
    make_inv(slug="draft-aja")
    assert pub(client, "draft-aja").status_code == 404
    assert pub(client, "tidak-ada").status_code == 404
    make_inv(slug="sudah-lewat", status="published", expires_at="2020-01-01T00:00:00+00:00")
    r = pub(client, "sudah-lewat")
    assert r.status_code == 410 and r.json()["error"]["code"] == "invitation_expired"


def test_public_rate_limit(client, make_inv):
    make_inv(slug="aktif-dong", status="published")
    for _ in range(5):
        assert pub(client, "aktif-dong").status_code == 201
    r = pub(client, "aktif-dong")
    assert r.status_code == 429 and r.headers["retry-after"]
    assert r.headers["access-control-allow-origin"] == "*"


def test_public_wishes_hide_and_matching(client, make_inv, db):
    inv = make_inv(slug="aktif-dong", status="published")
    gpost(client, inv, "Pak Joko")
    r1 = pub(client, "aktif-dong", message="Selamat!")
    pub(client, "aktif-dong", message=None)
    assert db.one("rsvps", id=r1.json()["id"])["guest_id"] is not None
    wishes = client.get("/api/public/invitations/aktif-dong/rsvps").json()["items"]
    assert [w["message"] for w in wishes] == ["Selamat!"] and "id" not in wishes[0]
    assert client.patch(f"/api/rsvps/{r1.json()['id']}", headers=auth(B), json={"is_hidden": True}).status_code == 404
    assert client.patch(f"/api/rsvps/{r1.json()['id']}", headers=auth(A), json={"is_hidden": True}).status_code == 200
    assert client.get("/api/public/invitations/aktif-dong/rsvps").json()["items"] == []


def test_stats_latest_per_name(client, make_inv, db):
    inv = make_inv(slug="aktif-dong", status="published")
    for n in ("Pak Joko", "Bu Sari", "Ani"):
        gpost(client, inv, n)
    pub(client, "aktif-dong")  # Pak Joko hadir
    db.tables["rsvps"][-1]["created_at"] = "2026-01-01T00:00:00+00:00"
    client.post("/api/public/invitations/aktif-dong/rsvps", json={"name": "pak joko", "attendance": "tidak_hadir"})
    client.post("/api/public/invitations/aktif-dong/rsvps", json={"name": "Orang Baru", "attendance": "hadir"})
    j = client.get(f"/api/invitations/{inv['id']}/rsvps", headers=auth(A)).json()
    assert j["stats"] == {"guests_total": 3, "responded": 2, "attending": 1, "not_attending": 1, "no_response": 2}
    assert j["total"] == 3
    lst = client.get(f"/api/invitations/{inv['id']}/guests", headers=auth(A)).json()["items"]
    assert {g["name"]: g["rsvp"] for g in lst}["Pak Joko"] == "tidak_hadir"
    assert client.get(f"/api/invitations/{inv['id']}/rsvps", headers=auth(B)).status_code == 404
