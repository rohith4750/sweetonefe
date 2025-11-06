export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sweets Management System';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  KITCHEN_ADMIN: 'kitchen_admin',
  TRANSPORT_ADMIN: 'transport_admin',
  BRANCH_ADMIN: 'branch_admin',
  USER: 'user',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const DISTRIBUTION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
} as const;

