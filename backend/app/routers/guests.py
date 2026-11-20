from fastapi import APIRouter, Depends, Query, Response

from app.config import Settings, get_settings
from app.deps import AuthUser, get_current_user, get_db
from app.schemas.guest import GuestBulk, GuestIn, GuestPatch
from app.services import guests as svc

router = APIRouter(tags=["Tamu"])


@router.get("/api/invitations/{inv_id}/guests")
def list_guests(inv_id: str, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
                user: AuthUser = Depends(get_current_user), db=Depends(get_db), s: Settings = Depends(get_settings)):
    return svc.list_for(db, s, user, inv_id, limit, offset)


@router.post("/api/invitations/{inv_id}/guests", status_code=201)
def add_guest(inv_id: str, body: GuestIn, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
              s: Settings = Depends(get_settings)):
    return svc.add(db, s, user, inv_id, body)


@router.post("/api/invitations/{inv_id}/guests/bulk", status_code=201)
def bulk_guests(inv_id: str, body: GuestBulk, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
                s: Settings = Depends(get_settings)):
    return svc.bulk(db, s, user, inv_id, body)


@router.patch("/api/guests/{guest_id}")
def patch_guest(guest_id: str, body: GuestPatch, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
                s: Settings = Depends(get_settings)):
    return svc.update(db, s, user, guest_id, body)


@router.delete("/api/guests/{guest_id}", status_code=204)
def delete_guest(guest_id: str, user: AuthUser = Depends(get_current_user), db=Depends(get_db)):
    svc.delete(db, user, guest_id)
    return Response(status_code=204)
