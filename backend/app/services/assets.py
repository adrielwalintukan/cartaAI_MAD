"""Aset via signed upload URL (06 §5)."""
import logging
from datetime import timedelta
from uuid import uuid4

import httpx

from app.config import Settings
from app.deps import AuthUser
from app.errors import AppError, premium_required
from app.repos import assets as repo
from app.repos.common import now
from app.schemas.asset import AssetUploadIn
from app.services.invitations import asset_url, get_or_404

log = logging.getLogger(__name__)
IMAGE = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
AUDIO = {"audio/mpeg": "mp3", "audio/mp4": "m4a"}


def _view(s: Settings, a: dict) -> dict:
    return {"id": a["id"], "kind": a["kind"], "url": asset_url(s, a["storage_path"]),
            "content_type": a["content_type"], "size_bytes": a["size_bytes"], "position": a["position"]}


def _remove(db, s: Settings, paths: list[str]) -> None:
    try:
        db.storage.from_(s.supabase_storage_bucket).remove(paths)
    except Exception:
        log.warning("gagal menghapus objek storage", exc_info=True)


def upload_url(db, s: Settings, user: AuthUser, inv_id: str, body: AssetUploadIn) -> dict:
    inv = get_or_404(db, inv_id, user)
    if inv["plan"] != "premium":
        raise premium_required(["assets"])
    allowed = AUDIO if body.kind == "music" else IMAGE
    if body.content_type not in allowed:
        raise AppError("unsupported_media_type", 415, "Tipe berkas tidak diizinkan.")
    limit = s.max_audio_bytes if body.kind == "music" else s.max_image_bytes
    if body.size_bytes > limit:
        raise AppError("file_too_large", 413, f"Ukuran berkas melebihi {limit // (1024 * 1024)} MB.")
    if body.kind == "gallery":
        n = len([a for a in repo.list_for(db, inv_id) if a["kind"] == "gallery"])
        if n >= s.gallery_max_photos:
            raise AppError("asset_limit_reached", 403, f"Galeri maksimal {s.gallery_max_photos} foto.")
    asset_id = str(uuid4())
    path = f"invitations/{inv_id}/{body.kind}/{asset_id}.{allowed[body.content_type]}"
    repo.insert(db, {"id": asset_id, "invitation_id": inv_id, "kind": body.kind, "storage_path": path,
                     "content_type": body.content_type, "size_bytes": body.size_bytes, "position": body.position})
    signed = db.storage.from_(s.supabase_storage_bucket).create_signed_upload_url(path)
    return {"asset_id": asset_id, "upload": {"bucket": s.supabase_storage_bucket, "path": path,
                                             "token": signed["token"], "expires_in": 7200}}


def _head(url: str) -> int | None:
    """Ukuran objek di URL publik, atau None bila belum ada."""
    try:
        r = httpx.head(url, timeout=10, follow_redirects=True)
    except httpx.HTTPError:
        return None
    return int(r.headers.get("content-length", 0)) if r.status_code == 200 else None


def confirm(db, s: Settings, user: AuthUser, inv_id: str, asset_id: str) -> dict:
    get_or_404(db, inv_id, user)
    a = repo.get(db, inv_id, asset_id)
    if not a:
        raise AppError("not_found", 404, "Aset tidak ditemukan.")
    if a["status"] == "ready":
        return {"asset": _view(s, a)}
    size = _head(asset_url(s, a["storage_path"]))
    if size is None:
        raise AppError("asset_not_uploaded", 409, "Berkas belum diunggah.")
    limit = s.max_audio_bytes if a["kind"] == "music" else s.max_image_bytes
    if size > limit:
        _remove(db, s, [a["storage_path"]])
        repo.delete(db, asset_id)
        raise AppError("file_too_large", 413, "Ukuran berkas melebihi batas.")
    if a["kind"] != "gallery":
        for old in repo.list_for(db, inv_id, "ready"):
            if old["kind"] == a["kind"]:
                _remove(db, s, [old["storage_path"]])
                repo.delete(db, old["id"])
    repo.mark_ready(db, asset_id)
    return {"asset": _view(s, {**a, "status": "ready", "size_bytes": size or a["size_bytes"]})}


def delete(db, s: Settings, user: AuthUser, inv_id: str, asset_id: str) -> None:
    get_or_404(db, inv_id, user)
    a = repo.get(db, inv_id, asset_id)
    if not a:
        raise AppError("not_found", 404, "Aset tidak ditemukan.")
    _remove(db, s, [a["storage_path"]])
    repo.delete(db, asset_id)


def cleanup_pending(db, s: Settings) -> int:
    old = repo.pending_older_than(db, (now() - timedelta(hours=24)).isoformat())
    if old:
        _remove(db, s, [a["storage_path"] for a in old])
        for a in old:
            repo.delete(db, a["id"])
    return len(old)
