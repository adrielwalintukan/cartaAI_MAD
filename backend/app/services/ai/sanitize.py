"""Sanitasi HTML buatan AI (07 §4). Pendekatan whitelist; parser html5lib seperti browser."""
import re
from dataclasses import dataclass
from urllib.parse import urlparse

from bs4 import BeautifulSoup, Comment, Doctype, NavigableString, Tag

MAX_HTML_CHARS = 600_000
SLOT_NAMES = {"rsvp", "countdown", "guest-name", "music", "gift", "open", "ornament", "gallery", "portrait"}
KIND_RE = re.compile(r"^[a-z-]{2,30}$")
TAILWIND_SRC = "https://cdn.tailwindcss.com"
FONT_HOSTS = {"fonts.googleapis.com", "fonts.gstatic.com"}

ALLOWED_TAGS = set(
    "html head meta title link style script body div section header footer main nav article aside p span "
    "h1 h2 h3 h4 h5 h6 a img ul ol li br hr strong em b i u small blockquote figure figcaption button "
    "table thead tbody tr th td svg g path circle rect ellipse line polyline polygon defs "
    "lineargradient radialgradient stop".split()
)
DROP_TAGS = set(
    "iframe object embed form input textarea select base frame frameset applet audio video source track "
    "canvas template noscript foreignobject use animate set animatetransform".split()
)
GLOBAL_ATTRS = {"class", "id", "style", "lang", "title", "role", "alt", "width", "height", "data-carta-to"}
SVG_ATTRS = {
    "viewbox", "xmlns", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "d", "cx", "cy",
    "r", "rx", "ry", "x", "y", "x1", "x2", "y1", "y2", "points", "transform", "opacity", "fill-opacity",
    "stroke-opacity", "fill-rule", "offset", "stop-color", "stop-opacity", "gradientunits", "preserveaspectratio",
    "id",
}
TD_ATTRS = {"colspan", "rowspan"}


class SanitizeError(Exception):
    code = "sanitize_failed"


@dataclass(frozen=True)
class SanitizeCtx:
    invitation_id: str
    storage_prefix: str  # {SUPABASE_URL}/storage/v1/object/public/{bucket}/

    @property
    def asset_prefix(self) -> str:
        return f"{self.storage_prefix}invitations/{self.invitation_id}/"


def _host(url: str) -> str:
    try:
        return (urlparse(url).hostname or "").lower()
    except ValueError:
        return ""


_CSS_COMMENT = re.compile(r"/\*.*?\*/", re.S)
_IMPORT = re.compile(r"@import\s+(?:url\(\s*)?['\"]?([^'\")\s;]+)['\"]?\s*\)?[^;{}]*;?", re.I)
_URL = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.I | re.S)
_BAD_CSS = re.compile(r"expression\s*\(|behavior\s*:|-moz-binding|javascript\s*:|vbscript\s*:", re.I)
_DATA_IMG = re.compile(r"^data:image/(png|jpeg|webp|svg\+xml)[;,]", re.I)


def clean_css(css: str, ctx: SanitizeCtx) -> str:
    # shortcut: backslash (escape CSS) dibuang seluruhnya agar tak dipakai menyamarkan url()/expression;
    # selector ber-escape ala Tailwind di <style> buatan AI jadi tidak berlaku. Longgarkan bila ada keluhan tampilan.
    css = _CSS_COMMENT.sub("", css).replace("\\", "")
    css = _IMPORT.sub(lambda m: m.group(0) if _host(m.group(1)) == "fonts.googleapis.com" else "", css)

    def url_sub(m):
        u = m.group(2).strip()
        if u.startswith(ctx.asset_prefix) or _host(u) in FONT_HOSTS or _DATA_IMG.match(u):
            return m.group(0)
        return "none"

    css = _URL.sub(url_sub, css)
    return _BAD_CSS.sub("", css)


def _clean_href(href: str) -> str | None:
    h = re.sub(r"[\x00-\x20 ]+", "", href)
    low = h.lower()
    if low.startswith(("https://", "tel:", "mailto:", "#")):
        return h
    return None


def _raw_text(node: Tag) -> str:
    # get_text() mengabaikan isi <script>/<style> di bs4 baru
    return "".join(str(c) for c in node.contents)


