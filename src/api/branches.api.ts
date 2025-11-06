import apiClient from './client';
import {
  Branch,
  CreateBranchRequest,
  UpdateBranchRequest,
  BranchListResponse,
} from '@/types/branch.types';

export const branchesApi = {
  getAll: async (params?: { status?: 'active' | 'inactive' }): Promise<BranchListResponse> => {
    const response = await apiClient.get<BranchListResponse>('/branches', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Branch> => {
    const response = await apiClient.get<Branch>(`/branches/${id}`);
    return response.data;
  },

  create: async (data: CreateBranchRequest): Promise<Branch> => {
    const response = await apiClient.post<Branch>('/branches', data);
    return response.data;
  },

  update: async (id: number, data: UpdateBranchRequest): Promise<Branch> => {
    const response = await apiClient.put<Branch>(`/branches/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/branches/${id}`);
    return response.data;
  },
};

