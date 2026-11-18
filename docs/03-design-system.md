# 03 · Design System CartaAI v2

Disusun 2026-11-18. Mengikuti arah visual **Q10** di [`00-keputusan-dan-analisis.md`](00-keputusan-dan-analisis.md)
(editorial-romantis, satu aksen, serif + sans, tanpa gradien ungu, ada dark mode). Metode: token tiga lapis
(primitif → semantik → komponen) sesuai skill `design-system`, brand mengikuti skill `brand`.
Pratinjau visual: [`design-preview.html`](design-preview.html) (buka di browser, ada tombol light/dark).

Ruang lingkup: **UI aplikasi CartaAI** (web + iOS + Android, satu codebase Expo Router). Tampilan *undangan
hasil AI* (HTML milik pengantin) di luar dokumen ini; AI menentukan gayanya sendiri dari preset template (Q18).

## Keputusan final

| Hal | Pilihan | Alasan singkat |
|-----|---------|----------------|
| Aksen | **Terracotta** (`#A8482A`, versi gelap `#E08A66`) | Lolos WCAG AA sebagai teks dan latar tombol (5,37:1 dan 5,70:1). Emas pudar di ivory hanya 2,22:1: tidak aman untuk teks/tombol dan terlihat "pucat" di layar. Terracotta terasa hangat, dekat dengan nuansa kertas dan tanah liat, tidak klise "wedding gold". |
| Display | **Fraunces** (400, 600, 400 italic) | Serif bergaya "soft" dengan karakter hangat, tampil bagus besar; ada di `@expo-google-fonts/fraunces`. Cormorant terlalu tipis di ukuran kecil dan buruk di layar mobile resolusi rendah. |
| Teks | **Inter** (400, 500, 600) | Sans netral, sangat terbaca di ukuran kecil, dukungan huruf Latin lengkap; `@expo-google-fonts/inter`. Geist juga tersedia, tetapi Inter lebih teruji di ukuran kecil dan di Android. |
| Tinta | Hijau-hitam `#1F2A24` | Lebih lembut dari hitam murni, selaras dengan kertas hangat; kontras 13,77:1 di ivory. |
| Aksen kedua | **Tidak ada.** Hijau tua `#2F4A3C` hanya dipakai sebagai warna netral gelap (header gelap, footer) | Aturan "satu aksen" tetap utuh. |

Font tidak perlu CDN: diimpor lewat `@expo-google-fonts/fraunces` dan `@expo-google-fonts/inter` (keduanya ada
di npm, v0.4.x) bersama `expo-font` yang sudah terpasang. Paket ini **belum terpasang**; pasang di fase F2.
Nama export `Fraunces_400Regular`, `Fraunces_600SemiBold`, `Fraunces_400Regular_Italic` sudah dicek di paket npm; nama Inter (`Inter_400Regular`, dst.) mengikuti konvensi yang sama, cek ulang saat install.

---

## 1. Prinsip desain dan suara brand

### 1.1 Prinsip
1. **Seperti kertas undangan, bukan dashboard SaaS.** Ruang kosong lega, tipografi yang bekerja, ornamen sedikit.
2. **Satu hal menonjol per layar.** Satu tombol primer, satu judul serif besar. Sisanya tenang.
3. **Hangat, jelas, tidak berlebihan.** Calon pengantin sedang sibuk dan gugup; UI harus menenangkan.
4. **Hasil adalah bintangnya.** Pratinjau undangan selalu lebih besar daripada kontrolnya.
5. **Aksesibel sejak awal.** Kontras AA, target sentuh ≥ 44, fokus terlihat, hormati reduce-motion.
6. **Token dulu, nilai mentah dilarang.** Tidak ada hex/angka spasi di komponen; semua dari `theme`.

### 1.2 Suara brand (Bahasa Indonesia)
Ramah seperti kakak yang membantu menyiapkan acara. Kalimat pendek, kata kerja aktif, sapaan **"kamu"**
(bukan "Anda" kaku, bukan "lo/gue"). Tidak lebay, tidak menggurui, tidak menjanjikan berlebihan.

| Konteks | Jangan | Pakai |
|---------|--------|-------|
| Hero | "🚀 Revolusi Undangan Digital Berbasis AI Tercanggih!" | "Undangan pernikahanmu, siap dibagikan dalam hitungan menit." |
| Tombol generate | "✨ Generate Sekarang ✨" | "Buat undangan" |
| Loading | "AI sedang bekerja keras menciptakan keajaiban..." | "Menyusun undanganmu. Biasanya 20-40 detik." |
| Sukses | "🎉🎉 Yeay! Undangan kamu berhasil dibuat!!" | "Undanganmu sudah jadi." |
| Error | "Oops! Terjadi kesalahan sistem." | "Undangan belum bisa dibuat. Periksa koneksi lalu coba lagi." |
| Kosong | "Belum ada data 😢" | "Belum ada undangan. Mulai dari data mempelai." |
| Upgrade | "Dapatkan FITUR PREMIUM EKSKLUSIF sekarang juga!" | "Tambah foto, galeri, dan musik. Rp99.000, sekali bayar untuk undangan ini." |
| Konfirmasi hapus | "Apakah Anda yakin ingin menghapus?" | "Hapus undangan ini? Linknya akan berhenti aktif." |

Aturan copy:
- Judul kalimat biasa (huruf kapital hanya di awal), bukan Title Case.
- Tombol = kata kerja + objek ("Simpan perubahan", "Kirim ke WhatsApp"), maksimal 3 kata.
- Pesan error: apa yang terjadi + apa yang bisa dilakukan. Jangan menyalahkan pengguna, jangan tampilkan kode/stack.
- Angka dan harga: `Rp99.000` (titik ribuan, tanpa spasi). Tanggal: `12 Desember 2026`.
- Nama paket: **Gratis** dan **Premium**. Jangan "Pro", "Ultimate".
- Emoji: tidak dipakai di UI. Boleh di pesan WhatsApp template yang bisa diedit pengguna (itu pesan mereka).

### 1.3 Pola "AI slop" yang dilarang
Review PR desain wajib menolak yang berikut:

