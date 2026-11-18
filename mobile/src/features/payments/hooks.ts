import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitationKeys } from '../invitations/hooks';
import { paymentsApi } from './api';

export const useCreateOrder = () => useMutation({ mutationFn: paymentsApi.createOrder });

/** Polling tiap 3 dtk selama status masih pending (06 §9). */
export function useOrder(orderId: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const o = await paymentsApi.order(orderId!);
      if (o.status === 'paid') qc.invalidateQueries({ queryKey: invitationKeys.all });
      return o;
    },
    enabled: !!orderId,
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 3000 : false),
  });
}
