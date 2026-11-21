# QA visual: desain undangan AI (Q27)

Tanggal: 2026-11-21 · Rencana: `docs/superpowers/plans/2026-11-21-desain-undangan-ai.md` (Task 8)

## Lingkungan
- Backend lokal `127.0.0.1:8010` (commit `1dbea1a`), Supabase proyek pemilik, migrasi `20261121000000_design_presets.sql` sudah diterapkan (7 preset, semua `premium_only=false`).
- Akun uji sementara (paket Gratis), dihapus setelah QA.
- Chrome headless 390×844, halaman `GET /u/{slug}?to=Bapak+Joko`. Skrip mengklik "Buka Undangan", menggulir seluruh halaman, lalu memotret.

## Hasil per undangan

| Kasus | Gaya / input | Model tercatat | Ornamen (terisi) | Reveal tampil setelah scroll | Kunci sampul → dibuka | Error console/CSP |
|---|---|---|---|---|---|---|
| a | `default`, tanpa catatan | `gemini-3.5-flash` | 10 (10) | 31/31 | ya → ya | 0 |
| b | `elegan` | `gemini-3.1-flash-lite` (cadangan) | 4 (4) | 2/2 | ya → ya | 0 |
| c | `nusantara` + "nuansa batik Minahasa, banyak ornamen bunga, terasa hangat" | `gemini-3.1-flash-lite` (cadangan) | 5 (5), termasuk `batik-band`, `arch-frame` | 4/4 | ya → ya | 0 |
| d | `bebas` + "Dusty pink & putih" + "romantis dan lembut, banyak bunga mawar" | `gemini-3.5-flash` | 11 (11) | 19/19 | ya → ya | 0 |

Semua halaman menampilkan nama tamu dari `?to=`, hitung mundur, dan form RSVP. Watermark Gratis tampil.

**Kasus e (model cadangan)** terjadi secara alami. Saat b dan c dibuat, `gemini-3.5-flash` membalas 504/timeout, lalu sistem beralih ke `gemini-3.1-flash-lite`, dan versi undangan mencatat model cadangan itu. Karena itu kasus e tidak diuji terpisah.

**Pemulihan job.** Job d sempat macet ketika koneksi internet lokal putus (DNS gagal). Setelah backend dinyalakan ulang, job diantrekan ulang otomatis dan selesai (attempt 1).

## Pengaruh input customer
- Gaya terlihat berbeda:
  - a: editorial krem dan terracotta;
  - b: hitam-emas;
  - c: krem-cokelat dengan huruf Cinzel;
  - d: dusty pink.
- d mengikuti tema warna "Dusty pink & putih" dan catatan bunga (11 ornamen bunga dan daun).
- c memakai ornamen batik dan gapura sesuai brief Nusantara. Hasilnya lebih sederhana karena dibuat oleh model cadangan.

## Form app (390px)
Setelah login dengan akun uji, langkah "Gaya" menampilkan:
- 7 gaya tanpa kunci Premium;
- kolom tema warna dengan 5 chip (chip yang dipilih mengisi kolom, 11/80);
- kotak "Ceritakan desain impianmu" dengan penghitung 43/300;
- tidak ada teks "khusus Premium";
- tidak ada error halaman.

## Temuan
1. Tombol "Buka Undangan" di kasus c (model cadangan) kontrasnya rendah: teks cokelat tua di atas tombol cokelat.
   - Ini kualitas keluaran AI, bukan kesalahan kit.
   - Prompt sudah mewajibkan kontras ≥ 4.5:1.
   - Belum diperbaiki.
2. `gemini-3.5-flash` sering timeout (504 setelah sekitar 90 detik) saat permintaan sedang ramai. Akibatnya satu generate bisa memakan sekitar 2–3 menit sebelum beralih ke cadangan.
3. Di luar lingkup: tombol chat mengambang di app menutupi tombol "Lanjut" di bagian bawah form (lihat `form-2-penuh.png`).

## Bukti
Gambar di folder `2026-11-21-desain-undangan-ai/`:
- `qa-a-default-1-sampul.png`, `qa-a-default-3-tengah.png`
- `qa-b-elegan-1-sampul.png`
- `qa-c-nusantara-1-sampul.png`
- `qa-d-bebas-1-sampul.png`, `qa-d-bebas-4-rsvp.png`
- `form-2-penuh.png`
