// Logika murni klien API (tanpa import RN/Supabase) agar bisa diuji dengan `node scripts/verify-api.mjs`.

export type ApiErrorBody = { error?: { code?: string; message?: string; details?: Record<string, unknown>; request_id?: string } };

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
  requestId?: string;
  constructor(code: string, message: string, status: number, details?: Record<string, unknown>, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

const FALLBACK_MESSAGE: Record<string, string> = {
  network_error: 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.',
  timeout: 'Server terlalu lama menjawab. Coba lagi sebentar lagi.',
};

/** Normalkan respons error (06 §1.1) menjadi ApiError; tahan terhadap body non-JSON. */
export function normalizeApiError(status: number, body: unknown): ApiError {
  const e = (body as ApiErrorBody | null)?.error;
  if (e && typeof e.code === 'string') {
    return new ApiError(e.code, e.message || 'Terjadi kesalahan. Coba lagi.', status, e.details, e.request_id);
  }
  return new ApiError(`http_${status}`, 'Terjadi kesalahan pada server. Coba lagi.', status);
}

export const networkError = () => new ApiError('network_error', FALLBACK_MESSAGE.network_error, 0);
export const timeoutError = () => new ApiError('timeout', FALLBACK_MESSAGE.timeout, 0);

/** 502/503/504 dan gangguan jaringan = kemungkinan cold start Render → layak diulang. */
export function isRetryable(err: ApiError, method: string): boolean {
  if (err.code === 'network_error' || [502, 503, 504].includes(err.status)) return true;
  // Timeout hanya diulang untuk GET (aman); POST/PATCH bisa sudah diproses server.
  return err.code === 'timeout' && method === 'GET';
}

export const backoffMs = (attempt: number) => 1000 * 2 ** attempt; // 1s, 2s, 4s

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }>;

export type RequestCoreOptions = {
  fetchImpl: FetchLike;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
};

export async function requestWithRetry<T>(o: RequestCoreOptions): Promise<T> {
  const { fetchImpl, url, method, headers, body, timeoutMs = 60_000, maxAttempts = 3, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = o;
  let last: ApiError = networkError();
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { method, headers, body, signal: ctrl.signal });
      let data: unknown = null;
      try { data = res.status === 204 ? null : await res.json(); } catch { data = null; }
      if (res.ok) return data as T;
      last = normalizeApiError(res.status, data);
    } catch (e) {
      last = (e as { name?: string })?.name === 'AbortError' ? timeoutError() : networkError();
    } finally {
      clearTimeout(timer);
    }
    if (attempt === maxAttempts - 1 || !isRetryable(last, method)) throw last;
    await sleep(backoffMs(attempt));
  }
  throw last;
}
