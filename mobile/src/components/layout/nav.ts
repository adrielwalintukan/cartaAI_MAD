import type { IconName } from '../ui';

export type NavItem = { key: string; label: string; href: string; icon: IconName };

/** Menu area login. Rute kanonik: docs/02 §1. */
export const appNav: NavItem[] = [
  { key: 'home', label: 'Beranda', href: '/app', icon: 'home' },
  { key: 'new', label: 'Buat undangan', href: '/app/undangan/baru', icon: 'plus-square' },
  { key: 'list', label: 'Undangan saya', href: '/app/undangan', icon: 'mail' },
  { key: 'help', label: 'Bantuan', href: '/app/bantuan', icon: 'message-circle' },
  { key: 'account', label: 'Akun', href: '/app/akun', icon: 'user' },
];

/** Tab bar mobile: 4 tab (docs/03 §5.11). "Buat" tab biasa, bukan FAB. */
export const tabNav: NavItem[] = [
  { key: 'home', label: 'Beranda', href: '/app', icon: 'home' },
  { key: 'new', label: 'Buat', href: '/app/undangan/baru', icon: 'plus-square' },
  { key: 'list', label: 'Undangan', href: '/app/undangan', icon: 'mail' },
  { key: 'account', label: 'Akun', href: '/app/akun', icon: 'user' },
];

export const marketingNav: NavItem[] = [
  { key: 'style', label: 'Gaya', href: '/gaya', icon: 'image' },
  { key: 'price', label: 'Harga', href: '/harga', icon: 'tag' },
];

/** Item aktif = href terpanjang yang cocok dengan path (agar /app/undangan tidak aktif di /app/undangan/baru). */
export function activeKey(items: NavItem[], pathname: string): string | null {
  let best: NavItem | null = null;
  for (const it of items) {
    const hit = pathname === it.href || pathname.startsWith(it.href + '/');
    if (hit && (!best || it.href.length > best.href.length)) best = it;
  }
  return best?.key ?? null;
}
