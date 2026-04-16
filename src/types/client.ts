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

// Intern Session for tracking Intern's work sessions
export interface LeadStatusSnapshot {
  status: string;
  count: number;
}

export interface InternSession {
  id: string;
  internName: string;
  date: Date;
  loginTime: string;
  logoutTime?: string;
  entryLeadStatuses: LeadStatusSnapshot[];
  exitLeadStatuses?: LeadStatusSnapshot[];
  totalCallsMade?: number;
  conversions?: Record<string, number>; // status -> change count
  isActive: boolean;
  createdAt: Date;
}

// Intern name configuration (managed by admin)
export interface InternName {
  id: string;
  name: string;
  color: string; // Hex color for the card
  createdAt: Date;
  isActive: boolean;
  manualSlotBooked?: number; // Manual slot booked count (editable by admin)
}

// WhatsApp message template (max 8 templates)
export interface WhatsAppTemplate {
  id: string;
  emoji: string;
  label: string;
  message: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

// WhatsApp message log for tracking sent messages
export interface MessageLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  templateName: string;
  variables: Record<string, unknown>[];
  status: 'sent' | 'failed';
  waMessageId?: string;
  error?: string;
  sentAt: Date;
}
