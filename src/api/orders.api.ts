import apiClient from './client';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderListResponse,
} from '@/types/order.types';

export const ordersApi = {
  getAll: async (params?: {
    branch_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    include_completed?: boolean;
  }): Promise<OrderListResponse> => {
    const response = await apiClient.get<OrderListResponse>('/orders', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  update: async (id: number, data: UpdateOrderRequest): Promise<Order> => {
    const response = await apiClient.put<Order>(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/orders/${id}`);
    return response.data;
  },
};

