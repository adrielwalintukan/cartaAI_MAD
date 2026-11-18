# 01 · Product Requirements Document (PRD) CartaAI v2

Status: draf F0. Sumber keputusan: [00-keputusan-dan-analisis.md](00-keputusan-dan-analisis.md) (Q1-Q25).
Bila ada konflik, dokumen 00 yang benar. Hal yang belum diputuskan ditandai **TBD**.

## 1. Ringkasan produk

CartaAI adalah generator undangan pernikahan digital. Calon pengantin mengisi data pernikahan, AI
(Gemini) membuat **HTML undangan utuh**, dan hasilnya berupa **link undangan aktif**
(`/u/<slug>`) yang dibagikan ke tamu lewat WhatsApp. Pendukung: daftar tamu, RSVP dan ucapan,
pembayaran premium (Midtrans), chatbot bantuan.

v2 adalah refactor penuh: satu codebase Expo Router (iOS, Android, web), backend FastAPI
distruktur ulang, Supabase baru, UI baru bergaya editorial-romantis. Tujuan v2 adalah produk
portofolio yang benar-benar bisa dipakai, skala kecil (Q1).

## 2. Masalah dan pengguna

### Masalah
- Undangan cetak mahal dan lambat; template undangan digital generik, sulit disesuaikan.
- Membuat undangan digital dari nol butuh keahlian desain/web.
- Mengirim undangan personal ke ratusan tamu (nama tamu di tiap link) dan memantau kehadiran
  dilakukan manual lewat chat dan spreadsheet.

### Pengguna
- **Primer: calon pengantin Indonesia** (pasangan atau keluarga/EO kecil yang mengurus undangan).
  Nyaman memakai WhatsApp, umumnya mengakses dari ponsel, kadang dari laptop untuk impor daftar tamu.
- **Sekunder: tamu undangan.** Membuka link dari WhatsApp (hampir selalu di ponsel), membaca detail
  acara, mengisi RSVP dan ucapan. Tidak perlu akun.

### Persona singkat
| Persona | Konteks | Kebutuhan utama |
|---------|---------|-----------------|
| **Rina (27), calon pengantin** | Menikah 3 bulan lagi, anggaran terbatas, pakai ponsel | Undangan cantik cepat jadi tanpa desainer; kirim ke tamu dengan nama masing-masing; tahu siapa yang hadir |
| **Dimas (31), calon pengantin premium** | Ingin foto, galeri, musik, nomor rekening hadiah | Hasil yang terasa personal dan tanpa watermark; bisa edit dan generate ulang |
| **Bu Tati (55), tamu** | Menerima link lewat WhatsApp, layar kecil, tidak akrab teknologi | Halaman cepat terbuka, tulisan terbaca, RSVP satu ketukan |

## 3. Tujuan dan metrik sukses

Tujuan (sesuai Q1): (1) alur lengkap dari daftar sampai link undangan bisa dipakai nyata;
(2) keamanan dasar benar di server (Q14, Q24); (3) tampilan konsisten dan layak portofolio.

Metrik realistis skala kecil (target awal, ditinjau ulang setelah ada pengguna nyata):

| Metrik | Target | Cara ukur |
|--------|--------|-----------|
| Keberhasilan generate (job `selesai` / total job) | >= 90% | tabel `generation_jobs` |
| Waktu generate sampai link siap (median) | <= 60 detik (TBD, ukur setelah F1) | `generation_jobs` (waktu mulai, selesai) |
| Pengguna terdaftar yang menyelesaikan 1 undangan | >= 40% | `profiles` vs `invitations` |
| Undangan gratis yang di-upgrade | >= 5% (hipotesis, bukan jaminan) | `orders` berstatus lunas |
| Pembayaran lunas yang aktif otomatis | 100% (uji webhook lulus) | pytest + `orders` |
| Tes keamanan Q24 lulus | 100% di CI | pytest |
| Lighthouse landing (Performance, SEO, A11y) | >= 90 / 90 / 90 | Lighthouse mobile |

Analitik produk tidak dibangun di v2; metrik dibaca dari database lewat dashboard Supabase (Q23).

## 4. Cakupan

