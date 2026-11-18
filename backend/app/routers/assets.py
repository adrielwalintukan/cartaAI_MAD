from fastapi import APIRouter, Depends, Response

from app.config import Settings, get_settings
from app.deps import AuthUser, get_current_user, get_db
from app.schemas.asset import AssetUploadIn
from app.services import assets as svc

router = APIRouter(prefix="/api/invitations/{inv_id}/assets", tags=["Aset"])


@router.post("/upload-url", status_code=201)
def upload_url(inv_id: str, body: AssetUploadIn, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
               s: Settings = Depends(get_settings)):
    return svc.upload_url(db, s, user, inv_id, body)


@router.post("/{asset_id}/confirm")
def confirm(inv_id: str, asset_id: str, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
            s: Settings = Depends(get_settings)):
    return svc.confirm(db, s, user, inv_id, asset_id)


@router.delete("/{asset_id}", status_code=204)
def delete(inv_id: str, asset_id: str, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
           s: Settings = Depends(get_settings)):
    svc.delete(db, s, user, inv_id, asset_id)
    return Response(status_code=204)
