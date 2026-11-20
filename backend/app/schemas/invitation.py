import re
from datetime import date, timedelta
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator

from app.schemas.common import Text, clean_text

SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
Religion = Literal["islam", "kristen", "katolik", "hindu", "buddha", "konghucu", "lainnya"]
Timezone = Literal["WIB", "WITA", "WIT"]


def _time(v):
    if v in (None, ""):
        return None
    if not isinstance(v, str) or not TIME_RE.match(v.strip()):
        raise ValueError("Format jam harus HH:MM 24 jam, contoh 09:00 (tanpa zona waktu; isi zona di kolom terpisah).")
    return v.strip()


Clock = Annotated[str | None, BeforeValidator(_time)]


class Person(BaseModel):
    name: Text(60) = None
    father: Text(60) = None
    mother: Text(60) = None


class Ceremony(BaseModel):
    label: Text(40) = None
    time: Clock = None
    location: Text(200) = None


class Reception(BaseModel):
    time: Clock = None
    location: Text(200) = None


class Gift(BaseModel):
    bank: Text(30) = None
    account_number: str | None = None
    account_name: Text(60) = None

    @field_validator("account_number")
    @classmethod
    def _acc(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not re.fullmatch(r"[0-9 .-]{5,30}", v):
            raise ValueError("Nomor rekening hanya angka (5-30 karakter).")
        return v


class InvitationData(BaseModel):
    """Bentuk `invitations.data` (06 §2.1). Semua opsional saat draft; kelengkapan dicek saat generate."""

    model_config = ConfigDict(extra="ignore")
    groom: Person = Field(default_factory=Person)
    bride: Person = Field(default_factory=Person)
    religion: Religion | None = None
    event_date: date | None = None
    timezone: Timezone = "WIB"
    ceremony: Ceremony = Field(default_factory=Ceremony)
    reception: Reception | None = None
    notes: Text(500, multiline=True) = None
    color_theme: Text(80) = None
    gifts: list[Gift] = Field(default_factory=list, max_length=5)

    @field_validator("event_date")
    @classmethod
    def _date(cls, v):
        if v and v > date.today() + timedelta(days=366 * 3):
            raise ValueError("Tanggal acara tidak boleh lebih dari 3 tahun ke depan.")
        return v

    def to_db(self) -> dict:
        d = self.model_dump(mode="json", exclude_none=True)
        if not d.get("reception", {}).get("location") and not d.get("reception", {}).get("time"):
            d.pop("reception", None)
        return d

    def missing(self) -> list[str]:
        m = []
        if not self.groom.name:
            m.append("groom.name")
        if not self.bride.name:
            m.append("bride.name")
        if not self.event_date:
            m.append("event_date")
        if not self.ceremony.location:
            m.append("ceremony.location")
        return m

    def title(self) -> str | None:
        if self.groom.name and self.bride.name:
            return clean_text(f"{self.groom.name} & {self.bride.name}", 120)
        return self.groom.name or self.bride.name


def validate_slug(slug: str) -> str:
    s = slug.strip().lower() if isinstance(slug, str) else ""
    if not (3 <= len(s) <= 40 and SLUG_RE.match(s)):
        raise ValueError("Slug 3-40 karakter: huruf kecil, angka, dan tanda hubung (tidak di tepi/ganda).")
    return s


class InvitationCreate(BaseModel):
    slug: str
    preset_id: str = "default"
    data: InvitationData = Field(default_factory=InvitationData)

    @field_validator("slug")
    @classmethod
    def _slug(cls, v):
        return validate_slug(v)


class InvitationPatch(BaseModel):
    data: InvitationData | None = None
    preset_id: str | None = Field(default=None, pattern=r"^[a-z0-9-]{2,40}$")