### Dalam cakupan v2
Web aplikasi lengkap + app iOS/Android dari satu codebase (Q2, Q3): landing, auth, generator, job
async, preset gaya, halaman undangan publik, RSVP/countdown/musik, kelola tamu, dashboard RSVP,
pembayaran per undangan, chatbot, riwayat, dark mode, responsif.

### Di luar cakupan v2
- Panel admin (pakai dashboard Supabase, Q23).
- Langganan bulanan (Q7: bayar sekali per undangan).
- Pembayaran kripto/blockchain (Q8).
- Editor visual WYSIWYG untuk HTML hasil AI (perubahan lewat edit data + generate ulang, Q16).
- Domain kustom per undangan, pembuatan template oleh pengguna.
- Migrasi data lama (Q5: diikhlaskan).
- Analitik lanjutan, notifikasi push, multi-bahasa selain Indonesia (TBD bila nanti diperlukan).
- Pengiriman WhatsApp otomatis lewat API; v2 hanya membuka WhatsApp dengan pesan terisi (tautan `wa.me`).

## 5. Paket Gratis vs Premium (sesuai Q17)

| Aspek | Gratis | Premium (Rp99.000, sekali bayar per undangan) |
|-------|--------|-----------------------------------------------|
| Data inti (mempelai, orang tua, acara, lokasi) | Ya | Ya |
| Foto mempelai / foto cover | Tidak | Ya |
| Galeri foto | Tidak | Ya, maks 10 |
| Musik latar | Tidak | Ya |
| Amplop digital / rekening | Tidak | Ya |
| Pilihan tema dan gaya (preset, tema warna) | Tidak | Ya |
| Watermark | Ada | Tidak ada |
| Masa aktif link | 30 hari | 1 tahun |
| Maks tamu di daftar tamu | 50 | Tak terbatas |
| Kuota generate ulang per undangan (Q16) | 3x | 15x |
| RSVP, ucapan, countdown, nama tamu `?to=` | Ya (slot sistem) | Ya |

Catatan: harga final selain Rp99.000 dan kemungkinan diskon adalah **TBD**. Pembelian Premium
berlaku untuk **satu undangan**; undangan lain tetap Gratis sampai dibayar sendiri. Perilaku
undangan Gratis setelah 30 hari (nonaktif, dapat diaktifkan kembali lewat upgrade?) dan pengaturan
gaya default untuk Gratis ("tanpa pilihan" berarti satu gaya bawaan) adalah **TBD**.

## 6. Daftar fitur, prioritas, dan acceptance criteria

Prioritas: **M** = Must (rilis v2 tidak sah tanpa ini), **S** = Should, **C** = Could.
Setiap kriteria ditulis agar bisa diuji (pytest untuk server, checklist QA manual untuk UI, Q24).

### F-01 Auth email + Google (M) — Q21
- Daftar dengan email+password; login; keluar; lupa password lewat email tautan reset; login Google OAuth.
- AC1: pengguna baru dapat mendaftar, dan baris `profiles` terbentuk.
- AC2: login salah memberi pesan galat jelas tanpa membocorkan apakah email terdaftar.
- AC3: tautan reset password mengizinkan set password baru; tautan kedaluwarsa ditolak.
- AC4: login Google membuat/menautkan akun; sesi bertahan setelah muat ulang (web) dan restart app (mobile).
- AC5: semua endpoint terproteksi menolak permintaan tanpa token dengan 401.

### F-02 Generator undangan + job async + kuota generate ulang (M) — Q6, Q15, Q16, Q22
- Form data (lihat dokumen 02), submit membuat job; app menampilkan progres dan polling sampai link siap.
- AC1: `POST` generate membalas `job_id` dalam waktu singkat (target < 2 detik, tanpa menunggu AI).
- AC2: status job melewati `antre` → `berjalan` → `selesai`/`gagal`; layar progres mencerminkan status.
- AC3: job `gagal` menampilkan pesan dan tombol coba lagi; kegagalan tidak menghabiskan kuota (TBD: konfirmasi aturan).
- AC4: field khusus Premium ditolak server (bukan hanya dikunci di UI) bila undangan belum premium.
- AC5: kuota generate ulang dicek di server: Gratis 3x, Premium 15x per undangan; percobaan ke-4/ke-16 ditolak.
- AC6: slug tetap saat generate ulang; versi terakhir + 1 versi sebelumnya tersimpan, ada aksi rollback.
- AC7: pengguna A tidak bisa menimpa/menghasilkan ulang undangan milik B (termasuk lewat slug yang sama).
- AC8: model `gemini-3.1-flash-lite` lewat `google-genai`; saat rate limit, memakai key kedua.
- AC9: slug unik, hanya `a-z0-9-`, panjang batas TBD; slug dipakai ditolak dengan pesan jelas.

