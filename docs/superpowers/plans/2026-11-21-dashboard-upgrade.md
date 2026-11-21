# Dashboard app dan upgrade Premium: rencana implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Beranda app terlihat sekelas landing page (tidak AI slop), dengan ajakan upgrade Premium yang jelas dan checkout satu tombol.

**Architecture:** Hanya frontend Expo (`mobile/`). Logika ringkasan dan pemilihan target upgrade ada di satu modul murni `features/dashboard/summary.ts`. Komponen beranda baru ada di `features/dashboard/`. Alur upgrade dari mana saja lewat hook `useStartUpgrade`. `InvitationCard` dan halaman upgrade didesain ulang di tempatnya.

**Tech Stack:** Expo SDK 54, React Native Web, expo-router, TanStack Query, Reanimated 4, expo-linear-gradient, expo-image. Tanpa library baru.

**Spec:** `docs/superpowers/specs/2026-11-21-dashboard-upgrade-design.md`

## Global Constraints
- Backend, harga, dan aturan paket tidak berubah. Premium per undangan, Rp99.000 (`PREMIUM_PRICE`).
- Tanpa library baru. Gerak memakai Reanimated dengan easing `Easing.out(Easing.exp)` dan stagger 60 ms. Reduce motion dipatuhi.
- Anti-slop:
  - tanpa gradien ungu/biru;
  - tanpa emoji;
  - tanpa grid tiga kartu identik berikon;
  - blur hanya di modal;
  - satu aksen terracotta;
  - huruf display Fraunces (`fontFamily.display`, `displayItalic`).
- Hanya memakai token tema (`colors.*`, `space`, `radius`) supaya tema terang dan gelap tetap benar. Warna literal hanya untuk gradien blok promo gelap, yang memang selalu gelap di kedua tema.
- Teks Bahasa Indonesia.
- Tombol bayar hanya satu, menampilkan loading, dan tidak bisa diklik dua kali.
- Commit hanya di `refactor/v2`, tanpa push.

## Review Focus
1. **Akun tanpa undangan:** beranda menampilkan empty state yang rapi. Promo tetap tampil, dan "Upgrade sekarang" mengarah ke form buat undangan dengan pesan. Dicek di Task 5 (akun uji baru).
2. **Semua undangan sudah Premium atau kedaluwarsa:** promo disembunyikan, "Lihat paket" tetap membuka tabel perbandingan, dan tidak ada tombol Upgrade di kartu. Logikanya ada di `upgradeTargets`; dicek di Task 1 (assert) dan Task 5.
3. **Lebar 390px dan tema gelap:** sel angka 2×2 tidak terpotong, mockup promo disembunyikan di ponsel, dan kontras teks di blok promo gelap terbaca. Dicek di Task 5 (tangkapan 390px terang/gelap).
4. **Klik "Bayar" berulang atau jaringan lambat:** hanya satu pesanan dibuat dan tombolnya disabled saat `isPending`. Dicek di Task 4.
5. **Undangan draf (`event_date` kosong, status draft):** kartu tetap rapi, tanpa bar masa aktif dan tanpa baris RSVP. Dicek di Task 3 dan Task 5.

---

### Task 1: Modul ringkasan dan target upgrade

**Files:**
- Create: `mobile/src/features/dashboard/summary.ts`
- Create: `mobile/src/features/dashboard/summary.check.ts` (self-check `node`-free: dijalankan lewat `npx tsx`, tidak di-bundle)

**Interfaces:**
- Produces:
  - `summarize(items: InvitationSummary[]): { active: number; guests: number; rsvps: number; nearestDays: number | null }`
    - `active` = `status === 'published' && !is_expired`
    - `guests` = Σ `guest_count`
    - `rsvps` = Σ `rsvp_count`
    - `nearestDays` = sisa hari terkecil dari undangan aktif (memakai `daysLeft` yang sudah ada)
  - `upgradeTargets(items: InvitationSummary[]): InvitationSummary[]` = `plan === 'free' && !is_expired`.

- [ ] **Step 1:** Tulis `summary.check.ts` berisi `assert` untuk:
  - 0 item → `{active:0, guests:0, rsvps:0, nearestDays:null}`, target `[]`;
  - campuran (1 published free, 1 draft free, 1 premium) → `active 1`, target 2 (yang draft juga), premium tidak ikut;
  - item kedaluwarsa tidak ikut target.
- [ ] **Step 2:** `npx tsx src/features/dashboard/summary.check.ts` → gagal (modul belum ada). Bila `tsx` tidak tersedia lewat npx, catat sebagai ruling dan verifikasi lewat `tsc` serta tangkapan layar Task 5.
- [ ] **Step 3:** Implementasikan `summary.ts`.
- [ ] **Step 4:** Jalankan lagi → lulus; `npx tsc --noEmit` → 0 error.
- [ ] **Step 5:** Commit `feat(app): ringkasan dashboard dan target upgrade`.

