export function normalizeApiBaseUrl(rawUrl?: string) {
  const fallback = 'https://cartaaimad-production.up.railway.app';
  const value = (rawUrl || fallback).trim().replace(/\/+$/, '');

  if (!value) {
    return fallback;
  }

  if (value.endsWith('/docs')) {
    return value.slice(0, -5);
  }

  return value;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.EXPO_PUBLIC_BACKEND_URL
);