### F-03 Preset gaya / template (M) — Q18
- Daftar preset (gambar preview + brief desain: palet, mood, tipografi) dan opsi "Bebas".
- AC1: memilih preset menyertakan brief-nya dalam prompt; "Bebas" memakai tema warna tulisan pengguna.
- AC2: preset hanya bisa dipilih pada undangan Premium (Q17); Gratis memakai gaya bawaan.
- AC3: jumlah dan nama preset awal: **TBD** (usulan minimal 3 gaya, dari yang ada: elegan, formal, simple).

### F-04 Link undangan publik `/u/<slug>?to=` (M) — Q14, Q19
- AC1: `/u/<slug>` menyajikan HTML hasil sanitasi; `?to=Nama+Tamu` mengganti slot `guest-name`.
- AC2: tidak ada `<script>` atau event handler dari AI di output; hanya CDN whitelist (Tailwind CDN, Google Fonts).
- AC3: respons memuat header CSP dan disajikan dari path/origin terpisah dari aplikasi, tanpa akses ke sesi login.
- AC4: input pengguna ber-HTML (mis. `<script>`) tampil sebagai teks, tidak dieksekusi.
- AC5: slug tak dikenal → halaman 404 ramah; undangan kedaluwarsa → halaman "undangan telah berakhir".
- AC6: tampil benar di lebar 360 px sampai desktop.

### F-05 Slot sistem: RSVP, countdown, musik, nama tamu, watermark (M) — Q13
- AI menaruh penanda `data-carta="rsvp|countdown|music|guest-name|gift"`; sistem menyisipkan script.
- AC1: bila AI lupa menaruh slot wajib (rsvp, countdown), sistem menambahkannya di posisi bawaan.
- AC2: RSVP mengirim nama, kehadiran (hadir/tidak/ragu: TBD opsi), ucapan; tersimpan di `rsvps`.
- AC3: countdown menghitung ke tanggal+waktu acara dalam zona waktu acara (TBD cara menyimpan zona).
- AC4: pemutar musik hanya ada bila ada musik (Premium) dan tidak autoplay tanpa interaksi pengguna.
- AC5: undangan Gratis memuat watermark yang tidak bisa dihapus lewat HTML AI; Premium tanpa watermark.
- AC6: memperbaiki script sistem tidak perlu generate ulang (script disisipkan saat penyajian).
- AC7: RSVP dibatasi laju per IP/perangkat untuk mencegah spam (angka TBD).

### F-06 Daftar tamu + WhatsApp + impor CSV (M) — Q20
- AC1: tambah/ubah/hapus tamu hanya oleh pemilik undangan (hapus tanpa auth sebelumnya, B3, harus tertutup).
- AC2: tiap tamu punya link personal `/u/<slug>?to=<nama>`; salin link dan tombol WhatsApp membuka `wa.me` dengan pesan terisi.
- AC3: template pesan WhatsApp bisa diedit dengan variabel `{nama}` dan `{link}` (nama variabel TBD).
- AC4: impor teks tempel (satu nama per baris) dan berkas CSV (web); baris kosong/duplikat diabaikan dengan ringkasan hasil.
- AC5: batas tamu ditegakkan di server: Gratis 50, Premium tak terbatas; impor yang melebihi batas ditolak/dipotong dengan pesan jelas.
- AC6: penanda status "sudah dikirim" per tamu (S, bukan pengiriman otomatis).

