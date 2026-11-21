# Komponen undangan yang dirender sistem

Tanggal: 2026-11-22 · Status: disetujui pengguna (cara A, foto kecil hanya diperingatkan)

## Masalah
Undangan Premium hasil generate: peta lokasi hilang, galeri terpotong, tombol musik di sampul, kartu rekening polos,
ornamen menabrak nama, terasa jadul. Penyebab: komponen ini ditulis bebas oleh AI (atau diganti teks polos di
`runtime.js` saat refactor v2), dan foto sampul yang diunggah memang kecil (399×501 px).

## Keputusan
**A. Sistem merender komponen yang wajib selalu rapi; AI hanya mengatur tema, sampul, dan ritme halaman.**
Alternatif B (hanya memperketat prompt) ditolak: tabrakan dan komponen hilang tetap bisa terjadi.

| Komponen | Cara | Perilaku |
|---|---|---|
| Peta | runtime menyisipkan iframe Google Maps sebelum tiap tautan `google.com/maps/search/...` | tanpa kunci API; CSP `frame-src https://www.google.com` |
| Kartu rekening | runtime, slot `gift` | kartu bank (gradien aksen, chip SVG, nomor, nama, tombol Salin); tanpa gambar eksternal |
| Musik | runtime memindahkan slot `music` ke `body` | bubble kanan bawah; klik = mute, klik lagi = unmute |
| Galeri | slot baru `gallery`, disisipkan bila AI lupa | kolom 2, rasio asli foto, tidak ada yang dipotong |
| Potret mempelai | slot baru `portrait` (`data-who`) | bingkai lengkung, rasio asli foto |
| Kartu / animasi | kelas kit `carta-card`, `carta-kenburns`, `carta-float` | dipakai AI untuk kartu acara dan sampul |

## Foto HD
Foto kecil tidak bisa ditajamkan. Aplikasi memperingatkan saat unggah bila sisi terpanjang < 1280 px. Foto tetap
diterima. Sampul tetap `<img>` oleh AI (satu-satunya foto yang wajib dipakai AI).

## Di luar cakupan
Gambar kartu bank lama (project Supabase lama tidak terjangkau), logo bank, penolakan foto kecil.
