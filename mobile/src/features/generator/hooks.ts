import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitationKeys } from '../invitations/hooks';
import { generatorApi } from './api';

/** Polling tiap 2,5 dtk sampai job selesai/gagal (06 §4). */
export const useJob = (jobId: string | undefined) =>
  useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => generatorApi.job(jobId!),
    enabled: !!jobId,
    refetchInterval: (q) => (q.state.data && ['succeeded', 'failed'].includes(q.state.data.status) ? false : 2500),
  });

export function useStartGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generatorApi.start,
    onSuccess: (_r, id) => qc.invalidateQueries({ queryKey: invitationKeys.detail(id) }),
  });
}
