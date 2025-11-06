import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch {
    return '';
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'HH:mm');
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Extracts error message from API error response
 * @param error - The error object from API call
 * @param defaultMessage - Default message if no error message is found
 * @returns Error message string
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (!error) return defaultMessage;
  
  // Try to get message from various possible locations
  const message = 
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    defaultMessage;
  
  return typeof message === 'string' ? message : defaultMessage;
};

/**
 * Extracts success message from API response
 * @param response - The response object from API call
 * @param defaultMessage - Default message if no success message is found
 * @returns Success message string
 */
export const getSuccessMessage = (response: any, defaultMessage: string = 'Operation completed successfully'): string => {
  if (!response) return defaultMessage;
  
  const message = 
    response.data?.message ||
    response.message ||
    defaultMessage;
  
  return typeof message === 'string' ? message : defaultMessage;
};

