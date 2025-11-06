export interface Recipe {
  recipe_id: number;
  sweet_id: number;
  material_id: number;
  quantity_required: number;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
    unit_price: number;
    current_stock: number;
    reorder_level: number;
    last_updated: string;
  };
  RawMaterials?: {
    material_id: number;
    name: string;
    unit: string;
    current_stock: number;
    reorder_level: number;
    price_per_unit: number;
    last_updated: string;
  };
}

export interface CreateRecipeRequest {
  sweet_id: number;
  material_id: number;
  quantity_required: number;
}

export interface UpdateRecipeRequest {
  quantity_required?: number;
}

export type RecipeListResponse = Recipe[];

