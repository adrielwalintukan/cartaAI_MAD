"""Ornamen SVG buatan tim untuk slot `data-carta="ornament" data-kind="…"` (Q27, 07 §5).

Diisi saat penyajian setelah sanitasi, jadi SVG ini milik sistem, bukan AI. Warna mengikuti `currentColor`
(CSS kit mengatur `color: var(--carta-accent)`), sehingga ornamen menyatu dengan palet undangan.
"""
from bs4 import BeautifulSoup

_A = 'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" fill="none" stroke="currentColor"'

KINDS: dict[str, str] = {
    # Sudut bunga: sulur melengkung dengan kelopak dan daun; diputar AI lewat transform untuk sudut lain.
    "floral-corner": (
        f'<svg {_A} viewBox="0 0 160 160" stroke-width="1.4" stroke-linecap="round">'
        '<path d="M6 154C10 96 40 46 96 18M6 154C40 128 70 104 92 70M6 154C24 120 30 96 30 70"/>'
        '<path d="M96 18c10-8 26-10 38-4-6 12-22 18-38 4zM92 70c12-2 26 4 32 16-14 4-28-2-32-16z" fill="currentColor" fill-opacity=".18"/>'
        '<path d="M30 70c-8-10-8-24 0-34 8 10 8 24 0 34z" fill="currentColor" fill-opacity=".18"/>'
        '<circle cx="58" cy="40" r="9"/><circle cx="58" cy="40" r="3.5" fill="currentColor"/>'
        '<path d="M58 31c4-8 12-10 16-6M49 40c-8-4-10-12-6-16M58 49c-2 8 2 14 8 14M67 40c8 2 12 8 10 14"/>'
        '<circle cx="118" cy="44" r="2.5" fill="currentColor"/><circle cx="20" cy="104" r="2.5" fill="currentColor"/>'
        "</svg>"
    ),
    # Pemisah bunga: garis dengan kuntum di tengah dan daun kecil di kiri-kanan.
    "floral-divider": (
        f'<svg {_A} viewBox="0 0 240 32" stroke-width="1.2" stroke-linecap="round">'
        '<path d="M8 16h86M146 16h86"/>'
        '<path d="M94 16c6-8 14-8 18-2M146 16c-6 8-14 8-18 2" />'
        '<circle cx="120" cy="16" r="7"/><circle cx="120" cy="16" r="2.6" fill="currentColor"/>'
        '<path d="M120 9c0-5 3-7 6-7M120 23c0 5-3 7-6 7M113 16c-5 0-7-3-7-6M127 16c5 0 7 3 7 6"/>'
        '<path d="M70 16c4-6 10-7 14-4-4 5-10 6-14 4zM170 16c-4 6-10 7-14 4 4-5 10-6 14-4z" fill="currentColor" fill-opacity=".25"/>'
        "</svg>"
    ),
    # Pemisah daun: batang dengan daun berselang.
    "leaf-divider": (
        f'<svg {_A} viewBox="0 0 240 40" stroke-width="1.2" stroke-linecap="round">'
        '<path d="M20 20h200"/>'
        '<path d="M60 20c4-10 14-14 22-12-2 9-12 14-22 12zM100 20c4 10 14 14 22 12-2-9-12-14-22-12z'
        'M140 20c4-10 14-14 22-12-2 9-12 14-22 12zM180 20c4 10 14 14 22 12-2-9-12-14-22-12z" fill="currentColor" fill-opacity=".22"/>'
        '<circle cx="20" cy="20" r="3" fill="currentColor"/><circle cx="220" cy="20" r="3" fill="currentColor"/>'
        "</svg>"
    ),
    # Bingkai lengkung (gapura/arch) untuk di belakang nama atau foto.
    "arch-frame": (
        f'<svg {_A} viewBox="0 0 200 280" stroke-width="1.3" preserveAspectRatio="xMidYMid meet">'
        '<path d="M14 276V100C14 52 52 14 100 14s86 38 86 86v176"/>'
        '<path d="M26 276V102c0-41 33-74 74-74s74 33 74 74v174" stroke-opacity=".55"/>'
        '<path d="M100 4l6 10h-12z" fill="currentColor"/><circle cx="100" cy="44" r="3" fill="currentColor"/>'
        '<path d="M14 276h172" stroke-width="2"/>'
        "</svg>"
    ),
    # Pita batik: pola kawung berulang di antara dua garis.
    "batik-band": (
        f'<svg {_A} viewBox="0 0 240 36" stroke-width="1.1">'
        '<path d="M0 3h240M0 33h240" stroke-width="1.6"/>'
        '<g fill="currentColor" fill-opacity=".2">'
        + "".join(
            f'<ellipse cx="{x}" cy="11" rx="5" ry="7"/><ellipse cx="{x}" cy="25" rx="5" ry="7"/>'
            f'<ellipse cx="{x - 7}" cy="18" rx="7" ry="5"/><ellipse cx="{x + 7}" cy="18" rx="7" ry="5"/>'
            for x in range(20, 240, 40)
        )
        + "</g>"
        + "".join(f'<circle cx="{x}" cy="18" r="1.8" fill="currentColor"/>' for x in range(20, 240, 40))
        + "</svg>"
    ),
    # Dua cincin bertaut.
    "rings": (
        f'<svg {_A} viewBox="0 0 120 70" stroke-width="2">'
        '<circle cx="46" cy="40" r="24"/><circle cx="74" cy="40" r="24"/>'
        '<path d="M46 16l-5-8h10z" fill="currentColor"/>'
        '<path d="M86 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor" stroke="none"/>'
        "</svg>"
    ),
    # Pemisah titik: tiga titik membesar di tengah dengan garis pudar.
    "dots-divider": (
        f'<svg {_A} viewBox="0 0 200 16" stroke-width="1">'
        '<path d="M10 8h66M124 8h66" stroke-opacity=".6"/>'
        '<circle cx="88" cy="8" r="2" fill="currentColor"/><circle cx="100" cy="8" r="3.5" fill="currentColor"/>'
        '<circle cx="112" cy="8" r="2" fill="currentColor"/>'
        "</svg>"
    ),
    # Gelombang untuk tepi section (lebar penuh).
    "wave": (
        f'<svg {_A} viewBox="0 0 240 40" preserveAspectRatio="none" stroke="none">'
        '<path d="M0 22c30-14 60-14 90 0s60 14 90 0 40-12 60-6v24H0z" fill="currentColor" fill-opacity=".35"/>'
        '<path d="M0 28c30-10 60-10 90 0s60 10 90 0 40-8 60-4v16H0z" fill="currentColor"/>'
        "</svg>"
    ),
}


def fill(soup: BeautifulSoup) -> None:
    """Sisipkan SVG di awal setiap slot ornamen yang `data-kind`-nya dikenal; isi buatan AI di dalam slot dibiarkan."""
    for slot in soup.find_all(attrs={"data-carta": "ornament"}):
        svg = KINDS.get(slot.get("data-kind", ""))
        if svg and not slot.find("svg", attrs={"data-carta-svg": True}):
            slot.insert(0, BeautifulSoup(svg.replace("<svg ", '<svg data-carta-svg="" ', 1), "html.parser"))
