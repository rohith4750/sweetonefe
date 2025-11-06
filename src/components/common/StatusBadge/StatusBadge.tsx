import React from 'react';
import './StatusBadge.css';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  children?: React.ReactNode;
}

const statusVariantMap: Record<string, StatusVariant> = {
  active: 'success',
  completed: 'success',
  approved: 'success',
  pending: 'warning',
  processing: 'info',
  cancelled: 'error',
  rejected: 'error',
  inactive: 'error',
  default: 'default',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  children,
}) => {
  const badgeVariant = variant || statusVariantMap[status.toLowerCase()] || 'default';
  const displayText = children || status;

  return <span className={`status-badge status-badge-${badgeVariant}`}>{displayText}</span>;
};

