# 06 · Spesifikasi API v2

Dokumen terkait: [04-arsitektur.md](04-arsitektur.md), [05-skema-database.md](05-skema-database.md),
[07-pipeline-generate-ai.md](07-pipeline-generate-ai.md), [08-rencana-refactor.md](08-rencana-refactor.md).
Sumber keputusan: [00](00-keputusan-dan-analisis.md).

Base URL: `https://<host-render>` (env klien `EXPO_PUBLIC_API_BASE_URL`). Semua JSON UTF-8 kecuali `GET /u/{slug}` (HTML).
Kontrak ini jadi acuan; implementasi FastAPI menghasilkan `/openapi.json` dan tipe klien di-generate darinya (04 §2.2).

## 1. Konvensi

- **Auth**: `Authorization: Bearer <access_token Supabase>`. Kolom *Auth* di tabel: `JWT` (wajib login),
  `—` (publik), `signature` (webhook).
- **Kepemilikan**: objek milik user lain atau tidak ada → `404 not_found` (bukan 403).
- **ID** uuid; waktu ISO-8601 UTC (`2026-11-18T10:00:00Z`); `event_date` `YYYY-MM-DD`; jam `HH:MM`.
- **Idempotensi**: `POST .../generate` dan `POST /api/payments/orders` aman dipanggil ulang saat sudah ada job/order aktif
  (mengembalikan yang aktif atau `409` seperti tertulis).
- **Pagination** (bila ada): `limit` (default 50, maks 100) dan `offset`/`before` seperti dijelaskan per endpoint.

### 1.1 Format error seragam

