import apiClient from './client';
import { LoginRequest, LoginResponse } from '@/types/auth.types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },
};

