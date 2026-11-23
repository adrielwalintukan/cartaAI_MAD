from uuid import UUID

from pydantic import BaseModel


class OrderCreate(BaseModel):
    invitation_id: UUID
