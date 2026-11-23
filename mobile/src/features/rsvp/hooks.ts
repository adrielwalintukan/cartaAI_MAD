import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rsvpApi } from './api';

export const useRsvps = (invitationId: string | undefined) =>
  useQuery({ queryKey: ['rsvps', invitationId], queryFn: () => rsvpApi.list(invitationId!), enabled: !!invitationId });

export function useHideRsvp(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => rsvpApi.setHidden(id, hidden),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rsvps', invitationId] }),
  });
}
