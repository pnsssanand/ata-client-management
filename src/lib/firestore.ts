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
import { Client, DropdownField, Note, InternSession, LeadStatusSnapshot } from '@/types/client';

// Helper to get user-specific collection path
const getUserClientsCollection = (userId: string) => `users/${userId}/clients`;
const getUserDropdownsCollection = (userId: string) => `users/${userId}/dropdowns`;
const getUserInternSessionsCollection = (userId: string) => `users/${userId}/internSessions`;

// Legacy collection references (for backward compatibility with existing data)
const LEGACY_CLIENTS_COLLECTION = 'clients';
const LEGACY_DROPDOWNS_COLLECTION = 'dropdowns';
const LEGACY_INTERN_SESSIONS_COLLECTION = 'internSessions';

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

const getInternSessionsCollectionPath = (userId?: string): string => {
  // If no userId or legacy user, use legacy collection
  if (!userId || userId === LEGACY_USER_ID) {
    return LEGACY_INTERN_SESSIONS_COLLECTION;
  }
  // New users get user-specific collections
  return getUserInternSessionsCollection(userId);
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
  // Ensure dropdownValues is synced with status fields before saving
  const dropdownValues = { ...(client.dropdownValues || {}) };
  dropdownValues['Lead Status'] = client.status;
  dropdownValues['Priority'] = client.priority;
  if (client.callOutcome) {
    dropdownValues['Call Outcome'] = client.callOutcome;
  }
  
  // Build the document data explicitly to avoid serialization issues
  const data: DocumentData = {
    id: client.id,
    name: client.name,
    phone: client.phone,
    status: client.status,
    priority: client.priority,
    followUpRequired: client.followUpRequired,
    dropdownValues,
    createdAt: dateToTimestamp(client.createdAt),
    notes: (client.notes || []).map(note => ({
      id: note.id,
      content: note.content,
      createdBy: note.createdBy,
      createdAt: dateToTimestamp(note.createdAt)
    }))
  };
  
  // Add optional fields only if they have values
  if (client.email) data.email = client.email;
  if (client.company) data.company = client.company;
  if (client.avatarUrl) data.avatarUrl = client.avatarUrl;
  if (client.callOutcome) data.callOutcome = client.callOutcome;
  if (client.lastContacted) data.lastContacted = dateToTimestamp(client.lastContacted);
  
  return data;
};

// Convert Firestore document to Client
const firestoreToClient = (data: DocumentData): Client => {
  // Ensure dropdownValues is initialized
  const dropdownValues = { ...(data.dropdownValues || {}) };
  
  // The status, priority, and callOutcome fields are the source of truth
  // Always sync dropdownValues with these fields to ensure consistency
  // This ensures that the UI always shows the correct saved status
  const status = data.status || 'New Lead';
  const priority = data.priority || 'Medium';
  const callOutcome = data.callOutcome;
  
  // Always update dropdownValues to match the status fields
  dropdownValues['Lead Status'] = status;
  dropdownValues['Priority'] = priority;
  if (callOutcome) {
    dropdownValues['Call Outcome'] = callOutcome;
  }
  
  return {
    ...data,
    createdAt: timestampToDate(data.createdAt),
    lastContacted: data.lastContacted ? timestampToDate(data.lastContacted) : undefined,
    notes: (data.notes || []).map((note: DocumentData) => ({
      ...note,
      createdAt: timestampToDate(note.createdAt)
    })),
    dropdownValues,
    status,
    priority,
    callOutcome,
    followUpRequired: data.followUpRequired ?? true
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
  
  try {
    const firestoreData = clientToFirestore(client);
    await setDoc(clientRef, firestoreData);
    console.log(`[Firestore] Successfully saved client ${client.id} to ${collectionPath}`);
  } catch (error) {
    console.error(`[Firestore] Error saving client ${client.id} to ${collectionPath}:`, error);
    throw error;
  }
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

// Intern Session operations

// Convert InternSession to Firestore format
const internSessionToFirestore = (session: InternSession): DocumentData => {
  return {
    id: session.id,
    internName: session.internName,
    date: dateToTimestamp(session.date),
    loginTime: session.loginTime,
    logoutTime: session.logoutTime || null,
    entryLeadStatuses: session.entryLeadStatuses,
    exitLeadStatuses: session.exitLeadStatuses || null,
    totalCallsMade: session.totalCallsMade || null,
    conversions: session.conversions || null,
    isActive: session.isActive,
    createdAt: dateToTimestamp(session.createdAt)
  };
};

// Convert Firestore document to InternSession
const firestoreToInternSession = (data: DocumentData): InternSession => {
  return {
    id: data.id,
    internName: data.internName,
    date: timestampToDate(data.date),
    loginTime: data.loginTime,
    logoutTime: data.logoutTime || undefined,
    entryLeadStatuses: data.entryLeadStatuses || [],
    exitLeadStatuses: data.exitLeadStatuses || undefined,
    totalCallsMade: data.totalCallsMade || undefined,
    conversions: data.conversions || undefined,
    isActive: data.isActive ?? true,
    createdAt: timestampToDate(data.createdAt)
  };
};

export const saveInternSession = async (session: InternSession, userId?: string): Promise<void> => {
  const collectionPath = getInternSessionsCollectionPath(userId);
  const sessionRef = doc(db, collectionPath, session.id);
  await setDoc(sessionRef, internSessionToFirestore(session));
};

export const deleteInternSession = async (sessionId: string, userId?: string): Promise<void> => {
  const collectionPath = getInternSessionsCollectionPath(userId);
  const sessionRef = doc(db, collectionPath, sessionId);
  await deleteDoc(sessionRef);
};

// Subscribe to intern sessions collection
export const subscribeToInternSessions = (
  onSessionsChange: (sessions: InternSession[]) => void,
  onError?: (error: Error) => void,
  userId?: string
) => {
  const collectionPath = getInternSessionsCollectionPath(userId);
  const sessionsRef = collection(db, collectionPath);
  
  return onSnapshot(
    sessionsRef,
    (snapshot) => {
      const sessions: InternSession[] = [];
      snapshot.forEach((doc) => {
        sessions.push(firestoreToInternSession(doc.data()));
      });
      // Sort by date descending
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onSessionsChange(sessions);
    },
    (error) => {
      console.error('Error subscribing to intern sessions:', error);
      onError?.(error);
    }
  );
};