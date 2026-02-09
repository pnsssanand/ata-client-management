import { create } from 'zustand';
import { Client, DropdownField, User, InternSession, LeadStatusSnapshot } from '@/types/client';
import { 
  saveClient, 
  deleteClientFromFirestore, 
  subscribeToClients,
  saveDropdown,
  deleteDropdownFromFirestore,
  subscribeToDropdowns,
  saveInternSession,
  deleteInternSession,
  subscribeToInternSessions
} from '@/lib/firestore';

// Debounce utility for optimizing frequent updates
const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

const debouncedSave = (key: string, fn: () => Promise<void>, delay: number = 300) => {
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  const timer = setTimeout(() => {
    fn().catch(console.error);
    debounceTimers.delete(key);
  }, delay);
  debounceTimers.set(key, timer);
};

interface ClientStore {
  clients: Client[];
  dropdowns: DropdownField[];
  internSessions: InternSession[];
  activeInternSession: InternSession | null;
  searchQuery: string;
  filterStatus: string;
  filterPriority: string;
  filterCallOutcome: string;
  currentUser: User | null;
  currentUserId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSynced: boolean;
  lastSyncTime: Date | null;
  unsubscribeClients: (() => void) | null;
  unsubscribeDropdowns: (() => void) | null;
  unsubscribeInternSessions: (() => void) | null;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterPriority: (priority: string) => void;
  setFilterCallOutcome: (callOutcome: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'notes' | 'dropdownValues'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  deleteMultipleClients: (ids: string[]) => Promise<void>;
  addNote: (clientId: string, content: string) => Promise<void>;
  updateDropdownValue: (clientId: string, fieldName: string, value: string) => Promise<void>;
  addDropdownField: (field: Omit<DropdownField, 'id' | 'createdAt'>) => Promise<void>;
  updateDropdownField: (id: string, updates: Partial<DropdownField>) => Promise<void>;
  deleteDropdownField: (id: string) => Promise<void>;
  addDropdownOption: (fieldId: string, option: string) => Promise<void>;
  updateDropdownOption: (fieldId: string, index: number, newValue: string) => Promise<void>;
  deleteDropdownOption: (fieldId: string, index: number) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  filteredClients: () => Client[];
  initializeFirebase: (userId?: string) => void;
  cleanup: () => void;
  // Intern session methods
  startInternSession: (internName: string, loginTime: string) => Promise<void>;
  endInternSession: (sessionId: string, logoutTime: string) => Promise<void>;
  deleteInternSessionRecord: (sessionId: string) => Promise<void>;
  getLeadStatusSnapshot: () => LeadStatusSnapshot[];
}

export const useClientStore = create<ClientStore>()((set, get) => ({
  clients: [],
  dropdowns: [],
  internSessions: [],
  activeInternSession: null,
  searchQuery: '',
  filterStatus: 'all',
  filterPriority: 'all',
  filterCallOutcome: 'all',
  currentUser: null,
  currentUserId: null,
  isLoading: true,
  isInitialized: false,
  isSynced: false,
  lastSyncTime: null,
  unsubscribeClients: null,
  unsubscribeDropdowns: null,
  unsubscribeInternSessions: null,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterCallOutcome: (callOutcome) => set({ filterCallOutcome: callOutcome }),
  
  initializeFirebase: (userId?: string) => {
    const { isInitialized, unsubscribeClients, unsubscribeDropdowns, unsubscribeInternSessions } = get();
    
    if (isInitialized) return;
    
    // Store the userId for later use in save/delete operations
    set({ currentUserId: userId || null });
    
    // Clean up existing subscriptions
    if (unsubscribeClients) unsubscribeClients();
    if (unsubscribeDropdowns) unsubscribeDropdowns();
    if (unsubscribeInternSessions) unsubscribeInternSessions();
    
    // Subscribe to clients (pass userId to use user-specific collection)
    const clientsUnsub = subscribeToClients(
      (clients) => {
        set({ clients, isLoading: false, isSynced: true, lastSyncTime: new Date() });
      },
      (error) => {
        console.error('Clients subscription error:', error);
        set({ isLoading: false, isSynced: false });
      },
      userId
    );
    
    // Default dropdown configurations for new users
    const defaultDropdowns: DropdownField[] = [
      {
        id: 'default-lead-status',
        name: 'Lead Status',
        options: ['New Lead', 'Hot Lead', 'Warm Lead', 'Cold Lead', 'Converted', 'Lost', 'Installed'],
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'default-call-outcome',
        name: 'Call Outcome',
        options: ['Connected', 'No Answer', 'Busy', 'Wrong Number', 'Voicemail', 'Call Back Later', 'Not Interested'],
        createdBy: 'system',
        createdAt: new Date()
      }
    ];
    
    // Subscribe to dropdowns - initialize defaults if empty (for new users)
    let hasInitializedDefaults = false;
    const dropdownsUnsub = subscribeToDropdowns(
      async (dropdowns) => {
        // If this is a new user with no dropdowns, initialize defaults
        if (dropdowns.length === 0 && userId && !hasInitializedDefaults) {
          hasInitializedDefaults = true;
          // Set defaults immediately in local state for responsive UI
          set({ dropdowns: defaultDropdowns });
          // Save default dropdowns for the new user to Firebase
          for (const dropdown of defaultDropdowns) {
            try {
              await saveDropdown(dropdown, userId);
            } catch (error) {
              console.error('Error saving default dropdown:', error);
            }
          }
        } else {
          set({ dropdowns });
        }
      },
      (error) => {
        console.error('Dropdowns subscription error:', error);
      },
      userId
    );
    
    // Subscribe to intern sessions
    const internSessionsUnsub = subscribeToInternSessions(
      (sessions) => {
        const activeSession = sessions.find(s => s.isActive);
        set({ internSessions: sessions, activeInternSession: activeSession || null });
      },
      (error) => {
        console.error('Intern sessions subscription error:', error);
      },
      userId
    );
    
    set({ 
      isInitialized: true, 
      unsubscribeClients: clientsUnsub,
      unsubscribeDropdowns: dropdownsUnsub,
      unsubscribeInternSessions: internSessionsUnsub
    });
  },
  
  cleanup: () => {
    const { unsubscribeClients, unsubscribeDropdowns, unsubscribeInternSessions } = get();
    if (unsubscribeClients) unsubscribeClients();
    if (unsubscribeDropdowns) unsubscribeDropdowns();
    if (unsubscribeInternSessions) unsubscribeInternSessions();
    set({ 
      clients: [],
      dropdowns: [],
      internSessions: [],
      activeInternSession: null,
      currentUserId: null,
      isInitialized: false, 
      isLoading: true,
      isSynced: false,
      unsubscribeClients: null, 
      unsubscribeDropdowns: null,
      unsubscribeInternSessions: null
    });
  },
  
  addClient: async (client) => {
    const { currentUserId } = get();
    // Generate a unique ID using timestamp + random string to avoid collisions
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize dropdownValues with the status, priority, and callOutcome values
    // This ensures consistency between the main fields and dropdownValues
    const dropdownValues: Record<string, string> = {};
    if (client.status) {
      dropdownValues['Lead Status'] = client.status;
    }
    if (client.priority) {
      dropdownValues['Priority'] = client.priority;
    }
    if (client.callOutcome) {
      dropdownValues['Call Outcome'] = client.callOutcome;
    }
    
    const newClient: Client = {
      ...client,
      id: uniqueId,
      createdAt: new Date(),
      notes: [],
      dropdownValues
    };
    
    // Optimistically update local state
    set((state) => ({ clients: [...state.clients, newClient] }));
    
    // Save to Firebase with user-specific collection
    try {
      await saveClient(newClient, currentUserId || undefined);
    } catch (error) {
      console.error('Error saving client:', error);
      // Rollback on error
      set((state) => ({ clients: state.clients.filter(c => c.id !== newClient.id) }));
      throw error;
    }
  },
  
  updateClient: async (id, updates) => {
    const { clients, currentUserId } = get();
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    const updatedClient = { ...client, ...updates };
    
    // Optimistically update
    set((state) => ({
      clients: state.clients.map((c) => c.id === id ? updatedClient : c)
    }));
    
    // Save to Firebase with user-specific collection
    try {
      await saveClient(updatedClient, currentUserId || undefined);
    } catch (error) {
      console.error('Error updating client:', error);
      // Rollback
      set((state) => ({
        clients: state.clients.map((c) => c.id === id ? client : c)
      }));
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    const { clients, currentUserId } = get();
    const client = clients.find(c => c.id === id);
    
    // Optimistically update
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id)
    }));
    
    // Delete from Firebase with user-specific collection
    try {
      await deleteClientFromFirestore(id, currentUserId || undefined);
    } catch (error) {
      console.error('Error deleting client:', error);
      // Rollback
      if (client) {
        set((state) => ({
          clients: [...state.clients, client]
        }));
      }
      throw error;
    }
  },
  
