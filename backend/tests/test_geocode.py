import httpx

from app.services import geocode


class Resp:
    def __init__(self, rows, status=200):
        self.status_code, self._rows = status, rows

    def json(self):
        return self._rows


def _fresh(monkeypatch, fake):
    geocode._CACHE.clear()
    monkeypatch.setattr(httpx, "get", fake)


def test_locate_returns_rounded_lat_lon_and_caches(monkeypatch):
    calls = []
    _fresh(monkeypatch, lambda *a, **k: calls.append(1) or Resp([{"lat": "1.3951234567", "lon": "125.0654321"}]))
    assert geocode.locate("Universitas Klabat") == [1.395123, 125.065432]
    assert geocode.locate("Universitas Klabat") == [1.395123, 125.065432] and len(calls) == 1


def test_locate_retries_without_parentheses(monkeypatch):
    seen = []

    def fake(url, params, **k):
        seen.append(params["q"])
        return Resp([{"lat": "1", "lon": "2"}] if params["q"] == "Kampus" else [])

    _fresh(monkeypatch, fake)
    assert geocode.locate("Kampus (Gedung A)") == [1.0, 2.0] and seen == ["Kampus (Gedung A)", "Kampus"]


def test_locate_failure_is_none_and_cached(monkeypatch):
    calls = []

    def boom(*a, **k):
        calls.append(1)
        raise httpx.ConnectError("x")

    _fresh(monkeypatch, boom)
    assert geocode.locate("Tempat") is None and geocode.locate("Tempat") is None and len(calls) == 1


def test_locate_blank_makes_no_request(monkeypatch):
    _fresh(monkeypatch, lambda *a, **k: (_ for _ in ()).throw(AssertionError("tidak boleh dipanggil")))
    assert geocode.locate("  ") is None and geocode.locate(None) is None


def test_locate_drops_leading_word_as_last_resort(monkeypatch):
    seen = []

    def fake(url, params, **k):
        seen.append(params["q"])
        return Resp([{"lat": "1.45", "lon": "125.03"}] if params["q"] == "Gunung Klabat" else [])

    _fresh(monkeypatch, fake)
    assert geocode.locate("Puncak Gunung Klabat") == [1.45, 125.03] and seen == ["Puncak Gunung Klabat", "Gunung Klabat"]
