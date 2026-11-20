from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.deps import AuthUser, get_current_user, get_db
from app.schemas.chat import ChatRequest
from app.services import chat as svc

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])


@router.post("")
def chat(body: ChatRequest, user: AuthUser = Depends(get_current_user), db=Depends(get_db),
         s: Settings = Depends(get_settings)):
    return svc.reply(db, s, user, body)


@router.get("/usage")
def usage(user: AuthUser = Depends(get_current_user), db=Depends(get_db), s: Settings = Depends(get_settings)):
    return svc.usage(db, s, user)
