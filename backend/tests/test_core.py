from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import A, auth


def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200 and r.json() == {"status": "ok"} and r.headers["x-request-id"]


def test_healthz_deep(client):
    assert client.get("/healthz?deep=1").json() == {"status": "ok"}


def test_401_format(client):
    r = client.get("/api/me")
    err = r.json()["error"]
    assert r.status_code == 401 and err["code"] == "unauthorized" and err["request_id"] == r.headers["x-request-id"]


def test_bad_token_and_header(client):
    assert client.get("/api/me", headers={"Authorization": "Bearer salah"}).status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Basic abc"}).status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Bearer "}).status_code == 401


def test_valid_token(client):
    r = client.get("/api/me", headers=auth(A))
    assert r.status_code == 200 and r.json()["email"] == A["email"]


def test_404_route(client):
    r = client.get("/tidak/ada")
    assert r.status_code == 404 and r.json()["error"]["code"] == "not_found"


def test_422_format(client):
    r = client.post("/api/invitations", headers=auth(A), json={"slug": "x"})
    err = r.json()["error"]
    assert r.status_code == 422 and err["code"] == "validation_error" and err["details"]["fields"][0]["path"] == "slug"


def test_500_hides_stack(db):
    def boom():
        raise RuntimeError("rahasia internal")

    app.dependency_overrides[__import__("app.deps", fromlist=["get_db"]).get_db] = boom
    c = TestClient(app, raise_server_exceptions=False)
    r = c.get("/api/presets")
    assert r.status_code == 500 and r.json()["error"]["code"] == "internal_error"
    assert "rahasia" not in r.text and "Traceback" not in r.text


def test_presets_public(client):
    r = client.get("/api/presets")
    assert r.status_code == 200 and "brief" not in r.text and r.json()["items"][0]["id"] == "default"


def test_public_cors_wildcard(client):
    r = client.options("/api/public/invitations/x/rsvps", headers={"Origin": "null"})
    assert r.status_code == 204 and r.headers["access-control-allow-origin"] == "*"


def test_docs_off_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    from app.config import get_settings
    get_settings.cache_clear()
    try:
        from app.main import create_app
        assert TestClient(create_app()).get("/docs").status_code == 404
    finally:
        monkeypatch.undo()
        get_settings.cache_clear()


def test_public_url_prefers_public_site_url():
    from app.config import Settings
    assert Settings().public_url("a-b") == "https://web.test/u/a-b"
    assert Settings(public_site_url="https://site.test/").public_url("a-b") == "https://site.test/u/a-b"