### F-07 Dashboard RSVP (M) — Q20
- AC1: pemilik melihat total hadir / tidak hadir / belum menjawab dan daftar ucapan.
- AC2: data hanya terlihat oleh pemilik (diuji: user lain mendapat 403/404).
- AC3: ekspor CSV RSVP (S).

### F-08 Pembayaran sekali per undangan via Midtrans (M) — Q7, Q17
- AC1: dari undangan Gratis, "Upgrade" membuat order Rp99.000 untuk undangan tersebut; harga dibaca dari konfigurasi server, bukan hardcode klien.
- AC2: `POST /api/payments/webhook` memverifikasi signature; signature salah ditolak.
- AC3: status `settlement`/`capture` yang sah mengaktifkan Premium untuk undangan itu, termasuk VA/e-wallet tanpa `fraud_status` (memperbaiki B6).
- AC4: aktivasi idempoten: webhook yang sama dikirim dua kali tidak menggandakan efek.
- AC5: `pending`, `expire`, `cancel`, `deny` tidak mengaktifkan; status order tampil di layar status pembayaran.
- AC6: aktivasi memperpanjang masa aktif menjadi 1 tahun dan membuka kuota 15x; tidak mengubah undangan lain.
- AC7: lingkungan sandbox/production dari env (B7); satu endpoint webhook saja (B8).
- AC8: pengguna melihat status benar walau menutup app sebelum bayar selesai (status dibaca dari server).

### F-09 Chatbot terbatas (S) — Q9
- AC1: wajib login; tanpa token → 401.
- AC2: maks 20 pesan/hari/user dihitung di server; pesan ke-21 → 429 dengan pesan jelas; reset harian (zona waktu reset TBD).
- AC3: cakupan jawaban dibatasi pada bantuan penggunaan CartaAI (system prompt); panjang input dibatasi.

### F-10 Riwayat undangan (M)
- AC1: daftar undangan milik pengguna dengan status (draf, diproses, aktif, kedaluwarsa), paket, tanggal acara.
- AC2: dari riwayat bisa membuka link, salin link, kelola tamu, lihat RSVP, edit/generate ulang, upgrade.
- AC3: hapus undangan meminta konfirmasi; setelah dihapus link menjadi 404 (soft delete: TBD).

### F-11 Dark mode (S) — Q10
- AC1: mengikuti pengaturan sistem, dengan pilihan manual Terang/Gelap/Sistem yang tersimpan.
- AC2: semua layar aplikasi memakai token warna; kontras teks memenuhi WCAG AA di kedua mode.
- AC3: halaman undangan publik **tidak** mengikuti dark mode aplikasi (desain ditentukan AI/preset).

### F-12 Responsif desktop/mobile (M) — Q3
- AC1: semua layar dapat dipakai dari lebar 360 px hingga 1440 px tanpa scroll horizontal.
- AC2: desktop memakai navigasi samping/atas dan konten berkolom; mobile memakai tab bawah (detail di dokumen 02).
- AC3: landing page di-render statis (static export) dan berisi konten tanpa JavaScript tambahan untuk SEO.

### F-13 Unggah aset (M untuk Premium) — Q17
- AC1: foto (jpg/png/webp) dan musik (mp3/m4a) divalidasi tipe dan ukuran di server (batas ukuran TBD); galeri maks 10.
- AC2: aset tersimpan di bucket privat-per-pengguna/terkontrol, URL tidak hardcode (B9).
- AC3: unggahan Premium ditolak server pada undangan Gratis.

### F-14 Landing page (S)
- AC1: berisi nilai jual, cara kerja, preview gaya, tabel harga (Q17), FAQ, tombol Mulai.
- AC2: tag `title`, `meta description`, Open Graph, dan sitemap tersedia.

## 7. Kebutuhan non-fungsional

