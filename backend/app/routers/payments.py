import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from app.config import Settings, get_settings
from app.deps import AuthUser, get_current_user, get_db
from app.errors import AppError
from app.schemas.payment import OrderCreate
from app.services import payments as svc

router = APIRouter(prefix="/api/payments", tags=["Pembayaran"])


@router.post("/orders")
def create_order(body: OrderCreate, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
                 s: Settings = Depends(get_settings)):
    order, created = svc.create_order(db, s, user, str(body.invitation_id))
    return JSONResponse(order, status_code=201 if created else 200)


@router.get("/orders/{order_id}")
def get_order(order_id: str, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
              s: Settings = Depends(get_settings)):
    return svc.get_order(db, s, user, order_id)


@router.post("/webhook")
async def webhook(request: Request, db=Depends(get_db), s: Settings = Depends(get_settings)):
    body = await request.body()
    if len(body) > svc._MAX_WEBHOOK_BYTES:
        raise AppError("payload_too_large", 413, "Permintaan terlalu besar.")
    try:
        payload = json.loads(body)
    except ValueError:
        payload = None
    if not isinstance(payload, dict):
        raise AppError("invalid_signature", 403, "Signature tidak valid.")
    # sinkron di threadpool agar tidak memblokir event loop
    from starlette.concurrency import run_in_threadpool
    return await run_in_threadpool(svc.handle_webhook, db, s, payload)
