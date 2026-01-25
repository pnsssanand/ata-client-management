export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  avatarUrl?: string;
  status: string;
  priority: string;
  callOutcome?: string;
  followUpRequired: boolean;
  lastContacted?: Date;
  createdAt: Date;
  notes: Note[];
  dropdownValues: Record<string, string>;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export interface DropdownField {
  id: string;
  name: string;
  options: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  avatarUrl?: string;
}
