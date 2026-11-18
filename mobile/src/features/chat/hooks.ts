import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatTurn } from '../../types/api';
import { chatApi } from './api';

export const useChatUsage = () => useQuery({ queryKey: ['chat', 'usage'], queryFn: chatApi.usage });

export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatTurn[] }) => chatApi.send(message, history),
    onSuccess: (r) => qc.setQueryData(['chat', 'usage'], (u: { limit: number } | undefined) => ({ limit: u?.limit ?? 20, remaining: r.remaining })),
  });
}
