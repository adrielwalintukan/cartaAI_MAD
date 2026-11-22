"""Geocoding lokasi acara (Nominatim) untuk peta statis di halaman undangan. Gagal = None (halaman memakai iframe)."""
import logging
import re
import time

import httpx

log = logging.getLogger(__name__)
_CACHE: dict[str, tuple[float, list[float] | None]] = {}
TTL_FOUND, TTL_MISS = 7 * 86400, 600
_URL = "https://nominatim.openstreetmap.org/search"


def _variants(q: str):
    yield q
    bare = re.sub(r"\s*\([^)]*\)", "", q).strip()  # "Kampus (Gedung A)" -> "Kampus"
    if bare and bare != q:
        yield bare
    words = bare.split()
    if len(words) >= 3:
        yield " ".join(words[1:])  # "Puncak Gunung Klabat" -> "Gunung Klabat"


def locate(q: str | None) -> list[float] | None:
    """[lat, lon] untuk nama lokasi; hasil (juga kegagalan) di-cache agar Nominatim tidak dibebani."""
    q = (q or "").strip()
    if not q:
        return None
    hit = _CACHE.get(q)
    if hit and hit[0] > time.time():
        return hit[1]
    found = None
    for v in _variants(q):
        try:
            r = httpx.get(_URL, params={"q": v, "format": "jsonv2", "limit": 1, "accept-language": "id"},
                          headers={"User-Agent": "CartaAI/1.0 (peta undangan digital)"}, timeout=2.5)
            rows = r.json() if r.status_code == 200 else []
            if rows:
                found = [round(float(rows[0]["lat"]), 6), round(float(rows[0]["lon"]), 6)]
                break
        except Exception as exc:  # jaringan/format: peta cadangan dipakai
            log.warning("geocode gagal type=%s", type(exc).__name__)
            break
    _CACHE[q] = (time.time() + (TTL_FOUND if found else TTL_MISS), found)
    return found
