"""Konfigurasi rute undangan publik (web/vercel.json) dan penjaga build-nya (review PR #1)."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

WEB = Path(__file__).resolve().parents[2] / "web"
GUARD = WEB / "scripts" / "check-deploy-config.mjs"
NODE = shutil.which("node")


def rewrite():
    cfg = json.loads((WEB / "vercel.json").read_text(encoding="utf-8"))
    return next(r for r in cfg["rewrites"] if r["source"] == "/u/:slug")


def test_public_invitation_route_maps_slug_to_backend_path():
    dest = rewrite()["destination"]
    assert dest.startswith("https://") and dest.endswith("/u/:slug")


def run_guard(env_extra):
    env = {k: v for k, v in os.environ.items() if k not in ("VERCEL", "CHECK_DEPLOY_STRICT")} | env_extra
    return subprocess.run([NODE, str(GUARD)], capture_output=True, text=True, env=env, timeout=60)


@pytest.mark.skipif(NODE is None, reason="node tidak tersedia")
def test_guard_only_warns_locally_and_fails_on_vercel_while_placeholder():
    placeholder = "TBD" in rewrite()["destination"].upper()
    local = run_guard({})
    assert local.returncode == 0  # lokal: peringatan saja
    vercel = run_guard({"VERCEL": "1"})
    assert (vercel.returncode != 0) == placeholder  # Vercel: gagal selama placeholder, lulus setelah diganti
    if placeholder:
        assert "placeholder" in vercel.stderr
