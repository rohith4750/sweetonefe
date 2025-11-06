import apiClient from './client';
import {
  Production,
  CreateProductionRequest,
  ProductionListResponse,
} from '@/types/production.types';

export const productionApi = {
  getAll: async (params?: {
    start_date?: string;
    end_date?: string;
    sweet_id?: number;
  }): Promise<ProductionListResponse> => {
    const response = await apiClient.get<ProductionListResponse>('/production', {
      params,
    });
    return response.data;
  },

  create: async (data: CreateProductionRequest): Promise<Production> => {
    const response = await apiClient.post<Production>('/production', data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/production/${id}`);
    return response.data;
  },
};

