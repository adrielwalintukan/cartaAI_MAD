# 00 · Keputusan dan Analisis Awal (Refactor v2)

Sumber kebenaran untuk semua dokumen dan pekerjaan refactor v2. Disusun 2026-11-18 dari analisis kode
di branch `main` (commit `52d9ba5`) dan sesi tanya-jawab dengan pemilik project. Dokumen lain wajib
konsisten dengan berkas ini; bila ada konflik, berkas ini yang benar sampai diperbarui.

## 1. Apa itu CartaAI

Pengguna (calon pengantin) mengisi data pernikahan sendiri, lalu AI (Gemini) **membuat HTML undangan
utuh**. Output ke customer adalah **link undangan aktif** yang bisa dibagikan ke tamu (WhatsApp).
Fitur pendukung: daftar tamu, RSVP dan ucapan, pembayaran premium (Midtrans), chatbot bantuan.

## 2. Kondisi saat ini (fakta terverifikasi)

### Struktur
- `mobile/`: Expo SDK 54, Expo Router 6, React Native 0.81, React 19, TypeScript. ±8.500 baris.
  `app.json` sudah `web.output: "static"` (react-native-web terpasang).
- `backend/`: FastAPI + Uvicorn, `supabase` (python), `midtransclient`, `google-generativeai`. ±1.300 baris.
- `video/`: project Remotion untuk video promo (belum di-commit, di luar cakupan refactor).

### Infrastruktur mati
- Supabase lama (`sckwugoazrkjdulqzxoq.supabase.co`): domain tidak ada lagi (NXDOMAIN) → project terhapus.
- Railway (`cartaaimad-production.up.railway.app`): "Application not found".
- Skema DB **tidak ada di repo** (tanpa migrasi). Tabel lama yang dipakai kode: `tbl_user`, `tbl_m_subs`,
  `tbl_t_subs`, `tbl_t_invitation`, `tbl_t_invitation_content`, `tbl_t_template_ai`, `tbl_t_gallery`,
  `tbl_t_guest`, `tbl_t_rsvp`, bucket storage `invitation-assets`.

### Masalah backend
| # | Masalah | Lokasi |
|---|---------|--------|
| B1 | Status premium hanya dicek di client; `POST /api/invitations/generate` bisa dipanggil siapa pun yang login | `backend/routers/invitations.py` |
| B2 | Slug hijack: pencarian slug di `generate` tanpa filter `id_user`, undangan user lain bisa ditimpa | `invitations.py` ±baris 193 |
| B3 | `DELETE /guests/{guest_id}` tanpa auth | `invitations.py` ±baris 141 |
| B4 | `/api/chat` tanpa auth dan tanpa rate limit (kuota Gemini bisa disalahgunakan) | `routers/chatbot.py` |
| B5 | HTML hasil AI disajikan mentah dari domain API, input user masuk prompt tanpa escape (risiko XSS) | `ai_generator.py`, `GET /invitations/{slug}` |
| B6 | Webhook mensyaratkan `fraud_status == 'accept'`; untuk VA/e-wallet field ini sering kosong → pembayaran lunas tidak mengaktifkan premium | `routers/payments.py` |
| B7 | Harga hardcode `99000`, Midtrans `is_production=False` hardcode | `payments.py`, `dependencies.py` |
| B8 | 4 endpoint webhook duplikat (`/`, `/midtrans-notification`, `/api/payments/midtrans-notification`, `/midtrans/webhook`) | `main.py`, `midtrans.py` |
| B9 | Dua client Supabase dengan key berbeda (anon vs service), URL storage hardcode | `dependencies.py`, `invitations.py`, `ai_generator.py` |
| B10 | `google-generativeai` deprecated; RSVP/countdown ditulis AI sehingga bisa rusak | `ai_generator*.py` |

### Masalah frontend
- Gaya "AI slop": `#6366f1` muncul 93×, gradien `#667eea→#764ba2` di 25 file, tanpa token desain, tanpa font khusus.
- `GeneratorScreen.tsx` 1.522 baris (form, upload, submit, UI jadi satu).
- Kode mati: `BlockchainPayment.tsx` (simulasi), `FreeGeneratorScreen`/`PremiumGeneratorScreen` (6 baris), aset `react-logo*`, `partial-react-logo`.
- Status premium dibaca langsung dari `tbl_t_subs` di `AuthContext.tsx`.

## 3. Keputusan (hasil tanya-jawab, final)

