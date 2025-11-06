import { ROLES } from "./constants";

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const canViewDashboard = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.KITCHEN_ADMIN || role === ROLES.BRANCH_ADMIN;
};

export const canManageUsers = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN;
};

export const canManageProduction = (role: string): boolean => {
  return role === ROLES.KITCHEN_ADMIN;
};

export const canManageRawMaterials = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.KITCHEN_ADMIN;
};

export const canManageRecipes = (role: string): boolean => {
  return role === ROLES.KITCHEN_ADMIN;
};

export const canManageFinishedGoods = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.KITCHEN_ADMIN;
};

export const canViewFinishedGoods = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.KITCHEN_ADMIN;
};

export const canManageDistribution = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.KITCHEN_ADMIN;
};

export const canApproveDistribution = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.TRANSPORT_ADMIN;
};

export const canViewDistribution = (role: string): boolean => {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.KITCHEN_ADMIN ||
    role === ROLES.TRANSPORT_ADMIN
  );
};

export const canManageOrders = (role: string): boolean => {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.KITCHEN_ADMIN ||
    role === ROLES.BRANCH_ADMIN ||
    role === ROLES.USER
  );
};

export const canManageReturns = (role: string): boolean => {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.KITCHEN_ADMIN ||
    role === ROLES.BRANCH_ADMIN
  );
};

export const canViewReports = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN || role === ROLES.KITCHEN_ADMIN;
};

export const canViewBranchStock = (role: string): boolean => {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.KITCHEN_ADMIN ||
    role === ROLES.BRANCH_ADMIN
  );
  // All authenticated users can view branch stock
};

export const canViewBranches = (role: string): boolean => {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.KITCHEN_ADMIN ||
    role === ROLES.BRANCH_ADMIN
  );
};

export const canManageBranches = (role: string): boolean => {
  return role === ROLES.SUPER_ADMIN;
};

export const canCreateQuickBill = (role: string): boolean => {
  return role === ROLES.BRANCH_ADMIN;
};

export const canViewBillHistory = (role: string): boolean => {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.KITCHEN_ADMIN ||
    role === ROLES.BRANCH_ADMIN
  );
  // role === ROLES.USER;
};