  deleteMultipleClients: async (ids) => {
    const { clients, currentUserId } = get();
    const clientsToDelete = clients.filter(c => ids.includes(c.id));
    
    // Optimistically update
    set((state) => ({
      clients: state.clients.filter((c) => !ids.includes(c.id))
    }));
    
    // Delete from Firebase with user-specific collection
    try {
      await Promise.all(ids.map(id => deleteClientFromFirestore(id, currentUserId || undefined)));
    } catch (error) {
      console.error('Error deleting clients:', error);
      // Rollback
      if (clientsToDelete.length > 0) {
        set((state) => ({ clients: [...state.clients, ...clientsToDelete] }));
      }
      throw error;
    }
  },
  
  addNote: async (clientId, content) => {
    const { clients, currentUser, currentUserId } = get();
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const newNote = {
      id: Date.now().toString(),
      content,
      createdAt: new Date(),
      createdBy: currentUser?.name || 'Unknown'
    };
    
    const updatedClient = {
      ...client,
      notes: [...client.notes, newNote]
    };
    
    set((state) => ({
      clients: state.clients.map((c) => c.id === clientId ? updatedClient : c)
    }));
    
    try {
      await saveClient(updatedClient, currentUserId || undefined);
    } catch (error) {
      console.error('Error adding note:', error);
      set((state) => ({
        clients: state.clients.map((c) => c.id === clientId ? client : c)
      }));
      throw error;
    }
  },
  
