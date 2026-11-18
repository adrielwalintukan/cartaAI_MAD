// Verifikasi normalisasi error & retry: `node --experimental-strip-types scripts/verify-api.mjs` (tanpa kerangka tes).
import assert from 'node:assert/strict';
import { ApiError, backoffMs, isRetryable, normalizeApiError, requestWithRetry } from '../src/lib/api-core.ts';

// 1. error 06 §1.1
const e = normalizeApiError(403, { error: { code: 'quota_exceeded', message: 'Kuota habis', details: { used: 3, limit: 3 }, request_id: 'r1' } });
assert.ok(e instanceof ApiError);
assert.deepEqual([e.code, e.status, e.requestId, e.details?.limit], ['quota_exceeded', 403, 'r1', 3]);
// 2. body bukan JSON / tanpa objek error
assert.equal(normalizeApiError(500, null).code, 'http_500');
assert.equal(normalizeApiError(502, { detail: 'x' }).code, 'http_502');
// 3. kelayakan retry
assert.ok(isRetryable(normalizeApiError(503, null), 'POST'));
assert.ok(!isRetryable(normalizeApiError(404, { error: { code: 'not_found' } }), 'GET'));
assert.ok(!isRetryable(normalizeApiError(422, { error: { code: 'validation_error' } }), 'POST'));
assert.deepEqual([0, 1, 2].map(backoffMs), [1000, 2000, 4000]);

const base = { url: 'http://x', method: 'GET', headers: {}, sleep: async () => {} };
const res = (status, body) => ({ status, ok: status < 400, json: async () => body });

// 4. cold start: 503, 503, lalu sukses → 3 panggilan
let n = 0;
const ok = await requestWithRetry({ ...base, fetchImpl: async () => (++n < 3 ? res(503, null) : res(200, { ok: 1 })) });
assert.deepEqual(ok, { ok: 1 });
assert.equal(n, 3);
// 5. 4xx tidak diulang
n = 0;
await assert.rejects(requestWithRetry({ ...base, fetchImpl: async () => { n++; return res(409, { error: { code: 'slug_taken', message: 'x' } }); } }), (err) => err.code === 'slug_taken');
assert.equal(n, 1);
// 6. gagal jaringan terus-menerus → network_error setelah 3 percobaan
n = 0;
await assert.rejects(requestWithRetry({ ...base, fetchImpl: async () => { n++; throw new TypeError('fail'); } }), (err) => err.code === 'network_error');
assert.equal(n, 3);
// 7. 204
assert.equal(await requestWithRetry({ ...base, method: 'DELETE', fetchImpl: async () => ({ status: 204, ok: true, json: async () => { throw new Error('no body'); } }) }), null);
console.log('verify-api: semua pemeriksaan lulus');
