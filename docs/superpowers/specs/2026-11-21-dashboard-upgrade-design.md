# Dashboard app dan upgrade Premium yang jelas

Tanggal: 2026-11-21 · Status: menunggu persetujuan pemilik · Ukuran: perubahan kecil (UI saja, backend tidak berubah)

## Maksud
- Dashboard setelah login masih terlihat polos: sapaan, satu tombol, dan daftar kartu. Pemilik ingin tampilannya sekelas landing page `web/`: modern, hidup, interaktif, dan **tidak terlihat seperti AI slop**.
- Ajakan upgrade Premium harus tampil jelas di dashboard, seperti bagian harga di situs e-commerce atau startup, bukan hanya di dalam tiap undangan.
- Tombol "Bayar sekarang" di halaman upgrade saat ini dobel.

## Keputusan pemilik
- Premium tetap **per undangan** (Rp99.000 sekali bayar, Q17). Yang diperbaiki hanya UI.
- Pendekatan 1: desain ulang di dalam app Expo memakai bahasa visual landing page, dengan library yang sudah terpasang (Reanimated, `expo-linear-gradient`, `expo-blur`). Tema terang/gelap tetap ada.

## Pendekatan yang dipertimbangkan
| # | Pendekatan | Alasan tidak dipilih / dipilih |
|---|---|---|
| **1** | **Desain ulang di Expo dengan gaya landing** | **Dipilih:** dampak terbesar, tetap jalan di ponsel dan web |
| 2 | Nomor 1 + palet dashboard disamakan penuh dengan landing | Tema gelap harus ditata ulang; pekerjaan bertambah tanpa tambahan nilai yang sepadan |
| 3 | Dashboard dipindah ke Next.js `web/` | App Android/iOS tidak ikut mendapatkannya; semua layar harus ditulis ulang |

## Rancangan

### Beranda `/app` (urutan dari atas)
1. **Kepala halaman.**
   - Label kecil berhuruf kapital (contoh: "SABTU, 21 NOV"), lalu sapaan besar dengan huruf display Fraunces: "Halo, Adriel." dengan kata kedua miring dan berwarna aksen, mengikuti gaya judul landing.
   - Di bawahnya satu kalimat status yang dihitung dari data, misalnya "2 undangan aktif · 14 tamu sudah konfirmasi".
   - Tombol utama "Buat undangan" ditambah tombol sekunder "Lihat paket".
2. **Ringkasan angka.** Empat sel dalam satu baris (2×2 di ponsel): Undangan aktif, Tamu, Sudah RSVP, Hadir.
   - Angka besar memakai Fraunces dan menghitung naik saat halaman dibuka.
   - Sel-sel dipisah garis tipis seperti grid editorial landing, bukan kartu berbayang yang seragam.
   - Data diambil dari daftar undangan dan statistik RSVP tiap undangan (maks. 5 undangan per akun, jadi paling banyak 5 permintaan).
3. **Kartu promo Premium.** Tampil hanya bila ada undangan Gratis yang belum di-upgrade.
   - Blok lebar dengan latar gelap hangat (gradien tinta hijau tua ke cokelat, sama seperti bagian gelap landing).
   - Isinya: label "PREMIUM", judul "Undanganmu bisa tampil utuh.", harga **Rp99.000** dengan catatan "sekali bayar per undangan", tiga manfaat (foto & galeri, musik & amplop digital, tanpa watermark · aktif 1 tahun), dan tombol "Upgrade sekarang".
   - Di sisi kanan (desktop) ada tumpukan dua mockup undangan dari `web/public/templates` yang miring halus dan bergerak sedikit mengikuti kursor (desktop) atau sentuhan.
   - Di bawah kartu ada tautan "Bandingkan Gratis dan Premium" yang membuka tabel perbandingan (accordion dengan tinggi beranimasi).
4. **Undangan terbaru.** Kartu undangan didesain ulang:
   - Thumbnail potret: foto sampul bila Premium; bila tidak, blok warna sesuai gaya dengan inisial besar Fraunces.
   - Judul, tanggal, badge status dan paket, sisa hari aktif dengan bar tipis.
   - Ringkasan RSVP satu baris.
   - Tombol: Bagikan, Tamu, dan **"Upgrade"** khusus untuk kartu Gratis. Menu "…" tetap ada.
   - Saat kursor di atas atau kartu ditekan, kartu terangkat sedikit dan garis tepinya berubah ke warna aksen.

### Alur upgrade dari dashboard
- "Upgrade sekarang" / "Lihat paket":
  - **1 undangan Gratis:** langsung ke `/app/undangan/{id}/upgrade`.
  - **Lebih dari satu:** buka lembar (modal) "Pilih undangan yang mau di-upgrade". Daftarnya memakai judul, tanggal, dan thumbnail, lalu satu tombol Lanjut.
  - **Tidak ada undangan:** ke form "Buat undangan" dengan pesan bahwa upgrade dilakukan setelah undangan dibuat.
- Halaman `/upgrade` (checkout):
  - Dua kolom di desktop: kiri ringkasan undangan dan daftar manfaat; kanan kotak harga yang menempel saat di-scroll (sticky).
  - Kotak harga berisi Rp99.000, total, metode Midtrans (VA, e-wallet, kartu), dan **satu** tombol "Bayar Rp99.000" yang menampilkan loading dan tidak bisa diklik dua kali.
  - Di ponsel tombol bayar menempel di bawah layar.
  - Tombol bayar dobel dihapus.

### Gerak dan detail
- Satu bahasa easing (expo-out), sama seperti landing.
- Elemen masuk berurutan dengan jeda 60 ms, angka menghitung naik, kartu terangkat saat hover/tekan, dan accordion beranimasi.
- `reduce motion` dipatuhi (Reanimated sudah mendukungnya).
- **Anti-slop:**
  - tanpa gradien ungu/biru;
  - tanpa emoji;
  - tanpa grid tiga kartu identik dengan ikon;
  - tanpa glassmorphism di mana-mana (blur hanya untuk lembar modal);
  - satu warna aksen terracotta;
  - tipografi besar sebagai pusat perhatian.

## Batasan
- Backend, harga, dan aturan paket tidak berubah.
- Tidak ada library baru.
- Layar lain (detail, tamu, RSVP, akun) tidak didesain ulang di pekerjaan ini, kecuali kartu dan halaman upgrade yang dipakai bersama.

## Uji dan bukti selesai
- `tsc` bersih.
- Tangkapan layar beranda dan checkout di 390px dan 1440px, tema terang dan gelap.
- Uji alur dengan akun uji (dihapus setelahnya) untuk tiga kasus pemilih undangan: 0, 1, dan lebih dari 1 undangan.
- Tidak ada error console.
- Tombol bayar hanya satu dan menampilkan loading.

## Diserahkan ke builder
- Ukuran, jarak, dan warna gradien persis.
- Mockup undangan mana yang dipakai.
- Teks pendukung kecil.
