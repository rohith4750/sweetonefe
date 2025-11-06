import { create } from 'zustand';
import { Toast, ToastType } from './Toast';

interface ToastStore {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  showToast: (message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    const toast: Toast = { id, message, type, duration };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
  },
  
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  success: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, 'success', duration);
  },
  
  error: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, 'error', duration);
  },
  
  warning: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, 'warning', duration);
  },
  
  info: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, 'info', duration);
  },
}));

// Export convenience functions
export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().success(message, duration),
  error: (message: string, duration?: number) => useToastStore.getState().error(message, duration),
  warning: (message: string, duration?: number) => useToastStore.getState().warning(message, duration),
  info: (message: string, duration?: number) => useToastStore.getState().info(message, duration),
};

