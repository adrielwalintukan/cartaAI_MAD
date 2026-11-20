import logging

import pytest

from app.services.ai import gemini


class Err(Exception):
    def __init__(self, code):
        super().__init__(f"{code} error")
        self.code = code


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    monkeypatch.setattr(gemini.time, "sleep", lambda *_: None)


def test_fallback_key_used_on_429(monkeypatch, settings):
    used = []

    def fake(key, *_a, **_k):
        used.append(key)
        if key == "gem-main-key":
            raise Err(429)
        return "<html/>"

    monkeypatch.setattr(gemini, "_call_model", fake)
    assert gemini.generate_text(settings, "s", "u") == "<html/>"
    assert used == ["gem-main-key", "gem-fallback-key"]


def test_all_keys_rate_limited(monkeypatch, settings):
    monkeypatch.setattr(gemini, "_call_model", lambda *a, **k: (_ for _ in ()).throw(Err(429)))
    with pytest.raises(gemini.GeminiError) as e:
        gemini.generate_text(settings, "s", "u")
    assert e.value.code == "ai_rate_limited"


def test_timeout_is_unavailable(monkeypatch, settings):
    monkeypatch.setattr(gemini, "_call_model", lambda *a, **k: (_ for _ in ()).throw(TimeoutError("timed out")))
    with pytest.raises(gemini.GeminiError) as e:
        gemini.generate_text(settings, "s", "u")
    assert e.value.code == "ai_unavailable"


def test_keys_not_in_logs(monkeypatch, settings, caplog):
    monkeypatch.setattr(gemini, "_call_model", lambda *a, **k: (_ for _ in ()).throw(Err(429)))
    with caplog.at_level(logging.DEBUG), pytest.raises(gemini.GeminiError):
        gemini.generate_text(settings, "s", "u")
    assert "gem-main-key" not in caplog.text and "gem-fallback-key" not in caplog.text
