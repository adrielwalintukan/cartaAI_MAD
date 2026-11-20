import { api } from '../../lib/api';
import type { Me } from '../../types/api';

export const meApi = {
  get: () => api.get<Me>('/api/me'),
  update: (b: { full_name?: string; avatar_url?: string }) => api.patch<Me>('/api/me', b),
};
