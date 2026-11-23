import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from './api';

export const invitationKeys = { all: ['invitations'] as const, detail: (id: string) => ['invitations', id] as const };

export const useInvitations = () => useQuery({ queryKey: invitationKeys.all, queryFn: invitationsApi.list });
export const useInvitation = (id: string | undefined) =>
  useQuery({ queryKey: invitationKeys.detail(id ?? ''), queryFn: () => invitationsApi.get(id!), enabled: !!id });

export function useInvitationMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: invitationKeys.all });
  return {
    create: useMutation({ mutationFn: invitationsApi.create, onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, ...b }: { id: string } & Parameters<typeof invitationsApi.update>[1]) => invitationsApi.update(id, b), onSuccess: refresh }),
    remove: useMutation({ mutationFn: invitationsApi.remove, onSuccess: refresh }),
    rollback: useMutation({ mutationFn: invitationsApi.rollback, onSuccess: refresh }),
  };
}
