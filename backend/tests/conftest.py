import os

# Env palsu SEBELUM app diimpor (tidak ada kunci asli di tes).
os.environ.update({
    "APP_ENV": "development", "SUPABASE_URL": "https://test.supabase.co", "SUPABASE_SERVICE_ROLE_KEY": "x",
    "GEMINI_API_KEY": "gem-main-key", "GEMINI_API_KEY_FALLBACK": "gem-fallback-key", "MIDTRANS_SERVER_KEY": "mid-server-key",
    "WEB_BASE_URL": "https://web.test", "PUBLIC_API_BASE_URL": "https://api.test",
    "CORS_ALLOWED_ORIGINS": "https://web.test", "MAX_INVITATIONS_PER_USER": "5",
    # Opsional: kosongkan eksplisit agar nilai di backend/.env pengembang tidak bocor ke tes.
    "PUBLIC_SITE_URL": "", "TRUSTED_PROXY_COUNT": "1",
})

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.deps import get_db, reset_rate_limits  # noqa: E402
from app.main import app  # noqa: E402
from tests.fake_supabase import FakeSupabase  # noqa: E402

A = {"id": "00000000-0000-0000-0000-00000000000a", "email": "a@test.id", "token": "tok-a"}
B = {"id": "00000000-0000-0000-0000-00000000000b", "email": "b@test.id", "token": "tok-b"}


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture
def db():
    d = FakeSupabase()
    d.add_user(A["id"], A["email"], A["token"])
    d.add_user(B["id"], B["email"], B["token"])
    app.dependency_overrides[get_db] = lambda: d
    reset_rate_limits()
    yield d
    app.dependency_overrides.clear()


@pytest.fixture
def client(db):
    return TestClient(app, raise_server_exceptions=False)


def auth(user):
    return {"Authorization": f"Bearer {user['token']}"}


VALID_DATA = {
    "groom": {"name": "Adriel", "father": "Bpk A", "mother": "Ibu B"},
    "bride": {"name": "Tiara"},
    "religion": "kristen", "event_date": "2027-06-12", "timezone": "WITA",
    "ceremony": {"label": "Pemberkatan", "time": "09:00", "location": "Gereja X, Manado"},
}


@pytest.fixture
def make_inv(db):
    """Buat undangan langsung di DB palsu."""
    def _make(owner=A, slug="adriel-tiara", plan="free", data=None, **extra):
        from uuid import uuid4
        row = {"id": str(uuid4()), "owner_id": owner["id"], "slug": slug, "title": "Adriel & Tiara",
               "data": VALID_DATA if data is None else data, "plan": plan, **extra}
        db.table("invitations").insert(row).execute()
        return db.one("invitations", id=row["id"])
    return _make
