"""Kontrak slot `data-carta` (07 §5): jamin slot saat generate, isi saat penyajian, CSP."""
import base64
import json
import secrets
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from app.services.ai import ornaments
from app.services.ai.sanitize import SanitizeCtx, parse, sanitize, serialize

REQUIRED = ("countdown", "rsvp")
TZ_OFFSET = {"WIB": "+07:00", "WITA": "+08:00", "WIT": "+09:00"}
_SECTION_STYLE = "padding:2.5rem 1rem"


@dataclass(frozen=True)
class SlotCtx:
    has_music: bool
    has_gifts: bool


def ensure_slots(html: str, ctx: SlotCtx) -> tuple[str, list[str]]:
    soup = parse(html)
    warnings: list[str] = []
    found: dict[str, list] = {}
    for el in soup.find_all(attrs={"data-carta": True}):
        found.setdefault(el["data-carta"], []).append(el)

    for name, els in found.items():
        if name not in ("guest-name", "open", "ornament") and len(els) > 1:
            for dup in els[1:]:
                del dup["data-carta"]
            warnings.append(f"slot_{name}_duplicate_removed")
            found[name] = els[:1]

    for name, has in (("music", ctx.has_music), ("gift", ctx.has_gifts)):
        if not has and found.get(name):
            for el in found.pop(name):
                el.decompose()
            warnings.append(f"slot_{name}_removed_no_data")

    body = soup.body

    def make(tag: str, name: str, style: str):
        return soup.new_tag(tag, attrs={"data-carta": name, "style": style})

    for name in REQUIRED:
        if not found.get(name):
            el = make("section", name, _SECTION_STYLE)
            body.append(el)
            found[name] = [el]
            warnings.append(f"slot_{name}_missing_injected")
    if ctx.has_gifts and not found.get("gift"):
        el = make("section", "gift", _SECTION_STYLE)
        found["rsvp"][0].insert_before(el)
        warnings.append("slot_gift_missing_injected")
    if ctx.has_music and not found.get("music"):
        body.append(make("div", "music", "position:fixed;right:1rem;bottom:1rem;z-index:50"))
        warnings.append("slot_music_missing_injected")
    return serialize(soup), warnings


@lru_cache
def runtime_js() -> str:
    return (Path(__file__).with_name("runtime.js")).read_text(encoding="utf-8")


def json_for_script(obj) -> str:
    s = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return (s.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
            .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))


@dataclass
class PublicCtx:
    slug: str
    plan: str
    event_at: str | None
    api_base: str
    music_url: str | None = None
    gifts: list[dict] = field(default_factory=list)


def event_iso(event_date: str | None, time_hhmm: str | None, tz: str) -> str | None:
    if not event_date:
        return None
    return f"{event_date}T{time_hhmm or '00:00'}:00{TZ_OFFSET.get(tz, '+07:00')}"


