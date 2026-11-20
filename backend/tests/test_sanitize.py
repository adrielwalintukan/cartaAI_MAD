import pytest

from app.services.ai.sanitize import (InvalidOutput, SanitizeCtx, SanitizeError, extract_document, sanitize)

PREFIX = "https://test.supabase.co/storage/v1/object/public/invitation-assets/"
CTX = SanitizeCtx("inv-1", PREFIX)


def s(body: str) -> str:
    return sanitize(f"<!DOCTYPE html><html><head></head><body>{body}</body></html>", CTX)


def head(h: str) -> str:
    return sanitize(f"<!DOCTYPE html><html><head>{h}</head><body><p>x</p></body></html>", CTX)


def test_script_removed():
    assert "alert" not in s("<script>alert(1)</script><p>ok</p>") and "<p>ok</p>" in s("<script>x</script><p>ok</p>")


def test_img_onerror_and_foreign_src():
    out = s("<img src=x onerror=alert(1)>")
    assert "onerror" not in out and "<img" not in out


@pytest.mark.parametrize("href", ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\nscript:alert(1)",
                                  "&#106;avascript:alert(1)", "data:text/html,<script>alert(1)</script>",
                                  "vbscript:x", "http://plain.example"])
def test_dangerous_hrefs_dropped(href):
    out = s(f'<a href="{href}">x</a>')
    assert "href" not in out.split("<body>")[1] and "javascript" not in out.lower().split("<body>")[1]


def test_safe_links_kept_and_external_hardened():
    out = s('<a href="https://wa.me/1">w</a><a href="#acara">a</a><a href="tel:+62812345">t</a>')
    assert 'target="_blank"' in out and "noopener" in out and 'href="#acara"' in out and "tel:" in out


@pytest.mark.parametrize("snippet", ["<svg onload=alert(1)></svg>", "<svg><script>alert(1)</script></svg>",
                                     '<svg><use href="https://evil/x.svg#a"></use></svg>',
                                     "<svg><animate attributeName=x></animate></svg>"])
def test_svg_vectors(snippet):
    out = s(snippet).split("<body>")[1].lower()
    assert "onload" not in out and "<script" not in out and "<use" not in out and "<animate" not in out


@pytest.mark.parametrize("tag", ['<iframe src="https://evil"></iframe>', "<object data=x></object>", "<embed src=x>",
                                 '<form action="https://evil"><input name=a></form>', "<input>", "<textarea>t</textarea>"])
def test_dropped_tags(tag):
    out = s(tag).split("<body>")[1].lower()
    for t in ("<iframe", "<object", "<embed", "<form", "<input", "<textarea"):
        assert t not in out


def test_meta_refresh_and_base_dropped():
    out = head('<meta http-equiv="refresh" content="0;url=https://evil"><base href="https://evil">')
    assert "refresh" not in out and "<base" not in out


def test_foreign_script_src_dropped_tailwind_kept():
    assert "evil.com" not in head('<script src="https://evil.com/x.js"></script>')
    assert "cdn.tailwindcss.com" in head('<script src="https://cdn.tailwindcss.com"></script>')


def test_tailwind_with_inline_body_dropped():
    assert "alert" not in head('<script src="https://cdn.tailwindcss.com">alert(1)</script>')


def test_link_whitelist():
    out = head('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">'
               '<link rel="stylesheet" href="https://evil/x.css">')
    assert "fonts.googleapis.com" in out and "evil" not in out


def test_style_import_and_urls():
    out = head("<style>@import url(https://evil/x.css);@import url('https://fonts.googleapis.com/css2?family=Inter');"
               "a{background:url(https://evil/x.png)}b{width:expression(alert(1))}</style>")
    assert "evil" not in out and "expression" not in out and "fonts.googleapis.com" in out


def test_style_attr_url_javascript():
    out = s('<div style="background:url(javascript:alert(1))">x</div>')
    assert "javascript" not in out


def test_css_escape_obfuscation():
    out = head("<style>a{background:\75rl(https://evil/x.png)}</style>")
    assert "evil" not in out or "url(" not in out.lower()


def test_foreign_asset_img_dropped_own_kept():
    other = PREFIX + "invitations/other-inv/cover/a.jpg"
    mine = PREFIX + "invitations/inv-1/cover/a.jpg"
    out = s(f'<img src="{other}"><img src="{mine}" alt="m">')
    assert other not in out and mine in out


def test_broken_nested_tags_and_case():
    out = s("<scr<script>ipt>alert(1)</scr</script>ipt><ScRiPt>alert(2)</ScRiPt>").split("<body>")[1].lower()
    assert "<script" not in out


def test_data_attrs():
    out = s('<div data-carta="rsvp" data-foo="1"></div><div data-carta="hack"></div>')
    assert 'data-carta="rsvp"' in out and "data-foo" not in out and "hack" not in out


def test_comments_and_cdata_dropped():
    out = s("<!--[if IE]><script>alert(1)</script><![endif]--><![CDATA[<script>alert(2)</script>]]><p>ok</p>")
    assert "<script" not in out.lower() and "ok" in out


def test_too_large():
    with pytest.raises(SanitizeError):
        s("<p>" + "a" * 650_000 + "</p>")


def test_basics_added():
    out = sanitize("<html><body><p>x</p></body></html>", CTX)
    assert out.startswith("<!DOCTYPE html>") and 'lang="id"' in out and "viewport" in out and 'charset="utf-8"' in out


def _doc(extra=""):
    return "<!DOCTYPE html><html><head></head><body>" + "<p>Adriel dan Tiara</p>" * 200 + extra + "</body></html>"


def test_extract_document_strips_fences_and_prose():
    raw = "Berikut:\n```html\n" + _doc() + "\n```\nSelesai"
    out = extract_document(raw, ("Adriel", "Tiara"))
    assert out.startswith("<!DOCTYPE") and out.endswith("</html>")


@pytest.mark.parametrize("raw", ["", "bukan html", "<html><body>pendek</body></html>",
                                 _doc()[:-20], "<!DOCTYPE html><html><head></head>" + "x" * 4000 + "</html>"])
def test_extract_document_rejects(raw):
    with pytest.raises(InvalidOutput):
        extract_document(raw, ("Adriel", "Tiara"))


def test_extract_requires_names():
    with pytest.raises(InvalidOutput):
        extract_document(_doc(), ("Adriel", "Budi"))
