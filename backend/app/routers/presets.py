from fastapi import APIRouter, Depends

from app.deps import get_db
from app.repos import presets as repo

router = APIRouter(prefix="/api/presets", tags=["Gaya"])


@router.get("")
def list_presets(db=Depends(get_db)):
    return {"items": [{k: p.get(k) for k in ("id", "name", "description", "preview_url", "premium_only")}
                      for p in repo.list_active(db)]}
