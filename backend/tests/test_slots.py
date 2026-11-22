import json
import re

from app.services.ai.sanitize import SanitizeCtx, sanitize
from app.services.ai.slots import PublicCtx, SlotCtx, build_csp, ensure_slots, json_for_script, render_public

PREFIX = "https://test.supabase.co/storage/v1/object/public/invitation-assets/"
SCTX = SanitizeCtx("inv-1", PREFIX)


def doc(body=""):
    return f"<!DOCTYPE html><html><head></head><body>{body}</body></html>"


def count(html, name):
    return len(re.findall(rf'data-carta="{name}"', html))


def test_missing_required_slots_injected():
    out, w = ensure_slots(doc("<p>x</p>"), SlotCtx(False, False))
    assert count(out, "rsvp") == 1 and count(out, "countdown") == 1
    assert "slot_rsvp_missing_injected" in w and "slot_countdown_missing_injected" in w


def test_present_slots_untouched():
    out, w = ensure_slots(doc('<div data-carta="countdown"></div><div data-carta="rsvp"></div>'), SlotCtx(False, False))
    assert w == [] and count(out, "rsvp") == 1


def test_duplicate_slot_reduced():
    out, w = ensure_slots(doc('<div data-carta="rsvp"></div><div data-carta="rsvp"></div><div data-carta="countdown"></div>'),
                          SlotCtx(False, False))
    assert count(out, "rsvp") == 1 and "slot_rsvp_duplicate_removed" in w


def test_music_gift_injected_when_data_exists():
    out, w = ensure_slots(doc(), SlotCtx(True, True))
    assert count(out, "music") == 1 and count(out, "gift") == 1
    assert out.index('data-carta="gift"') < out.index('data-carta="rsvp"')
    assert "slot_music_missing_injected" in w and "slot_gift_missing_injected" in w


def test_music_gift_removed_without_data():
    out, w = ensure_slots(doc('<div data-carta="music"></div><div data-carta="gift"></div>'), SlotCtx(False, False))
    assert count(out, "music") == 0 and count(out, "gift") == 0
    assert "slot_music_removed_no_data" in w and "slot_gift_removed_no_data" in w


def _public(plan, gifts=None):
    ctx = PublicCtx("adriel-tiara", plan, "2027-06-12T09:00:00+08:00", "https://api.test", None, gifts or [])
    return render_public(doc('<div data-carta="rsvp"></div>'), ctx, SCTX, "NONCE123")


def test_watermark_free_only():
    assert "<div data-carta-watermark" in _public("free")
    assert "<div data-carta-watermark" not in _public("premium")


def test_scripts_carry_nonce_and_runtime():
    out = _public("free")
    assert out.count('nonce="NONCE123"') == 3 and "__CARTA__" in out and "textContent" in out


def test_config_cannot_close_script():
    out = _public("premium", [{"bank": "</script><script>alert(1)</script>", "account_number": "123456",
                               "account_name": "A&B"}])
    assert "</script><script>alert(1)" not in out
    cfg = re.search(r"window.__CARTA__=(.*?);</script>", out, re.S).group(1)
    assert json.loads(cfg)["gifts"][0]["bank"].startswith("</script>")


def test_json_for_script_escapes():
    s = json_for_script({"a": "<\u2028>&"})
    assert "<" not in s and ">" not in s and "\u2028" not in s


def test_csp_shape():
    csp = build_csp("N", "https://abc.supabase.co", "https://api.test/", "https://web.test/")
    assert "script-src 'nonce-N' https://cdn.tailwindcss.com" in csp and "sandbox allow-scripts" in csp
    assert "allow-same-origin" not in csp and "connect-src https://api.test;" in csp
    assert "img-src data: https://abc.supabase.co" in csp and "frame-ancestors 'self' https://web.test" in csp
    assert "script-src 'none'" in build_csp(None, "https://abc.supabase.co", "https://api.test", "https://web.test")


# ---- kit desain (Q27)
from app.services.ai import ornaments  # noqa: E402
from app.services.ai.slots import _STYLE, runtime_js  # noqa: E402

