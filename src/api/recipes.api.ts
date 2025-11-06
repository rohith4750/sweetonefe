import apiClient from './client';
import {
  Recipe,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  RecipeListResponse,
} from '@/types/recipe.types';

export const recipesApi = {
  getAll: async (sweet_id?: number): Promise<RecipeListResponse> => {
    const params = sweet_id ? { sweet_id } : {};
    const response = await apiClient.get<RecipeListResponse>('/recipes', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Recipe> => {
    const response = await apiClient.get<Recipe>(`/recipes/${id}`);
    return response.data;
  },

  create: async (data: CreateRecipeRequest): Promise<Recipe> => {
    const response = await apiClient.post<Recipe>('/recipes', data);
    return response.data;
  },

  update: async (id: number, data: UpdateRecipeRequest): Promise<Recipe> => {
    const response = await apiClient.put<Recipe>(`/recipes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/recipes/${id}`);
    return response.data;
  },
};

