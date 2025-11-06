import apiClient from './client';
import {
  RawMaterial,
  CreateRawMaterialRequest,
  UpdateRawMaterialRequest,
  RawMaterialListResponse,
} from '@/types/raw-material.types';

export const rawMaterialsApi = {
  getAll: async (): Promise<RawMaterialListResponse> => {
    const response = await apiClient.get<RawMaterialListResponse>('/raw-materials');
    return response.data;
  },

  getById: async (id: number): Promise<RawMaterial> => {
    const response = await apiClient.get<RawMaterial>(`/raw-materials/${id}`);
    return response.data;
  },

  create: async (data: CreateRawMaterialRequest): Promise<RawMaterial> => {
    const response = await apiClient.post<RawMaterial>('/raw-materials', data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateRawMaterialRequest
  ): Promise<RawMaterial> => {
    const response = await apiClient.put<RawMaterial>(`/raw-materials/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/raw-materials/${id}`
    );
    return response.data;
  },
};

