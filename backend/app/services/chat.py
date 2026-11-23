"""Chatbot (06 §10): kuota harian atomik di DB, dikembalikan bila Gemini gagal."""
import logging
from datetime import datetime, timedelta, timezone

from app.config import Settings
from app.deps import AuthUser
from app.errors import AppError
from app.repos import chat_usage as repo
from app.schemas.chat import ChatRequest
from app.services.ai import gemini
from app.services.ai.prompt import CHAT_SYSTEM_PROMPT

log = logging.getLogger(__name__)
WIB = timezone(timedelta(hours=7))  # tanpa DST; hindari ketergantungan tzdata di Windows


def usage(db, s: Settings, user: AuthUser) -> dict:
    day = datetime.now(WIB).date().isoformat()
    return {"limit": s.chat_daily_limit, "remaining": max(s.chat_daily_limit - repo.used_today(db, user.id, day), 0)}


def reply(db, s: Settings, user: AuthUser, body: ChatRequest) -> dict:
    remaining = repo.consume(db, user.id, s.chat_daily_limit)
    if remaining < 0:
        raise AppError("chat_limit_reached", 429, "Batas 20 pesan chatbot hari ini sudah tercapai. Coba lagi besok.",
                       {"limit": s.chat_daily_limit})
    contents = [{"role": "user" if t.role == "user" else "model", "parts": [{"text": t.content}]}
                for t in body.history[-10:]]
    contents.append({"role": "user", "parts": [{"text": body.message}]})
    try:
        text = gemini.generate_text(s, CHAT_SYSTEM_PROMPT, contents, temperature=0.5, max_tokens=1024)
    except gemini.GeminiError:
        repo.refund(db, user.id)
        raise AppError("ai_unavailable", 502, "Chatbot sedang tidak tersedia, coba lagi sebentar.") from None
    except Exception:
        repo.refund(db, user.id)
        raise
    return {"reply": text.strip() or "Maaf, aku belum bisa menjawab itu.", "remaining": remaining}
