// @ts-nocheck -- impor berekstensi .ts hanya untuk node; tipe dicek lewat summary.ts
// Self-check tanpa test runner: `node --experimental-strip-types src/features/dashboard/summary.check.ts`
import assert from 'node:assert/strict';
import { summarize, upgradeTargets } from './summary.ts';

const day = 86_400_000;
const inv = (o: Record<string, unknown>) => ({ id: 'x', slug: 's', title: 'T', status: 'published', plan: 'free', public_url: null,
  expires_at: new Date(Date.now() + 10 * day).toISOString(), is_expired: false, quota: {}, event_date: '2027-01-01',
  cover_url: null, rsvp_count: 0, guest_count: 0, ...o }) as never;

assert.deepEqual(summarize([]), { active: 0, guests: 0, rsvps: 0, nearestDays: null });
assert.deepEqual(upgradeTargets([]), []);

const items = [
  inv({ id: 'a', guest_count: 10, rsvp_count: 3 }),
  inv({ id: 'b', status: 'draft', expires_at: null, guest_count: 2 }),
  inv({ id: 'c', plan: 'premium', expires_at: new Date(Date.now() + 200 * day).toISOString(), guest_count: 5, rsvp_count: 4 }),
  inv({ id: 'd', status: 'expired', is_expired: true, expires_at: new Date(Date.now() - day).toISOString() }),
];
assert.deepEqual(summarize(items), { active: 2, guests: 17, rsvps: 7, nearestDays: 10 });
assert.deepEqual(upgradeTargets(items).map((i: { id: string }) => i.id), ['a', 'b']);
console.log('summary.check ok');
