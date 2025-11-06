import apiClient from './client';
import {
  Distribution,
  CreateDistributionRequest,
  DistributionListResponse,
  DistributionHistoryResponse,
} from '@/types/distribution.types';

export const distributionApi = {
  getAll: async (params?: {
    start_date?: string;
    end_date?: string;
    branch_id?: number;
    status?: 'pending' | 'approved' | 'rejected';
    limit?: number;
    offset?: number;
  }): Promise<DistributionListResponse> => {
    const response = await apiClient.get<DistributionListResponse>('/distribution', {
      params,
    });
    return response.data;
  },

  getHistory: async (params?: {
    start_date?: string;
    end_date?: string;
    branch_id?: number;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<DistributionHistoryResponse> => {
    const response = await apiClient.get<DistributionHistoryResponse>('/distribution/history', {
      params,
    });
    return response.data;
  },

  create: async (data: CreateDistributionRequest): Promise<Distribution> => {
    const response = await apiClient.post<Distribution>('/distribution', data);
    return response.data;
  },

  approve: async (id: number): Promise<Distribution> => {
    const response = await apiClient.put<Distribution>(`/distribution/${id}/approve`);
    return response.data;
  },

  reject: async (id: number, reason: string): Promise<Distribution> => {
    const response = await apiClient.put<Distribution>(`/distribution/${id}/reject`, { reason });
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/distribution/${id}`);
    return response.data;
  },
};

