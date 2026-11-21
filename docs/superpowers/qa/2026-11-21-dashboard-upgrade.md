# QA: dashboard app dan upgrade Premium

Tanggal: 2026-11-21 · Rencana: `docs/superpowers/plans/2026-11-21-dashboard-upgrade.md` (Task 5)

## Lingkungan
- App Expo web `localhost:8081` dan backend lokal `8010`.
- Akun uji sementara (sudah dihapus).
- Chrome headless di 1440×900 dan 390×844, dengan `prefers-color-scheme` terang dan gelap (pilihan tema app: "Sistem").

## Alur upgrade dari beranda
| Kasus | Hasil |
|---|---|
| 0 undangan → "Upgrade sekarang" | Diarahkan ke `/app/undangan/baru` dengan toast "Buat undangan dulu, lalu upgrade dari sana." |
| 1 undangan Gratis → "Upgrade sekarang" | Langsung ke `/app/undangan/{id}/upgrade` |
| 2 undangan Gratis → "Upgrade sekarang" | Pemilih "Pilih undangan yang mau di-upgrade" muncul; memilih "Rendy & Febe" lalu Lanjut membuka checkout undangan itu |
| Tombol diklik sebelum daftar termuat | Awalnya salah arah ke form buat undangan (bug). Diperbaiki di `211b686`: kini menunggu data lalu membuka pemilih |
| Tombol bayar di checkout | Tepat 1 di 1440 dan 1 di 390 (sebelumnya dobel) |

Error halaman dan console: 0.

## Tampilan
- **Beranda desktop terang** (`home-1-1440-light*.png`):
  - sapaan Fraunces dengan nama miring terracotta;
  - 4 angka dalam grid bergaris rambut;
  - blok Premium gelap hangat dengan dua mockup;
  - kartu undangan dengan inisial, badge, dan tombol Upgrade.
- **Beranda ponsel gelap** (`home-0-390-dark.png`): angka 2×2 dan promo tanpa mockup.
- **Checkout** (`checkout-1440-dark.png`, `checkout-390-light.png`):
  - desktop dua kolom dengan kotak ringkasan;
  - di ponsel tombol bayar menempel di bawah;
  - tombol chat disembunyikan di halaman ini.
- **Pemilih undangan** (`picker-1440.png`) dan **perbandingan paket** (`compare-1440.png`).

## Catatan
- Di tangkapan beranda 390px bagian bawah, daftar undangan masih berupa skeleton karena difoto saat data belum selesai dimuat. Di desktop, dengan data yang sama, kartu tampil.
- Efek hover (kartu terangkat, mockup bergeser) dan hitung naik tidak terlihat di tangkapan statis. Kodenya diperiksa lewat `tsc`.