Semua error (termasuk 422 dan 500) berbentuk:

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "Kuota generate undangan ini sudah habis (3 dari 3).",
    "details": { "used": 3, "limit": 3 },
    "request_id": "9f1c2e7a"
  }
}
```

`message` berbahasa Indonesia, aman ditampilkan ke pengguna. `details` opsional (objek). `request_id` sama dengan
header `X-Request-ID` dan baris log server. Stack trace tidak pernah dikirim ke klien.

### 1.2 Kode error

| HTTP | `code` | Arti |
|------|--------|------|
| 400 | `bad_request` | Request tidak valid secara umum (mis. body bukan JSON) |
| 401 | `unauthorized` | Token tidak ada/kedaluwarsa/tidak valid |
| 403 | `premium_required` | Fitur khusus premium (foto, galeri, musik, rekening) |
| 403 | `quota_exceeded` | Kuota generate undangan habis (3 gratis / 15 premium) |
| 403 | `guest_limit_reached` | Batas 50 tamu (gratis) |
| 403 | `invitation_limit_reached` | Batas jumlah undangan per akun (TBD, 04 §6.1) |
| 403 | `asset_limit_reached` | Jumlah aset melewati batas (mis. galeri > 10) |
| 403 | `invalid_signature` | Signature webhook Midtrans salah |
| 404 | `not_found` | Tidak ada atau bukan milik user |
| 409 | `slug_taken` | Slug sudah dipakai |
| 409 | `job_in_progress` | Sudah ada job generate aktif untuk undangan ini |
| 409 | `no_previous_version` | Tidak ada versi sebelumnya untuk rollback |
| 409 | `already_premium` | Undangan sudah premium |
| 409 | `nothing_to_generate` | Data wajib belum lengkap (lihat `details.missing`) |
| 409 | `asset_not_uploaded` | `confirm` dipanggil tapi berkas belum ada di Storage |
| 410 | `invitation_expired` | Undangan melewati masa aktif (publik) |
| 413 | `file_too_large` | Ukuran melewati batas (gambar 5 MB, audio 10 MB) |
| 415 | `unsupported_media_type` | Tipe berkas tidak diizinkan |
| 422 | `validation_error` | Field tidak valid; `details.fields` = daftar `{path, message}` |
| 429 | `rate_limited` | Terlalu banyak request (publik); header `Retry-After` |
| 429 | `chat_limit_reached` | Batas 20 pesan chatbot/hari (Q9) |
| 500 | `internal_error` | Kesalahan server tak terduga |
| 502 | `ai_unavailable` | Gemini tidak tersedia (mis. chatbot) |
| 502 | `payment_gateway_error` | Midtrans gagal dihubungi |

Error pada **job** disimpan di job (`error.code`): `ai_unavailable`, `ai_rate_limited`, `invalid_output`,
`sanitize_failed`, `worker_lost`, `internal_error`.

## 2. Model data

### 2.1 `InvitationData` (isi `invitations.data`)

```json
{
  "groom": { "name": "Adriel", "father": "Bpk. A", "mother": "Ibu B" },
  "bride": { "name": "Tiara",  "father": "Bpk. C", "mother": "Ibu D" },
  "religion": "kristen",
  "event_date": "2026-12-12",
  "timezone": "WITA",
  "ceremony":  { "label": "Pemberkatan", "time": "09:00", "location": "Gereja X, Jl. Y, Manado" },
  "reception": { "time": "12:00", "location": "Gedung Z, Manado" },
  "notes": "Mohon hadir tepat waktu.",
  "color_theme": "sage dan champagne",
  "gifts": [ { "bank": "BCA", "account_number": "1234567890", "account_name": "Adriel M" } ]
}
```

| Field | Wajib | Aturan | Plan |
|-------|-------|--------|------|
| `groom.name`, `bride.name` | ya | 1–60 karakter | gratis |
| `groom.father/mother`, `bride.father/mother` | tidak | ≤ 60 | gratis |
| `religion` | tidak | `islam`,`kristen`,`katolik`,`hindu`,`buddha`,`konghucu`,`lainnya` | gratis |
| `event_date` | ya | tanggal valid, tidak lebih dari 3 tahun ke depan; masa lalu diizinkan (TBD) | gratis |
| `timezone` | tidak (default `WIB`) | `WIB`,`WITA`,`WIT` | gratis |
| `ceremony.location` | ya | 1–200 | gratis |
| `ceremony.time`, `ceremony.label` | tidak | `HH:MM` 24 jam / ≤ 40 | gratis |
| `reception` | tidak | `{time?, location}`; `location` ≤ 200 | gratis |
| `notes` | tidak | ≤ 500 | gratis |
| `color_theme` | tidak | ≤ 80 | gratis (Q27) |
| `design_notes` | tidak | ≤ 300 (lebih panjang dipotong) | gratis (Q27); keinginan desain, dipakai AI hanya untuk tampilan |
| `gifts` | tidak | ≤ 5 item; `bank` ≤ 30, `account_number` `^[0-9 .-]{5,30}$`, `account_name` ≤ 60 | **premium** |

Semua teks: dinormalisasi (NFC), karakter kontrol dibuang, `<` dan `>` diganti spasi, dipangkas (lihat 07 §1).
Field premium yang dikirim oleh user gratis → `403 premium_required` (`details.fields`). Foto/musik bukan bagian
`data` — dikelola sebagai aset (§5).

### 2.2 `Invitation` (detail)

```json
{
  "id": "uuid", "slug": "adriel-tiara", "title": "Adriel & Tiara",
  "status": "published", "plan": "free", "preset_id": "default",
  "data": { },
  "public_url": "https://<domain-web>/u/adriel-tiara",
  "published_at": "2026-11-18T10:00:00Z", "expires_at": "2026-12-18T10:00:00Z", "is_expired": false,
  "quota": { "generations_used": 1, "generations_limit": 3, "guests_limit": 50 },
  "has_previous_version": false,
  "current_version": { "id": "uuid", "version_no": 1, "created_at": "...", "warnings": [] },
  "assets": [ { "id": "uuid", "kind": "cover", "url": "https://.../invitations/.../cover/....jpg",
                "content_type": "image/jpeg", "size_bytes": 123456, "position": 0 } ],
  "active_job": null,
  "created_at": "...", "updated_at": "..."
}
```
`guests_limit` = `null` untuk premium (tak terbatas). `current_version` = `null` dan `status = "draft"` sebelum generate
pertama. `assets` hanya yang `status = ready`. `active_job` = `{ "id", "status", "stage" }` bila ada.
Ringkasan untuk daftar (`InvitationSummary`): `id, slug, title, status, plan, public_url, expires_at, is_expired, quota,
event_date, cover_url, rsvp_count, guest_count`.

### 2.3 `Job`

```json
{ "id": "uuid", "invitation_id": "uuid", "status": "running", "stage": "generating", "progress": 55,
  "attempt": 1, "error": null, "result_version_id": null, "created_at": "...", "finished_at": null }
