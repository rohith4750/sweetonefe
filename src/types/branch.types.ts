export interface Branch {
  branch_id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export type BranchListResponse = Branch[];

