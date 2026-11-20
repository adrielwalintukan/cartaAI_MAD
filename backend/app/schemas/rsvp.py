from typing import Literal

from pydantic import BaseModel, field_validator

from app.schemas.common import clean_text


class RsvpIn(BaseModel):
    name: str
    attendance: Literal["hadir", "tidak_hadir"]
    message: str | None = None

    @field_validator("name")
    @classmethod
    def _n(cls, v):
        v = clean_text(v, 100)
        if not v:
            raise ValueError("Nama tidak boleh kosong.")
        return v

    @field_validator("message")
    @classmethod
    def _m(cls, v):
        return clean_text(v, 500, multiline=True)


class RsvpPatch(BaseModel):
    is_hidden: bool