| Dilarang | Kenapa | Gantinya |
|----------|--------|----------|
| Gradien ungu/indigo (`#667eea→#764ba2`, `#6366f1→#a855f7`) | Ciri khas output AI generik | Warna solid dari token |
| Gradien apa pun sebagai latar tombol/kartu/hero | Terkesan murahan | Solid; maksimal 1 gradien lembut untuk fade gambar (scrim) |
| Glassmorphism (blur + transparan putih) | Kontras buruk, kurang bagus di Android | Permukaan solid `surface` |
| Kartu dengan bayangan tebal/berlapis | Berat dan generik | Border 1px `border`, bayangan hanya untuk modal/popover |
| Ikon di setiap judul/bagian, ikon dalam lingkaran berwarna | Dekorasi tanpa makna | Ikon hanya bila menambah arti (navigasi, aksi, status) |
| Emoji sebagai ikon/dekorasi | Tidak konsisten antar platform | Ikon set tunggal (bagian 8) |
| Tiga kartu fitur sama besar dengan ikon bulat di atasnya | Template landing standar | Daftar editorial bernomor, atau gambar + teks selang-seling |
| Badge/"pill" bercahaya, teks gradien, efek neon | Dekorasi | Badge polos (bagian 5.5) |
| Angka statistik palsu ("10.000+ pengguna") | Tidak jujur | Hapus atau pakai data nyata |
| Hover `scale(1.05)` + lompat di mana-mana | Gimmick | Perubahan warna/underline 150 ms |
| Banyak font/ukuran/warna acak | Tidak konsisten | Skala tipografi dan token saja |

---

## 2. Token

Tiga lapis: **primitif** (nilai mentah, hanya dipakai oleh semantik) → **semantik** (peran, dipakai oleh
komponen, punya varian light/dark) → **komponen** (opsional, di dalam file komponen).
Komponen **hanya** boleh membaca token semantik.

### 2.1 Warna primitif

| Token | Hex | Catatan |
|-------|-----|---------|
| `ivory.50` | `#FFFDF8` | Permukaan kartu (light) |
| `ivory.100` | `#FAF6EE` | Latar halaman (light) |
| `ivory.200` | `#F2ECE0` | Latar cekung/sunken (light) |
| `ivory.300` | `#E4DCCB` | Garis halus (light) |
| `sand.500` | `#8A826F` | Garis input (light) |
| `ink.900` | `#1F2A24` | Teks utama |
| `ink.600` | `#5B645D` | Teks sekunder |
| `ink.500` | `#6B726C` | Teks tersier/placeholder |
| `forest.700` | `#2F4A3C` | Netral gelap (header/footer gelap) |
| `terracotta.100` | `#F6E3D9` | Latar aksen lembut (light) |
| `terracotta.300` | `#E9A585` | Teks aksen lembut (dark) |
| `terracotta.400` | `#E08A66` | Aksen (dark) |
| `terracotta.600` | `#A8482A` | Aksen (light) |
| `terracotta.700` | `#8F3B21` | Aksen hover/pressed (light) |
| `night.900` | `#141A16` | Latar halaman (dark) |
| `night.800` | `#1C241F` | Permukaan kartu (dark) |
| `night.700` | `#252F29` | Permukaan terangkat (dark) |
| `night.600` | `#34403A` | Garis halus (dark) |
| `night.400` | `#6B7870` | Garis input (dark) |
| `paper.100` | `#F3EEE2` | Teks utama (dark) |
| `paper.400` | `#A9B1A9` | Teks sekunder (dark) |
| `paper.500` | `#8D968E` | Teks tersier (dark) |
| `clay.900` | `#3A2A22` | Latar aksen lembut (dark) |
| `green.600` / `green.300` | `#3F6B4A` / `#7DB68A` | Sukses light/dark |
| `amber.700` / `amber.300` | `#8A5C0E` / `#D9A441` | Peringatan light/dark |
| `red.600` / `red.300` | `#B3382C` / `#E5877C` | Bahaya light/dark |
| `blue.700` / `blue.300` | `#35607A` / `#7FB0CC` | Info light/dark |

### 2.2 Warna semantik (light & dark)

| Token semantik | Light | Dark | Dipakai untuk |
|----------------|-------|------|---------------|
| `bg` | `#FAF6EE` | `#141A16` | Latar halaman |
| `surface` | `#FFFDF8` | `#1C241F` | Kartu, input, sheet |
| `surfaceRaised` | `#FFFDF8` | `#252F29` | Modal, popover, menu |
| `surfaceSunken` | `#F2ECE0` | `#101511` | Area cekung, skeleton, kolom tab |
| `text` | `#1F2A24` | `#F3EEE2` | Teks utama |
| `textMuted` | `#5B645D` | `#A9B1A9` | Teks sekunder, label |
| `textSubtle` | `#6B726C` | `#8D968E` | Placeholder, caption (≥14px) |
| `border` | `#E4DCCB` | `#34403A` | Garis dekoratif (kartu, pemisah) |
| `borderStrong` | `#8A826F` | `#6B7870` | Garis kontrol (input, checkbox); wajib ≥3:1 |
| `accent` | `#A8482A` | `#E08A66` | Tombol primer, link, fokus |
| `accentHover` | `#8F3B21` | `#E9A585` | Hover/pressed aksen |
| `onAccent` | `#FFFDF8` | `#1A0F0A` | Teks/ikon di atas `accent` |
| `accentSoft` | `#F6E3D9` | `#3A2A22` | Latar badge/chip terpilih |
| `onAccentSoft` | `#8F3B21` | `#E9A585` | Teks di atas `accentSoft` |
| `inverse` | `#2F4A3C` | `#F3EEE2` | Footer/banner gelap (light) |
| `onInverse` | `#FAF6EE` | `#1F2A24` | Teks di atas `inverse` |
| `success` / `warning` / `danger` / `info` | `#3F6B4A` / `#8A5C0E` / `#B3382C` / `#35607A` | `#7DB68A` / `#D9A441` / `#E5877C` / `#7FB0CC` | Teks & ikon status |
| `successSoft` / `warningSoft` / `dangerSoft` / `infoSoft` | `#E6F0E6` / `#F7ECD3` / `#F8E1DD` / `#DFEAF1` | `#1F3326` / `#3A2F14` / `#3D1F1B` / `#1A2C38` | Latar badge/alert status |
| `scrim` | `rgba(31,42,36,0.55)` | `rgba(0,0,0,0.65)` | Lapisan di belakang modal |
| `focusRing` | `#A8482A` | `#E08A66` | Cincin fokus (2px + offset 2px) |

Disabled: pakai `textSubtle` untuk teks dan `surfaceSunken` untuk latar; jangan satu pun diandalkan sebagai satu-satunya penanda (tambahkan `aria-disabled`/`accessibilityState`).

### 2.3 Rasio kontras (dihitung, rumus WCAG 2.x)

Target: teks normal ≥ 4,5:1, teks besar (≥24px, atau ≥18,66px tebal) ≥ 3:1, komponen non-teks ≥ 3:1.

