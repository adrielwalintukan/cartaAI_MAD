from datetime import datetime, timedelta, timezone

import pytest

from app.services import generation
from app.services.ai import gemini
from tests.conftest import A, B, auth

GOOD = ("<!DOCTYPE html><html><head><title>U</title></head><body><h1>Adriel &amp; Tiara</h1>"
        + "<p>Dengan hormat kami mengundang</p>" * 150 + "<script>alert(1)</script></body></html>")


@pytest.fixture
def ai(monkeypatch):
    calls = []

    def fake(s, system, contents, **kw):
        calls.append((system, contents))
        return "```html\n" + GOOD + "\n```"

    monkeypatch.setattr(gemini, "generate_text", fake)
    monkeypatch.setattr(gemini.time, "sleep", lambda *_: None)
    return calls


def gen(client, inv, user=A):
    return client.post(f"/api/invitations/{inv['id']}/generate", headers=auth(user))


def test_success_creates_version_and_quota(client, make_inv, ai, db):
    inv = make_inv()
    r = gen(client, inv)
    assert r.status_code == 202 and r.json()["status"] == "queued"
    job = client.get(f"/api/jobs/{r.json()['job_id']}", headers=auth(A)).json()
    assert job["status"] == "succeeded" and job["progress"] == 100 and job["result_version_id"]
    row = db.one("invitations", id=inv["id"])
    assert row["generations_used"] == 1 and row["status"] == "published" and row["expires_at"]
    html = db.one("invitation_versions", id=row["current_version_id"])["html"]
    assert "alert(1)" not in html and 'data-carta="rsvp"' in html and 'data-carta="countdown"' in html
    assert ai[0][1].startswith("<data>")


def test_free_third_ok_fourth_blocked_without_gemini(client, make_inv, ai, db):
    inv = make_inv()
    for _ in range(3):
        assert gen(client, inv).status_code == 202
    n = len(ai)
    r = gen(client, inv)
    assert r.status_code == 403 and r.json()["error"]["code"] == "quota_exceeded" and len(ai) == n  # B1
    assert len(db.tables["invitation_versions"]) == 2 and db.one("invitations", id=inv["id"])["previous_version_id"]


def test_premium_quota_15(client, make_inv, ai):
    inv = make_inv(plan="premium", generations_used=14)
    assert gen(client, inv).status_code == 202
    assert gen(client, inv).status_code == 403


def test_nothing_to_generate(client, make_inv, ai):
    inv = make_inv(data={"groom": {"name": "A"}})
    r = gen(client, inv)
    j = r.json()["error"]
    assert r.status_code == 409 and j["code"] == "nothing_to_generate" and "bride.name" in j["details"]["missing"]
    assert ai == []


def test_other_user_404_B2(client, make_inv, ai):
    inv = make_inv()
    assert gen(client, inv, B).status_code == 404 and ai == []


def test_job_in_progress(client, make_inv, ai, db):
    inv = make_inv()
    db.table("generation_jobs").insert({"invitation_id": inv["id"], "user_id": A["id"], "input_snapshot": {}}).execute()
    r = gen(client, inv)
    assert r.status_code == 409 and r.json()["error"]["code"] == "job_in_progress" and r.json()["error"]["details"]["job_id"]


def test_invalid_output_3x_fails_without_quota(client, make_inv, monkeypatch, db):
    n = []
    monkeypatch.setattr(gemini, "generate_text", lambda *a, **k: n.append(1) or "bukan html")
    inv = make_inv()
    jid = gen(client, inv).json()["job_id"]
    job = client.get(f"/api/jobs/{jid}", headers=auth(A)).json()
    assert job["status"] == "failed" and job["error"]["code"] == "invalid_output" and len(n) == 3
    assert db.one("invitations", id=inv["id"])["generations_used"] == 0 and db.tables["invitation_versions"] == []
    assert gen(client, inv).status_code == 202  # tombol generate terbuka lagi


