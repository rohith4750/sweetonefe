export interface RawMaterial {
  material_id: number;
  name: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
  price_per_unit: number;
  last_updated: string;
  Recipes?: Recipe[];
}

export interface Recipe {
  recipe_id: number;
  sweet_id: number;
  material_id: number;
  quantity_required: number;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
  };
}

export interface CreateRawMaterialRequest {
  name: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
  price_per_unit: number;
}

export interface UpdateRawMaterialRequest {
  name?: string;
  unit?: string;
  current_stock?: number;
  reorder_level?: number;
  price_per_unit?: number;
}

export type RawMaterialListResponse = RawMaterial[];