### Task 2: Alur upgrade dari mana saja

**Files:**
- Create: `mobile/src/features/payments/useStartUpgrade.tsx`

**Interfaces:**
- Consumes: `upgradeTargets` (Task 1), `useInvitations`, komponen `Modal`.
- Produces: `useStartUpgrade(): { start: () => void; sheet: React.ReactNode }`. Perilakunya:
  - 0 target dan 0 undangan → toast "Buat undangan dulu, lalu upgrade dari sana." lalu ke `/app/undangan/baru`;
  - 0 target tetapi ada undangan → toast "Semua undanganmu sudah Premium.";
  - 1 target → `/app/undangan/{id}/upgrade`;
  - lebih dari 1 → buka `sheet`: Modal "Pilih undangan yang mau di-upgrade", daftar baris yang bisa dipilih (inisial/thumbnail, judul, tanggal), dan tombol "Lanjut" yang disabled sampai ada pilihan.

- [ ] **Step 1:** Implementasikan `useStartUpgrade`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0 error. Perilaku runtime diverifikasi di Task 5.
- [ ] **Step 3:** Commit `feat(app): alur upgrade dengan pemilih undangan`.

### Task 3: Beranda baru dan kartu undangan

**Files:**
- Create: `mobile/src/features/dashboard/DashboardHero.tsx`, `StatStrip.tsx`, `PremiumPromo.tsx`, `PlanCompare.tsx`
- Modify: `mobile/src/features/invitations/screens/InvitationList.tsx` (`HomeScreen`, `List`)
- Modify: `mobile/src/components/domain/InvitationCard.tsx`

**Interfaces:**
- Consumes: `summarize`, `upgradeTargets` (Task 1); `useStartUpgrade` (Task 2); `FREE_FEATURES`, `PREMIUM_FEATURES`, `PREMIUM_PRICE` (`lib/plans.ts`).
- Produces: prop baru `InvitationCard`:
  - `onUpgrade?: () => void` → tombol "Upgrade" berikon dan berwarna aksen;
  - `rsvpLine?: string`;
  - `expiryProgress?: number` (0–1) → bar tipis.

- [ ] **Step 1: `DashboardHero`.**
  - Overline tanggal hari ini (format Indonesia, kapital).
  - Judul "Halo, " + nama dalam `displayItalic` warna `accent`, lalu titik.
  - Ukuran: `display` variant (36/60).
  - Kalimat status dari `summarize`. Contoh: "2 undangan aktif · 14 tamu sudah konfirmasi". Bila belum ada undangan: "Mulai dari undangan pertamamu."
  - Tombol "Buat undangan" (primary) dan "Lihat paket" (secondary → scroll/buka `PlanCompare`).
- [ ] **Step 2: `StatStrip`.**
  - Empat sel: Undangan aktif, Tamu, Sudah RSVP, Hari aktif tersisa (`nearestDays`, "—" bila null).
  - Garis rambut `colors.border` di antara sel; 4 kolom di desktop, 2×2 di ponsel.
  - Angka Fraunces 40/56 menghitung naik dari 0 (Reanimated `withTiming` 900 ms + `useAnimatedReaction` → state).
  - Label `overline`.
- [ ] **Step 3: `PremiumPromo`.**
  - Tampil bila `upgradeTargets(...).length > 0` atau akun belum punya undangan.
  - `LinearGradient` `#1f2b24 → #3a2a20`; teks gading `#f4ede1`; label "PREMIUM".
  - Judul Fraunces "Undanganmu bisa *tampil utuh*." dengan kata miring berwarna terracotta muda.
  - Harga `formatRupiah(PREMIUM_PRICE)` besar + "sekali bayar per undangan".
  - 3 manfaat dalam satu baris yang dipisah titik tengah (bukan tiga kartu).
  - Tombol "Upgrade sekarang" → `start()`.
  - Desktop (`bp !== 'mobile'`): dua mockup `assets/templates/elegan_1.png` dan `formal_1.png` bertumpuk dan miring ±6°. Saat kursor di atas blok (Pressable `onHoverIn/Out`), mockup bergeser 8 px dan berputar 2° (`withTiming` 600 ms). Ponsel: mockup disembunyikan.
- [ ] **Step 4: `PlanCompare`.**
  - Tautan "Bandingkan Gratis dan Premium" membuka accordion (tinggi beranimasi Reanimated `Layout`/`FadeIn`).
  - Isinya tabel dua kolom dari `FREE_FEATURES` dan `PREMIUM_FEATURES` (cek/minus).
  - `ref` dibuka dari tombol hero "Lihat paket".
