import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-core';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // api.ts sudah mengulang untuk cold start; jangan menggandakan, dan jangan ulang error 4xx.
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 1,
      refetchOnWindowFocus: false,
    },
  },
});
