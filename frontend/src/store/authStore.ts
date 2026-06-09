import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthEmployee } from '../types';

interface AuthState {
  token: string | null;
  employee: AuthEmployee | null;
  isAuthenticated: boolean;
  login: (token: string, employee: AuthEmployee) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      employee: null,
      isAuthenticated: false,
      login: (token, employee) =>
        set({ token, employee, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('auth-storage');
        set({ token: null, employee: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