```
`status`: `queued|running|succeeded|failed`. `stage`→`progress` (derivasi server): `queued 0, validating 10,
prompting 20, generating 30–80 (naik per percobaan), sanitizing 85, injecting 92, saving 97, done 100`.
`error` = `{ "code", "message" }` saat `failed`.

## 3. Sistem

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/healthz` | — | `200 {"status":"ok"}`. `?deep=1` ikut query ringan ke DB (dipakai ping uptime, 04 §4). Tanpa data sensitif |
| GET | `/api/me` | JWT | `200 {id, email, full_name, avatar_url, invitations_count}` |
| PATCH | `/api/me` | JWT | Body `{full_name?, avatar_url?}` → `200` profil. 422 bila > 100 karakter |
| GET | `/api/presets` | — | `200 {items:[{id, name, description, preview_url, premium_only}]}` (hanya `is_active`, urut `sort_order`; `brief` tidak dikirim) |
| GET | `/api/chat/usage` | JWT | `200 {limit: 20, remaining: 13}` |

## 4. Undangan

### `GET /api/invitations/slug-available?slug=adriel-tiara` — JWT
`200 {"available": true}`; `422` bila format slug salah (3–40, `a-z0-9` dan `-`, tanpa `-` di tepi/ganda).

### `POST /api/invitations` — JWT — buat draft
Request:
```json
{ "slug": "adriel-tiara", "preset_id": "default", "data": { } }
```
`data` boleh parsial saat draft (hanya divalidasi bentuk; kelengkapan diperiksa saat generate). Preset
`premium_only` pada undangan gratis → `403 premium_required`.
`201` → `Invitation`. Error: `409 slug_taken`, `422 validation_error`, `403 invitation_limit_reached`,
`403 premium_required`. `title` diturunkan server dari `"{groom.name} & {bride.name}"`. **Slug tidak dapat diubah** setelah ini.

### `GET /api/invitations` — JWT
`200 {"items": [InvitationSummary]}` urut terbaru (milik user saja).

### `GET /api/invitations/{id}` — JWT
`200 Invitation`. `404 not_found`.

### `PATCH /api/invitations/{id}` — JWT — ubah data/preset
Request: `{ "data"?: InvitationData, "preset_id"?: "bebas" }` — `data` mengganti seluruh isi (kirim objek lengkap).
Tidak mengubah slug/plan/kuota. `200 Invitation`. Error: `422`, `403 premium_required`, `404`.
Mengubah data **tidak** mengubah halaman publik sampai generate ulang (kecuali `gifts` dan aset, yang dibaca saat penyajian).

### `DELETE /api/invitations/{id}` — JWT
`204`. Menghapus undangan, semua versi/tamu/RSVP/aset (baris dan objek Storage). Tidak dapat dibatalkan. Memperbaiki
B2/B3 (kepemilikan diperiksa di server; endpoint bulk-delete lama dihapus, klien memanggil per undangan).

### `POST /api/invitations/{id}/generate` — JWT — mulai job
Body kosong (opsional `{}`). Alur server: cek pemilik → cek kelengkapan data (`409 nothing_to_generate` + `details.missing`)
→ cek kuota (`403 quota_exceeded`) → cek fitur premium pada data/aset/preset (`403 premium_required`) → pastikan
tidak ada job aktif (`409 job_in_progress`, `details.job_id`) → buat job (snapshot data+preset+URL aset).
`202`:
```json
{ "job_id": "uuid", "status": "queued" }
```
Memperbaiki B1 (kuota/premium dicek server) dan B2 (hanya undangan milik user).

