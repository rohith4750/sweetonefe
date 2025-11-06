import { User } from './auth.types';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'kitchen_admin' | 'branch_admin' | 'transport_admin' | 'user';
  branch_id?: number | null;
  phone?: string | null;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'super_admin' | 'kitchen_admin' | 'branch_admin' | 'transport_admin' | 'user';
  branch_id?: number | null;
  status?: 'active' | 'inactive';
  phone?: string | null;
}

export type UserListResponse = User[];

