"""Job generate async (04 §4, 07 §1)."""
import logging
import threading
from datetime import timedelta
from uuid import uuid4

from app.config import Settings
from app.deps import AuthUser
from app.errors import AppError, not_found
from app.repos import assets as assets_repo
from app.repos import invitations as inv_repo
from app.repos import jobs as jobs_repo
from app.repos import presets as presets_repo
from app.repos.common import is_unique_violation, now, now_iso, parse_ts
from app.schemas.invitation import InvitationData
from app.schemas.job import PROGRESS
from app.services import plans
from app.services.ai import gemini, prompt
from app.services.ai.sanitize import InvalidOutput, SanitizeCtx, SanitizeError, extract_document, sanitize
from app.services.ai.slots import SlotCtx, ensure_slots
from app.services.invitations import asset_url, get_or_404

log = logging.getLogger(__name__)
_SEM = threading.Semaphore(2)  # RAM 512 MB + kuota Gemini (04 §4)
MAX_REQUEUE = 2
MAX_ATTEMPTS = 3

_ERR_MSG = {
    "ai_rate_limited": "Layanan AI sedang ramai, coba lagi sebentar.",
    "ai_unavailable": "Layanan AI tidak dapat dihubungi.",
    "invalid_output": "Hasil belum sesuai, coba generate lagi (kuota tidak terpakai).",
    "sanitize_failed": "Hasil belum sesuai, coba generate lagi (kuota tidak terpakai).",
    "worker_lost": "Proses terhenti, coba lagi.",
    "internal_error": "Terjadi kesalahan pada server, coba lagi.",
}


def build_snapshot(s: Settings, inv: dict, preset: dict, assets: list[dict]) -> dict:
    premium = inv["plan"] == "premium"
    data = dict(inv["data"])
    if not premium:
        data.pop("color_theme", None)
        data.pop("gifts", None)
    by_kind: dict = {"gallery": []}
    for a in assets if premium else []:
        url = asset_url(s, a["storage_path"])
        if a["kind"] == "gallery":
            by_kind["gallery"].append(url)
        elif a["kind"] != "music":
            by_kind[a["kind"]] = url
    return {"data": data, "preset_id": preset["id"] if premium else "default",
            "preset_brief": preset["brief"] if premium else None, "plan": inv["plan"], "assets": by_kind,
            "has_music": premium and any(a["kind"] == "music" for a in assets),
            "has_gifts": premium and bool(data.get("gifts"))}


def start(db, s: Settings, user: AuthUser, inv_id: str) -> dict:
    inv = get_or_404(db, inv_id, user)
    data = InvitationData.model_validate(inv["data"])
    if (missing := data.missing()):
        raise AppError("nothing_to_generate", 409, "Data wajib belum lengkap.", {"missing": missing})
    plans.check_generation_quota(inv["plan"], inv["generations_used"], s)
    preset = presets_repo.get(db, inv["preset_id"])
    if not preset:
        raise AppError("validation_error", 422, "Gaya tidak ditemukan.")
    plans.check_premium_fields(inv["plan"], inv["data"], preset["premium_only"])
    if (active := jobs_repo.active_for(db, inv_id)):
        raise AppError("job_in_progress", 409, "Masih ada proses generate yang berjalan.", {"job_id": active["id"]})
    snap = build_snapshot(s, inv, preset, assets_repo.list_for(db, inv_id, "ready"))
    if snap["preset_brief"] is None:
        default = presets_repo.get(db, "default")
        snap["preset_brief"] = default["brief"] if default else ""
    try:
        job = jobs_repo.insert(db, {"id": str(uuid4()), "invitation_id": inv_id, "user_id": user.id,
                                    "input_snapshot": snap})
    except Exception as exc:
        if is_unique_violation(exc):
            raise AppError("job_in_progress", 409, "Masih ada proses generate yang berjalan.") from None
        raise
    return {"job_id": job["id"], "status": "queued"}


def job_view(job: dict) -> dict:
    err = {"code": job["error_code"], "message": job.get("error_message") or ""} if job.get("error_code") else None
    return {"id": job["id"], "invitation_id": job["invitation_id"], "status": job["status"], "stage": job["stage"],
            "progress": PROGRESS.get(job["stage"], 0), "attempt": job["attempt"], "error": err,
            "result_version_id": job.get("result_version_id"), "created_at": job["created_at"],
            "finished_at": job.get("finished_at")}


def get_job(db, user: AuthUser, job_id: str) -> dict:
    job = jobs_repo.get_owned(db, job_id, user.id)
    if not job:
        raise not_found("Proses")
    return job


def _fail(db, job_id: str, code: str) -> None:
    jobs_repo.fail(db, job_id, now_iso(), code, _ERR_MSG.get(code, _ERR_MSG["internal_error"]))


def run_job(db, s: Settings, job_id: str) -> None:
    with _SEM:
        job = jobs_repo.claim(db, job_id, now_iso())
        if not job:
            return
        stage = lambda name: jobs_repo.touch(db, job_id, now_iso(), name)  # noqa: E731
        beat = lambda: jobs_repo.touch(db, job_id, now_iso())  # noqa: E731
        try:
            stage("validating")
            snap = job["input_snapshot"]
            data = InvitationData.model_validate(snap["data"])
            if data.missing():
                raise InvalidOutput("data tidak lengkap")
            stage("prompting")
            system, user_msg = prompt.build_messages(snap, snap.get("preset_brief") or "")
            stage("generating")
            doc = _generate_valid(s, system, user_msg, (data.groom.name, data.bride.name), beat)
            stage("sanitizing")
            clean = sanitize(doc, SanitizeCtx(job["invitation_id"], s.storage_public_prefix))
            stage("injecting")
            final, warnings = ensure_slots(clean, SlotCtx(bool(snap.get("has_music")), bool(snap.get("has_gifts"))))
            stage("saving")
            jobs_repo.commit(db, job_id, final, s.gemini_model, warnings, s.free_active_days)
        except gemini.GeminiError as e:
            _fail(db, job_id, e.code)
        except (InvalidOutput, SanitizeError) as e:
            log.warning("job=%s output ditolak: %s", job_id, e)
            _fail(db, job_id, e.code)
        except Exception:
            log.exception("job=%s gagal tak terduga", job_id)
            _fail(db, job_id, "internal_error")


def _generate_valid(s: Settings, system: str, user_msg: str, names, beat) -> str:
    last: Exception = InvalidOutput("kosong")
    for _ in range(MAX_ATTEMPTS):
        try:
            raw = gemini.generate_text(s, system, user_msg, heartbeat=beat)
            return extract_document(raw, names)
        except InvalidOutput as e:
            last = e
        except gemini.GeminiError as e:
            if e.code == "ai_rate_limited":
                raise
            last = e
    raise last


def recover_stale_jobs(db, s: Settings) -> list[str]:
    """Antrikan ulang job macet; kembalikan id yang perlu dijalankan lagi (pemanggil yang menjadwalkan)."""
    cutoff = (now() - timedelta(seconds=s.job_stale_after_seconds)).isoformat()
    requeued = []
    for job in jobs_repo.stale(db, cutoff):
        if job["attempt"] >= MAX_REQUEUE:
            _fail(db, job["id"], "worker_lost")
        else:
            jobs_repo.requeue(db, job["id"], now_iso(), job["attempt"] + 1)
            requeued.append(job["id"])
    return requeued


def dispatch_in_thread(db, s: Settings, job_ids: list[str]) -> None:
    for jid in job_ids:
        threading.Thread(target=run_job, args=(db, s, jid), daemon=True).start()


__all__ = ["parse_ts"]
