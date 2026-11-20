"""Endpoint tamu tanpa login (06 §7). CORS * ditambahkan middleware di main.py."""
from fastapi import APIRouter, Depends, Query, Request

from app.deps import check_rate_limit, client_ip, get_db
from app.schemas.rsvp import RsvpIn
from app.services import rsvps as svc

router = APIRouter(prefix="/api/public/invitations", tags=["Publik"])


@router.post("/{slug}/rsvps", status_code=201)
def submit(slug: str, body: RsvpIn, request: Request, db=Depends(get_db)):
    check_rate_limit(f"rsvp:{client_ip(request)}:{slug}", 5)
    return svc.submit_public(db, slug, body)


@router.get("/{slug}/rsvps")
def wishes(slug: str, request: Request, limit: int = Query(20, ge=1, le=50), before: str | None = None,
           db=Depends(get_db)):
    check_rate_limit(f"wishes:{client_ip(request)}", 60)
    return svc.list_public(db, slug, limit, before)