| Pasangan | Light | Dark |
|----------|-------|------|
| `text` / `bg` | 13,77 | 15,25 |
| `text` / `surface` | 14,60 | 13,73 |
| `textMuted` / `bg` | 5,69 | 8,03 |
| `textMuted` / `surface` | 6,03 | 7,23 |
| `textSubtle` / `bg` | 4,59 | 5,79 |
| `textSubtle` / `surface` | 4,86 | n/a (≥ 5,79 di `bg`) |
| `onAccent` / `accent` (tombol primer) | 5,70 | 7,16 |
| `onAccent` / `accentHover` | 7,34 | n/a |
| `accent` / `bg` (link, teks aksen) | 5,37 | 6,73 |
| `accent` / `surface` | n/a (≥ 5,37) | 6,05 |
| `onAccentSoft` / `accentSoft` (badge) | 6,01 | 6,64 |
| `inverse`/`onInverse` | 9,00 | 13,77 (setara `text`/`surface`) |
| `success` / `bg` | 5,71 | 7,51 |
| `warning` / `bg` | 5,38 | 7,85 |
| `danger` / `bg` | 5,54 | 6,80 |
| `info` / `bg` | 6,27 | 7,56 |
| `borderStrong` / `surface` (input) | 3,75 | 3,44 |
| `borderStrong` / `bg` | 3,54 | 3,82 |
| `border` / `bg` (dekoratif saja) | 2,04 | 2,33 |

Catatan: `border` sengaja <3:1 dan **hanya** untuk pemisah dekoratif; batas kontrol interaktif memakai `borderStrong`.
Aksen tidak dipakai sebagai teks di atas `accentSoft`/`surfaceSunken` kecuali `onAccentSoft` (aksen asli di `surfaceSunken` light = 4,92, masih lolos tetapi tipis). Rasio status di atas `*Soft` belum diukur: ukur saat F2 (lihat bagian 13).
Untuk perbandingan: indigo lama `#6366f1` di atas putih hanya 4,47:1 (gagal AA untuk teks normal).

### 2.4 Tipografi

Keluarga: `display` = Fraunces, `sans` = Inter. Di React Native **jangan memakai `fontWeight`** untuk font kustom;
pilih `fontFamily` per bobot.

| Peran | `fontFamily` |
|-------|--------------|
| `display` | `Fraunces_400Regular`, `Fraunces_600SemiBold` |
| `displayItalic` | `Fraunces_400Regular_Italic` (dipakai hemat: satu frasa aksen di judul) |
| `sans` / `sansMedium` / `sansSemibold` | `Inter_400Regular` / `Inter_500Medium` / `Inter_600SemiBold` |

Skala (px / line-height; kolom kiri mobile <768, kanan desktop ≥1024; tablet memakai mobile hingga 1023 kecuali `display`/`h1` yang memakai nilai tengah):

| Token | Font | Mobile | Desktop | Pemakaian |
|-------|------|--------|---------|-----------|
| `display` | Fraunces 600 | 36 / 42 | 60 / 66 | Hero landing saja |
| `h1` | Fraunces 600 | 30 / 36 | 44 / 50 | Judul halaman |
| `h2` | Fraunces 600 | 24 / 30 | 32 / 40 | Judul bagian |
| `h3` | Inter 600 | 18 / 26 | 20 / 28 | Judul kartu/sub-bagian |
| `bodyLg` | Inter 400 | 17 / 26 | 18 / 28 | Paragraf pembuka |
| `body` | Inter 400 | 16 / 24 | 16 / 24 | Teks isi, input (16 mencegah zoom iOS) |
| `bodySm` | Inter 400 | 14 / 20 | 14 / 20 | Teks bantu, baris tabel |
| `label` | Inter 500 | 14 / 20 | 14 / 20 | Label form, tombol sedang |
| `caption` | Inter 500 | 12 / 16 | 12 / 16 | Metadata; jangan untuk teks penting |
| `overline` | Inter 600 | 12 / 16, huruf kapital, letter-spacing +0,08em | sama | Penanda bagian (hemat) |

Aturan: line-height isi 1,5-1,6; judul 1,15-1,25; panjang baris maksimal ±68 karakter (`maxWidth.prose`).
Letter-spacing judul serif −0,01em di ukuran ≥30. Dukung Dynamic Type/skala font sistem
(`allowFontScaling` default tetap aktif; uji hingga 130%); jangan mengunci tinggi elemen teks.

### 2.5 Spasi (skala 4)

`space`: `0:0, 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64, 20:80, 24:96`.
Pemakaian: gap antar elemen satu kelompok 8-12; padding kartu 16 (mobile) / 24 (desktop); jarak antar
bagian halaman 48 (mobile) / 96 (desktop); gutter halaman 16 (mobile), 24 (tablet), 32 (desktop).

### 2.6 Radius dan border

| Token | Nilai | Pemakaian |
|-------|-------|-----------|
| `radius.sm` | 6 | Chip kecil, tag |
| `radius.md` | 10 | Tombol, input, badge persegi |
| `radius.lg` | 16 | Kartu, modal |
| `radius.xl` | 24 | Sheet bawah (sudut atas), gambar hero |
| `radius.full` | 9999 | Avatar, toggle, chip bulat |

Border: `hairline` = 1px (`StyleSheet.hairlineWidth` tidak dipakai agar konsisten di web), `strong` = 1,5px untuk fokus/terpilih.
Gaya editorial: kartu memakai **border 1px `border`**, bukan bayangan.

### 2.7 Elevasi (minimal)

| Level | Pemakaian | Light | Dark |
|-------|-----------|-------|------|
| `elev.0` | Hampir semua elemen | tanpa bayangan | tanpa bayangan |
| `elev.1` | Dropdown, popover, toast | `0 4 16 rgba(31,42,36,0.10)` | `0 4 16 rgba(0,0,0,0.40)` + border `border` |
| `elev.2` | Modal, sheet | `0 12 32 rgba(31,42,36,0.16)` | `0 12 32 rgba(0,0,0,0.55)` |

Di RN: `shadowColor/Offset/Opacity/Radius` (iOS), `elevation` 0/4/8 (Android), `boxShadow` (web, RN 0.81 mendukungnya). Di dark mode hierarki dibangun dari warna permukaan (`surface` → `surfaceRaised`), bukan bayangan.

### 2.8 Motion

