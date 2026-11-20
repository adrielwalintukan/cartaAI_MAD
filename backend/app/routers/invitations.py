from fastapi import APIRouter, Depends, Query, Response

from app.config import Settings, get_settings
from app.deps import AuthUser, get_current_user, get_db
from app.errors import AppError
from app.schemas.invitation import InvitationCreate, InvitationPatch, validate_slug
from app.services import invitations as svc

router = APIRouter(prefix="/api/invitations", tags=["Undangan"])


@router.get("/slug-available")
def slug_available(slug: str = Query(...), user: AuthUser = Depends(get_current_user), db=Depends(get_db)):
    try:
        s = validate_slug(slug)
    except ValueError as e:
        raise AppError("validation_error", 422, "Data yang dikirim tidak valid.",
                       {"fields": [{"path": "slug", "message": str(e)}]}) from None
    return {"available": svc.slug_available(db, s)}


@router.post("", status_code=201)
def create(body: InvitationCreate, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
           s: Settings = Depends(get_settings)):
    return svc.create(db, s, user, body)


@router.get("")
def list_invitations(user: AuthUser = Depends(get_current_user), db=Depends(get_db),
                     s: Settings = Depends(get_settings)):
    return {"items": svc.list_for(db, s, user)}


@router.get("/{inv_id}")
def detail(inv_id: str, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
           s: Settings = Depends(get_settings)):
    return svc.serialize(db, s, svc.get_or_404(db, inv_id, user))


@router.patch("/{inv_id}")
def patch(inv_id: str, body: InvitationPatch, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
          s: Settings = Depends(get_settings)):
    return svc.update(db, s, user, inv_id, body)


@router.delete("/{inv_id}", status_code=204)
def delete(inv_id: str, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
           s: Settings = Depends(get_settings)):
    svc.delete(db, s, user, inv_id)
    return Response(status_code=204)


@router.post("/{inv_id}/rollback")
def rollback(inv_id: str, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
             s: Settings = Depends(get_settings)):
    return svc.rollback(db, s, user, inv_id)
