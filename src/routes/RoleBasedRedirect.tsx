import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getDefaultRouteForRole } from '@/utils/menu';

export const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const defaultRoute = getDefaultRouteForRole(user.role);
  return <Navigate to={defaultRoute} replace />;
};

