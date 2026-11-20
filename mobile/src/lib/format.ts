/** `Rp99.000` (titik ribuan, tanpa spasi) — docs/03 §1.2. */
export function formatRupiah(n: number): string {
  return 'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** `12 Desember 2026` dari 'YYYY-MM-DD' atau ISO. */
export function formatDateId(iso: string, short = false): string {
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: short ? 'short' : 'long', year: 'numeric' });
}
