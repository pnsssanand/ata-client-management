import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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

// Enable offline persistence for real-time sync across devices
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support persistence
    console.warn('Firestore persistence not supported in this browser');
  }
});

// Initialize Auth
export const auth = getAuth(app);

export default app;
