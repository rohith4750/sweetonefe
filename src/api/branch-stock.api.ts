import apiClient from './client';
import {
  BranchStockListResponse,
} from '@/types/branch-stock.types';

export const branchStockApi = {
  getAll: async (branch_id?: number): Promise<BranchStockListResponse> => {
    const params = branch_id ? { branch_id } : {};
    const response = await apiClient.get<BranchStockListResponse>('/branch-stock', {
      params,
    });
    return response.data;
  },
};

