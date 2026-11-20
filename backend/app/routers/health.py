from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.deps import get_db
from app.repos import presets as presets_repo

router = APIRouter(tags=["Sistem"])


@router.get("/healthz")
def healthz(deep: int = 0, db=Depends(get_db)):
    if deep:
        try:
            presets_repo.list_active(db)
        except Exception:
            return JSONResponse({"status": "degraded"}, status_code=503)
    return {"status": "ok"}
