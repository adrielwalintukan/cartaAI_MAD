# Supabase (CartaAI v2)

Skema ada di `migrations/` (sumber desain: `docs/05-skema-database.md`). Tanpa rahasia di folder ini.

Menerapkan ke project baru: Supabase CLI `supabase link --project-ref <ref>` lalu `supabase db push`,
atau tempel isi `migrations/*.sql` ke SQL Editor dashboard. Project dev saat ini: `wiyrblibtzufwejmspib`
(sudah diterapkan lewat MCP `apply_migration`, nama migrasi `init`).

Setelah migrasi, atur di dashboard (04 §6.3): Auth Site URL & Redirect URLs, provider email + Google.
Preset gaya tambahan: tambah baris ke `style_presets` (Q23, tanpa panel admin).
