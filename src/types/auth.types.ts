export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'kitchen_admin' | 'branch_admin' | 'transport_admin' | 'user';
  branch_id: number | null;
  status: 'active' | 'inactive';
  phone?: string | null;
  created_at: string;
  Branches?: {
    name: string;
  } | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

