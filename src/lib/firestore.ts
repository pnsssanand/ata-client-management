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

// Collection references
const CLIENTS_COLLECTION = 'clients';
const DROPDOWNS_COLLECTION = 'dropdowns';

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
export const saveClient = async (client: Client): Promise<void> => {
  const clientRef = doc(db, CLIENTS_COLLECTION, client.id);
  await setDoc(clientRef, clientToFirestore(client));
};

export const deleteClientFromFirestore = async (clientId: string): Promise<void> => {
  const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
  await deleteDoc(clientRef);
};

// Subscribe to clients collection
export const subscribeToClients = (
  onClientsChange: (clients: Client[]) => void,
  onError?: (error: Error) => void
) => {
  const clientsRef = collection(db, CLIENTS_COLLECTION);
  
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
export const saveDropdown = async (dropdown: DropdownField): Promise<void> => {
  const dropdownRef = doc(db, DROPDOWNS_COLLECTION, dropdown.id);
  await setDoc(dropdownRef, dropdownToFirestore(dropdown));
};

export const deleteDropdownFromFirestore = async (dropdownId: string): Promise<void> => {
  const dropdownRef = doc(db, DROPDOWNS_COLLECTION, dropdownId);
  await deleteDoc(dropdownRef);
};

// Subscribe to dropdowns collection
export const subscribeToDropdowns = (
  onDropdownsChange: (dropdowns: DropdownField[]) => void,
  onError?: (error: Error) => void
) => {
  const dropdownsRef = collection(db, DROPDOWNS_COLLECTION);
  
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

// Initialize default dropdowns if none exist
export const initializeDefaultDropdowns = async (defaultDropdowns: DropdownField[]): Promise<void> => {
  const batch = writeBatch(db);
  
  defaultDropdowns.forEach((dropdown) => {
    const dropdownRef = doc(db, DROPDOWNS_COLLECTION, dropdown.id);
    batch.set(dropdownRef, dropdownToFirestore(dropdown), { merge: true });
  });
  
  await batch.commit();
};