def test_rate_limited_fails_fast(client, make_inv, monkeypatch):
    def boom(*a, **k):
        raise gemini.GeminiError("ai_rate_limited")

    monkeypatch.setattr(gemini, "generate_text", boom)
    jid = gen(client, make_inv()).json()["job_id"]
    job = client.get(f"/api/jobs/{jid}", headers=auth(A)).json()
    assert job["error"]["code"] == "ai_rate_limited"


def test_unexpected_error_hidden(client, make_inv, monkeypatch):
    monkeypatch.setattr(gemini, "generate_text", lambda *a, **k: 1 / 0)
    jid = gen(client, make_inv()).json()["job_id"]
    job = client.get(f"/api/jobs/{jid}", headers=auth(A)).json()
    assert job["error"]["code"] == "internal_error" and "division" not in job["error"]["message"]


def test_job_not_visible_to_others(client, make_inv, ai):
    jid = gen(client, make_inv()).json()["job_id"]
    assert client.get(f"/api/jobs/{jid}", headers=auth(B)).status_code == 404


def test_free_snapshot_drops_premium_data(client, make_inv, ai, db):
    inv = make_inv()
    jid = gen(client, inv).json()["job_id"]
    snap = db.one("generation_jobs", id=jid)["input_snapshot"]
    assert snap["preset_id"] == "default" and snap["assets"] == {"gallery": []} and snap["has_music"] is False


def test_recover_stale_requeues_then_worker_lost(db, make_inv, settings):
    inv = make_inv()
    old = (datetime.now(timezone.utc) - timedelta(seconds=600)).isoformat()
    db.table("generation_jobs").insert({"invitation_id": inv["id"], "user_id": A["id"], "input_snapshot": {},
                                        "status": "running", "heartbeat_at": old}).execute()
    job = db.tables["generation_jobs"][0]
    for expected_attempt in (1, 2):
        assert generation.recover_stale_jobs(db, settings) == [job["id"]]
        assert job["status"] == "queued" and job["attempt"] == expected_attempt
        job["status"], job["heartbeat_at"] = "running", old
    assert generation.recover_stale_jobs(db, settings) == []
    assert job["status"] == "failed" and job["error_code"] == "worker_lost"


def test_fresh_job_not_recovered(db, make_inv, settings):
    inv = make_inv()
    db.table("generation_jobs").insert({"invitation_id": inv["id"], "user_id": A["id"], "input_snapshot": {},
                                        "status": "running"}).execute()
    assert generation.recover_stale_jobs(db, settings) == []


def test_claim_is_atomic(db, make_inv, settings, ai):
    inv = make_inv()
    db.table("generation_jobs").insert({"invitation_id": inv["id"], "user_id": A["id"], "input_snapshot": {},
                                        "status": "running"}).execute()
    jid = db.tables["generation_jobs"][0]["id"]
    generation.run_job(db, settings, jid)  # sudah running -> diabaikan
    assert ai == [] and db.tables["generation_jobs"][0]["status"] == "running"


def test_rollback_swaps_versions(client, make_inv, ai, db):
    inv = make_inv()
    gen(client, inv)
    gen(client, inv)
    before = db.one("invitations", id=inv["id"])
    cur, prev = before["current_version_id"], before["previous_version_id"]
    r = client.post(f"/api/invitations/{inv['id']}/rollback", headers=auth(A))
    assert r.status_code == 200 and r.json()["current_version"]["id"] == prev
    assert db.one("invitations", id=inv["id"])["previous_version_id"] == cur
    assert db.one("invitations", id=inv["id"])["generations_used"] == 2  # rollback tak memakai kuota


def test_free_snapshot_keeps_design_input_drops_gifts(db, make_inv, settings):
    inv = make_inv()
    inv["data"] = {**inv["data"], "color_theme": "sage", "design_notes": "bunga",
                   "gifts": [{"bank": "BCA", "account_number": "12345", "account_name": "A"}]}
    snap = generation.build_snapshot(settings, inv, {"id": "default", "brief": "b"}, [])
    assert snap["data"]["color_theme"] == "sage" and snap["data"]["design_notes"] == "bunga"
    assert "gifts" not in snap["data"]
