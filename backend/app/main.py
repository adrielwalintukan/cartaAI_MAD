"""Aplikasi FastAPI v2 (04 §2.1)."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.config import get_settings
from app.db import get_supabase
from app.errors import new_request_id, register_error_handlers
from app.logging_config import setup_logging
from app.routers import assets, chat, guests, health, invitations, jobs, me, payments, presets, public, rsvps, serve
from app.services import assets as assets_svc
from app.services import generation

log = logging.getLogger(__name__)
_PUBLIC_CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    try:  # startup tidak boleh gagal hanya karena DB belum terjangkau
        db = get_supabase()
        generation.dispatch_in_thread(db, s, generation.recover_stale_jobs(db, s))
        assets_svc.cleanup_pending(db, s)
    except Exception:
        log.warning("pemeliharaan startup dilewati", exc_info=True)
    yield


def create_app() -> FastAPI:
    s = get_settings()
    setup_logging(s.log_level)
    app = FastAPI(title="CartaAI API", version="2.0.0", lifespan=lifespan,
                  docs_url=None if s.is_production else "/docs",
                  redoc_url=None, openapi_url=None if s.is_production else "/openapi.json")
    register_error_handlers(app)
    app.add_middleware(CORSMiddleware, allow_origins=s.cors_origins, allow_credentials=False,
                       allow_methods=["*"], allow_headers=["*"])

    @app.middleware("http")
    async def public_cors(request: Request, call_next):
        if not request.url.path.startswith("/api/public/"):
            return await call_next(request)
        if request.method == "OPTIONS":
            return Response(status_code=204, headers=_PUBLIC_CORS)
        resp = await call_next(request)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp

    @app.middleware("http")
    async def request_id(request: Request, call_next):
        rid = new_request_id()
        request.state.request_id = rid
        resp = await call_next(request)
        resp.headers["X-Request-ID"] = rid
        return resp

    for r in (health, me, presets, invitations, jobs, assets, guests, rsvps, public, serve, payments, chat):
        app.include_router(r.router)
    return app


app = create_app()
