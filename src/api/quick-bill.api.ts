import apiClient from './client';
import {
  QuickBillProduct,
  CreateQuickBillRequest,
  QuickBillResponse,
  QuickBillHistoryResponse,
} from '@/types/quick-bill.types';

export const quickBillApi = {
  getProducts: async (branch_id?: number): Promise<QuickBillProduct[]> => {
    const params = branch_id ? { branch_id } : {};
    const response = await apiClient.get<QuickBillProduct[]>('/quick-bill/products', { params });
    return response.data;
  },

  create: async (data: CreateQuickBillRequest): Promise<QuickBillResponse> => {
    const response = await apiClient.post<QuickBillResponse>('/quick-bill', data);
    return response.data;
  },

  getHistory: async (params?: {
    branch_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<QuickBillHistoryResponse> => {
    const response = await apiClient.get<QuickBillHistoryResponse>('/quick-bill/history', { params });
    return response.data;
  },
};

