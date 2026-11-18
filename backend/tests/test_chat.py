import pytest

from app.services.ai import gemini
from tests.conftest import A, auth


@pytest.fixture
def ok(monkeypatch):
    seen = []
    monkeypatch.setattr(gemini, "generate_text", lambda s, system, contents, **k: seen.append(contents) or "Halo!")
    return seen


def chat(client, msg="Halo", **kw):
    return client.post("/api/chat", headers=auth(A), json={"message": msg, **kw})


def test_requires_auth_B4(client, ok):
    assert client.post("/api/chat", json={"message": "hi"}).status_code == 401 and ok == []


def test_reply_and_usage(client, ok):
    r = chat(client)
    assert r.status_code == 200 and r.json() == {"reply": "Halo!", "remaining": 19}
    assert client.get("/api/chat/usage", headers=auth(A)).json() == {"limit": 20, "remaining": 19}


def test_21st_message_blocked(client, ok):
    for _ in range(20):
        assert chat(client).status_code == 200
    r = chat(client)
    assert r.status_code == 429 and r.json()["error"]["code"] == "chat_limit_reached" and len(ok) == 20


def test_gemini_failure_refunds(client, monkeypatch):
    def boom(*a, **k):
        raise gemini.GeminiError("ai_unavailable")

    monkeypatch.setattr(gemini, "generate_text", boom)
    r = chat(client)
    assert r.status_code == 502 and r.json()["error"]["code"] == "ai_unavailable"
    assert client.get("/api/chat/usage", headers=auth(A)).json()["remaining"] == 20


def test_history_trimmed_to_10(client, ok):
    hist = [{"role": "user" if i % 2 == 0 else "bot", "content": f"m{i}"} for i in range(30)]
    chat(client, history=hist)
    assert len(ok[0]) == 11 and ok[0][0]["parts"][0]["text"] == "m20" and ok[0][-1]["parts"][0]["text"] == "Halo"


def test_message_too_long_422(client, ok):
    assert chat(client, "x" * 1001).status_code == 422 and chat(client, "").status_code == 422
