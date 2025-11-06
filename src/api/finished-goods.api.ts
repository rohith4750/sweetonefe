import apiClient from './client';
import {
  FinishedGood,
  CreateFinishedGoodRequest,
  UpdateFinishedGoodRequest,
  FinishedGoodsListResponse,
} from '@/types/finished-goods.types';

export const finishedGoodsApi = {
  getAll: async (): Promise<FinishedGoodsListResponse> => {
    const response = await apiClient.get<FinishedGoodsListResponse>('/finished-goods');
    return response.data;
  },

  getById: async (id: number): Promise<FinishedGood> => {
    const response = await apiClient.get<FinishedGood>(`/finished-goods/${id}`);
    return response.data;
  },

  create: async (data: CreateFinishedGoodRequest): Promise<FinishedGood> => {
    const response = await apiClient.post<FinishedGood>('/finished-goods', data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateFinishedGoodRequest
  ): Promise<FinishedGood> => {
    const response = await apiClient.put<FinishedGood>(`/finished-goods/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/finished-goods/${id}`
    );
    return response.data;
  },
};

