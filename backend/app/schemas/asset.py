from typing import Literal

from pydantic import BaseModel, Field


class AssetUploadIn(BaseModel):
    kind: Literal["cover", "groom", "bride", "gallery", "music"]
    content_type: str
    size_bytes: int = Field(gt=0)
    position: int = Field(default=0, ge=0, le=100)
