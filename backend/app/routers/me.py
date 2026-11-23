from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import AuthUser, get_current_user, get_db
from app.repos import invitations as inv_repo
from app.repos import profiles as repo
from app.schemas.common import clean_text

router = APIRouter(prefix="/api/me", tags=["Profil"])


class ProfilePatch(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=500)


def _view(db, user: AuthUser, p: dict | None) -> dict:
    p = p or {}
    return {"id": user.id, "email": user.email, "full_name": p.get("full_name"), "avatar_url": p.get("avatar_url"),
            "invitations_count": inv_repo.count_by_owner(db, user.id)}


@router.get("")
def get_me(user: AuthUser = Depends(get_current_user), db=Depends(get_db)):
    return _view(db, user, repo.get(db, user.id))


@router.patch("")
def patch_me(body: ProfilePatch, user: AuthUser = Depends(get_current_user), db=Depends(get_db)):
    vals = body.model_dump(exclude_unset=True)
    if "full_name" in vals:
        vals["full_name"] = clean_text(vals["full_name"], 100)
    p = repo.update(db, user.id, vals) if vals else repo.get(db, user.id)
    return _view(db, user, p)