### `GET /api/jobs/{job_id}` — JWT — status job
`200 Job`. Klien polling tiap 2–3 detik sampai `succeeded`/`failed`. Setiap panggilan menjalankan
`recover_stale_jobs()` (04 §4). `404` bila bukan milik user. Setelah `succeeded`, ambil `GET /api/invitations/{id}`.

### `POST /api/invitations/{id}/rollback` — JWT
Menukar versi aktif dengan versi sebelumnya (Q16). `200 Invitation`. `409 no_previous_version`. Tidak memakai kuota.
Rollback kedua kali = maju lagi.

## 5. Aset (foto, galeri, musik)

**Pilihan: signed upload URL dari backend** (bukan upload langsung ke Storage dengan RLS, bukan multipart via FastAPI).
Alasan: (1) premium, jumlah, tipe, dan ukuran dicek server **sebelum** satu byte pun tersimpan; (2) berkas tidak
melewati Render free (RAM 512 MB, timeout, cold start); (3) tak perlu kebijakan tulis di `storage.objects`, jadi klien
tidak bisa menulis sembarang objek; (4) alur sama untuk web dan mobile (`uploadToSignedUrl` supabase-js). Harga: tiga
langkah (minta URL → upload → konfirmasi).

### `POST /api/invitations/{id}/assets/upload-url` — JWT
```json
{ "kind": "gallery", "content_type": "image/jpeg", "size_bytes": 482311, "position": 0 }
```
Aturan: premium saja (`403 premium_required`); `kind` ∈ `cover|groom|bride|gallery|music`; gambar:
`image/jpeg|png|webp` ≤ `MAX_IMAGE_BYTES` (5 MB); musik: `audio/mpeg|audio/mp4` ≤ `MAX_AUDIO_BYTES` (10 MB)
(`415`/`413`); galeri maks 10 yang `ready`+`pending` (`403 asset_limit_reached`). Untuk jenis tunggal yang sudah ada,
aset lama diganti saat `confirm` berhasil.
`201`:
```json
{ "asset_id": "uuid",
  "upload": { "bucket": "invitation-assets",
              "path": "invitations/<invitation_id>/gallery/<asset_id>.jpg",
              "token": "<signed-upload-token>", "expires_in": 7200 } }
```
Klien: `supabase.storage.from(bucket).uploadToSignedUrl(path, token, fileBody, { contentType })`.

### `POST /api/invitations/{id}/assets/{asset_id}/confirm` — JWT
Server memeriksa objek ada (HEAD ke URL publik) dan ukurannya sesuai batas, lalu `status = ready` (dan menghapus aset
lama jenis tunggal). `200 {asset: {...}}`. Berkas tak ada → `409 asset_not_uploaded`; terlalu besar →
`413` dan objek dihapus.

### `DELETE /api/invitations/{id}/assets/{asset_id}` — JWT
`204`; baris dan objek Storage dihapus. Efek di halaman publik berlaku pada penyajian berikutnya (musik/gift dibaca
saat penyajian; foto yang sudah tertanam di HTML versi lama akan rusak sampai generate ulang — UI menyarankan generate ulang).

## 6. Tamu (pemilik) — Q20

