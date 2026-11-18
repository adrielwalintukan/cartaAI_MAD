import { api } from '../../lib/api';
import type { CreateOrderResponse, Order } from '../../types/api';

export const paymentsApi = {
  createOrder: (invitation_id: string) => api.post<CreateOrderResponse>('/api/payments/orders', { invitation_id }),
  order: (orderId: string) => api.get<Order>(`/api/payments/orders/${orderId}`),
};
