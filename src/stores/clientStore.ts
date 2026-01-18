import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, DropdownField, User } from '@/types/client';

const defaultDropdowns: DropdownField[] = [
  { id: '1', name: 'Lead Status', options: ['New Lead', 'Hot Lead', 'Warm Lead', 'Cold Lead', 'Converted', 'Lost'], createdBy: 'admin', createdAt: new Date() },
  { id: '2', name: 'Call Outcome', options: ['Not Reached', 'Interested', 'Not Interested', 'Call Back', 'Booked', 'Cancelled'], createdBy: 'admin', createdAt: new Date() },
  { id: '3', name: 'Priority', options: ['High', 'Medium', 'Low'], createdBy: 'admin', createdAt: new Date() }
];

interface ClientStore {
  clients: Client[];
  dropdowns: DropdownField[];
  searchQuery: string;
  filterStatus: string;
  filterPriority: string;
  currentUser: User | null;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterPriority: (priority: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'notes' | 'dropdownValues'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addNote: (clientId: string, content: string) => void;
  updateDropdownValue: (clientId: string, fieldName: string, value: string) => void;
  addDropdownField: (field: Omit<DropdownField, 'id' | 'createdAt'>) => void;
  updateDropdownField: (id: string, updates: Partial<DropdownField>) => void;
  deleteDropdownField: (id: string) => void;
  addDropdownOption: (fieldId: string, option: string) => void;
  updateDropdownOption: (fieldId: string, index: number, newValue: string) => void;
  deleteDropdownOption: (fieldId: string, index: number) => void;
  setCurrentUser: (user: User | null) => void;
  filteredClients: () => Client[];
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
  clients: [],
  dropdowns: defaultDropdowns,
  searchQuery: '',
  filterStatus: 'all',
  filterPriority: 'all',
  currentUser: null,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  
  addClient: (client) => set((state) => ({
    clients: [...state.clients, {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date(),
      notes: [],
      dropdownValues: {}
    }]
  })),
  
  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  
  deleteClient: (id) => set((state) => ({
    clients: state.clients.filter((c) => c.id !== id)
  })),
  
  addNote: (clientId, content) => set((state) => ({
    clients: state.clients.map((c) => c.id === clientId ? {
      ...c,
      notes: [...c.notes, {
        id: Date.now().toString(),
        content,
        createdAt: new Date(),
        createdBy: state.currentUser?.name || 'Unknown'
      }]
    } : c)
  })),
  
  updateDropdownValue: (clientId, fieldName, value) => set((state) => ({
    clients: state.clients.map((c) => c.id === clientId ? {
      ...c,
      dropdownValues: { ...c.dropdownValues, [fieldName]: value },
      status: fieldName === 'Lead Status' ? value : c.status,
      priority: fieldName === 'Priority' ? value : c.priority,
      callOutcome: fieldName === 'Call Outcome' ? value : c.callOutcome
    } : c)
  })),
  
  addDropdownField: (field) => set((state) => ({
    dropdowns: [...state.dropdowns, {
      ...field,
      id: Date.now().toString(),
      createdAt: new Date()
    }]
  })),
  
  updateDropdownField: (id, updates) => set((state) => ({
    dropdowns: state.dropdowns.map((d) => d.id === id ? { ...d, ...updates } : d)
  })),
  
  deleteDropdownField: (id) => set((state) => ({
    dropdowns: state.dropdowns.filter((d) => d.id !== id)
  })),
  
  addDropdownOption: (fieldId, option) => set((state) => ({
    dropdowns: state.dropdowns.map((d) => d.id === fieldId 
      ? { ...d, options: [...d.options, option] } 
      : d
    )
  })),
  
  updateDropdownOption: (fieldId, index, newValue) => set((state) => ({
    dropdowns: state.dropdowns.map((d) => d.id === fieldId 
      ? { ...d, options: d.options.map((opt, i) => i === index ? newValue : opt) } 
      : d
    )
  })),
  
  deleteDropdownOption: (fieldId, index) => set((state) => ({
    dropdowns: state.dropdowns.map((d) => d.id === fieldId 
      ? { ...d, options: d.options.filter((_, i) => i !== index) } 
      : d
    )
  })),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  filteredClients: () => {
    const { clients, searchQuery, filterStatus, filterPriority } = get();
    return clients.filter((client) => {
      const matchesSearch = !searchQuery || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || client.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }
}),
    {
      name: 'ata-client-storage',
      partialize: (state) => ({ 
        clients: state.clients, 
        dropdowns: state.dropdowns,
        currentUser: state.currentUser 
      }),
    }
  )
);
