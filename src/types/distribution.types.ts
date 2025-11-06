export interface Distribution {
  distribution_id: number;
  sweet_id: number;
  to_branch: number;
  quantity_sent: number;
  date: string;
  distributed_by: number;
  status?: 'pending' | 'approved' | 'rejected';
  approved_by?: number | null;
  approved_at?: string | null;
  reason?: string | null;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
  };
  Branches?: {
    branch_id: number;
    name: string;
  };
  Users?: {
    user_id: number;
    name: string;
    email: string;
  };
  CreatedBy?: {
    user_id: number;
    name: string;
    email: string;
  };
  ApprovedBy?: {
    user_id: number;
    name: string;
    email: string;
  } | null;
}

export interface CreateDistributionRequest {
  sweet_id: number;
  to_branch: number;
  quantity_sent: number;
  date: string;
}

export type DistributionListResponse = Distribution[];

export interface DistributionHistorySummary {
  total_distributions: number;
  approved: number;
  pending: number;
  rejected: number;
  total_quantity: number;
  total_value: number;
}

export interface DistributionByBranch {
  branch_name: string;
  total_distributions: number;
  total_quantity: number;
  total_value: number;
}

export interface DistributionByProduct {
  product_name: string;
  total_distributions: number;
  total_quantity: number;
  total_value: number;
}

export interface DistributionHistoryItem {
  distribution_id: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  product: string;
  branch: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  created_by: string;
  approved_by?: string | null;
  approved_at?: string | null;
}

export interface DistributionHistoryResponse {
  summary: DistributionHistorySummary;
  by_branch: DistributionByBranch[];
  by_product: DistributionByProduct[];
  history: DistributionHistoryItem[];
}

