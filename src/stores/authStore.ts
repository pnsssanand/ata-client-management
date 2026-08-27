import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthUser {
  email: string;
  name: string;
  role: 'admin' | 'staff';
  userId: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
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
  },
  {
    email: 'atabniclients@gmail.com',
    password: 'atabniclients@gmail.com',
    name: 'ATABNIC Clients',
    role: 'admin' as const,
    userId: 'atabniclients'
  }
];


export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: async (email: string, password: string) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        
        // 1. Check hardcoded users first
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

        // 2. If not hardcoded, check Firebase Auth
        try {
          const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
          const uid = userCredential.user.uid;
          
          // Fetch user details from Firestore
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            set({
              isAuthenticated: true,
              user: {
                email: userData.email,
                name: userData.name,
                role: userData.role || 'staff',
                userId: uid
              }
            });
            return true;
          } else {
            // If user doc doesn't exist but auth succeeded (fallback)
            set({
              isAuthenticated: true,
              user: {
                email: trimmedEmail,
                name: 'User',
                role: 'staff',
                userId: uid
              }
            });
            return true;
          }
        } catch (error) {
          console.error("Firebase login error:", error);
          return false;
        }
      },

      signup: async (email: string, password: string, name: string) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        
        try {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
          const uid = userCredential.user.uid;
          
          // Store additional user details in Firestore
          await setDoc(doc(db, 'users', uid), {
            email: trimmedEmail,
            name: name.trim(),
            role: 'staff', // default role
            userId: uid,
            createdAt: new Date().toISOString()
          });

          // Log them in immediately
          set({
            isAuthenticated: true,
            user: {
              email: trimmedEmail,
              name: name.trim(),
              role: 'staff',
              userId: uid
            }
          });
          
          return true;
        } catch (error) {
          console.error("Firebase signup error:", error);
          return false;
        }
      },

      logout: () => {
        auth.signOut().catch(console.error);
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