| Token | Nilai | Pemakaian |
|-------|-------|-----------|
| `duration.fast` | 120 ms | Hover, press, fokus |
| `duration.base` | 200 ms | Buka/tutup, ganti tab |
| `duration.slow` | 320 ms | Sheet/modal masuk, transisi langkah |
| `ease.out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Masuk |
| `ease.inOut` | `cubic-bezier(0.65, 0, 0.35, 1)` | Perpindahan |

Hanya animasikan `opacity` dan `transform` (dan warna). Tidak ada animasi berulang yang dekoratif selain
indikator progres/skeleton. **Reduce motion**: baca `AccessibilityInfo.isReduceMotionEnabled` di native dan
`prefers-reduced-motion` di web (lewat `useReducedMotion` dari `react-native-reanimated`, sudah terpasang); bila aktif,
semua durasi jadi 0-1 ms dan skeleton memakai warna statis tanpa shimmer. Perubahan status penting tidak boleh
hanya lewat animasi.

### 2.9 Breakpoint dan lebar konten

| Nama | Lebar | Perilaku |
|------|-------|----------|
| `mobile` | < 768 | Satu kolom, tab bar bawah |
| `tablet` | 768-1023 | Satu-dua kolom, tab bar bawah (atau sidebar ikon ramping), gutter 24 |
| `desktop` | ≥ 1024 | Sidebar dashboard, navbar web, gutter 32 |
| `wide` | ≥ 1440 | Konten tetap di lebar maks, margin bertambah |

Lebar konten maksimal: `prose` 680, `form` 560, `content` 1120 (landing, dashboard), `page` 1280 (batas luar).
Pengujian tiga lebar: 375, 768, 1280.

---

## 3. Implementasi token di React Native

Satu sumber kebenaran: objek TypeScript, bukan CSS variable (native tidak punya CSS variable). Web memakai objek yang sama
lewat react-native-web, jadi tidak perlu Tailwind/NativeWind (hindari dependensi baru).

### 3.1 Struktur berkas `mobile/src/theme/`

```
mobile/src/theme/
├── tokens.ts        # primitif + semantik (light & dark) + skala (space, radius, font, motion, breakpoint)
├── fonts.ts         # useAppFonts(): memuat Fraunces + Inter lewat expo-font, daftar nama fontFamily
├── ThemeProvider.tsx# context: scheme ('light'|'dark'|'system'), theme aktif, simpan pilihan ke storage
├── useTheme.ts      # hook: { colors, space, radius, type, elev, motion, isDark, setScheme }
├── useBreakpoint.ts # hook: 'mobile' | 'tablet' | 'desktop' (dari useWindowDimensions)
└── index.ts         # re-export
```

`ThemeProvider` menggantikan `DarkModeProvider` yang ada di `mobile/src/context/` (satu-satunya pemilik tema).

### 3.2 `tokens.ts` (contoh singkat)

```ts
const primitive = {
  ivory: { 50: '#FFFDF8', 100: '#FAF6EE', 200: '#F2ECE0', 300: '#E4DCCB' },
  terracotta: { 600: '#A8482A', 700: '#8F3B21', 400: '#E08A66', 300: '#E9A585' },
  ink: { 900: '#1F2A24', 600: '#5B645D', 500: '#6B726C' },
  // ...night, paper, status
} as const;

export const light = {
  bg: primitive.ivory[100], surface: primitive.ivory[50], text: primitive.ink[900],
  textMuted: primitive.ink[600], border: primitive.ivory[300],
  accent: primitive.terracotta[600], accentHover: primitive.terracotta[700], onAccent: primitive.ivory[50],
  // ...sisa token semantik di bagian 2.2
} as const;

export type Colors = { [K in keyof typeof light]: string };
export const dark: Colors = { bg: '#141A16', surface: '#1C241F', /* ... */ } as Colors;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64, 24: 96 } as const;
export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 } as const;
export const breakpoints = { tablet: 768, desktop: 1024, wide: 1440 } as const;
export const maxWidth = { prose: 680, form: 560, content: 1120, page: 1280 } as const;
export const motion = { fast: 120, base: 200, slow: 320 } as const;

// skala tipografi: [mobile, desktop]
export const type = {
  display: { family: 'Fraunces_600SemiBold', size: [36, 60], line: [42, 66] },
  h1:      { family: 'Fraunces_600SemiBold', size: [30, 44], line: [36, 50] },
  body:    { family: 'Inter_400Regular',     size: [16, 16], line: [24, 24] },
  // ...
} as const;
```

### 3.3 `useTheme` dan pemakaian

```tsx
export function useTheme() {
  const { scheme, setScheme } = useContext(ThemeContext);       // 'light' | 'dark' | 'system'
  const system = useColorScheme();
  const isDark = (scheme === 'system' ? system : scheme) === 'dark';
  const bp = useBreakpoint();                                   // 'mobile' | 'tablet' | 'desktop'
  const colors = isDark ? dark : light;
  const t = (k: keyof typeof type) => ({                        // gaya teks siap pakai
    fontFamily: type[k].family,
    fontSize: type[k].size[bp === 'desktop' ? 1 : 0],
    lineHeight: type[k].line[bp === 'desktop' ? 1 : 0],
  });
  return { colors, isDark, bp, t, space, radius, motion, scheme, setScheme };
}

// di komponen
function Card({ children }) {
  const { colors, space, radius } = useTheme();
  return <View style={{ backgroundColor: colors.surface, borderColor: colors.border,
    borderWidth: 1, borderRadius: radius.lg, padding: space[4] }}>{children}</View>;
}
```

Aturan implementasi:
- `app/_layout.tsx` menahan splash screen sampai font termuat (`useAppFonts`), lalu membungkus `ThemeProvider`.
- Static rendering web: set `colorScheme` awal dari `prefers-color-scheme` agar tidak kedip; pilihan pengguna disimpan (`AsyncStorage`/`localStorage`).
- Warna dilarang ditulis literal di komponen. Tambahkan aturan ESLint `no-restricted-syntax` untuk literal `#hex` di `mobile/src/components` dan `mobile/app` (kecuali `theme/`).
- `StatusBar` mengikuti `isDark`; set `userInterfaceStyle: "automatic"` di `app.json`.
- Tema di sini hanya untuk UI aplikasi; halaman undangan publik (HTML AI) tidak memakainya.

---

## 4. Ikonografi, ilustrasi, fotografi

- **Satu set ikon: Feather** dari `@expo/vector-icons` (sudah terpasang). Garis tipis 1,5-2px selaras dengan nuansa editorial.
  Jangan campur dengan `Ionicons`/`MaterialIcons`/`FontAwesome`. Gunakan lewat wrapper tipis `Icon` (props: `name`, `size` 16/20/24, warna dari token).
- Ukuran: 16 (inline), 20 (tombol, input), 24 (navigasi). Warna mengikuti teks (`text`/`textMuted`/`accent`).
- Ikon tanpa label wajib punya `accessibilityLabel`; ikon dekoratif diberi `accessibilityElementsHidden`/`aria-hidden`.
- **Ilustrasi**: garis tunggal (line art) satu warna `accent`/`text` di atas kertas, hanya di empty state dan landing; maksimal satu per layar. Tidak ada 3D, orang kartun generik, atau blob gradien. Bila belum ada aset, gunakan tipografi saja (huruf serif besar atau monogram inisial mempelai).
- **Fotografi**: foto pernikahan nyata, cahaya alami, tone hangat, warna tidak jenuh, rasio 4:5 atau 3:2. Sudut `radius.xl` untuk hero, `radius.lg` lain. Lisensi jelas (Unsplash/Pexels atau foto sendiri); simpan di `mobile/assets/images/`, kompres ke WebP ≤ 200 KB. Wajah orang di screenshot demo harus fiktif/diizinkan.
- Pratinjau template: gambar statis hasil render undangan contoh, rasio 9:16, border 1px `border`.
- Ornamen: garis pemisah tipis, huruf kapital besar (drop cap), dan jarak. Tidak ada bunga/ornamen emas bawaan UI.

