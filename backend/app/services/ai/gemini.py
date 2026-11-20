"""Klien google-genai dengan fallback key (07 §3.1). Key tidak pernah dicatat di log."""
import logging
import time

from google import genai
from google.genai import types

from app.config import Settings

log = logging.getLogger(__name__)


class GeminiError(Exception):
    def __init__(self, code: str, message: str = ""):
        super().__init__(message or code)
        self.code = code  # ai_rate_limited | ai_unavailable


def classify(exc: Exception) -> str:
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    text = f"{type(exc).__name__} {exc}".upper()
    if code in (429, 503) or "RESOURCE_EXHAUSTED" in text:
        return "ai_rate_limited"
    return "ai_unavailable"


def _call_model(api_key: str, s: Settings, system: str, contents, temperature: float, max_tokens: int):
    client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=s.gemini_timeout_seconds * 1000))
    res = client.models.generate_content(
        model=s.gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system, temperature=temperature,
                                           max_output_tokens=max_tokens),
    )
    return res.text or ""


def generate_text(s: Settings, system: str, contents, *, temperature: float = 0.8,
                  max_tokens: int | None = None, heartbeat=None) -> str:
    keys = [k for k in (s.gemini_api_key, s.gemini_api_key_fallback) if k]
    max_tokens = max_tokens or s.gemini_max_output_tokens
    last = "ai_unavailable"
    for round_no in range(2):
        for i, key in enumerate(keys):
            if heartbeat:
                heartbeat()
            try:
                return _call_model(key, s, system, contents, temperature, max_tokens)
            except Exception as exc:  # SDK melempar banyak jenis; semuanya dipetakan
                last = classify(exc)
                log.warning("gemini gagal key_index=%d kind=%s type=%s", i, last, type(exc).__name__)
                if last == "ai_unavailable":
                    raise GeminiError("ai_unavailable", "Layanan AI tidak dapat dihubungi.") from None
        if round_no == 0:
            time.sleep(3)
    raise GeminiError(last, "Layanan AI sedang ramai, coba lagi sebentar.")
