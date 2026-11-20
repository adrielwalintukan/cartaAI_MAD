import re

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import clean_text


def clean_name(v: str) -> str:
    v = clean_text(v, 100)
    if not v:
        raise ValueError("Nama tidak boleh kosong.")
    return v


def clean_phone(v):
    if v in (None, ""):
        return None
    v = re.sub(r"[ \-()]", "", str(v))
    if not re.fullmatch(r"\+?[0-9]{8,15}", v):
        raise ValueError("Nomor telepon tidak valid (8-15 digit).")
    return v


class GuestIn(BaseModel):
    name: str
    phone: str | None = None

    @field_validator("name")
    @classmethod
    def _n(cls, v):
        return clean_name(v)

    @field_validator("phone")
    @classmethod
    def _p(cls, v):
        return clean_phone(v)


class GuestPatch(BaseModel):
    name: str | None = None
    phone: str | None = None

    @field_validator("name")
    @classmethod
    def _n(cls, v):
        return clean_name(v) if v is not None else v

    @field_validator("phone")
    @classmethod
    def _p(cls, v):
        return clean_phone(v)


class GuestBulk(BaseModel):
    guests: list[dict] = Field(max_length=500)
