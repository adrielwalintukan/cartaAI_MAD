from fastapi import APIRouter, Depends, Query

from app.deps import AuthUser, get_current_user, get_db
from app.schemas.rsvp import RsvpPatch
from app.services import rsvps as svc

router = APIRouter(tags=["RSVP"])


@router.get("/api/invitations/{inv_id}/rsvps")
def dashboard(inv_id: str, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
              user: AuthUser = Depends(get_current_user), db=Depends(get_db)):
    return svc.dashboard(db, user, inv_id, limit, offset)


@router.patch("/api/rsvps/{rsvp_id}")
def patch_rsvp(rsvp_id: str, body: RsvpPatch, user: AuthUser = Depends(get_current_user), db=Depends(get_db)):
    return svc.set_hidden(db, user, rsvp_id, body.is_hidden)
