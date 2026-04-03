import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'tech_admin' | 'admin' | 'senior_manager' | 'manager' | 'client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  organization?: string;
  position?: string;
  phone?: string;
  role: UserRole;
  status: string;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },
      isAuthenticated: () => !!get().user && !!get().accessToken,
    }),
    {
      name: 'lk-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
);

// Role helpers
export const ROLE_LABELS: Record<UserRole, string> = {
  tech_admin: 'Техадмин',
  admin: 'Администратор',
  senior_manager: 'Старший менеджер',
  manager: 'Менеджер',
  client: 'Клиент',
};

export const canAccess = (userRole: UserRole, allowed: UserRole[]): boolean =>
  allowed.includes(userRole);
