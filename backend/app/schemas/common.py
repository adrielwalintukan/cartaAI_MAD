import re
import unicodedata
from typing import Annotated

from pydantic import BeforeValidator

_HIDDEN = re.compile("[‪-‮⁦-⁩​-‏﻿]")


def clean_text(value, max_len: int, multiline: bool = False) -> str | None:
    """Pembersihan input user sebelum disimpan / masuk prompt (07 §2)."""
    if value is None:
        return None
    s = unicodedata.normalize("NFC", str(value))
    s = _HIDDEN.sub("", s)
    s = s.replace("\t", " ").replace("\r", "\n")
    if not multiline:
        s = s.replace("\n", " ")
    s = "".join(c for c in s if c == "\n" or not unicodedata.category(c).startswith("C"))
    s = s.replace("<", " ").replace(">", " ")
    if multiline:
        s = "\n".join(re.sub(r" +", " ", ln).strip() for ln in s.split("\n")).strip()
    else:
        s = re.sub(r"\s+", " ", s).strip()
    return s[:max_len].strip() or None


def Text(max_len: int, multiline: bool = False):
    return Annotated[str | None, BeforeValidator(lambda v: clean_text(v, max_len, multiline))]
