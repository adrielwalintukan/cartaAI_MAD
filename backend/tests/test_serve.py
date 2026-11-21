import re

from tests.conftest import VALID_DATA

HTML = ("<!DOCTYPE html><html><head></head><body><h1>Adriel</h1><div data-carta=\"rsvp\"></div>"
        "<div data-carta=\"countdown\"></div><script>alert('ai')</script></body></html>")


def publish(db, make_inv, plan="free", slug="adriel-tiara", **extra):
    inv = make_inv(slug=slug, plan=plan, status="published", **extra)
    db.table("invitation_versions").insert({"invitation_id": inv["id"], "version_no": 1, "html": HTML, "model": "m",
                                            "input_snapshot": {}}).execute()
    vid = db.tables["invitation_versions"][-1]["id"]
    db.one("invitations", id=inv["id"])["current_version_id"] = vid
    return inv


def test_headers_and_nonce_unique(client, db, make_inv):
    publish(db, make_inv)
    a, b = client.get("/u/adriel-tiara"), client.get("/u/adriel-tiara")
    assert a.status_code == 200 and a.headers["content-type"].startswith("text/html")
    csp = a.headers["content-security-policy"]
    nonce = re.search(r"'nonce-([^']+)'", csp).group(1)
    assert "sandbox allow-scripts" in csp and "allow-same-origin" not in csp
    assert "connect-src https://api.test" in csp and "https://test.supabase.co" in csp
    assert nonce != re.search(r"'nonce-([^']+)'", b.headers["content-security-policy"]).group(1)
    assert a.text.count(f'nonce="{nonce}"') == 3 and "alert('ai')" not in a.text
    assert a.headers["x-content-type-options"] == "nosniff" and a.headers["referrer-policy"] == "no-referrer"
    assert a.headers["x-robots-tag"] == "noindex" and "s-maxage=300" in a.headers["cache-control"]


def test_watermark_by_plan(client, db, make_inv):
    publish(db, make_inv)
    publish(db, make_inv, plan="premium", slug="prem-prem")
    assert "<div data-carta-watermark" in client.get("/u/adriel-tiara").text
    assert "<div data-carta-watermark" not in client.get("/u/prem-prem").text


def test_404_draft_and_missing_410_expired(client, db, make_inv):
    make_inv(slug="masih-draft")
    r = client.get("/u/masih-draft")
    assert r.status_code == 404 and "script-src 'none'" in r.headers["content-security-policy"]
    assert client.get("/u/nggak-ada").status_code == 404
    publish(db, make_inv, slug="kedaluwarsa", expires_at="2020-01-01T00:00:00+00:00")
    assert client.get("/u/kedaluwarsa").status_code == 410


def test_query_not_rendered(client, db, make_inv):
    publish(db, make_inv)
    r = client.get("/u/adriel-tiara?to=<img src=x onerror=alert(1)>")
    assert "onerror" not in r.text


def test_gifts_only_for_premium(client, db, make_inv):
    gifts = [{"bank": "BCA", "account_number": "12345", "account_name": "A"}]
    publish(db, make_inv, data={**VALID_DATA, "gifts": gifts})
    publish(db, make_inv, plan="premium", slug="prem-prem", data={**VALID_DATA, "gifts": gifts})
    assert "12345" not in client.get("/u/adriel-tiara").text and "12345" in client.get("/u/prem-prem").text


def test_event_time_zone(client, db, make_inv):
    publish(db, make_inv)
    assert "2027-06-12T09:00:00+08:00" in client.get("/u/adriel-tiara").text


def test_ornament_filled_on_serve_csp_unchanged(client, db, make_inv):
    publish(db, make_inv)
    db.tables["invitation_versions"][-1]["html"] = HTML.replace("</body>", '<div data-carta="ornament" data-kind="wave"></div></body>')
    r = client.get("/u/adriel-tiara")
    assert r.status_code == 200 and "<svg" in r.text
    assert "img-src" in r.headers["content-security-policy"] and "'unsafe-eval'" not in r.headers["content-security-policy"]
