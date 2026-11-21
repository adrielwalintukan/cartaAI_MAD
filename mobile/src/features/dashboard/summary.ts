import type { InvitationSummary } from '../../types/api';

/** Sisa hari sampai `iso`; null bila tidak ada tanggal. */
export const daysLeft = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null);

const isActive = (i: InvitationSummary) => i.status === 'published' && !i.is_expired;

/** Angka beranda dari daftar undangan (satu permintaan, tanpa statistik RSVP per undangan). */
export function summarize(items: InvitationSummary[]) {
  const days = items.filter(isActive).map((i) => daysLeft(i.expires_at)).filter((d): d is number => d != null);
  return {
    active: items.filter(isActive).length,
    guests: items.reduce((n, i) => n + i.guest_count, 0),
    rsvps: items.reduce((n, i) => n + i.rsvp_count, 0),
    nearestDays: days.length ? Math.min(...days) : null,
  };
}

/** Undangan yang masih bisa di-upgrade: Gratis dan belum kedaluwarsa (draf ikut). */
export const upgradeTargets = (items: InvitationSummary[]) => items.filter((i) => i.plan === 'free' && !i.is_expired);
