"""GET /u/{slug}: HTML undangan + CSP (07 §5.3, §6)."""
import html as html_lib

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

from app.config import Settings, get_settings
from app.deps import get_db
from app.repos import assets as assets_repo
from app.repos import invitations as inv_repo
from app.repos import versions as versions_repo
from app.repos.common import now, parse_ts
from app.services.ai import slots
from app.services.ai.sanitize import SanitizeCtx
from app.services.invitations import asset_url

router = APIRouter(tags=["Undangan publik"])

_BASE_HEADERS = {"X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex"}


def _headers(s: Settings, nonce: str | None, cache: str) -> dict:
    return {**_BASE_HEADERS, "Cache-Control": cache,
            "Content-Security-Policy": slots.build_csp(nonce, s.supabase_url, s.public_api_base_url, s.web_base_url)}


def _error_page(s: Settings, status: int, title: str, text: str) -> HTMLResponse:
    body = (f'<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" '
            f'content="width=device-width,initial-scale=1"><title>{html_lib.escape(title)}</title>'
            f'<style>body{{font-family:sans-serif;text-align:center;padding:4rem 1rem;color:#333}}</style></head>'
            f"<body><h1>{html_lib.escape(title)}</h1><p>{html_lib.escape(text)}</p></body></html>")
    return HTMLResponse(body, status_code=status, headers=_headers(s, None, "no-store"))


@router.get("/u/{slug}", response_class=HTMLResponse)
def serve_invitation(slug: str, db=Depends(get_db), s: Settings = Depends(get_settings)):
    inv = inv_repo.get_by_slug(db, slug)
    if not inv or inv["status"] != "published" or not inv.get("current_version_id"):
        return _error_page(s, 404, "Undangan tidak ditemukan", "Periksa kembali tautan undangan Anda.")
    if inv.get("expires_at") and parse_ts(inv["expires_at"]) < now():
        return _error_page(s, 410, "Undangan sudah tidak aktif", "Masa aktif undangan ini telah berakhir.")
    ver = versions_repo.get(db, inv["current_version_id"])
    if not ver:
        return _error_page(s, 404, "Undangan tidak ditemukan", "Periksa kembali tautan undangan Anda.")
    data = inv["data"]
    music = next((a for a in assets_repo.list_for(db, inv["id"], "ready") if a["kind"] == "music"), None)
    premium = inv["plan"] == "premium"
    gifts = (data.get("gifts") or []) if premium else []
    ctx = slots.PublicCtx(
        slug=slug, plan=inv["plan"], api_base=s.public_api_base_url,
        event_at=slots.event_iso(data.get("event_date"), (data.get("ceremony") or {}).get("time"),
                                 data.get("timezone", "WIB")),
        music_url=asset_url(s, music["storage_path"]) if (music and premium) else None, gifts=gifts)
    nonce = slots.new_nonce()
    page = slots.render_public(ver["html"], ctx, SanitizeCtx(inv["id"], s.storage_public_prefix), nonce)
    cache = "public, s-maxage=300, stale-while-revalidate=86400"
    return HTMLResponse(page, headers=_headers(s, nonce, cache))