Model `Guest`: `{ "id", "name", "phone": null, "link": "https://<web>/u/<slug>?to=Pak+Joko", "rsvp": "hadir"|"tidak_hadir"|null, "created_at" }`.
`link` dibentuk server; `rsvp` = status terbaru berdasarkan nama.

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/invitations/{id}/guests` | JWT | `200 {items:[Guest], total, limit}` (`limit` = 50 / `null`). Query `limit`,`offset` |
| POST | `/api/invitations/{id}/guests` | JWT | Body `{name, phone?}` → `201 Guest`. Nama sudah ada → `422 validation_error` (`fields: name`). `403 guest_limit_reached` |
| POST | `/api/invitations/{id}/guests/bulk` | JWT | Impor (klien mengurai teks/CSV lalu mengirim JSON), lihat di bawah |
| PATCH | `/api/guests/{guest_id}` | JWT | Body `{name?, phone?}` → `200 Guest` |
| DELETE | `/api/guests/{guest_id}` | JWT | `204`. Kepemilikan lewat undangan induknya (memperbaiki B3) |

`POST .../guests/bulk`:
```json
{ "guests": [ { "name": "Pak Joko", "phone": "+628123456789" }, { "name": "Bu Sari" } ] }
```
Maks 500 baris. Nama duplikat (dalam berkas atau sudah ada, tanpa membedakan huruf besar/kecil) di-*skip*. **Semua atau
tidak sama sekali** untuk batas: bila jumlah akhir > 50 (gratis) → `403 guest_limit_reached`
(`details: {limit, current, requested}`) dan tidak ada yang tersimpan.
`201 {"created": 12, "skipped": 3, "rejected": [{"index": 5, "reason": "nama kosong"}], "items": [Guest]}`.

Hapus tamu tidak menghapus RSVP/ucapannya (`rsvps.guest_id` jadi null).

## 7. RSVP dan ucapan

### Pemilik (dashboard)
| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/invitations/{id}/rsvps` | JWT | `200 {stats, items, total}`; query `limit`,`offset` |
| PATCH | `/api/rsvps/{rsvp_id}` | JWT | Body `{is_hidden: true}` → `200`; sembunyikan ucapan dari daftar publik |

```json
{ "stats": { "guests_total": 40, "responded": 22, "attending": 18, "not_attending": 4, "no_response": 18 },
  "items": [ { "id": "uuid", "guest_id": "uuid|null", "name": "Pak Joko", "attendance": "hadir",
               "message": "Selamat!", "is_hidden": false, "created_at": "..." } ],
  "total": 31 }
```
`stats` dihitung dari status **terbaru per nama**; `no_response` = tamu terdaftar tanpa RSVP;
`responded` mencakup juga RSVP dari nama yang belum terdaftar.

### Publik (dipanggil script slot di halaman undangan) — rate limit
Tanpa auth. Respons berisi header `Access-Control-Allow-Origin: *` (halaman undangan berorigin buram karena
`sandbox`, 04 §5). Tanpa kredensial/cookie.

| Method | Path | Keterangan |
|--------|------|------------|
| POST | `/api/public/invitations/{slug}/rsvps` | Kirim RSVP + ucapan |
| GET | `/api/public/invitations/{slug}/rsvps` | Daftar ucapan |

`POST` request: `{ "name": "Pak Joko", "attendance": "hadir", "message": "Selamat!" }`
(`name` 1–100; `attendance` `hadir|tidak_hadir`; `message` ≤ 500, opsional). Nama dicocokkan ke `guests` (tanpa
membedakan huruf) → `guest_id`. `201 {"id": "uuid"}`. Error: `404` (slug tak ada/draft), `410 invitation_expired`,
`422`, `429 rate_limited` (5 kiriman/menit/IP/slug). Hanya-tambah (05 §3.7).
`GET` query `limit` (≤ 50, default 20), `before` (ISO, untuk halaman berikut):
`200 {"items":[{"name","attendance","message","created_at"}], "next_before": "..."|null}` — hanya yang punya `message`,
`is_hidden = false`, terbaru dulu. 60 request/menit/IP. Tidak mengembalikan id/telepon.

## 8. Penyajian undangan

### `GET /u/{slug}` — publik
`200 text/html` — HTML versi aktif dengan slot terisi (07 §5–6). Query `?to=Nama+Tamu` diproses di sisi klien oleh
script slot (`guest-name`, nama RSVP); server tidak merender nama dari query (mencegah injeksi).
Header respons (rincian di 07 §6): `Content-Security-Policy` (nonce + sandbox), `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`, `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`.
Error berupa halaman HTML sederhana (bukan JSON): `404` (tidak ada/draft), `410` (`invitation_expired`),
`500`. Diakses lewat rewrite Vercel `/u/:slug` (04 §5); path yang sama berlaku langsung di host Render untuk uji.

## 9. Pembayaran (Q7, Q17)

