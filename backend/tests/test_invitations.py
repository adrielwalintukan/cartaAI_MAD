from tests.conftest import A, B, VALID_DATA, auth


def create(client, user=A, slug="adriel-tiara", **kw):
    return client.post("/api/invitations", headers=auth(user), json={"slug": slug, "data": VALID_DATA, **kw})


def test_create_and_shape(client):
    r = create(client)
    assert r.status_code == 201
    j = r.json()
    assert j["title"] == "Adriel & Tiara" and j["status"] == "draft" and j["plan"] == "free"
    assert j["public_url"] == "https://web.test/u/adriel-tiara" and j["current_version"] is None
    assert j["quota"] == {"generations_used": 0, "generations_limit": 3, "guests_limit": 50}
    assert j["assets"] == [] and j["active_job"] is None and j["has_previous_version"] is False


def test_slug_taken_and_available(client):
    create(client)
    assert create(client, B).status_code == 409 and create(client, B).json()["error"]["code"] == "slug_taken"
    assert client.get("/api/invitations/slug-available?slug=adriel-tiara", headers=auth(B)).json() == {"available": False}
    assert client.get("/api/invitations/slug-available?slug=baru-slug", headers=auth(B)).json() == {"available": True}
    assert client.get("/api/invitations/slug-available?slug=A_b", headers=auth(B)).status_code == 422


def test_invalid_slug_422(client):
    assert create(client, slug="Bad Slug!").status_code == 422


def test_premium_preset_and_fields_on_free(client):
    r = create(client, slug="satu-satu", preset_id="bebas")
    assert r.status_code == 403 and r.json()["error"]["code"] == "premium_required"
    r = client.post("/api/invitations", headers=auth(A), json={
        "slug": "dua-dua", "data": {**VALID_DATA, "gifts": [{"bank": "BCA", "account_number": "12345", "account_name": "A"}]}})
    assert r.status_code == 403
    r = client.post("/api/invitations", headers=auth(A), json={"slug": "tiga-tiga", "data": {**VALID_DATA, "color_theme": "sage"}})
    assert r.status_code == 403


def test_unknown_preset_422(client):
    assert create(client, preset_id="tidak-ada").status_code == 422


def test_invitation_limit(client):
    for i in range(5):
        assert create(client, slug=f"slug-{i}x").status_code == 201
    r = create(client, slug="slug-enam")
    assert r.status_code == 403 and r.json()["error"]["code"] == "invitation_limit_reached"


def test_list_only_own(client):
    create(client)
    create(client, B, slug="bukan-punya-a")
    items = client.get("/api/invitations", headers=auth(A)).json()["items"]
    assert [i["slug"] for i in items] == ["adriel-tiara"]
    assert {"rsvp_count", "guest_count", "cover_url", "event_date"} <= items[0].keys()


def test_patch_does_not_touch_slug_plan(client):
    inv = create(client).json()
    r = client.patch(f"/api/invitations/{inv['id']}", headers=auth(A), json={
        "data": {**VALID_DATA, "notes": "Halo"}, "slug": "hack", "plan": "premium"})
    j = r.json()
    assert r.status_code == 200 and j["slug"] == "adriel-tiara" and j["plan"] == "free" and j["data"]["notes"] == "Halo"


def test_patch_premium_fields_rejected_on_free(client):
    inv = create(client).json()
    assert client.patch(f"/api/invitations/{inv['id']}", headers=auth(A), json={"preset_id": "bebas"}).status_code == 403
    assert client.patch(f"/api/invitations/{inv['id']}", headers=auth(A),
                        json={"data": {**VALID_DATA, "color_theme": "x"}}).status_code == 403


def test_other_user_gets_404(client):
    inv = create(client).json()
    i = inv["id"]
    for method, path, body in [("get", f"/api/invitations/{i}", None), ("patch", f"/api/invitations/{i}", {"data": VALID_DATA}),
                               ("delete", f"/api/invitations/{i}", None), ("post", f"/api/invitations/{i}/rollback", None)]:
        r = client.request(method, path, headers=auth(B), json=body)
        assert r.status_code == 404 and r.json()["error"]["code"] == "not_found", (method, path)
    assert client.get(f"/api/invitations/{i}", headers=auth(A)).status_code == 200


def test_delete_cleans_storage(client, db):
    inv = create(client).json()
    db.table("invitation_assets").insert({"invitation_id": inv["id"], "kind": "cover", "storage_path": "p/x.jpg",
                                          "content_type": "image/jpeg", "size_bytes": 1}).execute()
    assert client.delete(f"/api/invitations/{inv['id']}", headers=auth(A)).status_code == 204
    assert db.removed == ["p/x.jpg"] and db.tables["invitations"] == [] and db.tables["invitation_assets"] == []


def test_rollback_without_previous(client):
    inv = create(client).json()
    r = client.post(f"/api/invitations/{inv['id']}/rollback", headers=auth(A))
    assert r.status_code == 409 and r.json()["error"]["code"] == "no_previous_version"


def test_me_patch(client):
    r = client.patch("/api/me", headers=auth(A), json={"full_name": "Adriel <b>M"})
    assert r.status_code == 200 and r.json()["full_name"] == "Adriel b M"
    assert client.patch("/api/me", headers=auth(A), json={"full_name": "x" * 101}).status_code == 422