- [ ] **Step 5: `InvitationCard`.**
  - Thumbnail potret 3:4. Tanpa foto: blok `accentSoft` dengan inisial Fraunces besar dan garis tipis bingkai dalam.
  - Bar masa aktif 3 px bila `expiryProgress` ada (merah bila `expirySoon`).
  - `rsvpLine` di bawah subtitle.
  - Tombol: primary, secondary, dan "Upgrade" (bila `onUpgrade`), plus menu "…". Item menu "Upgrade ke Premium" dari commit sebelumnya dihapus karena kini ada tombolnya.
  - Hover/tekan: `translateY -2`, border ke `accent` (`withTiming` 250 ms).
  - Tanpa `event_date`/draft: tanpa bar dan tanpa baris RSVP.
- [ ] **Step 6: `HomeScreen`.**
  - Susunan: Hero → StatStrip → PremiumPromo → PlanCompare → "Undangan terbaru" (List limit 3) dengan tautan "Lihat semua".
  - Elemen masuk berurutan `FadeInDown.delay(i*60)`.
  - `List` mengisi `onUpgrade` (via `start` khusus id: langsung `/app/undangan/{id}/upgrade`), `rsvpLine` = `"{rsvp_count} dari {guest_count} tamu sudah RSVP"` bila `guest_count > 0`, dan `expiryProgress` = `daysLeft / (premium ? 365 : 30)`.
- [ ] **Step 7:** `npx tsc --noEmit` → 0 error.
- [ ] **Step 8:** Commit `feat(app): beranda baru dengan ringkasan, promo Premium, dan kartu undangan`.

### Task 4: Halaman checkout satu tombol

**Files:**
- Modify: `mobile/src/features/payments/screens/PaymentScreens.tsx` (`UpgradeScreen`)

- [ ] **Step 1:** Susun ulang `UpgradeScreen`.
  - Desktop dua kolom. Kiri: judul "Upgrade *{judul undangan}*", daftar manfaat Premium (ikon cek), dan catatan "Sekali bayar, tanpa langganan." Kanan: kotak ringkasan sticky (`position: 'sticky'` di web, biasa di native) berisi paket, harga, total, metode Midtrans, dan **satu** `Button` "Bayar Rp99.000" (`loading={order.isPending}`, `disabled={order.isPending}`).
  - Ponsel: satu kolom, dan tombol bayar menempel di bawah layar.
  - `PricingCard` tidak lagi dipakai di layar ini.
- [ ] **Step 2:** Guard dobel klik: `pay` langsung `return` bila `order.isPending`.
- [ ] **Step 3:** `npx tsc --noEmit` → 0 error; `grep -c "Bayar" PaymentScreens.tsx` → hanya satu tombol bayar di `UpgradeScreen`.
- [ ] **Step 4:** Commit `fix(app): checkout Premium satu tombol bayar dengan loading`.

### Task 5: Verifikasi visual dan alur

**Files:**
- Scratchpad (tidak di-commit): skrip puppeteer login + tangkapan layar.

- [ ] **Step 1:** Minta izin pemilik untuk akun uji sementara.
- [ ] **Step 2:** Akun baru (0 undangan): tangkap beranda 390px dan 1440px, terang dan gelap. Klik "Upgrade sekarang" → diarahkan ke form dengan toast.
- [ ] **Step 3:** Buat 1 undangan draf lewat API → "Upgrade sekarang" langsung ke `/upgrade`. Tangkap checkout 390px dan 1440px; pastikan hanya satu tombol bayar.
- [ ] **Step 4:** Buat undangan kedua → "Upgrade sekarang" membuka pemilih; pilih satu → `/upgrade` milik undangan itu.
- [ ] **Step 5:** Nol error console. Hapus akun uji dan file kredensialnya.
- [ ] **Step 6:** Tulis hasil singkat beserta tangkapan layar di `docs/superpowers/qa/2026-11-21-dashboard-upgrade.md`, lalu commit `test: QA dashboard dan upgrade`.

---

## Self-review
- **Cakupan spec:**
  - Beranda: hero → T3S1; angka → T3S2; promo → T3S3; perbandingan → T3S4; kartu → T3S5.
  - Alur upgrade 0/1/banyak → T2.
  - Checkout satu tombol → T4.
  - Gerak dan anti-slop → Global Constraints + T3.
  - Uji → T5.
- **Penyimpangan dari spec (disengaja):** sel "Hadir" diganti "Hari aktif tersisa". Jumlah hadir butuh satu permintaan statistik RSVP per undangan, sedangkan `InvitationSummary` sudah memuat `guest_count` dan `rsvp_count`, jadi beranda cukup satu permintaan.
- **Nama konsisten:** `summarize`, `upgradeTargets`, `useStartUpgrade().start/sheet`, `onUpgrade`, `rsvpLine`, `expiryProgress`.
