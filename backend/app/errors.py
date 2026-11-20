"""Format error seragam (06 §1.1)."""
import logging
import uuid
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, code: str, status: int, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.code, self.status, self.message, self.details = code, status, message, details


def not_found(what: str = "Data") -> AppError:
    return AppError("not_found", 404, f"{what} tidak ditemukan.")


def premium_required(fields: list[str] | None = None) -> AppError:
    return AppError(
        "premium_required", 403, "Fitur ini khusus paket Premium.", {"fields": fields} if fields else None
    )


def _body(request: Request, code: str, message: str, details: dict | None = None) -> dict:
    err: dict[str, Any] = {
        "code": code,
        "message": message,
        "request_id": getattr(request.state, "request_id", None),
    }
    if details:
        err["details"] = details
    return {"error": err}


def _resp(request: Request, status: int, code: str, message: str, details=None, headers=None):
    h = dict(headers or {})
    rid = getattr(request.state, "request_id", None)
    if rid:
        h["X-Request-ID"] = rid
    return JSONResponse(_body(request, code, message, details), status_code=status, headers=h)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError):
        headers = {"Retry-After": "60"} if exc.code == "rate_limited" else None
        return _resp(request, exc.status, exc.code, exc.message, exc.details, headers)

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError):
        fields = [
            {"path": ".".join(str(p) for p in e["loc"] if p not in ("body", "query", "path")),
             "message": str(e.get("msg", "")).removeprefix("Value error, ")}
            for e in exc.errors()
        ]
        return _resp(request, 422, "validation_error", "Data yang dikirim tidak valid.", {"fields": fields})

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException):
        codes = {401: "unauthorized", 404: "not_found", 405: "bad_request"}
        msgs = {401: "Sesi tidak valid. Silakan masuk lagi.", 404: "Data tidak ditemukan."}
        return _resp(request, exc.status_code, codes.get(exc.status_code, "bad_request"),
                     msgs.get(exc.status_code, "Permintaan tidak valid."))

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception):
        rid = getattr(request.state, "request_id", None)
        log.error("unhandled error request_id=%s path=%s", rid, request.url.path, exc_info=exc)
        return _resp(request, 500, "internal_error", "Terjadi kesalahan pada server.")


def new_request_id() -> str:
    return uuid.uuid4().hex[:8]