---

## 5. Spesifikasi komponen inti

Kerangka tiap komponen: anatomi, varian/ukuran, state, aksesibilitas. Berlaku di semua state:
**target sentuh ≥ 44×44** (perluas dengan `hitSlop`/padding bila visual lebih kecil), **fokus terlihat di web**
(`focusRing`: outline 2px + offset 2px, hanya `:focus-visible`), `accessibilityRole` dan label yang benar,
warna bukan satu-satunya penanda state.

### 5.1 Button

- **Anatomi**: [ikon kiri opsional] label [ikon kanan opsional]; indikator loading menggantikan ikon, lebar tombol tetap.
- **Varian**: `primary` (latar `accent`, teks `onAccent`), `secondary` (latar `surface`, border `borderStrong`, teks `text`), `ghost` (tanpa latar, teks `accent`), `danger` (latar `danger`-solid, hanya di konfirmasi hapus), `link` (teks aksen, garis bawah).
- **Ukuran**: `sm` tinggi 36 (hit area 44), `md` 44, `lg` 52. Padding horizontal 16/20/24, radius `md`, label `label` (sm/md) atau Inter 600 16 (lg). Satu `primary` per layar/bagian.
- **State**: default; hover (web) `accentHover` / `surfaceSunken`; pressed (native) `accentHover` + `opacity .92`, tanpa scale; fokus ring; disabled (`surfaceSunken`, teks `textSubtle`, `aria-disabled`); loading (spinner, `accessibilityState.busy`, klik ditahan).
- **A11y**: `accessibilityRole="button"`, label = teks; tombol ikon saja wajib `accessibilityLabel`; Enter/Space mengaktifkan di web.

### 5.2 TextField / TextArea / Select / DatePicker

- **Anatomi** (atas ke bawah): label (`label`, selalu terlihat, bukan placeholder) → [teks bantu opsional] → kontrol → pesan error/bantuan (`bodySm`). Penanda wajib: kata "(opsional)" pada yang tidak wajib, bukan bintang merah.
- **Kontrol**: tinggi 48, radius `md`, border 1px `borderStrong`, latar `surface`, teks `body` 16, placeholder `textSubtle`. TextArea: min 3 baris, bisa tumbuh, hitung karakter bila ada batas.
- **State**: default; hover border `text`-muted; fokus border `accent` 1,5px + ring; terisi; error (border `danger`, ikon + pesan, bukan hanya warna); disabled; read-only.
- **Select**: di web `<select>` asli lewat komponen web atau popover daftar; di native `ActionSheet`/sheet bawah dengan daftar opsi tinggi ≥ 48. Menampilkan nilai terpilih + chevron.
- **DatePicker**: field read-only bertuliskan "12 Desember 2026" (locale `id-ID`), memunculkan picker native (iOS/Android) atau `<input type="date">` di web; dukung input teks di web. Jam: field terpisah 24 jam, label "WIB/WITA/WIT" dapat dipilih.
- **A11y**: label terkait kontrol (`accessibilityLabel`/`htmlFor`), `accessibilityHint` untuk format, error dibacakan (`accessibilityLiveRegion="polite"` / `role="alert"`), `autoComplete`/`inputMode` tepat (email, tel, url), urutan Tab logis, tombol "Next/Done" di keyboard.

### 5.3 Card

- **Anatomi**: kontainer (`surface`, border `border`, radius `lg`, padding 16/24) → [media] → judul (`h3`) → isi → [aksi di kaki].
- **Varian**: `plain` (statis), `interactive` (seluruh kartu dapat ditekan: hover border `borderStrong`, fokus ring), `sunken` (latar `surfaceSunken`, tanpa border, untuk ringkasan).
- **State**: interaktif memiliki hover/pressed/fokus; tanpa bayangan di semua state.
- **A11y**: kartu interaktif satu target (`role="link"`/`button`) dengan label merangkum isi; jangan menumpuk tombol di dalam kartu yang juga dapat ditekan (pisahkan area aksi).

### 5.4 Badge / Chip

- **Badge** (status, tidak interaktif): tinggi 24, padding 8, radius `sm`, teks `caption`, latar `*Soft`, teks warna status/`onAccentSoft`, titik/ikon 12px opsional. Varian: `neutral`, `accent` (Premium), `success` (Aktif/Lunas), `warning` (Menunggu pembayaran), `danger` (Kedaluwarsa), `info` (Diproses).
- **Chip** (pilihan/filter, interaktif): tinggi 36 (hit 44), radius `full`, border `borderStrong`; terpilih: latar `accentSoft` + border `accent` + teks `onAccentSoft` + ikon centang. `accessibilityRole="button"` dengan `accessibilityState.selected`.
- Teks selalu menyebut status ("Aktif"), tidak hanya warna.

### 5.5 Tabs / Segmented

- **Tabs** (navigasi bagian dalam satu halaman): teks `label`, garis bawah 2px `accent` pada aktif, jarak antar tab 24, area sentuh tinggi 44; bisa digulir horizontal bila panjang. `role="tablist"/"tab"`, `aria-selected`, panah kiri/kanan berpindah di web.
- **Segmented** (2-4 opsi eksklusif, mis. Bulanan/Tahunan, Light/Dark/Sistem): kontainer `surfaceSunken` radius `md`, segmen aktif `surface` + border `border`, tinggi 40 (hit 44). `role="radiogroup"`.
- Perpindahan 120 ms (`opacity`/posisi garis), tanpa animasi jika reduce-motion.

### 5.6 Modal / Sheet

- **Modal** (desktop, dialog): lebar 480 (maks 640), `surfaceRaised`, radius `lg`, padding 24, `elev.2`, `scrim`. Struktur: judul `h2`, isi, kaki aksi (kanan: primer; kiri/sebelahnya: batal).
- **Sheet** (mobile): menempel di bawah, sudut atas `radius.xl`, pegangan 36×4 di tengah atas, tinggi maksimal 90%, bisa digeser turun untuk menutup, tombol aksi menempel di bawah dengan safe-area.
- **Perilaku**: fokus pindah ke dalam dan terkunci (focus trap) di web, Esc menutup, klik scrim menutup kecuali form belum disimpan, kembali ke pemicu saat ditutup; tombol Back Android menutup. Masuk 320 ms `ease.out` (fade + geser 16px), reduce-motion: tanpa geser.
- **A11y**: `role="dialog"` `aria-modal`, `aria-labelledby` ke judul, tombol tutup berlabel (target 44).

