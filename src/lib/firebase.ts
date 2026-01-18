import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDsgu3T0pTaZvunvcpfUYyo1qg3QTqnF0k",
  authDomain: "ata-client-manager.firebaseapp.com",
  projectId: "ata-client-manager",
  storageBucket: "ata-client-manager.firebasestorage.app",
  messagingSenderId: "169523722364",
  appId: "1:169523722364:web:fbea55cab528bcff61b1f9",
  measurementId: "G-EC2DXYYFEJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
