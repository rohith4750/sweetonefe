import React from 'react';
import { theme } from '@/styles/theme';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const widthClass = fullWidth ? 'btn-full-width' : '';
  const loadingClass = isLoading ? 'btn-loading' : '';
  const disabledClass = disabled || isLoading ? 'btn-disabled' : '';

  return (
    <button
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${disabledClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="btn-spinner" />}
      <span className={isLoading ? 'btn-content-hidden' : ''}>{children}</span>
    </button>
  );
};

