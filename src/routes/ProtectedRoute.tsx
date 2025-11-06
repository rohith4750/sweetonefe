import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getDefaultRouteForRole } from '@/utils/menu';
import { Loading } from '@/components/common';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  permissionCheck?: (role: string) => boolean;
  redirectOnDeny?: boolean; // If true, redirect to default route instead of showing Access Denied
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  permissionCheck,
  redirectOnDeny = false,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      if (redirectOnDeny) {
        const defaultRoute = getDefaultRouteForRole(user.role);
        return <Navigate to={defaultRoute} replace />;
      }
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }
  }

  if (permissionCheck && !permissionCheck(user.role)) {
    if (redirectOnDeny) {
      const defaultRoute = getDefaultRouteForRole(user.role);
      return <Navigate to={defaultRoute} replace />;
    }
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};

