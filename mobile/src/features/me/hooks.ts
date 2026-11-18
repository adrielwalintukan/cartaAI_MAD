import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meApi } from './api';

export const useMe = (enabled = true) => useQuery({ queryKey: ['me'], queryFn: meApi.get, enabled });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: meApi.update, onSuccess: (me) => qc.setQueryData(['me'], me) });
}
