"""Tamu milik pemilik (06 §6)."""
from urllib.parse import quote_plus

from app.config import Settings
from app.deps import AuthUser
from app.errors import AppError, not_found
from app.repos import guests as repo
from app.repos import invitations as inv_repo
from app.repos import rsvps as rsvps_repo
from app.repos.common import is_unique_violation
from app.schemas.guest import GuestBulk, GuestIn, GuestPatch, clean_name, clean_phone
from app.services import plans
from app.services.invitations import get_or_404


def latest_by_key(db, inv_id: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for r in rsvps_repo.list_for(db, inv_id):  # terbaru dulu
        out.setdefault(r["name_key"], r)
    return out


def _view(s: Settings, inv: dict, g: dict, latest: dict) -> dict:
    r = latest.get(g["name_key"])
    return {"id": g["id"], "name": g["name"], "phone": g.get("phone"),
            "link": f"{s.public_url(inv['slug'])}?to={quote_plus(g['name'])}",
            "rsvp": r["attendance"] if r else None, "created_at": g["created_at"]}


def _dup() -> AppError:
    return AppError("validation_error", 422, "Data yang dikirim tidak valid.",
                    {"fields": [{"path": "name", "message": "Nama tamu sudah ada."}]})


def list_for(db, s: Settings, user: AuthUser, inv_id: str, limit: int, offset: int) -> dict:
    inv = get_or_404(db, inv_id, user)
    latest = latest_by_key(db, inv_id)
    return {"items": [_view(s, inv, g, latest) for g in repo.list_for(db, inv_id, limit, offset)],
            "total": repo.count(db, inv_id), "limit": plans.guest_limit(inv["plan"], s)}


def add(db, s: Settings, user: AuthUser, inv_id: str, body: GuestIn) -> dict:
    inv = get_or_404(db, inv_id, user)
    plans.check_guest_limit(inv["plan"], repo.count(db, inv_id), 1, s)
    if repo.find_by_key(db, inv_id, body.name.lower()):
        raise _dup()
    try:
        g = repo.insert_many(db, [{"invitation_id": inv_id, "name": body.name, "phone": body.phone}])[0]
    except Exception as exc:
        if is_unique_violation(exc):
            raise _dup() from None
        raise
    return _view(s, inv, g, {})


def bulk(db, s: Settings, user: AuthUser, inv_id: str, body: GuestBulk) -> dict:
    inv = get_or_404(db, inv_id, user)
    existing = {g["name_key"] for g in repo.all_for(db, inv_id)}
    new, rejected, skipped = [], [], 0
    for i, raw in enumerate(body.guests):
        try:
            name = clean_name((raw or {}).get("name"))
            phone = clean_phone((raw or {}).get("phone"))
        except ValueError as e:
            rejected.append({"index": i, "reason": str(e)})
            continue
        key = name.lower()
        if key in existing:
            skipped += 1
            continue
        existing.add(key)
        new.append({"invitation_id": inv_id, "name": name, "phone": phone})
    plans.check_guest_limit(inv["plan"], repo.count(db, inv_id), len(new), s)  # semua atau tidak sama sekali
    created = repo.insert_many(db, new)
    return {"created": len(created), "skipped": skipped, "rejected": rejected,
            "items": [_view(s, inv, g, {}) for g in created]}


def _owned_guest(db, user: AuthUser, guest_id: str) -> tuple[dict, dict]:
    g = repo.get(db, guest_id)
    inv = inv_repo.get_owned(db, g["invitation_id"], user.id) if g else None
    if not g or not inv:
        raise not_found("Tamu")
    return g, inv


def update(db, s: Settings, user: AuthUser, guest_id: str, body: GuestPatch) -> dict:
    g, inv = _owned_guest(db, user, guest_id)
    vals = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if "name" in vals and vals["name"] and vals["name"].lower() != g["name_key"]:
        if repo.find_by_key(db, inv["id"], vals["name"].lower()):
            raise _dup()
    g = repo.update(db, guest_id, vals) if vals else g
    return _view(s, inv, g, latest_by_key(db, inv["id"]))


def delete(db, user: AuthUser, guest_id: str) -> None:
    _owned_guest(db, user, guest_id)
    repo.delete(db, guest_id)
