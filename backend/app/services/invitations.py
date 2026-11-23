"""CRUD undangan, rollback, hapus (06 §4). Semua query berpagar owner_id."""
import logging
from uuid import uuid4

from app.config import Settings
from app.deps import AuthUser
from app.errors import AppError, not_found
from app.repos import assets as assets_repo
from app.repos import guests as guests_repo
from app.repos import invitations as repo
from app.repos import jobs as jobs_repo
from app.repos import presets as presets_repo
from app.repos import rsvps as rsvps_repo
from app.repos import versions as versions_repo
from app.repos.common import is_unique_violation, now, parse_ts
from app.schemas.invitation import InvitationCreate, InvitationData, InvitationPatch
from app.services import plans

log = logging.getLogger(__name__)


def asset_url(s: Settings, path: str) -> str:
    return s.storage_public_prefix + path


def _is_expired(row: dict) -> bool:
    return bool(row.get("expires_at")) and parse_ts(row["expires_at"]) < now()


def get_or_404(db, inv_id: str, user: AuthUser) -> dict:
    row = repo.get_owned(db, inv_id, user.id)
    if not row:
        raise not_found("Undangan")
    return row


def _preset_or_422(db, preset_id: str) -> dict:
    p = presets_repo.get(db, preset_id)
    if not p:
        raise AppError("validation_error", 422, "Data yang dikirim tidak valid.",
                       {"fields": [{"path": "preset_id", "message": "Gaya tidak ditemukan."}]})
    return p


def serialize(db, s: Settings, row: dict) -> dict:
    ver = versions_repo.get(db, row["current_version_id"]) if row.get("current_version_id") else None
    job = jobs_repo.active_for(db, row["id"])
    assets = assets_repo.list_for(db, row["id"], "ready")
    return {
        "id": row["id"], "slug": row["slug"], "title": row["title"], "status": row["status"], "plan": row["plan"],
        "preset_id": row["preset_id"], "data": row["data"], "public_url": s.public_url(row["slug"]),
        "published_at": row.get("published_at"), "expires_at": row.get("expires_at"),
        "is_expired": _is_expired(row),
        "quota": plans.quota_info(row["plan"], row["generations_used"], s),
        "has_previous_version": bool(row.get("previous_version_id")),
        "current_version": ({"id": ver["id"], "version_no": ver["version_no"], "created_at": ver["created_at"],
                             "warnings": ver.get("warnings") or []} if ver else None),
        "assets": [{"id": a["id"], "kind": a["kind"], "url": asset_url(s, a["storage_path"]),
                    "content_type": a["content_type"], "size_bytes": a["size_bytes"], "position": a["position"]}
                   for a in assets],
        "active_job": {"id": job["id"], "status": job["status"], "stage": job["stage"]} if job else None,
        "created_at": row["created_at"], "updated_at": row["updated_at"],
    }


def summary(db, s: Settings, row: dict) -> dict:
    cover = next((a for a in assets_repo.list_for(db, row["id"], "ready") if a["kind"] == "cover"), None)
    return {
        "id": row["id"], "slug": row["slug"], "title": row["title"], "status": row["status"], "plan": row["plan"],
        "public_url": s.public_url(row["slug"]), "expires_at": row.get("expires_at"),
        "is_expired": _is_expired(row), "quota": plans.quota_info(row["plan"], row["generations_used"], s),
        "event_date": (row.get("data") or {}).get("event_date"),
        "cover_url": asset_url(s, cover["storage_path"]) if cover else None,
        "rsvp_count": len(rsvps_repo.list_for(db, row["id"])),  # shortcut: N+1, aman untuk <= MAX_INVITATIONS_PER_USER
        "guest_count": guests_repo.count(db, row["id"]),
    }


def list_for(db, s: Settings, user: AuthUser) -> list[dict]:
    return [summary(db, s, r) for r in repo.list_by_owner(db, user.id)]


def create(db, s: Settings, user: AuthUser, body: InvitationCreate) -> dict:
    preset = _preset_or_422(db, body.preset_id)
    data = body.data.to_db()
    plans.check_premium_fields("free", data, preset["premium_only"])
    if repo.count_by_owner(db, user.id) >= s.max_invitations_per_user:
        raise AppError("invitation_limit_reached", 403,
                       f"Batas {s.max_invitations_per_user} undangan per akun tercapai.")
    taken = AppError("slug_taken", 409, "Slug sudah dipakai, pilih yang lain.")
    if repo.slug_exists(db, body.slug):
        raise taken
    try:
        row = repo.insert(db, {"id": str(uuid4()), "owner_id": user.id, "slug": body.slug,
                               "title": body.data.title() or body.slug, "data": data, "preset_id": body.preset_id})
    except Exception as exc:
        if is_unique_violation(exc):
            raise taken from None
        raise
    return serialize(db, s, row)


def update(db, s: Settings, user: AuthUser, inv_id: str, body: InvitationPatch) -> dict:
    row = get_or_404(db, inv_id, user)
    values: dict = {}
    preset_id = body.preset_id or row["preset_id"]
    preset = _preset_or_422(db, preset_id)
    data = body.data.to_db() if body.data is not None else row["data"]
    plans.check_premium_fields(row["plan"], data, preset["premium_only"])
    if body.data is not None:
        values["data"] = data
        values["title"] = body.data.title() or row["title"]
    if body.preset_id:
        values["preset_id"] = body.preset_id
    if values:
        row = repo.update(db, inv_id, user.id, values) or row
    return serialize(db, s, row)


def delete(db, s: Settings, user: AuthUser, inv_id: str) -> None:
    get_or_404(db, inv_id, user)
    paths = [a["storage_path"] for a in assets_repo.list_for(db, inv_id)]
    repo.delete(db, inv_id, user.id)
    if paths:
        try:
            db.storage.from_(s.supabase_storage_bucket).remove(paths)
        except Exception:
            log.warning("gagal menghapus objek storage undangan=%s", inv_id, exc_info=True)


def rollback(db, s: Settings, user: AuthUser, inv_id: str) -> dict:
    row = get_or_404(db, inv_id, user)
    if not row.get("previous_version_id"):
        raise AppError("no_previous_version", 409, "Tidak ada versi sebelumnya.")
    repo.rollback(db, inv_id, user.id)
    return serialize(db, s, repo.get_owned(db, inv_id, user.id))


def slug_available(db, slug: str) -> bool:
    return not repo.slug_exists(db, slug)


__all__ = ["InvitationData"]