  updateDropdownValue: async (clientId, fieldName, value) => {
    const { clients, currentUserId } = get();
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const previousClient = { ...client }; // Store for rollback
    
    const updatedClient = {
      ...client,
      dropdownValues: { ...client.dropdownValues, [fieldName]: value },
      status: fieldName === 'Lead Status' ? value : client.status,
      priority: fieldName === 'Priority' ? value : client.priority,
      callOutcome: fieldName === 'Call Outcome' ? value : client.callOutcome
    };
    
    // Immediately update local state for responsive UI
    set((state) => ({
      clients: state.clients.map((c) => c.id === clientId ? updatedClient : c)
    }));
    
    // Save immediately for important fields like Lead Status
    const isImportantField = fieldName === 'Lead Status' || fieldName === 'Call Outcome' || fieldName === 'Priority';
    
    const saveFunction = async () => {
      // Get the latest client state before saving
      const currentClients = get().clients;
      const userId = get().currentUserId;
      const latestClient = currentClients.find(c => c.id === clientId);
      if (latestClient) {
        await saveClient(latestClient, userId || undefined);
        console.log(`[Firestore] Saved ${fieldName} = "${value}" for client ${clientId}`);
      }
    };
    
    if (isImportantField) {
      // Save immediately for important fields and propagate errors
      try {
        await saveFunction();
      } catch (error) {
        console.error('Error updating dropdown value:', error);
        // Rollback to previous state on error
        set((state) => ({
          clients: state.clients.map((c) => c.id === clientId ? previousClient : c)
        }));
        throw error; // Re-throw to notify caller
      }
    } else {
      // Debounce for other fields to prevent rapid consecutive writes
      const debounceKey = `client-dropdown-${clientId}`;
      debouncedSave(debounceKey, saveFunction, 500);
    }
  },
  
