from app.repos.common import first, rows


def insert(db, row: dict) -> dict:
    return first(db.table("generation_jobs").insert(row).execute())


def get(db, job_id: str) -> dict | None:
    return first(db.table("generation_jobs").select("*").eq("id", job_id).limit(1).execute())


def get_owned(db, job_id: str, user_id: str) -> dict | None:
    return first(db.table("generation_jobs").select("*").eq("id", job_id).eq("user_id", user_id).limit(1).execute())


def active_for(db, inv_id: str) -> dict | None:
    return first(db.table("generation_jobs").select("*").eq("invitation_id", inv_id)
                 .in_("status", ["queued", "running"]).limit(1).execute())


def claim(db, job_id: str, now_iso: str) -> dict | None:
    """queued -> running secara atomik; None bila sudah diklaim."""
    return first(db.table("generation_jobs").update(
        {"status": "running", "started_at": now_iso, "heartbeat_at": now_iso}
    ).eq("id", job_id).eq("status", "queued").execute())


def touch(db, job_id: str, now_iso: str, stage: str | None = None) -> None:
    vals = {"heartbeat_at": now_iso}
    if stage:
        vals["stage"] = stage
    db.table("generation_jobs").update(vals).eq("id", job_id).in_("status", ["queued", "running"]).execute()


def fail(db, job_id: str, now_iso: str, code: str, message: str) -> None:
    db.table("generation_jobs").update({"status": "failed", "error_code": code, "error_message": message,
                                        "finished_at": now_iso, "heartbeat_at": now_iso}
                                       ).eq("id", job_id).in_("status", ["queued", "running"]).execute()


def stale(db, cutoff_iso: str) -> list[dict]:
    return rows(db.table("generation_jobs").select("*").in_("status", ["queued", "running"])
                .lt("heartbeat_at", cutoff_iso).execute())


def requeue(db, job_id: str, now_iso: str, attempt: int) -> None:
    db.table("generation_jobs").update({"status": "queued", "stage": "queued", "attempt": attempt,
                                        "heartbeat_at": now_iso}).eq("id", job_id).execute()


def commit(db, job_id: str, html: str, model: str, warnings: list[str], free_days: int) -> str:
    res = db.rpc("commit_generation", {"p_job_id": job_id, "p_html": html, "p_model": model,
                                       "p_warnings": warnings, "p_free_days": free_days}).execute()
    return res.data
