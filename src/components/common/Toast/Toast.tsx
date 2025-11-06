import React, { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return null;
    }
  };

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{toast.message}</span>
      </div>
      <button
        className="toast-close"
        onClick={() => onClose(toast.id)}
        aria-label="Close toast"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

