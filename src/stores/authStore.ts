import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  email: string;
  name: string;
  role: 'admin' | 'staff';
  userId: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Hardcoded credentials for multiple users
const VALID_USERS = [
  {
    email: 'anandtravelagency@gmail.com',
    password: 'anandtravelagency@gmail.com',
    name: 'Anand Travel Agency',
    role: 'admin' as const,
    userId: 'anandtravelagency'
  },
  {
    email: 'atamanager@gmail.com',
    password: 'atamanager@gmail.com',
    name: 'ATA Manager',
    role: 'admin' as const,
    userId: 'atamanager'
  }
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (email: string, password: string) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        
        const validUser = VALID_USERS.find(
          user => user.email.toLowerCase() === trimmedEmail && user.password === trimmedPassword
        );
        
        if (validUser) {
          set({
            isAuthenticated: true,
            user: {
              email: validUser.email,
              name: validUser.name,
              role: validUser.role,
              userId: validUser.userId
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
