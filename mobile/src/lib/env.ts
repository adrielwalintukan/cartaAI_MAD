// Akses `process.env.EXPO_PUBLIC_*` harus statis agar Metro dapat menyisipkan nilainya saat build.
const raw = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  // EXPO_PUBLIC_BACKEND_URL = nama lama, diterima agar .env dev lama tetap jalan.
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_BACKEND_URL,
  EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL,
};

const missing = (['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_API_BASE_URL'] as const).filter((k) => !raw[k]?.trim());
if (missing.length) {
  // Tanpa fallback ke server lama: gagal jelas agar salah konfigurasi tidak tersembunyi.
  throw new Error(`Variabel lingkungan belum diisi: ${missing.join(', ')}. Salin mobile/.env.example ke mobile/.env lalu isi nilainya.`);
}

const trim = (u: string) => u.trim().replace(/\/+$/, '');

export const env = {
  supabaseUrl: trim(raw.EXPO_PUBLIC_SUPABASE_URL!),
  supabaseAnonKey: raw.EXPO_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  apiBaseUrl: trim(raw.EXPO_PUBLIC_API_BASE_URL!),
  /** Domain web untuk link undangan. Di web, bila kosong dipakai origin halaman. */
  webBaseUrl: raw.EXPO_PUBLIC_WEB_BASE_URL?.trim()
    ? trim(raw.EXPO_PUBLIC_WEB_BASE_URL)
    : typeof window !== 'undefined' && window.location ? window.location.origin : '',
};
