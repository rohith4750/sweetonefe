export interface Return {
  return_id: number;
  branch_id: number;
  sweet_id: number;
  quantity: number;
  reason: string;
  date: string;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
  };
  Branches?: {
    branch_id: number;
    name: string;
  };
}

export interface CreateReturnRequest {
  branch_id?: number;
  sweet_id: number;
  quantity: number;
  reason: string;
  date: string;
}

export type ReturnListResponse = Return[];

