import { api } from '../../lib/api';
import type { ChatTurn } from '../../types/api';

export const chatApi = {
  send: (message: string, history: ChatTurn[]) => api.post<{ reply: string; remaining: number }>('/api/chat', { message, history }),
  usage: () => api.get<{ limit: number; remaining: number }>('/api/chat/usage'),
};