| # | Topik | Keputusan |
|---|-------|-----------|
| Q1 | Tujuan | Produk portofolio yang benar-benar bisa dipakai, skala kecil (tanpa arsitektur enterprise). |
| Q2 | Website | Web berisi **aplikasi lengkap** (landing, auth, generator, dashboard tamu/RSVP, pembayaran) + halaman undangan publik. |
| Q3 | Codebase | ~~Satu codebase Expo Router termasuk landing~~ **Diubah oleh Q26:** aplikasi (setelah login) tetap satu codebase Expo Router untuk iOS, Android, dan web; situs publik (landing, template, harga, tentang, legal) pindah ke project Next.js `web/`. |
| Q4 | Backend | **Tetap FastAPI (Python)**, distruktur ulang: service layer, satu client Supabase (service role, hanya di server), auth + cek premium + cek kepemilikan di server. |
| Q5 | Database | **Project Supabase baru**, skema didesain ulang sebagai migrasi di repo (`supabase/migrations/`), RLS aktif, nama tabel jelas (mis. `profiles`, `invitations`, `invitation_versions`, `guests`, `rsvps`, `orders`, `generation_jobs`). Data lama diikhlaskan. |
| Q6 | AI generate | **AI tetap membuat HTML undangan utuh.** Output ke customer = link undangan aktif. |
| Q7 | Bisnis | **Bayar sekali per undangan** (bukan langganan bulanan). |
| Q8 | Dibuang | `BlockchainPayment`, screen generator duplikat, aset contoh Expo, webhook duplikat (sisa satu: `POST /api/payments/webhook`). |
| Q9 | Chatbot | Dipertahankan: wajib login, batas 20 pesan/hari/user. |
| Q10 | Visual | **Editorial-romantis**: latar ivory/kertas hangat, tinta gelap (hijau tua/cokelat), satu aksen (terracotta atau emas pudar), display serif (Fraunces/Cormorant) + sans bersih (Inter/Geist), tanpa gradien ungu, ada dark mode. |
| Q11 | Hosting | Backend **Render**, web **Vercel** (static export Expo), mobile **EAS Build**. |
| Q12 | Dokumen | Bahasa Indonesia, Markdown, folder `docs/` di repo. Kerja di branch `refactor/v2`. |
| Q13 | Pembagian AI vs sistem | AI membuat seluruh tampilan (HTML+CSS: layout, warna, font, ornamen). AI menaruh **penanda slot** (mis. `<div data-carta="rsvp"></div>`, `data-carta="countdown"`, `"music"`, `"guest-name"`, `"gift"`). Sistem menyisipkan script/komponen yang wajib jalan: RSVP & ucapan, countdown, pemutar musik, nama tamu dari `?to=`, watermark (gratis). Script ini bisa diperbaiki tanpa generate ulang. |
| Q14 | Keamanan HTML | Escape input user sebelum masuk prompt; sanitasi output AI (buang semua `<script>` dan event handler dari AI, hanya CDN whitelist: Tailwind CDN dan Google Fonts); sajikan dengan header CSP dari path/origin terpisah dari aplikasi (tanpa akses ke sesi login). |
| Q15 | Proses generate | **Job async**: `POST` membalas `job_id` segera; app menampilkan layar progres dan polling status sampai link siap. |
| Q16 | Generate ulang | Boleh edit data lalu generate ulang dengan kuota: Gratis 3×, Premium 15× per undangan. Slug tetap. Simpan versi terakhir + 1 versi sebelumnya untuk rollback. |
| Q17 | Paket | **Gratis**: data inti (mempelai, orang tua, acara, lokasi), tanpa foto/musik/galeri/rekening, ada watermark, aktif 30 hari, maks 50 tamu. **Premium Rp99.000 sekali bayar per undangan**: foto, galeri (maks 10), musik, amplop digital/rekening, pilihan tema & gaya, tanpa watermark, aktif 1 tahun, tamu tak terbatas. |
| Q18 | Template | Template = **preset gaya**: gambar preview + "brief desain" (palet, mood, tipografi) yang dikirim ke AI sebagai arahan. Ada opsi "Bebas" (AI menentukan dari tema warna yang ditulis user). |
| Q19 | Link | `https://<domain-web>/u/<slug>`; Vercel rewrite ke backend. Link tamu: `/u/<slug>?to=Nama+Tamu`. Domain sementara: domain bawaan Vercel. |
| Q20 | Tamu | Daftar tamu, link personal per tamu, kirim WhatsApp dengan template pesan yang bisa diedit, impor teks/CSV (web), dashboard RSVP (hadir/tidak/ucapan). |
| Q21 | Auth | Email+password + Google OAuth (Supabase Auth), lupa password. |
| Q22 | Model AI | Gemini `gemini-3.1-flash-lite` (cadangan `gemini-3.5-flash-lite`; kuota free tier RPD jauh lebih tinggi, 500 vs 20) lewat SDK baru `google-genai`; key dari env, fallback ke key kedua saat rate limit. |
| Q23 | Admin | Tanpa panel admin di v2; pakai dashboard Supabase. |
| Q24 | Tes | pytest untuk: webhook Midtrans (signature, aktivasi idempoten), kepemilikan data (user A tak bisa ubah milik B), cek premium & kuota di server, sanitasi HTML. Frontend: checklist QA manual. |
| Q26 | Situs publik | (2026-11-21) Situs publik dibangun ulang di `web/` (Next.js 15 static export, Tailwind v4, GSAP + ScrollTrigger + SplitText, Lenis, three.js lewat React Three Fiber) dengan arah visual dari Locomotive, Obys, OHZI, Blobmixer, dan Firstwork: palet hangat, tipografi besar, hero 3D amplop yang terbuka saat di-scroll. App Expo hanya dipoles dengan Reanimated. Konten lama dipulihkan: tentang (visi, misi, keunggulan), fitur, katalog 9 template + halaman detail, footer lengkap, halaman legal (draf), chatbot mengambang di app. Testimoni lama tidak ditampilkan karena bukan testimoni nyata. Rewrite `/u/:slug` pindah ke `web/vercel.json`. |
| Q25 | Fase | F0 dokumen → F1 DB baru + backend → F2 design system + komponen dasar → F3 semua layar web+mobile → F4 deploy (Render/Vercel/EAS) + QA. Tiap fase = PR terpisah ke `refactor/v2`. |

## 4. Prinsip kerja
- Perubahan terkecil yang menyelesaikan masalah; hapus yang tidak dipakai; jangan tambah dependensi tanpa alasan.
- Rahasia hanya lewat env; jangan commit `.env`. Key lama (Midtrans, Gemini) perlu di-rotate oleh pemilik.
- Belum diputuskan (tandai "TBD" di dokumen, jangan dikarang): nama domain final, harga final selain Rp99.000, akun Midtrans production.
