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
    has_gallery: bool = False


def ensure_slots(html: str, ctx: SlotCtx) -> tuple[str, list[str]]:
    soup = parse(html)
    warnings: list[str] = []
    found: dict[str, list] = {}
    for el in soup.find_all(attrs={"data-carta": True}):
        found.setdefault(el["data-carta"], []).append(el)

    for name, els in found.items():
        if name not in ("guest-name", "open", "ornament", "portrait") and len(els) > 1:
            for dup in els[1:]:
                del dup["data-carta"]
            warnings.append(f"slot_{name}_duplicate_removed")
            found[name] = els[:1]

    for name, has in (("music", ctx.has_music), ("gift", ctx.has_gifts), ("gallery", ctx.has_gallery)):
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
    if ctx.has_gallery and not found.get("gallery"):
        el = make("section", "gallery", _SECTION_STYLE)
        found["rsvp"][0].insert_before(el)
        warnings.append("slot_gallery_missing_injected")
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
    gallery: list[str] = field(default_factory=list)
    portraits: dict = field(default_factory=dict)  # {"groom": url, "bride": url}
    places: dict = field(default_factory=dict)  # {nama lokasi: [lat, lon]} untuk peta statis


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
    ".carta-grain{position:relative}.carta-grain::before{content:\"\";position:absolute;inset:0;pointer-events:none;"
    "z-index:0;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E"
    "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E"
    "%3Crect width='160' height='160' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E\")}"
    ".carta-display{font-family:var(--carta-font-display,inherit);letter-spacing:-.02em;line-height:1}"
    "[data-carta=ornament]{display:block;color:var(--carta-accent,currentColor);pointer-events:none}"
    "[data-carta=ornament] svg{display:block;width:100%;height:auto}"
    "html.carta-locked,html.carta-locked body{overflow:hidden}"
    ".carta-cover-out{transform:translateY(-100%)!important;transition:transform .9s cubic-bezier(.76,0,.24,1)}"
    # Komponen sistem: kartu, peta, rekening, musik, galeri, potret (selalu rapi apa pun desain AI)
    ".carta-card{position:relative;text-align:center;padding:2rem 1.5rem;border-radius:1.5rem;"
    "background:linear-gradient(160deg,color-mix(in srgb,var(--carta-bg,#fff) 35%,#fff),color-mix(in srgb,var(--carta-accent,#8a5a44) 8%,var(--carta-bg,#fff)));"
    "border:1px solid color-mix(in srgb,var(--carta-accent,#8a5a44) 26%,transparent);"
    "box-shadow:0 1px 2px rgba(0,0,0,.05),0 22px 46px -22px rgba(0,0,0,.32);"
    "transition:transform .6s cubic-bezier(.23,1,.32,1),box-shadow .6s cubic-bezier(.23,1,.32,1)}"
    ".carta-card::before{content:\"\";position:absolute;inset:.55rem;border-radius:1.1rem;pointer-events:none;"
    "border:1px solid color-mix(in srgb,var(--carta-accent,#8a5a44) 32%,transparent)}"
    ".carta-card>*{position:relative}"
    ".carta-card:hover{transform:translateY(-4px);box-shadow:0 2px 4px rgba(0,0,0,.06),0 30px 56px -22px rgba(0,0,0,.4)}"
    ".carta-card-accent{color:#fff;border-color:transparent;"
    "background:linear-gradient(145deg,color-mix(in srgb,var(--carta-accent,#8a5a44) 92%,#000),color-mix(in srgb,var(--carta-accent,#8a5a44) 52%,#000))}"
    ".carta-card-accent::before{border-color:rgba(255,255,255,.38)}"
    ".carta-card-glass{color:#fff;background:rgba(255,255,255,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);"
    "border-color:rgba(255,255,255,.32)}.carta-card-glass::before{border-color:rgba(255,255,255,.22)}"
    ".carta-chip{display:inline-block;padding:.38rem .95rem;border-radius:999px;font-size:.72rem;font-weight:700;"
    "letter-spacing:.16em;text-transform:uppercase;color:var(--carta-accent,#8a5a44);"
    "background:color-mix(in srgb,var(--carta-accent,#8a5a44) 13%,transparent)}"
    ".carta-card-accent .carta-chip,.carta-card-glass .carta-chip{color:#fff;background:rgba(255,255,255,.2)}"
    ".carta-eyebrow{font-size:.75rem;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--carta-accent,#8a5a44)}"
    ".carta-title{font-family:var(--carta-font-display,inherit);font-size:clamp(1.9rem,8vw,2.7rem);line-height:1.1;margin:.4rem 0 1rem}"
    ".carta-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.9rem 1.7rem;border-radius:999px;"
    "border:1px solid transparent;color:#fff;font-weight:600;letter-spacing:.04em;text-decoration:none;cursor:pointer;"
    "background:linear-gradient(135deg,var(--carta-accent,#8a5a44),color-mix(in srgb,var(--carta-accent,#8a5a44) 60%,#000));"
    "box-shadow:0 14px 28px -12px color-mix(in srgb,var(--carta-accent,#8a5a44) 70%,#000);"
    "transition:transform .45s cubic-bezier(.23,1,.32,1),box-shadow .45s cubic-bezier(.23,1,.32,1)}"
    ".carta-btn:hover{transform:translateY(-3px);box-shadow:0 20px 34px -12px color-mix(in srgb,var(--carta-accent,#8a5a44) 70%,#000)}"
    ".carta-btn-ghost{background:transparent;color:var(--carta-accent,#8a5a44);border-color:var(--carta-accent,#8a5a44);box-shadow:none}"
    ".carta-section{position:relative;padding:5rem 1.25rem 5.5rem}"
    "[data-carta=ornament][data-kind=wave],[data-carta=ornament][data-kind=batik-band]{margin-bottom:4rem}"
    ".carta-box.carta-on-dark{color:#f7f3ea}.carta-box.carta-on-light{color:var(--carta-fg,#222)}"
    ".carta-box.carta-on-dark input,.carta-box.carta-on-dark textarea,.carta-box.carta-on-dark select{border-color:rgba(255,255,255,.45)}"
    ".carta-box.carta-on-dark .carta-wish{border-top-color:rgba(255,255,255,.3)}"
    ".carta-alt{background:color-mix(in srgb,var(--carta-accent,#8a5a44) 9%,var(--carta-bg,#fff))}"
    ".carta-dark{color:#f4ede1;background:linear-gradient(165deg,color-mix(in srgb,var(--carta-accent,#8a5a44) 38%,#10141a),#10141a)}"
    ".carta-map{margin:1rem 0;border-radius:1rem;overflow:hidden;border:1px solid color-mix(in srgb,var(--carta-accent,#8a5a44) 25%,transparent);"
    "box-shadow:0 10px 30px -14px rgba(0,0,0,.3);line-height:0}"
    ".carta-map iframe{width:100%;height:190px;border:0;display:block}"
    ".carta-map-static{position:relative;height:190px;overflow:hidden;background:#e8e4da;line-height:0}"
    ".carta-map-static img{position:absolute;display:block;max-width:none}"
    ".carta-map-pin{position:absolute;left:50%;top:50%;width:34px;height:44px;margin:-44px 0 0 -17px;color:var(--carta-accent,#c0392b);"
    "filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}"
    ".carta-map-credit{position:absolute;right:0;bottom:0;padding:2px 6px;font:10px/1.4 sans-serif;background:rgba(255,255,255,.85);color:#333;border-radius:6px 0 0 0}"
    ".carta-map-credit a{color:#0b57d0}"
    ".carta-gifts{display:grid;gap:1.25rem;justify-items:center;max-width:24rem;margin:0 auto}"
    ".carta-bank{width:100%;aspect-ratio:1.586;box-sizing:border-box;padding:1.25rem 1.4rem;border-radius:1.25rem;"
    "display:flex;flex-direction:column;justify-content:space-between;text-align:left;color:#fff;position:relative;overflow:hidden;"
    "background:linear-gradient(135deg,color-mix(in srgb,var(--carta-accent,#8a5a44) 88%,#000),color-mix(in srgb,var(--carta-accent,#8a5a44) 45%,#000));"
    "box-shadow:0 22px 44px -20px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.25)}"
    ".carta-bank::after{content:\"\";position:absolute;inset:0;pointer-events:none;"
    "background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);transform:translateX(-120%);"
    "animation:carta-shine 5s ease-in-out infinite}"
    "@keyframes carta-shine{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}"
    ".carta-bank-top{font-size:1rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}"
    ".carta-bank-no{font-size:clamp(1.15rem,5.4vw,1.5rem);letter-spacing:.12em;font-weight:600;font-variant-numeric:tabular-nums}"
    ".carta-bank-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:.75rem}"
    ".carta-bank-foot small{display:block;font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;opacity:.75}"
    ".carta-bank-foot b{font-size:.95rem;letter-spacing:.04em;text-transform:uppercase}"
    ".carta-bank-foot button{padding:.45rem .95rem;border:1px solid rgba(255,255,255,.55);border-radius:999px;"
    "background:rgba(255,255,255,.18);color:#fff;font-weight:600;font-size:.8rem;line-height:1;font-family:inherit;cursor:pointer;backdrop-filter:blur(6px)}"
    ".carta-bank-foot button:hover{background:rgba(255,255,255,.3)}"
    ".carta-music-wrap{position:fixed;right:1rem;bottom:1rem;z-index:60;padding:0;margin:0;background:none;border:0}"
    ".carta-music{width:3.1rem;height:3.1rem;border-radius:50%;border:1px solid rgba(255,255,255,.55);padding:0;display:grid;place-items:center;"
    "cursor:pointer;color:#fff;background:color-mix(in srgb,var(--carta-accent,#8a5a44) 92%,#000);"
    "box-shadow:0 10px 26px -8px rgba(0,0,0,.5);transition:transform .4s cubic-bezier(.23,1,.32,1)}"
    ".carta-music:hover{transform:scale(1.08)}.carta-music svg{display:block}"
    ".carta-music-on{animation:carta-pulse 2.4s ease-out infinite}"
    "@keyframes carta-pulse{0%{box-shadow:0 10px 26px -8px rgba(0,0,0,.5),0 0 0 0 color-mix(in srgb,var(--carta-accent,#8a5a44) 55%,transparent)}"
    "70%,100%{box-shadow:0 10px 26px -8px rgba(0,0,0,.5),0 0 0 16px transparent}}"
    ".carta-gallery{columns:2;column-gap:.75rem;max-width:34rem;margin:0 auto;padding:0 1rem}"
    "@media (min-width:768px){.carta-gallery{columns:3}}"
    ".carta-gallery figure{margin:0 0 .75rem;break-inside:avoid;border-radius:1rem;overflow:hidden;line-height:0;"
    "box-shadow:0 12px 28px -16px rgba(0,0,0,.4)}"
    ".carta-gallery img{width:100%;height:auto;display:block;transition:transform 1.1s cubic-bezier(.23,1,.32,1)}"
    ".carta-gallery figure:hover img{transform:scale(1.05)}"
    ".carta-portrait{width:min(15rem,70%);margin:0 auto 1.25rem;border-radius:999px 999px 1.25rem 1.25rem;overflow:hidden;line-height:0;"
    "border:4px solid #fff;box-shadow:0 0 0 1px color-mix(in srgb,var(--carta-accent,#8a5a44) 40%,transparent),0 22px 44px -20px rgba(0,0,0,.45)}"
    ".carta-portrait img{width:100%;height:auto;display:block}"
    ".carta-kenburns{animation:carta-kb 20s ease-in-out infinite alternate}"
    "@keyframes carta-kb{from{transform:scale(1)}to{transform:scale(1.09)}}"
    ".carta-float{animation:carta-fl 6s ease-in-out infinite}"
    "@keyframes carta-fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}"
    ".carta-map,.carta-gallery,.carta-bank{max-width:100%}"
    "@media (prefers-reduced-motion:reduce){.carta-js .carta-reveal{opacity:1;transform:none;transition:none}"
    ".carta-cover-out{transition:none}.carta-kenburns,.carta-float,.carta-bank::after,.carta-music-on{animation:none}}"
)


def render_public(html: str, ctx: PublicCtx, sctx: SanitizeCtx, nonce: str) -> str:
    """Sanitasi ulang + suntik style, config, runtime, watermark sebelum </body> (07 §5.3)."""
    soup = parse(sanitize(html, sctx))
    ornaments.fill(soup)  # SVG sistem diisi setelah sanitasi
    clean = serialize(soup)
    config = {"slug": ctx.slug, "api": ctx.api_base.rstrip("/"), "eventAt": ctx.event_at, "plan": ctx.plan,
              "musicUrl": ctx.music_url, "gifts": ctx.gifts, "gallery": ctx.gallery, "portraits": ctx.portraits, "places": ctx.places}
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
        f"img-src data: {sb} https://tile.openstreetmap.org",
        f"media-src {sb}",
        f"connect-src {api_base.rstrip('/')}",
        "frame-src https://www.google.com", "object-src 'none'", "base-uri 'none'", "form-action 'none'",
        f"frame-ancestors 'self' {web_base.rstrip('/')}",
        "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox",
    ])