### 5.7 Toast

- Pojok kanan bawah (desktop) / di atas tab bar, tengah (mobile); lebar maks 420; `surfaceRaised`, border `border`, radius `md`, `elev.1`, ikon status 20 + pesan `bodySm` (maks 2 baris) + aksi opsional ("Urungkan"), tanpa gradien.
- Varian: `success`, `error`, `info`; sukses hilang 4 s, error 8 s (atau sampai ditutup), jeda saat hover/fokus.
- **A11y**: `role="status"` (`aria-live="polite"`); error `role="alert"`. Jangan jadikan toast satu-satunya tempat informasi penting (error form tetap inline). Pesan: ringkas, tanpa emoji.

### 5.8 EmptyState

- Anatomi: ilustrasi garis opsional (maks 160px) → judul `h3` → satu kalimat penjelasan (`body`, `textMuted`, maks 40 karakter per baris ideal ≤ 60) → satu tombol `primary`.
- Pakai untuk: riwayat kosong, tamu kosong, RSVP kosong, hasil cari kosong. Salin: lihat contoh di 1.2. Rata tengah, padding vertikal 48.
- Varian `error` (gagal memuat): judul "Belum bisa memuat", tombol "Coba lagi".

### 5.9 Skeleton

- Blok `surfaceSunken` radius sama dengan elemen aslinya; bentuk meniru tata letak (garis teks, kartu, avatar). Shimmer opsional: sapuan tipis 1,4 s, dimatikan oleh reduce-motion.
- `accessibilityState.busy` pada kontainer, teks "Memuat" tersembunyi untuk pembaca layar. Tampilkan bila pemuatan >300 ms; tanpa lompatan tata letak saat konten datang.

### 5.10 ProgressSteps (progres generate)

Dua pemakaian, satu komponen dengan dua varian:
- **`stepper`** (form generator multi-langkah): maks 5 langkah, penanda lingkaran 28 (nomor, atau centang bila selesai) dan garis penghubung; langkah aktif `accent` solid, selesai `accent` garis, belum `borderStrong`. Mobile: ringkas ("Langkah 2 dari 4 · Acara") + bar tipis 4px; desktop: horizontal lengkap dengan label.
- **`job`** (layar progres generate, Q15): daftar vertikal status pekerjaan: "Data diterima" → "Menyusun desain" → "Memeriksa hasil" → "Menyiapkan link". Tiap baris: ikon status (menunggu: lingkaran garis; berjalan: spinner; selesai: centang; gagal: silang) + teks. Di bawahnya: perkiraan waktu ("Biasanya 20-40 detik") dan tombol sekunder "Beri tahu saya nanti" bila relevan. Tanpa persentase palsu; progres hanya berdasar status job dari server.
- Gagal: baris merah dengan pesan penyebab singkat + tombol "Coba lagi" (kuota tidak berkurang bila gagal dari sisi sistem: TBD di backend, lihat `docs/` sesi backend).
- **A11y**: `role="progressbar"`/`aria-valuenow` (stepper) atau daftar dengan `aria-live="polite"` yang mengumumkan perubahan status; tidak mengandalkan warna.

### 5.11 Navigasi: Navbar web, TabBar mobile, Sidebar desktop

**Navbar web** (landing dan halaman publik, ≥ 768; di mobile menjadi ikon menu + sheet)
- Tinggi 64, latar `bg` (solid, garis bawah 1px `border` saat halaman digulir), isi di `maxWidth.content`.
- Kiri: logotype "CartaAI" (Fraunces 600 22px, tanpa gradien/ikon). Tengah/kanan: Fitur, Template, Harga (`label`, link bergaris bawah di aktif/hover). Kanan: "Masuk" (`ghost`) dan "Mulai gratis" (`primary sm`).
- A11y: `<nav aria-label="Utama">`, tautan "Lewati ke konten" muncul saat fokus, menu mobile `aria-expanded`.

**TabBar mobile** (setelah login, < 768): 4 tab: **Beranda, Buat, Undangan, Akun**. Tinggi 56 + safe-area, latar `surface`, garis atas 1px `border`; ikon Feather 24 + label `caption`; aktif: ikon & label `accent`, tanpa pil/latar. Tab "Buat" adalah tab biasa (bukan FAB melayang). Target ≥ 44 per tab. `accessibilityRole="tab"`, `accessibilityState.selected`.

**Sidebar desktop** (≥ 1024): lebar 248 (ikon ramping 72 di tablet), latar `surface`, garis kanan 1px `border`. Atas: logotype; menu: Beranda, Buat undangan, Undangan saya, Tamu & RSVP, Paket, Bantuan (chatbot); bawah: nama pengguna + paket (badge) + pengaturan tema. Item aktif: latar `accentSoft`, teks `onAccentSoft`, bar kiri 3px `accent`. Tinggi item 44, radius `md`. `<nav aria-label="Dashboard">`, `aria-current="page"`.

### 5.12 InvitationCard (riwayat)

- Anatomi: thumbnail pratinjau undangan (rasio 4:5, radius `md`, border `border`) di kiri/atas → judul "Rina & Dimas" (Fraunces 600 20) → tanggal acara + slug (`bodySm`, `textMuted`) → Badge status (Draf, Menyusun, Aktif, Kedaluwarsa) + Badge paket (Gratis/Premium) → baris aksi.
- Aksi: `primary sm` "Buka" / "Salin link", `secondary sm` "Tamu", menu "⋯" (Edit data, Generate ulang (sisa kuota "2 dari 3"), Hapus). Tidak lebih dari dua aksi terlihat.
- Tata letak: grid 1 kolom (mobile, thumbnail 72px kiri), 2 kolom (tablet), 3 kolom (desktop). Kartu seluruhnya dapat dibuka. Skeleton dan EmptyState saat memuat/kosong.
- Info kedaluwarsa: "Aktif sampai 12 Jan 2027" (warna `warning` bila ≤ 7 hari).

### 5.13 PricingCard

- Dua kartu: **Gratis** dan **Premium** (Q17). Anatomi: nama paket (`overline`), harga (Fraunces 600 40: `Rp0`, `Rp99.000`) + keterangan "sekali bayar per undangan", satu kalimat penjelas, daftar fitur (centang `accent` / batasan `textMuted`), tombol.
- Premium diberi border `accent` 1,5px dan badge "Paling dipilih"; **tidak** ada gradien, bayangan, atau kartu yang diperbesar. Tombol Gratis `secondary`, Premium `primary`.
- Daftar fitur mengikuti Q17: Gratis: data inti, watermark, aktif 30 hari, maks 50 tamu. Premium: foto, galeri (maks 10), musik, amplop digital, pilihan tema & gaya, tanpa watermark, aktif 1 tahun, tamu tak terbatas.
- Layout: berdampingan di desktop (lebar sama, maks 400), bertumpuk di mobile dengan Premium di atas. A11y: tiap kartu `role="group"` berlabel nama paket; centang disertai teks ("Termasuk"/"Tidak termasuk" untuk pembaca layar).