def _process(node, ctx: SanitizeCtx) -> None:
    if isinstance(node, (Comment, Doctype)) or (isinstance(node, NavigableString) and type(node).__name__ in
                                                {"CData", "ProcessingInstruction", "Declaration"}):
        node.extract()
        return
    if not isinstance(node, Tag):
        return
    name = (node.name or "").lower()
    if name in DROP_TAGS:
        node.decompose()
        return
    if name == "script":
        src = node.get("src")
        if src == TAILWIND_SRC and not _raw_text(node).strip():
            node.attrs = {"src": TAILWIND_SRC}
        else:
            node.decompose()
        return
    if name == "link":
        rel = " ".join(node.get("rel", [])).lower() if isinstance(node.get("rel"), list) else str(node.get("rel", "")).lower()
        href = node.get("href", "")
        if rel in ("stylesheet", "preconnect") and _host(href) in FONT_HOSTS:
            node.attrs = {"rel": rel, "href": href, **({"crossorigin": ""} if "crossorigin" in node.attrs else {})}
        else:
            node.decompose()
        return
    if name == "meta":
        if "charset" in node.attrs:
            node.attrs = {"charset": "utf-8"}
        elif str(node.get("name", "")).lower() in ("viewport", "description") and "http-equiv" not in node.attrs:
            node.attrs = {"name": str(node.get("name")).lower(), "content": node.get("content", "")}
        else:
            node.decompose()
        return
    if name == "style":
        text = clean_css(_raw_text(node), ctx)
        node.clear()
        node.append(NavigableString(text))
        node.attrs = {}
        return
    if name not in ALLOWED_TAGS:
        for child in list(node.children):
            _process(child, ctx)
        node.unwrap()
        return

    for child in list(node.children):
        _process(child, ctx)
    if node.decomposed:
        return

    in_svg = name in {"svg", "g", "path", "circle", "rect", "ellipse", "line", "polyline", "polygon", "defs",
                      "lineargradient", "radialgradient", "stop"}
    new: dict = {}
    for attr, val in list(node.attrs.items()):
        a = attr.lower()
        if isinstance(val, list):
            val = " ".join(val)
        val = str(val)
        if a.startswith("on") or a in ("srcdoc", "formaction"):
            continue
        if a == "style":
            new["style"] = clean_css(val, ctx)
        elif a == "data-carta":
            if val in SLOT_NAMES:
                new[a] = val
        elif a == "data-kind":
            if KIND_RE.match(val):
                new[a] = val
        elif a == "data-who":
            if val in ("groom", "bride"):
                new[a] = val
        elif a in GLOBAL_ATTRS or a.startswith("aria-"):
            new[a] = val
        elif in_svg and a in SVG_ATTRS:
            new[a] = val
        elif name in ("td", "th") and a in TD_ATTRS:
            new[a] = val
        elif name == "a" and a == "href":
            h = _clean_href(val)
            if h is not None:
                new["href"] = h
        elif name == "img" and a == "src":
            if val.startswith(ctx.asset_prefix):
                new["src"] = val
    if name == "img" and "src" not in new:
        node.decompose()
        return
    if name == "a" and new.get("href", "").startswith("https://"):
        new["target"], new["rel"] = "_blank", "noopener noreferrer"
    node.attrs = new


def serialize(soup: BeautifulSoup) -> str:
    return "<!DOCTYPE html>\n" + str(soup.html)


def parse(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html5lib")


def _ensure_head(soup: BeautifulSoup) -> None:
    root = soup.html
    root["lang"] = "id"
    head = soup.head
    if head.find("meta", attrs={"charset": True}) is None:
        head.insert(0, soup.new_tag("meta", charset="utf-8"))
    if head.find("meta", attrs={"name": "viewport"}) is None:
        head.insert(1, soup.new_tag("meta", attrs={"name": "viewport", "content": "width=device-width, initial-scale=1"}))


def sanitize(html: str, ctx: SanitizeCtx) -> str:
    soup = parse(html)
    for child in list(soup.contents):
        _process(child, ctx)
    # html5lib membungkus semua node dalam <html>; pastikan struktur dasar ada
    _ensure_head(soup)
    out = serialize(soup)
    if len(out) > MAX_HTML_CHARS:
        raise SanitizeError("HTML terlalu besar setelah sanitasi.")
    return out


class InvalidOutput(Exception):
    code = "invalid_output"


_FENCE = re.compile(r"```(?:html)?", re.I)


def extract_document(raw: str, names: tuple[str, str] = ("", "")) -> str:
    """Validasi keluaran mentah Gemini (07 §4.1); mengembalikan dokumen bersih atau melempar InvalidOutput."""
    text = _FENCE.sub("", raw or "").strip()
    low = text.lower()
    start = low.find("<!doctype")
    if start < 0:
        start = low.find("<html")
    end = low.rfind("</html>")
    if start < 0 or end < 0:
        raise InvalidOutput("dokumen tidak lengkap/terpotong")
    doc = text[start : end + len("</html>")]
    low = doc.lower()
    if "<body" not in low:
        raise InvalidOutput("tanpa <body>")
    if not 3000 <= len(doc) <= MAX_HTML_CHARS:
        raise InvalidOutput("panjang di luar batas")
    visible = re.sub(r"<[^>]+>", " ", doc).lower()
    for n in names:
        if n and n.lower() not in visible:
            raise InvalidOutput("nama mempelai tidak muncul")
    return doc
