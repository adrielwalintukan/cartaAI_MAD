import pytest
from starlette.requests import Request

from app.deps import client_ip, reset_rate_limits


def req(xff=None, peer="10.0.0.1"):
    headers = [(b"x-forwarded-for", xff.encode())] if xff is not None else []
    return Request({"type": "http", "headers": headers, "client": (peer, 1234)})


def test_takes_entry_added_by_trusted_proxy_not_client_supplied():
    # klien menulis 6.6.6.6; proxy tepercaya menambahkan alamat klien sebenarnya di kanan
    assert client_ip(req("6.6.6.6, 9.9.9.9"), trusted_proxies=1) == "9.9.9.9"


def test_two_trusted_proxies_take_second_from_right():
    assert client_ip(req("6.6.6.6, 9.9.9.9, 172.16.0.1"), trusted_proxies=2) == "9.9.9.9"


def test_zero_trusted_proxies_ignores_header():
    assert client_ip(req("6.6.6.6"), trusted_proxies=0) == "10.0.0.1"


def test_header_shorter_than_trusted_chain_falls_back_to_peer():
    assert client_ip(req("6.6.6.6"), trusted_proxies=2) == "10.0.0.1"
    assert client_ip(req(None), trusted_proxies=1) == "10.0.0.1"


@pytest.mark.parametrize("xff", ["", " , ", "   "])
def test_blank_header_falls_back_to_peer(xff):
    assert client_ip(req(xff), trusted_proxies=1) == "10.0.0.1"


def test_rate_limit_not_bypassed_by_rotating_spoofed_header(client, make_inv, db):
    reset_rate_limits()
    inv = make_inv()
    inv["status"] = "published"
    row = db.one("invitations", id=inv["id"])
    row["status"] = "published"
    codes = []
    for i in range(7):
        r = client.post(f"/api/public/invitations/{row['slug']}/rsvps",
                        headers={"x-forwarded-for": f"6.6.6.{i}, 9.9.9.9"},
                        json={"name": "Tamu", "attendance": "hadir"})
        codes.append(r.status_code)
    assert 429 in codes  # alamat sebenarnya sama (9.9.9.9), jadi pemalsuan entri kiri tidak menghindari limit
