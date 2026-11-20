import { Linking, Platform, Share } from 'react-native';
import type { BadgeTone } from '../../components/ui';
import type { InvitationStatus, Plan } from '../../types/api';

export const STATUS: Record<InvitationStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draf', tone: 'neutral' },
  generating: { label: 'Diproses', tone: 'info' },
  published: { label: 'Aktif', tone: 'success' },
  expired: { label: 'Kedaluwarsa', tone: 'danger' },
};

export const planLabel = (p: Plan) => (p === 'premium' ? 'Premium' : 'Gratis') as 'Gratis' | 'Premium';

export const errMsg = (e: unknown) => (e instanceof Error && e.message ? e.message : 'Terjadi kesalahan. Coba lagi sebentar lagi.');

/** Sisa hari sampai `iso`; null bila tidak ada tanggal. */
export const daysLeft = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null);

/** Web: salin ke papan klip. Native: lembar bagikan sistem (tanpa dependensi tambahan). */
export async function shareLink(url: string): Promise<'copied' | 'shared'> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    return 'copied';
  }
  await Share.share({ message: url });
  return 'shared';
}

export const openUrl = (url: string) => (Platform.OS === 'web' ? (window.open(url, '_blank', 'noopener'), undefined) : Linking.openURL(url));

/** Urutan tahap job di server (backend/app/services/generation.py). */
export const JOB_STEPS = [
  { key: 'validating', label: 'Memeriksa data' },
  { key: 'prompting', label: 'Menyiapkan arahan desain' },
  { key: 'generating', label: 'AI merancang undangan' },
  { key: 'sanitizing', label: 'Membersihkan hasil' },
  { key: 'injecting', label: 'Memasang RSVP dan hitung mundur' },
  { key: 'saving', label: 'Menyimpan dan menerbitkan' },
] as const;

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-/, '').slice(0, 40);
