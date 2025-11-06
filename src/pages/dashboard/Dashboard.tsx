import React, { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders.api';
import { reportsApi } from '@/api/reports.api';
import { branchesApi } from '@/api/branches.api';
import { Loading } from '@/components/common';
import { formatCurrency } from '@/utils/formatters';
import { ROLES } from '@/utils/constants';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayEndStr = todayEnd.toISOString(); // Full ISO string with time

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => reportsApi.getAlerts(),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'dashboard'],
    queryFn: () => ordersApi.getAll({ status: 'pending' }),
  });

  // Fetch today's completed orders
  const { data: todayOrders, isLoading: todaySalesLoading } = useQuery({
    queryKey: ['today-sales', user?.branch_id, isSuperAdmin, todayStart],
    queryFn: () => {
      const params: any = {
        status: 'completed',
        start_date: todayStart, // YYYY-MM-DD format
        end_date: todayEndStr, // Full ISO string
      };
      
      // For branch users, filter by their branch
      if (!isSuperAdmin && user?.branch_id) {
        params.branch_id = user.branch_id;
      }
      
      return ordersApi.getAll(params);
    },
  });

  // Fetch all branches for super admin
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll(),
    enabled: isSuperAdmin,
  });

  // Calculate today's sales
  const todaySales = useMemo(() => {
    if (!todayOrders || todayOrders.length === 0) {
      return {
        branchSales: [],
        totalSales: 0,
        totalOrders: 0,
      };
    }

    if (isSuperAdmin && branches) {
      // For super admin: Calculate sales per branch
      const branchSalesMap = new Map<number, { name: string; amount: number; orders: number }>();
      
      // Initialize all branches with zero sales
      branches.forEach(branch => {
        branchSalesMap.set(branch.branch_id, {
          name: branch.name,
          amount: 0,
          orders: 0,
        });
      });

      // Calculate sales from orders
      todayOrders.forEach(order => {
        if (order.status === 'completed' && order.branch_id) {
          // Convert total_amount to number if it's a string
          const amount = typeof order.total_amount === 'string' 
            ? parseFloat(order.total_amount) 
            : (order.total_amount || 0);
          
          const existing = branchSalesMap.get(order.branch_id);
          if (existing) {
            existing.amount += amount;
            existing.orders += 1;
          } else {
            // Branch not in list, add it
            branchSalesMap.set(order.branch_id, {
              name: order.Branches?.name || `Branch ${order.branch_id}`,
              amount: amount,
              orders: 1,
            });
          }
        }
      });

      const branchSales = Array.from(branchSalesMap.values()).filter(
        branch => branch.amount > 0 || branch.orders > 0
      );

      const totalSales = branchSales.reduce((sum, branch) => sum + branch.amount, 0);
      const totalOrders = branchSales.reduce((sum, branch) => sum + branch.orders, 0);

      return {
        branchSales,
        totalSales,
        totalOrders,
      };
    } else {
      // For branch users: Show only their branch sales
      const branchSales = todayOrders
        .filter(order => order.status === 'completed')
        .reduce((acc, order) => {
          // Convert total_amount to number if it's a string
          const amount = typeof order.total_amount === 'string' 
            ? parseFloat(order.total_amount) 
            : (order.total_amount || 0);
          acc.amount += amount;
          acc.orders += 1;
          return acc;
        }, { amount: 0, orders: 0 });

      return {
        branchSales: [],
        totalSales: branchSales.amount,
        totalOrders: branchSales.orders,
      };
    }
  }, [todayOrders, isSuperAdmin, branches]);

  if (!user) return null;

  const stats = [
    {
      title: 'Pending Orders',
      value: orders?.length || 0,
      color: 'warning',
    },
    {
      title: 'Low Stock Alerts',
      value:
        (alerts?.raw_materials?.length || 0) + (alerts?.finished_goods?.length || 0),
      color: 'error',
    },
    {
      title: "Today's Sales",
      value: formatCurrency(todaySales.totalSales),
      color: 'success',
      displayValue: true,
    },
    {
      title: "Today's Orders",
      value: todaySales.totalOrders,
      color: 'info',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome, {user.name}!</h1>
        <p className="dashboard-subtitle">
          Here's an overview of your {user.role.replace('_', ' ')} dashboard
        </p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div key={index} className={`dashboard-stat dashboard-stat-${stat.color}`}>
            <h3 className="dashboard-stat-title">{stat.title}</h3>
            <p className="dashboard-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      {(alertsLoading || ordersLoading || todaySalesLoading) && <Loading />}

      {/* Today's Sales Section */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          Today's Sales {isSuperAdmin ? '(All Branches)' : `(${user?.Branches?.name || 'Branch'})`}
        </h2>
        {isSuperAdmin && todaySales.branchSales.length > 0 && todaySales.totalOrders > 0 ? (
          <div className="dashboard-sales">
            <div className="dashboard-sales-list">
              {todaySales.branchSales.map((branch, index) => (
                <div key={index} className="dashboard-sale-item">
                  <span className="dashboard-sale-branch">{branch.name}</span>
                  <span className="dashboard-sale-orders">{branch.orders} orders</span>
                  <span className="dashboard-sale-amount">{formatCurrency(branch.amount)}</span>
                </div>
              ))}
            </div>
            <div className="dashboard-sales-total">
              <span className="dashboard-sales-total-label">Total Sales:</span>
              <span className="dashboard-sales-total-value">{formatCurrency(todaySales.totalSales)}</span>
            </div>
          </div>
        ) : isSuperAdmin && todaySales.branchSales.length === 0 ? (
          <div className="dashboard-sales-empty">
            <p>No sales recorded for today</p>
          </div>
        ) : (
          <div className="dashboard-sales-single">
            <div className="dashboard-sale-item">
              <span className="dashboard-sale-branch">{user?.Branches?.name || 'Branch'}</span>
              <span className="dashboard-sale-orders">{todaySales.totalOrders} orders</span>
              <span className="dashboard-sale-amount">{formatCurrency(todaySales.totalSales)}</span>
            </div>
          </div>
        )}
      </div>

      {alerts && (
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Low Stock Alerts</h2>
          <div className="dashboard-alerts">
            {alerts.raw_materials?.map((material) => (
              <div key={material.material_id} className="dashboard-alert">
                <span className="dashboard-alert-label">Raw Material:</span>
                <span className="dashboard-alert-name">{material.name}</span>
                <span className="dashboard-alert-stock">
                  Stock: {material.current_stock} (Reorder: {material.reorder_level})
                </span>
              </div>
            ))}
            {alerts.finished_goods?.map((good) => (
              <div key={good.sweet_id} className="dashboard-alert">
                <span className="dashboard-alert-label">Finished Good:</span>
                <span className="dashboard-alert-name">{good.name}</span>
                <span className="dashboard-alert-stock">
                  Stock: {good.current_stock} (Reorder: {good.reorder_level})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

