import apiClient from './client';
import { User } from '@/types/auth.types';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,
} from '@/types/user.types';

export const usersApi = {
  getAll: async (): Promise<UserListResponse> => {
    const response = await apiClient.get<UserListResponse>('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },
};

