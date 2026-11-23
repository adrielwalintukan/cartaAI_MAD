import { api } from '../../lib/api';
import type { RsvpItem, RsvpStats } from '../../types/api';

export const rsvpApi = {
  list: (invitationId: string, p?: { limit?: number; offset?: number }) =>
    api.get<{ stats: RsvpStats; items: RsvpItem[]; total: number }>(`/api/invitations/${invitationId}/rsvps`, p),
  setHidden: (rsvpId: string, is_hidden: boolean) => api.patch<RsvpItem>(`/api/rsvps/${rsvpId}`, { is_hidden }),
};
