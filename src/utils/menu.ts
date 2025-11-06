import { ROLES } from "./constants";
import {
  canViewDashboard,
  canManageUsers,
  canManageProduction,
  canManageRawMaterials,
  canManageRecipes,
  canViewFinishedGoods,
  canViewDistribution,
  canManageOrders,
  canManageReturns,
  canViewReports,
  canViewBranchStock,
  canViewBranches,
  canCreateQuickBill,
  canViewBillHistory,
} from "./permissions";

export interface MenuItem {
  path: string;
  label: string;
  icon: string;
  permission?: (role: string) => boolean;
}

// Menu items organized by role
const roleBasedMenu: Record<string, MenuItem[]> = {
  [ROLES.SUPER_ADMIN]: [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      permission: canViewDashboard,
    },
    {
      path: "/users",
      label: "Users",
      icon: "👥",
      permission: canManageUsers,
    },
    {
      path: "/branches",
      label: "Branches",
      icon: "🏢",
      permission: canViewBranches,
    },
    {
      path: "/raw-materials",
      label: "Raw Materials",
      icon: "🥚",
      permission: canManageRawMaterials,
    },
    {
      path: "/finished-goods",
      label: "Finished Goods",
      icon: "🍬",
      permission: canViewFinishedGoods,
    },
    {
      path: "/distribution",
      label: "Distribution",
      icon: "🚚",
      permission: canViewDistribution,
    },
    {
      path: "/branch-stock",
      label: "Branch Stock",
      icon: "📦",
      permission: canViewBranchStock,
    },
    {
      path: "/orders",
      label: "Orders",
      icon: "🛒",
      permission: canManageOrders,
    },
    {
      path: "/bill-history",
      label: "Bill History",
      icon: "🧾",
      permission: canViewBillHistory,
    },
    {
      path: "/returns",
      label: "Returns",
      icon: "↩️",
      permission: canManageReturns,
    },
    {
      path: "/reports",
      label: "Reports",
      icon: "📈",
      permission: canViewReports,
    },
  ],
  [ROLES.KITCHEN_ADMIN]: [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      permission: canViewDashboard,
    },
    {
      path: "/branches",
      label: "Branches",
      icon: "🏢",
      permission: canViewBranches,
    },
    {
      path: "/raw-materials",
      label: "Raw Materials",
      icon: "🥚",
      permission: canManageRawMaterials,
    },
    {
      path: "/recipes",
      label: "Recipes",
      icon: "📝",
      permission: canManageRecipes,
    },
    {
      path: "/production",
      label: "Production",
      icon: "🏭",
      permission: canManageProduction,
    },
    {
      path: "/finished-goods",
      label: "Finished Goods",
      icon: "🍬",
      permission: canViewFinishedGoods,
    },
    {
      path: "/distribution",
      label: "Distribution",
      icon: "🚚",
      permission: canViewDistribution,
    },
    {
      path: "/branch-stock",
      label: "Branch Stock",
      icon: "📦",
      permission: canViewBranchStock,
    },
    {
      path: "/orders",
      label: "Orders",
      icon: "🛒",
      permission: canManageOrders,
    },
    {
      path: "/bill-history",
      label: "Bill History",
      icon: "🧾",
      permission: canViewBillHistory,
    },
    {
      path: "/returns",
      label: "Returns",
      icon: "↩️",
      permission: canManageReturns,
    },
    {
      path: "/reports",
      label: "Reports",
      icon: "📈",
      permission: canViewReports,
    },
  ],
  [ROLES.BRANCH_ADMIN]: [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      permission: canViewDashboard,
    },
    {
      path: "/branch-stock",
      label: "Branch Stock",
      icon: "📦",
      permission: canViewBranchStock,
    },
    {
      path: "/orders",
      label: "Orders",
      icon: "🛒",
      permission: canManageOrders,
    },
    {
      path: "/quick-bill",
      label: "Quick Bill",
      icon: "⚡",
      permission: canCreateQuickBill,
    },
    {
      path: "/bill-history",
      label: "Bill History",
      icon: "🧾",
      permission: canViewBillHistory,
    },
    {
      path: "/returns",
      label: "Returns",
      icon: "↩️",
      permission: canManageReturns,
    },
  ],
  [ROLES.TRANSPORT_ADMIN]: [
    {
      path: "/distribution",
      label: "Delivery Management",
      icon: "🚚",
      permission: canViewDistribution,
    },
  ],
  [ROLES.USER]: [
    {
      path: "/orders",
      label: "Orders",
      icon: "🛒",
      permission: canManageOrders,
    },
  ],
};

/**
 * Get menu items for a specific role
 * @param role - User role
 * @returns Array of menu items filtered by role and permission
 */
export const getMenuItemsForRole = (role: string): MenuItem[] => {
  const roleMenu = roleBasedMenu[role] || [];

  // Filter by permission check
  return roleMenu.filter((item) =>
    item.permission ? item.permission(role) : true
  );
};

/**
 * Get the default landing page for a specific role
 * @param role - User role
 * @returns Default route path for the role
 */
export const getDefaultRouteForRole = (role: string): string => {
  const roleMenu = roleBasedMenu[role] || [];

  // Get the first available menu item (usually the landing page)
  if (roleMenu.length > 0) {
    // Filter by permission and return the first valid item
    const validItems = roleMenu.filter((item) =>
      item.permission ? item.permission(role) : true
    );
    if (validItems.length > 0) {
      return validItems[0].path;
    }
  }

  // Fallback to distribution for transport_admin, dashboard for others
  if (role === ROLES.TRANSPORT_ADMIN) {
    return "/distribution";
  }

  return "/dashboard";
};

/**
 * Get all menu items (for backward compatibility)
 * Returns all menu items grouped by role
 */
export const menuItems: MenuItem[] = Object.values(roleBasedMenu).flat();
