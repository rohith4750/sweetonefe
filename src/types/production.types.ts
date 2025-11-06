export interface Production {
  production_id: number;
  sweet_id: number;
  quantity_produced: number;
  production_date: string;
  created_by: number;
  wastage: number;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
  };
  Users?: {
    user_id: number;
    name: string;
    email: string;
  };
}

export interface CreateProductionRequest {
  sweet_id: number;
  quantity_produced: number;
  production_date: string;
  wastage?: number;
}

export type ProductionListResponse = Production[];

