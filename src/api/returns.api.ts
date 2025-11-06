import apiClient from './client';
import {
  Return,
  CreateReturnRequest,
  ReturnListResponse,
} from '@/types/return.types';

export const returnsApi = {
  getAll: async (params?: {
    branch_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ReturnListResponse> => {
    const response = await apiClient.get<ReturnListResponse>('/returns', { params });
    return response.data;
  },

  create: async (data: CreateReturnRequest): Promise<Return> => {
    const response = await apiClient.post<Return>('/returns', data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/returns/${id}`);
    return response.data;
  },
};

