from fastapi import APIRouter, BackgroundTasks, Depends

from app.config import Settings, get_settings
from app.deps import AuthUser, get_current_user, get_db
from app.services import generation as svc

router = APIRouter(tags=["Generate"])


@router.post("/api/invitations/{inv_id}/generate", status_code=202)
def generate(inv_id: str, bg: BackgroundTasks, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
             s: Settings = Depends(get_settings)):
    res = svc.start(db, s, user, inv_id)
    bg.add_task(svc.run_job, db, s, res["job_id"])
    return res


@router.get("/api/jobs/{job_id}")
def get_job(job_id: str, bg: BackgroundTasks, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
            s: Settings = Depends(get_settings)):
    for jid in svc.recover_stale_jobs(db, s):
        bg.add_task(svc.run_job, db, s, jid)
    return svc.job_view(svc.get_job(db, user, job_id))
