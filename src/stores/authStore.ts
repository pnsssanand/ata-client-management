import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  email: string;
  name: string;
  role: 'admin' | 'staff';
}

interface AuthStore {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Hardcoded credentials
const VALID_CREDENTIALS = {
  email: 'anandtravelagency@gmail.com',
  password: 'anandtravelagency@gmail.com',
  name: 'Anand Travel Agency',
  role: 'admin' as const
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (email: string, password: string) => {
        if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
          set({
            isAuthenticated: true,
            user: {
              email: VALID_CREDENTIALS.email,
              name: VALID_CREDENTIALS.name,
              role: VALID_CREDENTIALS.role
            }
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null
        });
      }
    }),
    {
      name: 'ata-auth-storage'
    }
  )
);
