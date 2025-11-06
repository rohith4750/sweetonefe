export interface BranchStock {
  id: number;
  branch_id: number;
  sweet_id: number;
  current_stock: number;
  last_updated: string;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
    unit_price: number;
  };
  Branches?: {
    branch_id: number;
    name: string;
  };
}

export type BranchStockListResponse = BranchStock[];