### 5.14 GuestRow

- Anatomi: avatar inisial 36 (`surfaceSunken`, teks `textMuted`) → nama tamu (`body` 500) + kontak/grup (`bodySm`, `textMuted`) → status RSVP (Badge: Belum dibuka / Hadir / Tidak hadir / Ragu) → aksi: "Kirim WhatsApp" (ikon + label di desktop, ikon saja di mobile dengan label aksesibilitas) dan menu (Salin link personal, Edit, Hapus).
- Tinggi 64 (mobile), 56 (desktop), pemisah 1px `border`. Di desktop ditampilkan sebagai tabel dengan header tetap (Nama, Grup, RSVP, Jumlah tamu, Aksi); di mobile sebagai daftar.
- State: baru dikirim (badge "Terkirim"), memilih banyak (checkbox 44), geser untuk aksi (native, opsional; aksi harus tetap tersedia lewat menu). A11y: baris = grup berlabel "Nama, status RSVP"; tombol aksi punya label spesifik ("Kirim WhatsApp ke Rina").

---

## 6. Pola layout

Kerangka umum: gutter 16/24/32, konten di tengah dengan lebar maks (2.9), jarak bagian 48/96, satu `h1` per halaman.

### 6.1 Landing (static rendering, SEO)

**Desktop (≥ 1024)**
1. Navbar (5.11).
2. Hero dua kolom 7/5: kiri `overline` kecil, `display` Fraunces (satu frasa dengan `displayItalic` + warna `accent`), paragraf `bodyLg`, dua tombol ("Buat undangan gratis" primer, "Lihat contoh" ghost), baris bukti kecil nyata (mis. "Tanpa kartu kredit. Gratis 30 hari."). Kanan: bingkai ponsel/kertas berisi pratinjau undangan nyata (gambar statis), sedikit miring 0° (tanpa rotasi hiasan).
3. "Cara kerja" 3 langkah bernomor besar serif (01, 02, 03) berderet dengan garis tipis, bukan kartu ikon.
4. "Contoh gaya": galeri template (4-6 pratinjau 9:16, lalu "Lihat semua").
5. Fitur: daftar selang-seling gambar-teks (foto/tangkapan layar nyata), maks 3 bagian.
6. Harga: PricingCard x2 (5.13) + FAQ akordeon (6-8 pertanyaan).
7. CTA penutup di blok `inverse` (hijau tua), footer sederhana (tautan, kontak, hak cipta).

**Mobile (< 768)**: satu kolom; hero: judul 36, paragraf, tombol penuh-lebar `lg`, pratinjau di bawah; "Cara kerja" vertikal; template sebagai carousel horizontal dengan peek (kartu 70% lebar); harga bertumpuk (Premium dulu); FAQ akordeon; tombol CTA menempel di bawah (sticky) hanya bila tidak menutup konten. Navbar ringkas: logotype + tombol "Masuk" + menu.
SEO: judul, meta, heading berurutan, teks nyata (bukan gambar), `alt` pada gambar, link kanonis.

### 6.2 Dashboard: sidebar (desktop) vs tab bar (mobile)

- **Desktop ≥ 1024**: grid `Sidebar 248 | Konten`. Konten: header halaman (`h1` + aksi utama di kanan, mis. "Buat undangan"), lalu isi di `maxWidth.content`. Beranda: ringkasan 3 angka sederhana (Undangan aktif, Tamu terdaftar, RSVP hadir) sebagai baris teks serif besar tanpa kartu-warna-warni, lalu daftar InvitationCard 3 kolom. Halaman tamu: tabel GuestRow dengan toolbar (cari, filter Chip RSVP, impor CSV, tambah tamu).
- **Tablet 768-1023**: sidebar ikon ramping 72 (tooltip), konten satu-dua kolom.
- **Mobile < 768**: TabBar bawah (5.11), header halaman 56 dengan judul (`h2` Fraunces) dan aksi ikon; daftar satu kolom; "Tamu & RSVP" dibuka dari kartu undangan (halaman dalam dengan tombol kembali); aksi utama ("Tambah tamu") sebagai tombol `primary` di header atau sticky bawah.
- Navigasi sama di dua bentuk: satu definisi rute, dua pembungkus tampilan (`useBreakpoint`).

### 6.3 Form generator multi-langkah

- Langkah (maks 5), mengikuti paket: **1 Mempelai** (nama, panggilan, orang tua) → **2 Acara** (akad/resepsi: tanggal, jam, lokasi + tautan peta) → **3 Gaya** (template/preset atau "Bebas", tema warna; Premium: foto, galeri, musik) → **4 Tambahan** (amplop digital/rekening, kata pengantar) → **5 Tinjau & buat**. Fitur Premium yang terkunci tetap terlihat dengan badge "Premium" dan keterangan satu baris, bukan disembunyikan, tanpa dialog agresif.
- Desktop: dua kolom. Kiri form (`maxWidth.form` 560), kanan pratinjau data/gaya sticky (kartu pratinjau, bukan hasil AI karena belum ada). ProgressSteps `stepper` horizontal di atas. Mobile: satu kolom, stepper ringkas, tombol "Lanjut" sticky bawah dengan safe-area, "Kembali" sebagai `ghost`.
- Perilaku: simpan otomatis sebagai draf per langkah; validasi saat blur dan saat "Lanjut" (kesalahan inline, fokus ke field pertama yang salah); data tidak hilang saat kembali; konfirmasi bila keluar dengan perubahan belum tersimpan.
- Setelah "Buat undangan": layar `ProgressSteps job` (Q15), lalu layar hasil: pratinjau besar, link + tombol "Salin link" dan "Bagikan", tautan "Atur daftar tamu". Kuota generate ulang ditampilkan ("Sisa 2 dari 3 kali generate ulang").

### 6.4 Layar lain (ringkas)
- **Auth** (masuk, daftar, lupa/ubah password): kartu form `maxWidth` 420 di tengah, `surface` + border; desktop: dua panel (kiri foto/pernyataan editorial, kanan form); mobile: hanya form. Tombol "Lanjut dengan Google" secondary dengan logo Google resmi (bukan ikon Feather; satu-satunya pengecualian set ikon).
- **Pembayaran**: ringkasan pesanan (undangan, Rp99.000), metode dari Midtrans, status memakai Badge + teks jelas.
- **Chatbot**: halaman/panel obrolan; gelembung pengguna `accentSoft`, bot `surface` + border; sisa kuota harian "12 dari 20 pesan" di header.

