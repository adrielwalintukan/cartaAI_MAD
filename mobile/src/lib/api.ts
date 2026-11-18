import { ApiError, requestWithRetry, type FetchLike } from './api-core';
import { env } from './env';
import { supabase } from './supabase';

export { ApiError };

/** Dipakai layar lama sampai F3-11; layar baru memakai `api`/`request`. */
export const API_BASE_URL = env.apiBaseUrl;

type Query = Record<string, string | number | boolean | undefined | null>;
export type RequestOptions = { query?: Query; body?: unknown; auth?: boolean; timeoutMs?: number };

function buildUrl(path: string, query?: Query) {
  const qs = query
    ? Object.entries(query).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  return `${env.apiBaseUrl}${path}${qs ? `?${qs}` : ''}`;
}

/** Klien terketik: menempel JWT, timeout 60 dtk, retry backoff untuk cold start, error → ApiError. */
export async function request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth !== false) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return requestWithRetry<T>({
    fetchImpl: fetch as unknown as FetchLike,
    url: buildUrl(path, opts.query),
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    timeoutMs: opts.timeoutMs,
  });
}

export const api = {
  get: <T>(path: string, query?: Query, auth = true) => request<T>('GET', path, { query, auth }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};
