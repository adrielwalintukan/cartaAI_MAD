import { api } from '../../lib/api';
import type { Invitation, InvitationData, InvitationSummary } from '../../types/api';

export const invitationsApi = {
  list: () => api.get<{ items: InvitationSummary[] }>('/api/invitations'),
  get: (id: string) => api.get<Invitation>(`/api/invitations/${id}`),
  slugAvailable: (slug: string) => api.get<{ available: boolean }>('/api/invitations/slug-available', { slug }),
  create: (body: { slug: string; preset_id: string; data: Partial<InvitationData> }) => api.post<Invitation>('/api/invitations', body),
  update: (id: string, body: { data?: Partial<InvitationData>; preset_id?: string }) => api.patch<Invitation>(`/api/invitations/${id}`, body),
  remove: (id: string) => api.delete(`/api/invitations/${id}`),
  rollback: (id: string) => api.post<Invitation>(`/api/invitations/${id}/rollback`),
};
