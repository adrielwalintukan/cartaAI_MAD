"""Klien google-genai dengan fallback key (07 §3.1). Key tidak pernah dicatat di log."""
import logging
import time

from google import genai
from google.genai import types

from app.config import Settings

log = logging.getLogger(__name__)
BACKOFF_SECONDS = 6  # jeda antar-putaran saat model sibuk (429/503)
RETRY_UNAVAILABLE = 2  # percobaan ulang model non-terakhir pada galat server/timeout


class GeminiError(Exception):
    def __init__(self, code: str, message: str = ""):
        super().__init__(message or code)
        self.code = code  # ai_rate_limited | ai_unavailable


def classify(exc: Exception) -> str:
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    text = f"{type(exc).__name__} {exc}".upper()
    if code in (429, 503) or "RESOURCE_EXHAUSTED" in text:
        return "ai_rate_limited"
    if code == 404 or "NOT_FOUND" in text:
        return "ai_model_missing"
    return "ai_unavailable"


def _call_model(api_key: str, s: Settings, model: str, system: str, contents, temperature: float, max_tokens: int):
    client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=s.gemini_timeout_seconds * 1000))
    res = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system, temperature=temperature,
                                           max_output_tokens=max_tokens),
    )
    return res.text or ""


def _run(s: Settings, models: list[str], system: str, contents, temperature: float,
         max_tokens: int | None, heartbeat) -> tuple[str, str]:
    """Tiap model dicoba tuntas (key utama lalu cadangan, dua putaran) sebelum turun ke model berikutnya.

    Lonjakan permintaan (503) bersifat sesaat; model cadangan jauh lebih lemah untuk desain, jadi jangan buru-buru.
    """
    keys = [k for k in (s.gemini_api_key, s.gemini_api_key_fallback) if k]
    max_tokens = max_tokens or s.gemini_max_output_tokens
    last = "ai_unavailable"
    missing: set[str] = set()
    for model in models:
        for round_no in range(2):
            if model in missing:
                break
            for i, key in enumerate(keys):
                tries = 0
                while True:
                    if heartbeat:
                        heartbeat()
                    try:
                        return _call_model(key, s, model, system, contents, temperature, max_tokens), model
                    except Exception as exc:  # SDK melempar banyak jenis; semuanya dipetakan
                        kind = classify(exc)
                        log.warning("gemini gagal model=%s key_index=%d kind=%s type=%s", model, i, kind,
                                    type(exc).__name__)
                        if kind == "ai_unavailable" and model == models[-1]:
                            raise GeminiError("ai_unavailable", "Layanan AI tidak dapat dihubungi.") from None
                        if kind == "ai_unavailable" and tries < RETRY_UNAVAILABLE:
                            tries += 1  # galat sesaat/timeout: coba lagi model yang sama
                            time.sleep(4)
                            continue
                        if kind in ("ai_unavailable", "ai_model_missing"):
                            missing.add(model)  # model tak tersedia: langsung ke model berikutnya
                        else:
                            last = kind
                        break
                if model in missing:
                    break
            if round_no == 0 and model not in missing:
                time.sleep(BACKOFF_SECONDS)
    if len(missing) == len(models):
        raise GeminiError("ai_unavailable", "Layanan AI tidak dapat dihubungi.")
    raise GeminiError(last, "Layanan AI sedang ramai, coba lagi sebentar.")


def generate_text(s: Settings, system: str, contents, *, temperature: float = 0.8,
                  max_tokens: int | None = None, heartbeat=None) -> str:
    """Chatbot: model `GEMINI_MODEL` saja."""
    return _run(s, [s.gemini_model], system, contents, temperature, max_tokens, heartbeat)[0]


def generate_design(s: Settings, system: str, contents, *, heartbeat=None) -> tuple[str, str]:
    """Generate undangan: model desain lalu `GEMINI_MODEL` sebagai cadangan. Mengembalikan (teks, model dipakai)."""
    models = list(dict.fromkeys([s.gemini_design_model, s.gemini_model]))
    return _run(s, models, system, contents, 0.8, None, heartbeat)
