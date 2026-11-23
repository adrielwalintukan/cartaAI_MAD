import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from './api';

const key = (id: string) => ['guests', id] as const;

export const useGuests = (invitationId: string | undefined) =>
  useQuery({ queryKey: key(invitationId ?? ''), queryFn: () => guestsApi.list(invitationId!), enabled: !!invitationId });

export function useGuestMutations(invitationId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: key(invitationId) });
  return {
    create: useMutation({ mutationFn: (b: { name: string; phone?: string }) => guestsApi.create(invitationId, b), onSuccess: refresh }),
    bulk: useMutation({ mutationFn: (g: { name: string; phone?: string }[]) => guestsApi.bulk(invitationId, g), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, ...b }: { id: string; name?: string; phone?: string }) => guestsApi.update(id, b), onSuccess: refresh }),
    remove: useMutation({ mutationFn: guestsApi.remove, onSuccess: refresh }),
  };
}
