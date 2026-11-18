"""Aturan free/premium: satu-satunya sumber (04 §3.4)."""
from app.config import Settings
from app.errors import AppError, premium_required


def generation_limit(plan: str, s: Settings) -> int:
    return s.premium_generation_limit if plan == "premium" else s.free_generation_limit


def guest_limit(plan: str, s: Settings) -> int | None:
    return None if plan == "premium" else s.free_guest_limit


def active_days(plan: str, s: Settings) -> int:
    return s.premium_active_days if plan == "premium" else s.free_active_days


def check_generation_quota(plan: str, used: int, s: Settings) -> None:
    limit = generation_limit(plan, s)
    if used >= limit:
        raise AppError("quota_exceeded", 403,
                       f"Kuota generate undangan ini sudah habis ({used} dari {limit}).",
                       {"used": used, "limit": limit})


def premium_fields_used(data: dict) -> list[str]:
    out = []
    if data.get("color_theme"):
        out.append("color_theme")
    if data.get("gifts"):
        out.append("gifts")
    return out


def check_premium_fields(plan: str, data: dict, preset_premium_only: bool = False) -> None:
    if plan == "premium":
        return
    fields = premium_fields_used(data)
    if preset_premium_only:
        fields.append("preset_id")
    if fields:
        raise premium_required(fields)


def check_guest_limit(plan: str, current: int, adding: int, s: Settings) -> None:
    limit = guest_limit(plan, s)
    if limit is not None and current + adding > limit:
        raise AppError("guest_limit_reached", 403, f"Batas {limit} tamu untuk paket gratis tercapai.",
                       {"limit": limit, "current": current, "requested": adding})


def quota_info(plan: str, used: int, s: Settings) -> dict:
    return {"generations_used": used, "generations_limit": generation_limit(plan, s),
            "guests_limit": guest_limit(plan, s)}
