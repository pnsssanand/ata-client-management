import { create } from 'zustand';
import { Client, DropdownField, User } from '@/types/client';
import { 
  saveClient, 
  deleteClientFromFirestore, 
  subscribeToClients,
  saveDropdown,
  deleteDropdownFromFirestore,
  subscribeToDropdowns
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
  searchQuery: string;
  filterStatus: string;
  filterPriority: string;
  filterCallOutcome: string;
  currentUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSynced: boolean;
  lastSyncTime: Date | null;
  unsubscribeClients: (() => void) | null;
  unsubscribeDropdowns: (() => void) | null;
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
  initializeFirebase: () => void;
  cleanup: () => void;
}

export const useClientStore = create<ClientStore>()((set, get) => ({
  clients: [],
  dropdowns: [],
  searchQuery: '',
  filterStatus: 'all',
  filterPriority: 'all',
  filterCallOutcome: 'all',
  currentUser: null,
  isLoading: true,
  isInitialized: false,
  isSynced: false,
  lastSyncTime: null,
  unsubscribeClients: null,
  unsubscribeDropdowns: null,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterCallOutcome: (callOutcome) => set({ filterCallOutcome: callOutcome }),
  
  initializeFirebase: () => {
    const { isInitialized, unsubscribeClients, unsubscribeDropdowns } = get();
    
    if (isInitialized) return;
    
    // Clean up existing subscriptions
    if (unsubscribeClients) unsubscribeClients();
    if (unsubscribeDropdowns) unsubscribeDropdowns();
    
    // Subscribe to clients
    const clientsUnsub = subscribeToClients(
      (clients) => {
        set({ clients, isLoading: false, isSynced: true, lastSyncTime: new Date() });
      },
      (error) => {
        console.error('Clients subscription error:', error);
        set({ isLoading: false, isSynced: false });
      }
    );
    
    // Subscribe to dropdowns - always update with Firebase data (user-created dropdowns)
    const dropdownsUnsub = subscribeToDropdowns(
      (dropdowns) => {
        set({ dropdowns });
      },
      (error) => {
        console.error('Dropdowns subscription error:', error);
      }
    );
    
    set({ 
      isInitialized: true, 
      unsubscribeClients: clientsUnsub,
      unsubscribeDropdowns: dropdownsUnsub
    });
  },
  
  cleanup: () => {
    const { unsubscribeClients, unsubscribeDropdowns } = get();
    if (unsubscribeClients) unsubscribeClients();
    if (unsubscribeDropdowns) unsubscribeDropdowns();
    set({ 
      isInitialized: false, 
      unsubscribeClients: null, 
      unsubscribeDropdowns: null 
    });
  },
  
  addClient: async (client) => {
    // Generate a unique ID using timestamp + random string to avoid collisions
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newClient: Client = {
      ...client,
      id: uniqueId,
      createdAt: new Date(),
      notes: [],
      dropdownValues: {}
    };
    
    // Optimistically update local state
    set((state) => ({ clients: [...state.clients, newClient] }));
    
    // Save to Firebase
    try {
      await saveClient(newClient);
    } catch (error) {
      console.error('Error saving client:', error);
      // Rollback on error
      set((state) => ({ clients: state.clients.filter(c => c.id !== newClient.id) }));
      throw error;
    }
  },
  
  updateClient: async (id, updates) => {
    const { clients } = get();
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    const updatedClient = { ...client, ...updates };
    
    // Optimistically update
    set((state) => ({
      clients: state.clients.map((c) => c.id === id ? updatedClient : c)
    }));
    
    // Save to Firebase
    try {
      await saveClient(updatedClient);
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
    const { clients } = get();
    const client = clients.find(c => c.id === id);
    
    // Optimistically update
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id)
    }));
    
    // Delete from Firebase
    try {
      await deleteClientFromFirestore(id);
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
    const { clients } = get();
    const clientsToDelete = clients.filter(c => ids.includes(c.id));
    
    // Optimistically update
    set((state) => ({
      clients: state.clients.filter((c) => !ids.includes(c.id))
    }));
    
    // Delete from Firebase
    try {
      await Promise.all(ids.map(id => deleteClientFromFirestore(id)));
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
    const { clients, currentUser } = get();
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
      await saveClient(updatedClient);
    } catch (error) {
      console.error('Error adding note:', error);
      set((state) => ({
        clients: state.clients.map((c) => c.id === clientId ? client : c)
      }));
      throw error;
    }
  },
  
  updateDropdownValue: async (clientId, fieldName, value) => {
    const { clients } = get();
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
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
    
    // Debounce Firebase save to prevent rapid consecutive writes
    // This key ensures each client's dropdown changes are debounced separately
    const debounceKey = `client-dropdown-${clientId}`;
    debouncedSave(debounceKey, async () => {
      try {
        // Get the latest client state before saving
        const currentClients = get().clients;
        const latestClient = currentClients.find(c => c.id === clientId);
        if (latestClient) {
          await saveClient(latestClient);
        }
      } catch (error) {
        console.error('Error updating dropdown value:', error);
        // Note: We don't rollback here as the user may have made more changes
        // The next sync from Firebase will reconcile the state
      }
    }, 500);
  },
  
  addDropdownField: async (field) => {
    const newDropdown: DropdownField = {
      ...field,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    set((state) => ({
      dropdowns: [...state.dropdowns, newDropdown]
    }));
    
    try {
      await saveDropdown(newDropdown);
    } catch (error) {
      console.error('Error adding dropdown field:', error);
      set((state) => ({
        dropdowns: state.dropdowns.filter(d => d.id !== newDropdown.id)
      }));
      throw error;
    }
  },
  
  updateDropdownField: async (id, updates) => {
    const { dropdowns } = get();
    const dropdown = dropdowns.find(d => d.id === id);
    if (!dropdown) return;
    
    const updatedDropdown = { ...dropdown, ...updates, updatedAt: new Date() };
    
    set((state) => ({
      dropdowns: state.dropdowns.map((d) => d.id === id ? updatedDropdown : d)
    }));
    
    try {
      await saveDropdown(updatedDropdown);
    } catch (error) {
      console.error('Error updating dropdown field:', error);
      set((state) => ({
        dropdowns: state.dropdowns.map((d) => d.id === id ? dropdown : d)
      }));
      throw error;
    }
  },
  
  deleteDropdownField: async (id) => {
    const { dropdowns } = get();
    const dropdown = dropdowns.find(d => d.id === id);
    
    set((state) => ({
      dropdowns: state.dropdowns.filter((d) => d.id !== id)
    }));
    
    try {
      await deleteDropdownFromFirestore(id);
    } catch (error) {
      console.error('Error deleting dropdown field:', error);
      if (dropdown) {
        set((state) => ({ dropdowns: [...state.dropdowns, dropdown] }));
      }
      throw error;
    }
  },
  
  addDropdownOption: async (fieldId, option) => {
    const { dropdowns } = get();
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
      await saveDropdown(updatedDropdown);
    } catch (error) {
      console.error('Error adding dropdown option:', error);
      set((state) => ({
        dropdowns: state.dropdowns.map((d) => d.id === fieldId ? dropdown : d)
      }));
      throw error;
    }
  },
  
  updateDropdownOption: async (fieldId, index, newValue) => {
    const { dropdowns } = get();
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
      await saveDropdown(updatedDropdown);
    } catch (error) {
      console.error('Error updating dropdown option:', error);
      set((state) => ({
        dropdowns: state.dropdowns.map((d) => d.id === fieldId ? dropdown : d)
      }));
      throw error;
    }
  },
  
  deleteDropdownOption: async (fieldId, index) => {
    const { dropdowns } = get();
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
      await saveDropdown(updatedDropdown);
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
  }
}));
