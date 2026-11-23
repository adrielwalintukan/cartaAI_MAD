"""RSVP: dashboard pemilik dan endpoint publik (06 §7)."""
from app.deps import AuthUser
from app.errors import AppError, not_found
from app.repos import guests as guests_repo
from app.repos import invitations as inv_repo
from app.repos import rsvps as repo
from app.repos.common import now, parse_ts
from app.schemas.rsvp import RsvpIn
from app.services.guests import latest_by_key
from app.services.invitations import get_or_404


def dashboard(db, user: AuthUser, inv_id: str, limit: int, offset: int) -> dict:
    get_or_404(db, inv_id, user)
    allr = repo.list_for(db, inv_id)
    latest = latest_by_key(db, inv_id)
    guests = guests_repo.all_for(db, inv_id)
    keys = {g["name_key"] for g in guests}
    att = sum(1 for r in latest.values() if r["attendance"] == "hadir")
    stats = {"guests_total": len(guests), "responded": len(latest), "attending": att,
             "not_attending": len(latest) - att, "no_response": len(keys - latest.keys())}
    items = [{"id": r["id"], "guest_id": r.get("guest_id"), "name": r["guest_name"], "attendance": r["attendance"],
              "message": r.get("message"), "is_hidden": r["is_hidden"], "created_at": r["created_at"]}
             for r in allr[offset:offset + limit]]
    return {"stats": stats, "items": items, "total": len(allr)}


def set_hidden(db, user: AuthUser, rsvp_id: str, hidden: bool) -> dict:
    r = repo.get(db, rsvp_id)
    if not r or not inv_repo.get_owned(db, r["invitation_id"], user.id):
        raise not_found("RSVP")
    r = repo.set_hidden(db, rsvp_id, hidden)
    return {"id": r["id"], "is_hidden": r["is_hidden"]}


def _public_invitation(db, slug: str) -> dict:
    inv = inv_repo.get_by_slug(db, slug)
    if not inv or inv["status"] != "published":
        raise not_found("Undangan")
    if inv.get("expires_at") and parse_ts(inv["expires_at"]) < now():
        raise AppError("invitation_expired", 410, "Undangan ini sudah melewati masa aktif.")
    return inv


def submit_public(db, slug: str, body: RsvpIn) -> dict:
    inv = _public_invitation(db, slug)
    g = guests_repo.find_by_key(db, inv["id"], body.name.lower())
    r = repo.insert(db, {"invitation_id": inv["id"], "guest_id": g["id"] if g else None, "guest_name": body.name,
                         "attendance": body.attendance, "message": body.message})
    return {"id": r["id"]}


def list_public(db, slug: str, limit: int, before: str | None) -> dict:
    inv = _public_invitation(db, slug)
    limit = max(1, min(limit, 50))
    items = [r for r in repo.public_wishes(db, inv["id"], limit, before) if r.get("message")][:limit]
    return {"items": [{"name": r["guest_name"], "attendance": r["attendance"], "message": r["message"],
                       "created_at": r["created_at"]} for r in items],
            "next_before": items[-1]["created_at"] if len(items) == limit else None}
