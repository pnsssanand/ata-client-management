import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { Client, DropdownField, Note } from '@/types/client';

// Helper to get user-specific collection path
const getUserClientsCollection = (userId: string) => `users/${userId}/clients`;
const getUserDropdownsCollection = (userId: string) => `users/${userId}/dropdowns`;

// Legacy collection references (for backward compatibility with existing data)
const LEGACY_CLIENTS_COLLECTION = 'clients';
const LEGACY_DROPDOWNS_COLLECTION = 'dropdowns';

// Legacy user ID - this user uses the old collection structure
const LEGACY_USER_ID = 'anandtravelagency';

// Helper to get correct collection path based on userId
const getClientsCollectionPath = (userId?: string): string => {
  // If no userId or legacy user, use legacy collection
  if (!userId || userId === LEGACY_USER_ID) {
    return LEGACY_CLIENTS_COLLECTION;
  }
  // New users get user-specific collections
  return getUserClientsCollection(userId);
};

const getDropdownsCollectionPath = (userId?: string): string => {
  // If no userId or legacy user, use legacy collection
  if (!userId || userId === LEGACY_USER_ID) {
    return LEGACY_DROPDOWNS_COLLECTION;
  }
  // New users get user-specific collections
  return getUserDropdownsCollection(userId);
};

// Convert Date to Firestore Timestamp
const dateToTimestamp = (date: Date | undefined): Timestamp | null => {
  if (!date) return null;
  return Timestamp.fromDate(date instanceof Date ? date : new Date(date));
};

// Convert Firestore Timestamp to Date
const timestampToDate = (timestamp: Timestamp | null | undefined): Date => {
  if (!timestamp) return new Date();
  return timestamp.toDate();
};

// Convert Client to Firestore format
const clientToFirestore = (client: Client): DocumentData => {
  return {
    ...client,
    createdAt: dateToTimestamp(client.createdAt),
    lastContacted: dateToTimestamp(client.lastContacted),
    notes: client.notes.map(note => ({
      ...note,
      createdAt: dateToTimestamp(note.createdAt)
    }))
  };
};

// Convert Firestore document to Client
const firestoreToClient = (data: DocumentData): Client => {
  return {
    ...data,
    createdAt: timestampToDate(data.createdAt),
    lastContacted: data.lastContacted ? timestampToDate(data.lastContacted) : undefined,
    notes: (data.notes || []).map((note: DocumentData) => ({
      ...note,
      createdAt: timestampToDate(note.createdAt)
    }))
  } as Client;
};

// Convert DropdownField to Firestore format
const dropdownToFirestore = (dropdown: DropdownField): DocumentData => {
  return {
    ...dropdown,
    createdAt: dateToTimestamp(dropdown.createdAt),
    updatedAt: dateToTimestamp(dropdown.updatedAt || new Date())
  };
};

// Convert Firestore document to DropdownField
const firestoreToDropdown = (data: DocumentData): DropdownField => {
  return {
    ...data,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined
  } as DropdownField;
};

// Client operations
export const saveClient = async (client: Client, userId?: string): Promise<void> => {
  const collectionPath = getClientsCollectionPath(userId);
  const clientRef = doc(db, collectionPath, client.id);
  await setDoc(clientRef, clientToFirestore(client));
};

export const deleteClientFromFirestore = async (clientId: string, userId?: string): Promise<void> => {
  const collectionPath = getClientsCollectionPath(userId);
  const clientRef = doc(db, collectionPath, clientId);
  await deleteDoc(clientRef);
};

// Subscribe to clients collection
export const subscribeToClients = (
  onClientsChange: (clients: Client[]) => void,
  onError?: (error: Error) => void,
  userId?: string
) => {
  const collectionPath = getClientsCollectionPath(userId);
  const clientsRef = collection(db, collectionPath);
  
  return onSnapshot(
    clientsRef,
    (snapshot) => {
      const clients: Client[] = [];
      snapshot.forEach((doc) => {
        clients.push(firestoreToClient(doc.data()));
      });
      // Sort by createdAt descending
      clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onClientsChange(clients);
    },
    (error) => {
      console.error('Error subscribing to clients:', error);
      onError?.(error);
    }
  );
};

// Dropdown operations
export const saveDropdown = async (dropdown: DropdownField, userId?: string): Promise<void> => {
  const collectionPath = getDropdownsCollectionPath(userId);
  const dropdownRef = doc(db, collectionPath, dropdown.id);
  await setDoc(dropdownRef, dropdownToFirestore(dropdown));
};

export const deleteDropdownFromFirestore = async (dropdownId: string, userId?: string): Promise<void> => {
  const collectionPath = getDropdownsCollectionPath(userId);
  const dropdownRef = doc(db, collectionPath, dropdownId);
  await deleteDoc(dropdownRef);
};

// Subscribe to dropdowns collection
export const subscribeToDropdowns = (
  onDropdownsChange: (dropdowns: DropdownField[]) => void,
  onError?: (error: Error) => void,
  userId?: string
) => {
  const collectionPath = getDropdownsCollectionPath(userId);
  const dropdownsRef = collection(db, collectionPath);
  
  return onSnapshot(
    dropdownsRef,
    (snapshot) => {
      const dropdowns: DropdownField[] = [];
      snapshot.forEach((doc) => {
        dropdowns.push(firestoreToDropdown(doc.data()));
      });
      onDropdownsChange(dropdowns);
    },
    (error) => {
      console.error('Error subscribing to dropdowns:', error);
      onError?.(error);
    }
  );
};