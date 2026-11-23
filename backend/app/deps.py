"""Dependency FastAPI: client DB, user terautentikasi, rate limit."""
import logging
import time
from dataclasses import dataclass

from fastapi import Depends, Request

from app.config import Settings, get_settings
from app.db import get_supabase
from app.errors import AppError

log = logging.getLogger(__name__)


def get_db():
    return get_supabase()


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str | None


_TOKEN_TTL = 30.0
_token_cache: dict[str, tuple[float, AuthUser]] = {}  # shortcut: per-proses, cukup untuk satu instance


def _unauthorized() -> AppError:
    return AppError("unauthorized", 401, "Sesi tidak valid. Silakan masuk lagi.")


def get_current_user(request: Request, db=Depends(get_db)) -> AuthUser:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise _unauthorized()
    token = token.strip()
    hit = _token_cache.get(token)
    if hit and hit[0] > time.monotonic():
        return hit[1]
    try:
        res = db.auth.get_user(token)
        user = res.user if res else None
    except Exception:
        log.info("token ditolak oleh Supabase Auth")
        raise _unauthorized()
    if not user:
        raise _unauthorized()
    au = AuthUser(id=str(user.id), email=getattr(user, "email", None))
    if len(_token_cache) > 1000:
        _token_cache.clear()
    _token_cache[token] = (time.monotonic() + _TOKEN_TTL, au)
    return au


_hits: dict[str, list[float]] = {}


def client_ip(request: Request, trusted_proxies: int | None = None) -> str:
    """Alamat klien untuk rate limit. X-Forwarded-For hanya dipercaya sebanyak proxy tepercaya.

    Tiap proxy menambahkan alamat peer-nya di KANAN header; isi di kiri bisa dipalsukan klien. Maka klien yang sebenarnya
    adalah entri ke-N dari kanan (N = jumlah proxy tepercaya), bukan entri pertama.
    """
    n = get_settings().trusted_proxy_count if trusted_proxies is None else trusted_proxies
    hops = [h.strip() for h in request.headers.get("x-forwarded-for", "").split(",") if h.strip()]
    if n > 0 and len(hops) >= n:
        return hops[-n]
    return request.client.host if request.client else "unknown"


def check_rate_limit(key: str, limit: int, window: float = 60.0) -> None:
    """Limiter memori (06 §11). Hilang saat restart; cukup untuk satu instance."""
    now = time.monotonic()
    recent = [t for t in _hits.get(key, []) if now - t < window]
    if len(recent) >= limit:
        _hits[key] = recent
        raise AppError("rate_limited", 429, "Terlalu banyak permintaan. Coba lagi sebentar.")
    recent.append(now)
    _hits[key] = recent


def reset_rate_limits() -> None:
    _hits.clear()
    _token_cache.clear()


__all__ = ["AuthUser", "get_db", "get_current_user", "check_rate_limit", "client_ip", "get_settings", "Settings"]