PCTX = PublicCtx("adriel-tiara", "premium", None, "https://api.test")


def test_ensure_slots_keeps_multiple_ornaments():
    out, w = ensure_slots(doc('<div data-carta="ornament" data-kind="rings"></div>'
                              '<div data-carta="ornament" data-kind="wave"></div>'), SlotCtx(False, False))
    assert count(out, "ornament") == 2 and not any("ornament" in x for x in w)


def test_render_public_fills_known_ornament_skips_unknown():
    out = render_public(doc('<div data-carta="ornament" data-kind="rings"></div>'
                            '<div data-carta="ornament" data-kind="naga"><p>isi</p></div>'), PCTX, SCTX, "N")
    assert out.split("<style")[0].count("<svg") == 1 and "<p>isi</p>" in out


def test_ornament_keeps_ai_content_inside_slot():
    out = render_public(doc('<div data-carta="ornament" data-kind="arch-frame"><h1>Rendy &amp; Febe</h1></div>'), PCTX, SCTX, "N")
    assert "<svg" in out and "Rendy &amp; Febe" in out
    assert out.index("<svg") < out.index("Rendy")


def test_all_kinds_present_and_safe():
    assert set(ornaments.KINDS) == {"floral-corner", "floral-divider", "leaf-divider", "arch-frame",
                                    "batik-band", "rings", "dots-divider", "wave"}
    for svg in ornaments.KINDS.values():
        assert svg.startswith("<svg") and "currentColor" in svg
        assert "<script" not in svg and "href" not in svg and " on" not in svg


def test_kit_size_budget():
    assert len(_STYLE) + len(runtime_js()) + sum(len(v) for v in ornaments.KINDS.values()) < 40_000


def test_kit_css_classes_and_reduced_motion():
    assert ".carta-grain::before" in _STYLE and ".carta-grain{background-image" not in _STYLE
    for token in (".carta-reveal", ".carta-in", ".carta-delay-3", ".carta-reveal-zoom", ".carta-frame",
                  ".carta-grain", ".carta-display", "prefers-reduced-motion"):
        assert token in _STYLE
    # tanpa JS (kelas carta-js belum ada) konten tidak disembunyikan
    assert ".carta-js .carta-reveal{" in _STYLE and "\n.carta-reveal{opacity:0" not in _STYLE


def test_gallery_slot_injected_or_removed():
    out, w = ensure_slots(doc(), SlotCtx(False, False, True))
    assert 'data-carta="gallery"' in out and "slot_gallery_missing_injected" in w
    out, w = ensure_slots(doc('<div data-carta="gallery"></div>'), SlotCtx(False, False, False))
    assert 'data-carta="gallery"' not in out and "slot_gallery_removed_no_data" in w


def test_portrait_slot_and_who_survive_sanitize():
    out = sanitize(doc('<div data-carta="portrait" data-who="groom"></div><div data-carta="portrait" data-who="x"></div>'), SCTX)
    assert 'data-who="groom"' in out and 'data-who="x"' not in out


def test_csp_allows_google_maps_frame_only():
    csp = build_csp("N", "https://x.supabase.co", "https://api.x", "https://app.x")
    assert "frame-src https://www.google.com;" in csp


def test_two_portrait_slots_are_kept():
    out, w = ensure_slots(doc('<div data-carta="portrait" data-who="groom"></div><div data-carta="portrait" data-who="bride"></div>'),
                          SlotCtx(False, False))
    assert count(out, "portrait") == 2 and "slot_portrait_duplicate_removed" not in w


def test_csp_allows_osm_tiles_and_places_reach_config():
    assert "https://tile.openstreetmap.org" in build_csp("N", "https://x.supabase.co", "https://api.x", "https://app.x")
    ctx = PublicCtx(slug="s", plan="premium", event_at=None, api_base="https://api.x", places={"Klabat": [1.39, 125.06]})
    assert '"places":{"Klabat":[1.39,125.06]}' in render_public(doc("<p>x</p>"), ctx, SCTX, "N")
