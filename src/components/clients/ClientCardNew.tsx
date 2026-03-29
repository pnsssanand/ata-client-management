import { useState, useCallback, useEffect, useRef, memo, useTransition } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Clock, 
  Building, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Check,
  MoreVertical,
  DollarSign,
  StickyNote,
  Edit2,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Client } from '@/types/client';
import { useClientStore } from '@/stores/clientStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Status color configuration - DTS style
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Not Called': {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500'
  },
  'Answered': {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  'Not answered': {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500'
  },
  'Call Later': {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500'
  },
  'Not Interested': {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500'
  },
  'Converted': {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  'Hot Lead': {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500'
  },
  'Warm Lead': {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500'
  },
  'Cold Lead': {
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400'
  },
  'New Lead': {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500'
  },
  'Installed': {
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    dot: 'bg-violet-500'
  },
  'App Installed': {
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    dot: 'bg-violet-500'
  },
  'App user': {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500'
  },
  'Lost': {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-400'
  },
  'Slot Booked': {
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500'
  },
  'Hindi': {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  'Follow Up': {
    bg: 'bg-sky-50 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500'
  },
  'Busy': {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500'
  },
  'Wrong Number': {
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500'
  },
  'DND': {
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-800',
    dot: 'bg-gray-500'
  },
};

const getStatusColors = (status: string) => {
  return STATUS_COLORS[status] || {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    dot: 'bg-primary'
  };
};

interface ClientCardNewProps {
  client: Client;
  isSelected?: boolean;
}

export const ClientCardNew = memo(function ClientCardNew({ client, isSelected }: ClientCardNewProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, right: 0 });
  const statusRef = useRef<HTMLDivElement>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const isUpdatingRef = useRef(false);      // ref mirror — stable across renders
  const safetyTimerRef = useRef<number | null>(null); // force-reset if API hangs
  const [, startTransition] = useTransition(); // For non-blocking status updates
  
  // Edit contact name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(client.name);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState(client.phone);

  const { dropdowns, updateDropdownValue, addNote, whatsappTemplates, updateClient } = useClientStore();

  // Get lead status dropdown options
  const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
  const statusOptions = leadStatusDropdown?.options || [];

  const displayStatus = optimisticStatus || client.status;
  const statusColors = getStatusColors(displayStatus);

  // Sync optimistic status when client status changes
  useEffect(() => {
    if (optimisticStatus && client.status === optimisticStatus) {
      setOptimisticStatus(null);
    }
  }, [client.status, optimisticStatus]);

  // Clear safety timer on unmount
  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) window.clearTimeout(safetyTimerRef.current);
    };
  }, []);

  // Close status menu on outside click
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    // Immediate attachment for faster response
    document.addEventListener('mousedown', handleOutside, { passive: true });
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [statusMenuOpen]);

  // Close status menu on Escape
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setStatusMenuOpen(false); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [statusMenuOpen]);

  // Close status menu on scroll (position would be stale)
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handleScroll = () => setStatusMenuOpen(false);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [statusMenuOpen]);

  const openStatusMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdatingRef.current) return;
    // Calculate position synchronously and immediately open menu
    const rect = statusRef.current?.getBoundingClientRect();
    if (rect) {
      // Use startTransition to keep menu opening instant while calculation happens
      startTransition(() => {
        setStatusMenuPos({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      });
    }
    // Open menu immediately without waiting for position calculation
    setStatusMenuOpen(prev => !prev);
  }, [startTransition]);

  const handleCall = useCallback(() => {
    const cleanPhone = client.phone.replace(/[\s\-\(\)]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  }, [client.phone]);

  // WhatsApp predefined messages
  const whatsappMessages = [
    {
      id: 'greeting',
      label: 'Greeting Message',
      emoji: '👋',
      message: `Sir, I tried reaching you regarding train ticket bookings.

Mēmu train tickets reservation chestāmu sir —
🚆 Tatkal train tickets for emergency travel
🌞 Advance train ticket reservations for summer vacation
🙏 Tirupati train ticket bookings

Emina requirement unda sir? Please let us know, we'll be happy to assist you.

— Anand Travel Agency
📞 8985816481`
    },
    {
      id: 'hi',
      label: 'Hi Message',
      emoji: '🙏',
      message: `HI

— Anand Travel Agency
📞 8985816481`
    }
  ];

  const handleWhatsApp = useCallback((message?: string) => {
    const cleanPhone = client.phone.replace(/[\s\-\(\)\+]/g, '');
    let waUrl = `https://wa.me/${cleanPhone}`;
    
    if (message) {
      // Encode the message for URL
      const encodedMessage = encodeURIComponent(message);
      waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }
    
    window.open(waUrl, '_blank');
  }, [client.phone]);

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await addNote(client.id, newNote.trim());
        setNewNote('');
        toast.success('Note added successfully', { duration: 1500 });
      } catch (error) {
        toast.error('Failed to add note', { duration: 1500 });
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingRef.current || newStatus === displayStatus) {
      setStatusMenuOpen(false);
      return;
    }

    // Close menu IMMEDIATELY
    setStatusMenuOpen(false);

    // Set optimistic status instantly without blocking UI
    setOptimisticStatus(newStatus);
    isUpdatingRef.current = true;
    setIsUpdatingStatus(true);

    // Safety net: force-reset after 5s if API hangs
    if (safetyTimerRef.current) window.clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = window.setTimeout(() => {
      isUpdatingRef.current = false;
      setIsUpdatingStatus(false);
      safetyTimerRef.current = null;
    }, 5000);

    try {
      // Update in background without blocking UI
      startTransition(async () => {
        await updateDropdownValue(client.id, 'Lead Status', newStatus);
      });
      toast.success(`Status updated to "${newStatus}"`, { duration: 1500 });
    } catch (error) {
      setOptimisticStatus(null);
      toast.error('Failed to update status', { duration: 1500 });
    } finally {
      if (safetyTimerRef.current) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      isUpdatingRef.current = false;
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === client.name) {
      setIsEditingName(false);
      setEditedName(client.name);
      return;
    }

    try {
      await updateClient(client.id, { name: editedName.trim() });
      setIsEditingName(false);
      toast.success('Contact name updated', { duration: 1500 });
    } catch (error) {
      setEditedName(client.name);
      toast.error('Failed to update name', { duration: 1500 });
    }
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setEditedName(client.name);
  };

  const handleSavePhone = async () => {
    const trimmedPhone = editedPhone.trim();

    if (!trimmedPhone || trimmedPhone === client.phone) {
      setIsEditingPhone(false);
      setEditedPhone(client.phone);
      return;
    }

    if (!/^[\d+\-\s()]{7,20}$/.test(trimmedPhone)) {
      toast.error('Please enter a valid mobile number', { duration: 1500 });
      return;
    }

    try {
      await updateClient(client.id, { phone: trimmedPhone });
      setIsEditingPhone(false);
      toast.success('Mobile number updated', { duration: 1500 });
    } catch (error) {
      setEditedPhone(client.phone);
      toast.error('Failed to update mobile number', { duration: 1500 });
    }
  };

  const handleCancelPhoneEdit = () => {
    setIsEditingPhone(false);
    setEditedPhone(client.phone);
  };

  return (
    <Card className={cn(
      "group transition-all duration-300 ease-out border-border/40 overflow-hidden rounded-2xl shadow-md",
      "hover:shadow-2xl hover:-translate-y-1 hover:border-primary/40",
      "touch-manipulation",
      isSelected && "ring-2 ring-primary/60 border-primary/60 shadow-lg"
    )}>
      <CardContent className="p-0">
        {/* Main Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
            {/* Client Info */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <Avatar className="h-11 w-11 sm:h-12 sm:w-12 border-2 border-primary/20 shrink-0 ring-2 ring-background shadow-lg group-hover:scale-105 transition-transform duration-300">
                <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground font-bold text-sm">
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="h-8 text-base sm:text-lg font-bold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelNameEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={handleSaveName}
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={handleCancelNameEdit}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h3 className="font-bold text-foreground truncate text-base sm:text-lg leading-tight group-hover:text-primary transition-colors duration-200">
                      {client.name}
                    </h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                
                {isEditingPhone ? (
                  <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                    <Input
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      className="h-8 text-xs sm:text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePhone();
                        if (e.key === 'Escape') handleCancelPhoneEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={handleSavePhone}
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={handleCancelPhoneEdit}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleWhatsApp()}
                    className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground hover:text-emerald-600 transition-all duration-200 cursor-pointer group/phone touch-manipulation"
                  >
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="group-hover/phone:underline decoration-dotted underline-offset-2 font-medium">
                      {client.phone}
                    </span>
                  </button>
                )}

                {client.company && (
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                    <Building className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="truncate">{client.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge — pure React fixed-position dropdown */}
            <div ref={statusRef} className="shrink-0">
              <button
                type="button"
                onClick={openStatusMenu}
                disabled={isUpdatingStatus}
                className={cn(
                  "inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-semibold text-[11px] sm:text-xs border-2",
                  "cursor-pointer transition-all duration-100 select-none touch-manipulation shadow-sm",
                  "hover:ring-2 hover:ring-primary/30 hover:shadow-md active:scale-95",
                  statusColors.bg,
                  statusColors.text,
                  statusColors.border,
                  isUpdatingStatus && "opacity-70 cursor-not-allowed",
                  statusMenuOpen && "ring-2 ring-primary/40 shadow-md scale-105"
                )}
              >
                {isUpdatingStatus ? (
                  <>
                    <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span className={cn("w-2 h-2 rounded-full shrink-0 shadow-sm", statusColors.dot)} />
                    <span className="truncate max-w-[90px] sm:max-w-none">{displayStatus || 'Set Status'}</span>
                    <ChevronDown className={cn(
                      "h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70 shrink-0 transition-transform duration-100",
                      statusMenuOpen && "rotate-180"
                    )} />
                  </>
                )}
              </button>

              {/* Fixed-position dropdown — escapes card's overflow:hidden */}
              {statusMenuOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: statusMenuPos.top,
                    right: statusMenuPos.right,
                    zIndex: 9999,
                  }}
                  className="w-56 py-2 px-2 rounded-2xl shadow-2xl bg-popover/95 backdrop-blur-md border border-border/50 animate-in fade-in-0 zoom-in-95 duration-100"
                >
                  <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide px-3 py-2 border-b mb-1.5">
                    Update Status
                  </p>
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {statusOptions.map((status) => {
                      const colors = getStatusColors(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(status); }}
                          disabled={isUpdatingStatus}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-100 touch-manipulation",
                            displayStatus === status
                              ? "bg-primary/15 text-primary shadow-sm"
                              : "hover:bg-muted/80 active:scale-95"
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className={cn("w-2.5 h-2.5 rounded-full shadow-sm", colors.dot)} />
                            {status}
                          </span>
                          {displayStatus === status && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Last Contacted */}
          {client.lastContacted && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 bg-muted/40 rounded-xl px-3 py-2 w-fit border border-border/30">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">Last contacted {formatDistanceToNow(client.lastContacted, { addSuffix: true })}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleCall}
              size="sm"
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 rounded-xl h-9 sm:h-10 font-semibold shadow-md hover:shadow-lg text-xs sm:text-sm touch-manipulation transition-all duration-300 active:scale-[0.97]"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Call
            </Button>
            
            {/* WhatsApp Dropdown */}
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  type="button"
                  className="flex-1 gap-2 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 rounded-xl h-9 sm:h-10 font-semibold shadow-md hover:shadow-lg group/wa text-xs sm:text-sm touch-manipulation transition-all duration-300 active:scale-[0.97]"
                >
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">WhatsApp</span>
                  <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70 transition-transform group-data-[state=open]/wa:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-64 rounded-2xl p-2 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-3 duration-300"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wide px-3 py-2 border-b mb-1.5">
                  Choose Message Template
                </p>
                {whatsappTemplates.length > 0 ? (
                  whatsappTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(template.message);
                      }}
                      className="rounded-xl px-3 py-3 cursor-pointer transition-all hover:bg-emerald-50 focus:bg-emerald-50 gap-3 touch-manipulation"
                    >
                      <span className="text-xl">{template.emoji}</span>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">{template.label}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {template.message.split('\n')[0]}...
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-muted-foreground">No templates configured</p>
                    <p className="text-xs text-muted-foreground mt-1">Add templates in Settings</p>
                  </div>
                )}
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsApp();
                  }}
                  className="rounded-xl px-3 py-2.5 cursor-pointer transition-all hover:bg-muted focus:bg-muted gap-3 touch-manipulation"
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Open without message</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notes Toggle */}
            <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "gap-2 rounded-xl h-9 sm:h-10 px-3 sm:px-4 border-2 border-border/50 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg touch-manipulation transition-all duration-300 active:scale-[0.97]",
                    notesExpanded && "bg-muted border-muted-foreground/30 shadow-inner"
                  )}
                >
                  <StickyNote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Notes</span>
                  {client.notes.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] px-1.5 text-xs rounded-md font-bold">
                      {client.notes.length}
                    </Badge>
                  )}
                  <ChevronDown className={cn(
                    "h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300",
                    notesExpanded && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            {/* More Actions */}
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" type="button" className="h-9 sm:h-10 w-9 sm:w-10 rounded-xl shrink-0 touch-manipulation hover:bg-muted/80 active:scale-95 transition-all duration-200 shadow-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-52 rounded-2xl p-2 shadow-2xl"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem className="rounded-xl gap-2.5 cursor-pointer touch-manipulation py-2.5 font-medium hover:bg-primary/10 hover:text-primary">
                  <DollarSign className="h-4 w-4" />
                  Add Sale
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setIsEditingPhone(true);
                    setEditedPhone(client.phone);
                  }}
                  className="rounded-xl gap-2.5 cursor-pointer touch-manipulation py-2.5 font-medium hover:bg-primary/10 hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                  Edit Mobile Number
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl gap-2.5 cursor-pointer touch-manipulation py-2.5 font-medium hover:bg-primary/10 hover:text-primary">
                  <Mail className="h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem className="rounded-xl gap-2.5 text-destructive focus:text-destructive cursor-pointer touch-manipulation py-2.5 font-medium hover:bg-destructive/10">
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notes Expanded Section */}
        <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
          <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
            <div className="border-t border-border/40 bg-gradient-to-b from-muted/30 to-muted/10 p-4 sm:p-5 space-y-4">
              {/* Add Note */}
              <div className="flex gap-2.5">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px] bg-background rounded-xl resize-none text-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                />
                <Button 
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="shrink-0 rounded-xl h-10 w-10 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes List */}
              {client.notes.length > 0 ? (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {client.notes.slice().reverse().map((note) => (
                    <div 
                      key={note.id}
                      className="p-3.5 bg-background rounded-xl border border-border/50 text-sm group/note hover:border-border hover:shadow-md transition-all duration-200"
                    >
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                        <span className="font-semibold">{note.createdBy}</span>
                        <span className="font-medium">{formatDistanceToNow(note.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <StickyNote className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No notes yet</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
});
