import { api } from '../../lib/api';
import type { Guest } from '../../types/api';

export const guestsApi = {
  list: (invitationId: string, p?: { limit?: number; offset?: number }) =>
    api.get<{ items: Guest[]; total: number; limit: number | null }>(`/api/invitations/${invitationId}/guests`, p),
  create: (invitationId: string, b: { name: string; phone?: string }) => api.post<Guest>(`/api/invitations/${invitationId}/guests`, b),
  bulk: (invitationId: string, guests: { name: string; phone?: string }[]) =>
    api.post<{ created: number; skipped: number; rejected: { index: number; reason: string }[]; items: Guest[] }>(`/api/invitations/${invitationId}/guests/bulk`, { guests }),
  update: (guestId: string, b: { name?: string; phone?: string }) => api.patch<Guest>(`/api/guests/${guestId}`, b),
  remove: (guestId: string) => api.delete(`/api/guests/${guestId}`),
};
