import { Recipe } from './recipe.types';

export interface FinishedGood {
  sweet_id: number;
  name: string;
  unit_price: number;
  current_stock: number;
  reorder_level: number;
  last_updated: string;
  Recipes?: Recipe[];
}

export interface CreateFinishedGoodRequest {
  name: string;
  unit_price: number;
  current_stock?: number;
  reorder_level: number;
}

export interface UpdateFinishedGoodRequest {
  name?: string;
  unit_price?: number;
  current_stock?: number;
  reorder_level?: number;
}

export type FinishedGoodsListResponse = FinishedGood[];

