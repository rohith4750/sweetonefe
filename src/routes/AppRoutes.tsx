import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRedirect } from './RoleBasedRedirect';
import { AppLayout } from '@/components/common/Layout';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { UserList } from '@/pages/users/UserList';
import { RawMaterialList } from '@/pages/raw-materials/RawMaterialList';
import { RecipeList } from '@/pages/recipes/RecipeList';
import { ProductionList } from '@/pages/production/ProductionList';
import { FinishedGoodsList } from '@/pages/finished-goods/FinishedGoodsList';
import { DistributionList } from '@/pages/distribution/DistributionList';
import { BranchStockList } from '@/pages/branch-stock/BranchStockList';
import { OrderList } from '@/pages/orders/OrderList';
import { ReturnsList } from '@/pages/returns/ReturnsList';
import { ReportsDashboard } from '@/pages/reports/ReportsDashboard';
import { BranchList } from '@/pages/branches/BranchList';
import { QuickBill } from '@/pages/quick-bill/QuickBill';
import { BillHistoryList } from '@/pages/bill-history/BillHistoryList';
import { Profile } from '@/pages/profile/Profile';
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
} from '@/utils/permissions';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RoleBasedRedirect />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute permissionCheck={canViewDashboard} redirectOnDeny={true}>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute permissionCheck={canManageUsers}>
            <AppLayout>
              <UserList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/branches"
        element={
          <ProtectedRoute permissionCheck={canViewBranches}>
            <AppLayout>
              <BranchList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/raw-materials"
        element={
          <ProtectedRoute permissionCheck={canManageRawMaterials}>
            <AppLayout>
              <RawMaterialList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute permissionCheck={canManageRecipes}>
            <AppLayout>
              <RecipeList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/production"
        element={
          <ProtectedRoute permissionCheck={canManageProduction}>
            <AppLayout>
              <ProductionList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finished-goods"
        element={
          <ProtectedRoute permissionCheck={canViewFinishedGoods}>
            <AppLayout>
              <FinishedGoodsList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/distribution"
        element={
          <ProtectedRoute permissionCheck={canViewDistribution}>
            <AppLayout>
              <DistributionList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/branch-stock"
        element={
          <ProtectedRoute permissionCheck={canViewBranchStock}>
            <AppLayout>
              <BranchStockList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute permissionCheck={canManageOrders}>
            <AppLayout>
              <OrderList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quick-bill"
        element={
          <ProtectedRoute permissionCheck={canCreateQuickBill}>
            <AppLayout>
              <QuickBill />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bill-history"
        element={
          <ProtectedRoute permissionCheck={canViewBillHistory}>
            <AppLayout>
              <BillHistoryList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/returns"
        element={
          <ProtectedRoute permissionCheck={canManageReturns}>
            <AppLayout>
              <ReturnsList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute permissionCheck={canViewReports}>
            <AppLayout>
              <ReportsDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RoleBasedRedirect />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