  addDropdownField: async (field) => {
    const { currentUserId } = get();
    const newDropdown: DropdownField = {
      ...field,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    set((state) => ({
      dropdowns: [...state.dropdowns, newDropdown]
    }));
    
    try {
      await saveDropdown(newDropdown, currentUserId || undefined);
    } catch (error) {
      console.error('Error adding dropdown field:', error);
      set((state) => ({
        dropdowns: state.dropdowns.filter(d => d.id !== newDropdown.id)
      }));
      throw error;
    }
  },
  
  updateDropdownField: async (id, updates) => {
    const { dropdowns, currentUserId } = get();
    const dropdown = dropdowns.find(d => d.id === id);
    if (!dropdown) return;
    
    const updatedDropdown = { ...dropdown, ...updates, updatedAt: new Date() };
    
    set((state) => ({
      dropdowns: state.dropdowns.map((d) => d.id === id ? updatedDropdown : d)
    }));
    
    try {
      await saveDropdown(updatedDropdown, currentUserId || undefined);
    } catch (error) {
      console.error('Error updating dropdown field:', error);
      set((state) => ({
        dropdowns: state.dropdowns.map((d) => d.id === id ? dropdown : d)
      }));
      throw error;
    }
  },
  
  deleteDropdownField: async (id) => {
    const { dropdowns, currentUserId } = get();
    const dropdown = dropdowns.find(d => d.id === id);
    
    set((state) => ({
      dropdowns: state.dropdowns.filter((d) => d.id !== id)
    }));
    
    try {
      await deleteDropdownFromFirestore(id, currentUserId || undefined);
    } catch (error) {
      console.error('Error deleting dropdown field:', error);
      if (dropdown) {
        set((state) => ({ dropdowns: [...state.dropdowns, dropdown] }));
      }
      throw error;
    }
  },
  
  addDropdownOption: async (fieldId, option) => {
    const { dropdowns, currentUserId } = get();
    const dropdown = dropdowns.find(d => d.id === fieldId);
    if (!dropdown) return;
    
    const updatedDropdown = {
      ...dropdown,
      options: [...dropdown.options, option],
      updatedAt: new Date()
    };
    
    set((state) => ({
      dropdowns: state.dropdowns.map((d) => d.id === fieldId ? updatedDropdown : d)
    }));
    
    try {
      await saveDropdown(updatedDropdown, currentUserId || undefined);
    } catch (error) {
      console.error('Error adding dropdown option:', error);
      set((state) => ({
        dropdowns: state.dropdowns.map((d) => d.id === fieldId ? dropdown : d)
      }));
      throw error;
    }
  },
  
  updateDropdownOption: async (fieldId, index, newValue) => {
    const { dropdowns, currentUserId } = get();
    const dropdown = dropdowns.find(d => d.id === fieldId);
    if (!dropdown) return;
    
    const updatedDropdown = {
      ...dropdown,
      options: dropdown.options.map((opt, i) => i === index ? newValue : opt),
      updatedAt: new Date()
    };
    
    set((state) => ({
      dropdowns: state.dropdowns.map((d) => d.id === fieldId ? updatedDropdown : d)
    }));
    
    try {
      await saveDropdown(updatedDropdown, currentUserId || undefined);
    } catch (error) {
      console.error('Error updating dropdown option:', error);
      set((state) => ({
        dropdowns: state.dropdowns.map((d) => d.id === fieldId ? dropdown : d)
      }));
      throw error;
    }
  },
  
  deleteDropdownOption: async (fieldId, index) => {
    const { dropdowns, currentUserId } = get();
    const dropdown = dropdowns.find(d => d.id === fieldId);
    if (!dropdown) return;
    
    const updatedDropdown = {
      ...dropdown,
      options: dropdown.options.filter((_, i) => i !== index),
      updatedAt: new Date()
    };
    
    set((state) => ({
      dropdowns: state.dropdowns.map((d) => d.id === fieldId ? updatedDropdown : d)
    }));
    
    try {
      await saveDropdown(updatedDropdown, currentUserId || undefined);
    } catch (error) {
      console.error('Error deleting dropdown option:', error);
      set((state) => ({
        dropdowns: state.dropdowns.map((d) => d.id === fieldId ? dropdown : d)
      }));
      throw error;
    }
  },
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  filteredClients: () => {
    const { clients, searchQuery, filterStatus, filterPriority, filterCallOutcome } = get();
    return clients.filter((client) => {
      const matchesSearch = !searchQuery || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || client.priority === filterPriority;
      const matchesCallOutcome = filterCallOutcome === 'all' || client.callOutcome === filterCallOutcome;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCallOutcome;
    });
  },

  // Intern session methods
  getLeadStatusSnapshot: () => {
    const { clients, dropdowns } = get();
    const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
    const statusOptions = leadStatusDropdown?.options || [];
    
    // Count clients per status
    const statusCounts = clients.reduce((acc, client) => {
      const status = client.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Create snapshot with all status options
    return statusOptions.map(status => ({
      status,
      count: statusCounts[status] || 0
    }));
  },

  startInternSession: async (internName, loginTime) => {
    const { currentUserId, getLeadStatusSnapshot, internSessions } = get();
    
    // Check if there's already an active session
    const existingActive = internSessions.find(s => s.isActive);
    if (existingActive) {
      throw new Error('There is already an active session. Please end the current session first.');
    }

    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const entryLeadStatuses = getLeadStatusSnapshot();
    
    const newSession: InternSession = {
      id: sessionId,
      internName,
      date: new Date(),
      loginTime,
      entryLeadStatuses,
      isActive: true,
      createdAt: new Date()
    };
    
    // Optimistically update local state
    set((state) => ({ 
      internSessions: [newSession, ...state.internSessions],
      activeInternSession: newSession
    }));
    
    try {
      await saveInternSession(newSession, currentUserId || undefined);
    } catch (error) {
      console.error('Error starting intern session:', error);
      // Rollback
      set((state) => ({
        internSessions: state.internSessions.filter(s => s.id !== sessionId),
        activeInternSession: null
      }));
      throw error;
    }
  },

  endInternSession: async (sessionId, logoutTime) => {
    const { internSessions, currentUserId, getLeadStatusSnapshot } = get();
    const session = internSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const exitLeadStatuses = getLeadStatusSnapshot();
    
    // Calculate conversions (changes in lead status counts)
    const conversions: Record<string, number> = {};
    let totalCallsMade = 0;
    
    session.entryLeadStatuses.forEach(entry => {
      const exitStatus = exitLeadStatuses.find(e => e.status === entry.status);
      const exitCount = exitStatus?.count || 0;
      const change = exitCount - entry.count;
      conversions[entry.status] = change;
      // Total calls made is the sum of absolute changes (leads moved)
      if (change !== 0) {
        totalCallsMade += Math.abs(change);
      }
    });
    
    // Also check for any new statuses at exit that weren't in entry
    exitLeadStatuses.forEach(exit => {
      if (!conversions.hasOwnProperty(exit.status)) {
        conversions[exit.status] = exit.count;
        totalCallsMade += Math.abs(exit.count);
      }
    });
    
    // Total calls made is approximately half of total movements (since each call moves a lead from one status to another)
    totalCallsMade = Math.ceil(totalCallsMade / 2);
    
    const updatedSession: InternSession = {
      ...session,
      logoutTime,
      exitLeadStatuses,
      conversions,
      totalCallsMade,
      isActive: false
    };
    
    // Optimistically update
    set((state) => ({
      internSessions: state.internSessions.map(s => s.id === sessionId ? updatedSession : s),
      activeInternSession: null
    }));
    
    try {
      await saveInternSession(updatedSession, currentUserId || undefined);
    } catch (error) {
      console.error('Error ending intern session:', error);
      // Rollback
      set((state) => ({
        internSessions: state.internSessions.map(s => s.id === sessionId ? session : s),
        activeInternSession: session
      }));
      throw error;
    }
  },

  deleteInternSessionRecord: async (sessionId) => {
    const { internSessions, currentUserId, activeInternSession } = get();
    const session = internSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // Don't allow deleting active sessions
    if (session.isActive) {
      throw new Error('Cannot delete an active session. Please end the session first.');
    }
    
    // Optimistically update
    set((state) => ({
      internSessions: state.internSessions.filter(s => s.id !== sessionId)
    }));
    
    try {
      await deleteInternSession(sessionId, currentUserId || undefined);
    } catch (error) {
      console.error('Error deleting intern session:', error);
      // Rollback
      set((state) => ({
        internSessions: [...state.internSessions, session]
      }));
      throw error;
    }
  }
}));