_STYLE = (
    "[data-carta]{font-family:inherit;color:inherit}"
    ".carta-box{max-width:28rem;margin:0 auto;padding:1rem;font-family:var(--carta-font-body,inherit);"
    "color:var(--carta-fg,inherit);text-align:center}"
    ".carta-box input,.carta-box textarea,.carta-box select{width:100%;box-sizing:border-box;margin:.25rem 0;"
    "padding:.6rem;border:1px solid var(--carta-muted,#999);border-radius:var(--carta-radius,.5rem);"
    "background:transparent;color:inherit;font:inherit}"
    ".carta-box button{padding:.6rem 1.2rem;border:0;border-radius:var(--carta-radius,.5rem);"
    "background:var(--carta-accent,#8a5a44);color:var(--carta-bg,#fff);font:inherit;cursor:pointer}"
    ".carta-cd{display:flex;gap:.75rem;justify-content:center}"
    ".carta-cd b{display:block;font-size:1.8rem;font-family:var(--carta-font-display,inherit)}"
    ".carta-wish{border-top:1px solid var(--carta-muted,#bbb);padding:.5rem 0;text-align:left}"
    # Kit desain (Q27). Reveal hanya aktif bila runtime memasang .carta-js, jadi tanpa JS konten tetap tampil.
    ".carta-js .carta-reveal{opacity:0;transform:translateY(28px);"
    "transition:opacity .9s cubic-bezier(.23,1,.32,1),transform .9s cubic-bezier(.23,1,.32,1)}"
    ".carta-js .carta-reveal-left{transform:translateX(-36px)}.carta-js .carta-reveal-right{transform:translateX(36px)}"
    ".carta-js .carta-reveal-zoom{transform:scale(.92)}"
    ".carta-js .carta-reveal.carta-in{opacity:1;transform:none}"
    ".carta-delay-1{transition-delay:.15s!important}.carta-delay-2{transition-delay:.3s!important}"
    ".carta-delay-3{transition-delay:.45s!important}"
    ".carta-frame{outline:1px solid var(--carta-accent,currentColor);outline-offset:-12px;"
    "box-shadow:inset 0 0 0 18px transparent,inset 0 0 0 19px var(--carta-accent,currentColor)}"
    ".carta-grain{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E"
    "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E"
    "%3Crect width='160' height='160' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E\")}"
    ".carta-display{font-family:var(--carta-font-display,inherit);letter-spacing:-.02em;line-height:1}"
    "[data-carta=ornament]{display:block;color:var(--carta-accent,currentColor);pointer-events:none}"
    "[data-carta=ornament] svg{display:block;width:100%;height:auto}"
    "html.carta-locked,html.carta-locked body{overflow:hidden}"
    ".carta-cover-out{transform:translateY(-100%)!important;transition:transform .9s cubic-bezier(.76,0,.24,1)}"
    "@media (prefers-reduced-motion:reduce){.carta-js .carta-reveal{opacity:1;transform:none;transition:none}"
    ".carta-cover-out{transition:none}}"
)


def render_public(html: str, ctx: PublicCtx, sctx: SanitizeCtx, nonce: str) -> str:
    """Sanitasi ulang + suntik style, config, runtime, watermark sebelum </body> (07 §5.3)."""
    soup = parse(sanitize(html, sctx))
    ornaments.fill(soup)  # SVG sistem diisi setelah sanitasi
    clean = serialize(soup)
    config = {"slug": ctx.slug, "api": ctx.api_base.rstrip("/"), "eventAt": ctx.event_at, "plan": ctx.plan,
              "musicUrl": ctx.music_url, "gifts": ctx.gifts}
    parts = [
        f'<style data-carta-style nonce="{nonce}">{_STYLE}</style>',
        f'<script nonce="{nonce}">window.__CARTA__={json_for_script(config)};</script>',
        f'<script nonce="{nonce}">{runtime_js()}</script>',
    ]
    if ctx.plan == "free":
        parts.append(
            '<div data-carta-watermark style="position:fixed!important;bottom:0!important;left:0!important;'
            "right:0!important;display:block!important;z-index:2147483647!important;text-align:center;"
            "padding:.4rem;font:12px/1.2 sans-serif;background:rgba(0,0,0,.65);color:#fff;"
            'opacity:1!important;visibility:visible!important">Dibuat dengan CartaAI</div>'
        )
    idx = clean.rfind("</body>")
    inject = "".join(parts)
    return clean[:idx] + inject + clean[idx:] if idx >= 0 else clean + inject


def new_nonce() -> str:
    return base64.b64encode(secrets.token_bytes(16)).decode()


def build_csp(nonce: str | None, supabase_url: str, api_base: str, web_base: str) -> str:
    sb = f"https://{urlparse(supabase_url).netloc}" if supabase_url.startswith("http") else supabase_url
    script = f"'nonce-{nonce}' https://cdn.tailwindcss.com" if nonce else "'none'"
    return "; ".join([
        "default-src 'none'",
        f"script-src {script}",
        "style-src 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        f"img-src data: {sb}",
        f"media-src {sb}",
        f"connect-src {api_base.rstrip('/')}",
        "frame-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'",
        f"frame-ancestors 'self' {web_base.rstrip('/')}",
        "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox",
    ])