### `POST /api/payments/orders` — JWT — buat order Midtrans
```json
{ "invitation_id": "uuid" }
```
Server: cek pemilik → `409 already_premium` bila sudah premium → bila ada order `pending` yang belum kedaluwarsa
(< 23 jam), kembalikan yang itu → jika tidak, buat order (`amount = PREMIUM_PRICE_IDR`, B7) dan `Snap.create_transaction`
dengan `order_id = carta-<uuid>`, `item_details` (satu item "Undangan Premium CartaAI"), `customer_details`
(email user), `callbacks.finish = {WEB_BASE_URL}/app/pembayaran/{order_id}`, `expiry` 24 jam. `notification_url`
**tidak** dikirim per transaksi; memakai URL di dashboard Midtrans.
`201` (atau `200` bila memakai ulang):
```json
{ "order_id": "uuid", "midtrans_order_id": "carta-...", "amount": 99000, "status": "pending",
  "redirect_url": "https://app.sandbox.midtrans.com/snap/v4/redirect/...", "snap_token": "..." }
```
Pembayaran dibuka lewat `redirect_url` (tab browser di web; `expo-web-browser`/WebView di mobile) — **[Keputusan]**
agar tidak perlu Snap.js/client key. Error: `404`, `409 already_premium`, `502 payment_gateway_error`.

### `GET /api/payments/orders/{order_id}` — JWT — status order
`200 {order_id, invitation_id, status, amount, paid_at, invitation_plan}`. Bila `status = pending`, server menyinkronkan
dengan Midtrans Status API (`sync_order`) agar tahan terhadap notifikasi yang terlewat (Render tidur) — memakai
logika status yang sama dengan webhook. Klien polling tiap 3 detik setelah kembali dari Midtrans.

### `POST /api/payments/webhook` — signature — **satu-satunya** endpoint notifikasi (memperbaiki B8)
Dikonfigurasi sebagai Payment Notification URL di dashboard Midtrans. Tidak ada `GET`, `/`, `/midtrans-notification`,
`/midtrans/webhook` (dihapus; Q8).

Body (Midtrans, field penting): `order_id, status_code, gross_amount, signature_key, transaction_status,
fraud_status?, payment_type?, transaction_id?` (field lain diabaikan/disimpan di `payment_events`).

Langkah:
1. Simpan payload ke `payment_events` (`source = webhook`).
2. **Verifikasi signature**: `SHA512(order_id + status_code + gross_amount + SERVER_KEY)` dibandingkan konstan-waktu
   (`hmac.compare_digest`). Salah → `403 invalid_signature` (tidak memproses).
3. Cari order berdasarkan `midtrans_order_id`; tidak ada → `200 {"status":"ignored"}` (mis. uji dari dashboard; dicatat).
4. **Cocokkan nominal**: `Decimal(gross_amount) == order.amount`; beda → `200 {"status":"ignored"}` + log peringatan,
   tidak mengaktifkan.
5. Terapkan aturan status (di bawah) secara **idempoten**.
6. Balas `200 {"status":"ok"}`. Kegagalan DB/tak terduga → `500` agar Midtrans mengirim ulang.

**Aturan status** (perbaikan B6 — `fraud_status` tidak lagi disyaratkan `accept`):

| `transaction_status` | `fraud_status` | Hasil pada order |
|----------------------|----------------|------------------|
| `settlement` | apa pun/kosong | → `paid` |
| `capture` | kosong atau `accept` | → `paid` |
| `capture` | `challenge` | tetap `pending` (menunggu tinjauan merchant); **tidak** diaktifkan |
| `capture` | `deny` | → `failed` |
| `pending`, `authorize` | — | tetap `pending` (perbarui `payment_type`, `transaction_status`) |
| `deny`, `cancel`, `failure` | — | → `failed` (hanya dari `pending`) |
| `expire` | — | → `expired` (hanya dari `pending`) |
| `refund`, `chargeback` | — | → `refunded` bila `paid`, dan undangan kembali `free` (RPC `refund_order`, atomik; `expires_at` dibatasi ke masa aktif Gratis) |
| `partial_refund` | — | tidak mengubah apa pun: order tetap `paid`, Premium tetap aktif; dicatat di log dan `payment_events` untuk ditinjau manual |