---

## 7. Aksesibilitas (ringkasan lintas komponen)

- Kontras sesuai 2.3; jangan memakai `textSubtle` untuk teks <14px.
- Target sentuh ≥ 44×44; jarak antar target ≥ 8.
- Fokus terlihat (ring 2px + offset 2px), urutan Tab/gulir logis, tidak ada jebakan fokus kecuali modal.
- Semua gambar bermakna punya `alt`/`accessibilityLabel`; ikon tanpa label punya label.
- Dukung skala font sistem hingga 130% tanpa teks terpotong; layout tidak bergantung pada tinggi tetap untuk teks.
- Hormati reduce-motion dan `prefers-color-scheme`.
- Bahasa: `lang="id"` pada halaman web; pesan error dibacakan.
- Uji: VoiceOver/TalkBack (satu alur: daftar → buat undangan), keyboard saja di web, zoom 200%.

---

## 8. Panduan migrasi warna lama

Hitung kemunculan di `mobile/src` dan `mobile/app` (2026-11-18). Cara kerja: ganti per berkas saat layar itu dimigrasi (F3);
tidak ada penggantian massal otomatis, karena makna tiap pemakaian berbeda (teks vs latar vs garis).

| Warna lama | Jumlah | Peran umum | Token baru |
|------------|--------|------------|------------|
| `#6366f1` | 93 | Aksen/tombol/link | `colors.accent` (tombol: `accent` + `onAccent`; link/ikon: `accent`) |
| `#4f46e5` | 23 | Hover/pressed indigo | `colors.accentHover` |
| `#111827` | 82 | Teks utama | `colors.text` |
| `#1f2937` | 37 | Teks utama gelap / judul | `colors.text` |
| `#374151` | 33 | Teks isi | `colors.text` (isi) atau `colors.textMuted` (label) |
| `#4b5563` | 26 | Teks sekunder | `colors.textMuted` |
| `#6b7280` | 27 | Teks sekunder/placeholder | `colors.textMuted` (teks) / `colors.textSubtle` (placeholder) |
| `#9ca3af` | 48 | Placeholder, ikon redup | `colors.textSubtle` (kontras lama hanya ±2,5:1: gagal; naik ke 4,59:1) |
| `#d1d5db` | 33 | Border input | `colors.borderStrong` (input) / `colors.border` (pemisah) |
| `#e5e7eb` | 17 | Pemisah, border kartu | `colors.border` |
| `#f3f4f6` | 11 | Latar cekung | `colors.surfaceSunken` |
| `#f9fafb` | 29 | Latar halaman | `colors.bg` |
| `#ffffff` | 26 | Latar kartu / teks di tombol | `colors.surface` (latar) / `colors.onAccent` (teks di atas aksen) |
| `#667eea` | 40 | Awal gradien ungu | **Hapus gradien**; latar hero/tombol → `colors.accent` atau `colors.bg` |
| `#764ba2` | 35 | Akhir gradien ungu | Hapus bersama pasangannya |
| `#7c3aed`, `#a855f7` | 10, 9 | Ungu aksen tambahan | `colors.accent` (satu aksen saja) |
| `#ef4444` | 10 | Error/hapus | `colors.danger` (+ `dangerSoft` untuk latar) |
| `#f59e0b`, `#d97706` | 9, 4 | Peringatan | `colors.warning` |
| `#10b981`, `#dcfce7` | 7, 3 | Sukses | `colors.success` / `colors.successSoft` |
| `#0f172a`, `#475569`, `#f8fafc`, `#cbd5e1` | 5, 4, 4, 3 | Slate varian | `text`, `textMuted`, `bg`, `border` |
| `#fef2f2` | 4 | Latar error | `colors.dangerSoft` |
| `#e0e7ff`, `#eef2ff`, `#c7d2fe` | 4, 3, 3 | Latar indigo muda | `colors.accentSoft` (latar) / `colors.border` (garis) |

Langkah migrasi per layar (F3):
1. Ganti layar dengan komponen baru dari `mobile/src/components/ui/`; jangan menambal gaya lama.
2. Hapus semua `LinearGradient` dekoratif, emoji di teks, dan `shadow*` tebal.
3. Pastikan tidak ada `#hex` tersisa (lint 3.3) dan layar lolos cek dark mode serta tiga lebar (375/768/1280).
4. Setelah semua layar selesai, hapus `DarkModeProvider` lama dan konstanta warna lama.

---

## 9. Struktur komponen yang disarankan

```
mobile/src/components/ui/     # Button, TextField, TextArea, Select, DatePicker, Card, Badge, Chip,
                              # Tabs, Segmented, Modal, Sheet, Toast, EmptyState, Skeleton,
                              # ProgressSteps, Icon, Text (membungkus tipografi token)
mobile/src/components/layout/ # AppShell (sidebar/tab bar), Navbar, Sidebar, TabBar, Container, Section
mobile/src/components/domain/ # InvitationCard, PricingCard, GuestRow, TemplateCard
```

Komponen `ui/` tidak tahu domain (tanpa Supabase/API); komponen `domain/` menyusun dari `ui/`.
`Text` adalah satu-satunya pintu untuk teks bergaya (`<Text variant="h2">`), sehingga font dan skala tidak pernah ditulis ulang.

---

## 10. Checklist review PR desain

- [ ] Tidak ada `#hex`, gradien, emoji, glassmorphism, bayangan tebal di kode UI.
- [ ] Warna dan spasi dari token; teks lewat `Text variant`.
- [ ] Satu tombol `primary` per bagian; copy mengikuti 1.2.
- [ ] Kontras terukur untuk pasangan baru; input memakai `borderStrong`.
- [ ] Target ≥ 44, fokus terlihat, label aksesibilitas ada.
- [ ] Dark mode, reduce-motion, font 130%, lebar 375/768/1280 diperiksa.
- [ ] Ikon hanya Feather; ilustrasi/foto sesuai bagian 4.

## 11. Belum diputuskan (TBD)

- Nama domain final dan logotype/monogram final (sementara teks "CartaAI" Fraunces 600).
- Aset foto/ilustrasi nyata untuk landing dan empty state (sementara tipografi saja).
- Verifikasi nama export font setelah `@expo-google-fonts/*` dipasang; bila berat Fraunces terasa kasar di Android, turunkan ke 500 untuk `h2`.
- Rasio kontras status di atas `*Soft` (successSoft, warningSoft, dst.) belum dihitung; ukur di F2 sebelum dipakai untuk teks.
- Aturan kuota generate yang gagal dari sisi sistem (dokumen backend).
