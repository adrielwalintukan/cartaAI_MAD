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


# ---- model desain dengan cadangan (Q27)
def test_generate_design_order(monkeypatch, settings):
    calls = []

    def fake(key, s, model, *a):
        calls.append((model, key))
        raise Err(429)

    monkeypatch.setattr(gemini, "_call_model", fake)
    with pytest.raises(gemini.GeminiError) as e:
        gemini.generate_design(settings, "s", "u")
    assert e.value.code == "ai_rate_limited"
    assert calls[:4] == [("gemini-3.5-flash", "gem-main-key"), ("gemini-3.5-flash", "gem-fallback-key"),
                         ("gemini-3.1-flash-lite", "gem-main-key"), ("gemini-3.1-flash-lite", "gem-fallback-key")]


def test_generate_design_model_missing_falls_back(monkeypatch, settings):
    calls = []

    def fake(key, s, model, *a):
        calls.append(model)
        if model == "gemini-3.5-flash":
            raise Err(404)
        return "<html/>"

    monkeypatch.setattr(gemini, "_call_model", fake)
    assert gemini.generate_design(settings, "s", "u") == ("<html/>", "gemini-3.1-flash-lite")
    assert calls == ["gemini-3.5-flash", "gemini-3.1-flash-lite"]  # 404 tidak dicoba di key kedua


def test_chat_uses_chat_model(monkeypatch, settings):
    seen = []
    monkeypatch.setattr(gemini, "_call_model", lambda key, s, model, *a: seen.append(model) or "ok")
    assert gemini.generate_text(settings, "s", "u") == "ok" and seen == ["gemini-3.1-flash-lite"]


def test_generate_design_other_errors_fall_back(monkeypatch, settings):
    calls = []

    def fake(key, s, model, *a):
        calls.append(model)
        if model == "gemini-3.5-flash":
            raise Err(400)
        return "<html/>"

    monkeypatch.setattr(gemini, "_call_model", fake)
    assert gemini.generate_design(settings, "s", "u") == ("<html/>", "gemini-3.1-flash-lite")
    assert calls == ["gemini-3.5-flash", "gemini-3.1-flash-lite"]


def test_chat_still_raises_unavailable_immediately(monkeypatch, settings):
    calls = []
    monkeypatch.setattr(gemini, "_call_model", lambda *a: calls.append(1) or (_ for _ in ()).throw(Err(400)))
    with pytest.raises(gemini.GeminiError) as e:
        gemini.generate_text(settings, "s", "u")
    assert e.value.code == "ai_unavailable" and calls == [1]