Idempoten: transisi hanya dari `pending` (kecuali `paid → refunded`); `paid` memanggil RPC `mark_order_paid`, yang menerima order `pending` **maupun `expired`**
(settlement terlambat: order internal ditutup 23 jam, transaksi Midtrans berlaku 24 jam; pembayaran valid tidak boleh hilang)
(satu transaksi: order `paid` + `invitations.plan = 'premium'`, `expires_at = now + 365 hari`; mengembalikan `false`
bila sudah diproses). Event berulang atau tidak berurutan (mis. `pending` setelah `settlement`) tidak mengubah apa pun.

## 10. Chatbot (Q9)

### `POST /api/chat` — JWT
```json
{ "message": "Apa bedanya paket gratis dan premium?",
  "history": [ { "role": "user", "content": "Halo" }, { "role": "bot", "content": "Halo! ..." } ] }
```
`message` 1–1000 karakter; `history` maks 10 item terakhir (dipotong server), `role` `user|bot`.
Server memakai fungsi SQL `consume_chat_quota(user, 20)` **sebelum** memanggil Gemini (atomik); jika Gemini gagal,
kuota dikembalikan (`refund_chat_quota`).
`200 {"reply": "...", "remaining": 12}`. Error: `401`, `429 chat_limit_reached` (`details: {limit: 20}`; reset 00:00 WIB),
`502 ai_unavailable`, `422`. Memperbaiki B4. Teks prompt sistem chatbot ditulis ulang agar sesuai Q17
(prompt lama memuat fakta usang: galeri 20 foto, "tema tak terbatas") di `services/ai/prompt.py`.

## 11. Rate limit, CORS, dan header

- **Rate limit** (memori proses; cukup untuk satu instance, hilang saat restart; TBD bila multi-instance):
  `POST /api/public/.../rsvps` 5/menit/IP/slug; `GET /api/public/...` 60/menit/IP. IP = elemen pertama
  `X-Forwarded-For` (Render). Lainnya dibatasi lewat aturan bisnis (satu job aktif, kuota chat).
- **CORS**: `CORS_ALLOWED_ORIGINS` untuk `/api/*` (tanpa kredensial/cookie); `/api/public/*` menambah
  `Access-Control-Allow-Origin: *` dan mengizinkan `POST`/`OPTIONS` dengan `Content-Type`.
- Semua respons JSON menyertakan `X-Request-ID`.

## 12. Endpoint v1 yang dihapus

| Lama | Nasib |
|------|-------|
| `POST /api/auth/register`, `POST /api/auth/login` | Dihapus; klien memakai Supabase Auth |
| `POST /api/invitations/generate`, `/generate-free` | Diganti `POST /api/invitations/{id}/generate` (satu jalur, plan dari server) |
| `POST /api/invitations/{slug}/finalize` | Dihapus (tidak berfungsi) |
| `GET /api/invitations/` (join konten) | Diganti `GET /api/invitations` |
| `DELETE /api/invitations/` (bulk) | Diganti `DELETE /api/invitations/{id}` |
| `GET /api/invitations/{slug}` (HTML mentah) | Diganti `GET /u/{slug}` |
| `GET/POST /api/invitations/{slug}/rsvp` | Diganti `/api/public/invitations/{slug}/rsvps` |
| `GET /api/invitations/all-rsvps` | Diganti `GET /api/invitations/{id}/rsvps` per undangan |
| `GET /api/invitations/guests/{slug}`, `POST .../guests/bulk`, `DELETE /guests/{id}` | Diganti §6 |
| `POST /api/payments/create-transaction` | Diganti `POST /api/payments/orders` |
| `POST /api/payments/midtrans-notification`, `POST /`, `POST /midtrans-notification`, `GET/POST /midtrans/webhook` | Diganti satu `POST /api/payments/webhook` |
| `POST /api/chatbot/chat` | Diganti `POST /api/chat` (login + batas harian) |
| `GET /` (banner versi) | Diganti `GET /healthz` |