### Keamanan (Q14, Q4, Q24)
- Server sebagai satu-satunya yang memakai Supabase service role; kunci tidak pernah ada di klien. RLS aktif.
- Autentikasi, status premium, kuota, dan kepemilikan dicek **di server** (menutup B1-B4).
- Input pengguna di-escape sebelum masuk prompt; output AI disanitasi (hapus semua `<script>` dan event handler; CDN whitelist: Tailwind CDN, Google Fonts); disajikan dengan CSP dari path/origin terpisah.
- Rate limit: chatbot 20/hari/user; generate (kuota per undangan); RSVP (TBD angka).
- Rahasia hanya lewat env; key Midtrans dan Gemini lama harus di-rotate oleh pemilik.
- Pytest wajib: webhook Midtrans (signature, aktivasi idempoten), kepemilikan data, cek premium dan kuota, sanitasi HTML.

### Performa
- Landing: LCP <= 2,5 detik pada 4G (target Lighthouse mobile).
- Halaman undangan publik: HTML + aset terkompresi, gambar dioptimalkan; target TTI baik di ponsel kelas menengah.
- API non-AI: p95 < 500 ms (target, ukur setelah F1). Generate berjalan async sehingga tidak ada request yang menunggu AI.
- Render free tier mungkin cold start; layar memberi indikator memuat (risiko di bagian 8).

### Aksesibilitas
- Kontras WCAG AA, target sentuh >= 44 px, label pada semua input, fokus terlihat, urutan tab logis di web.
- Teks alternatif pada gambar bermakna; dukungan ukuran font sistem pada mobile.
- Halaman undangan: instruksi ke AI agar kontras teks memadai; tombol RSVP dapat diakses keyboard.

### SEO (landing)
- Static rendering (Q3), heading semantik, meta/OG, sitemap, `robots.txt`; halaman `/u/*` diberi `noindex` (undangan bersifat pribadi).

### Lainnya
- Bahasa antarmuka: Indonesia. Zona waktu acara: TBD.
- Privasi: data tamu dan RSVP hanya terlihat pemilik; kebijakan privasi dan ketentuan layanan perlu ada (isi TBD).

## 8. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| HTML dari AI berisi skrip berbahaya (XSS) | Pencurian sesi, reputasi | Sanitasi + CSP + origin terpisah (Q14), tes sanitasi |
| Output AI berantakan atau tidak konsisten | Undangan jelek | Preset dengan brief desain, slot sistem untuk bagian kritis, rollback versi, kuota generate ulang |
| Kuota/biaya Gemini membengkak | Layanan terhenti | Kuota generate per undangan, rate limit chatbot, key cadangan (Q22) |
| Midtrans production belum ada akun | Tidak bisa terima uang nyata | Mode sandbox untuk demo; TBD akun production |
| Webhook gagal mengaktifkan premium | Pengguna bayar tapi tidak aktif | Verifikasi signature, aktivasi idempoten, tes, status order bisa dicek ulang |
| Cold start / limit Render free tier | Generate dan API lambat | Job async, layar progres, indikator memuat |
| Skema DB baru salah rancang | Refaktor ulang mahal | Migrasi di repo, RLS, ditinjau di F1 |
| Lingkup membengkak (skala kecil) | Tidak selesai | Prioritas M/S/C, fase F0-F4 dengan PR terpisah (Q25) |
| Data pribadi tamu bocor | Pelanggaran privasi | RLS, cek kepemilikan di server, tes kepemilikan |

## 9. Pertanyaan terbuka (TBD)

1. Nama domain final (sementara domain bawaan Vercel, Q19).
2. Harga final selain Rp99.000 (termasuk diskon/promo).
3. Akun Midtrans production dan metode pembayaran yang diaktifkan.
4. Perilaku undangan Gratis setelah 30 hari (nonaktif permanen atau bisa di-upgrade) dan nasib data setelah 1 tahun.
5. Jumlah dan nama preset gaya awal beserta brief desainnya; gaya bawaan untuk Gratis.
6. Apakah job gagal mengurangi kuota generate ulang (usulan: tidak).
7. Batas ukuran unggahan foto/musik; batas panjang slug; batas laju RSVP; zona waktu reset kuota chatbot.
8. Opsi kehadiran RSVP (hadir/tidak saja, atau termasuk ragu) dan penyimpanan zona waktu acara.
9. Soft delete atau hapus permanen untuk undangan.
10. Isi kebijakan privasi dan ketentuan layanan.
11. Ukuran/angka target metrik di bagian 3 perlu divalidasi setelah ada data nyata.
