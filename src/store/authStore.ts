import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth.types';
import { authApi } from '@/api/auth.api';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
          });
          localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        } catch (error) {
          throw error;
        }
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      },
      checkAuth: () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
            });
          } catch {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        }
      },
      setUser: (user: User | null) => set({ user }),
      setToken: (token: string | null) => set({ token }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

