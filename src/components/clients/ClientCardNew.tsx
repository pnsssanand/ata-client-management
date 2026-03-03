import { useState, useCallback, useEffect, useRef, memo } from 'react';
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
  StickyNote
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
  
  const { dropdowns, updateDropdownValue, addNote } = useClientStore();

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
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handleOutside, { passive: true });
      document.addEventListener('touchstart', handleOutside, { passive: true });
    }, 50);
    return () => {
      window.clearTimeout(id);
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
    if (isUpdatingRef.current) return; // use ref — no stale closure, no re-creation
    const rect = statusRef.current?.getBoundingClientRect();
    if (rect) {
      setStatusMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setStatusMenuOpen(prev => !prev);
  }, []); // stable forever — reads ref, not state

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
    isUpdatingRef.current = true;
    setIsUpdatingStatus(true);
    setOptimisticStatus(newStatus);
    setStatusMenuOpen(false);

    // Safety net: force-reset after 8s if API hangs
    if (safetyTimerRef.current) window.clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = window.setTimeout(() => {
      isUpdatingRef.current = false;
      setIsUpdatingStatus(false);
      safetyTimerRef.current = null;
    }, 8000);

    try {
      await updateDropdownValue(client.id, 'Lead Status', newStatus);
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

  return (
    <Card className={cn(
      "group transition-all duration-200 border-border/50 hover:border-primary/30 overflow-hidden rounded-xl",
      "hover:shadow-lg hover:-translate-y-0.5",
      "touch-manipulation",
      isSelected && "ring-2 ring-primary/50 border-primary/50"
    )}>
      <CardContent className="p-0">
        {/* Main Content */}
        <div className="p-3 sm:p-4 lg:p-5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            {/* Client Info */}
            <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
              <Avatar className="h-9 w-9 sm:h-11 sm:w-11 border-2 border-primary/10 shrink-0 ring-2 ring-background shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate text-sm sm:text-base leading-tight">
                  {client.name}
                </h3>
                
                <button 
                  onClick={() => handleWhatsApp()}
                  className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground hover:text-emerald-600 transition-colors cursor-pointer group/phone touch-manipulation"
                >
                  <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="group-hover/phone:underline decoration-dotted underline-offset-2">
                    {client.phone}
                  </span>
                </button>

                {client.company && (
                  <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
                    <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
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
                  "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-medium text-[10px] sm:text-xs border",
                  "cursor-pointer transition-all duration-200 select-none touch-manipulation",
                  "hover:ring-2 hover:ring-primary/20 active:scale-95",
                  statusColors.bg,
                  statusColors.text,
                  statusColors.border,
                  isUpdatingStatus && "opacity-70 cursor-not-allowed",
                  statusMenuOpen && "ring-2 ring-primary/30"
                )}
              >
                {isUpdatingStatus ? (
                  <>
                    <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColors.dot)} />
                    <span className="truncate max-w-[80px] sm:max-w-none">{displayStatus || 'Set Status'}</span>
                    <ChevronDown className={cn(
                      "h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-60 shrink-0 transition-transform duration-150",
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
                  className="w-52 py-1.5 px-1.5 rounded-xl shadow-xl bg-popover border border-border animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
                >
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 border-b mb-1">
                    Update Status
                  </p>
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {statusOptions.map((status) => {
                      const colors = getStatusColors(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(status); }}
                          disabled={isUpdatingStatus}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-lg transition-all touch-manipulation",
                            displayStatus === status
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted/70 active:bg-muted active:scale-[0.98]"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
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
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 bg-muted/30 rounded-lg px-2.5 py-1.5 w-fit">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>Last contacted {formatDistanceToNow(client.lastContacted, { addSuffix: true })}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button 
              onClick={handleCall}
              size="sm"
              className="flex-1 gap-1 sm:gap-2 bg-primary hover:bg-primary/90 rounded-lg h-8 sm:h-9 font-medium shadow-sm text-xs sm:text-sm touch-manipulation active:scale-[0.97]"
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Call
            </Button>
            
            {/* WhatsApp Dropdown */}
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  type="button"
                  className="flex-1 gap-1 sm:gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 rounded-lg h-8 sm:h-9 font-medium group/wa text-xs sm:text-sm touch-manipulation active:scale-[0.97]"
                >
                  <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden xs:inline">WhatsApp</span>
                  <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-60 transition-transform group-data-[state=open]/wa:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-56 rounded-xl p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 border-b mb-1">
                  Choose Message Template
                </p>
                {whatsappMessages.map((msg) => (
                  <DropdownMenuItem
                    key={msg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsApp(msg.message);
                    }}
                    className="rounded-lg px-2.5 py-2.5 cursor-pointer transition-all hover:bg-emerald-50 focus:bg-emerald-50 gap-2.5 touch-manipulation"
                  >
                    <span className="text-lg">{msg.emoji}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{msg.label}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {msg.message.split('\n')[0]}...
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsApp();
                  }}
                  className="rounded-lg px-2.5 py-2 cursor-pointer transition-all hover:bg-muted focus:bg-muted gap-2.5 touch-manipulation"
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Open without message</span>
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
                    "gap-1 sm:gap-1.5 rounded-lg h-8 sm:h-9 px-2 sm:px-3 border-border/50 text-xs sm:text-sm touch-manipulation active:scale-[0.97]",
                    notesExpanded && "bg-muted border-muted-foreground/20"
                  )}
                >
                  <StickyNote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Notes</span>
                  {client.notes.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] px-1 sm:px-1.5 text-[10px] sm:text-xs rounded-md">
                      {client.notes.length}
                    </Badge>
                  )}
                  <ChevronDown className={cn(
                    "h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-200",
                    notesExpanded && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            {/* More Actions */}
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" type="button" className="h-9 w-9 rounded-lg shrink-0 touch-manipulation active:scale-95">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-48 rounded-xl"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer touch-manipulation">
                  <DollarSign className="h-4 w-4" />
                  Add Sale
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer touch-manipulation">
                  <Mail className="h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg gap-2 text-destructive focus:text-destructive cursor-pointer touch-manipulation">
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notes Expanded Section */}
        <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
          <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
            <div className="border-t border-border/50 bg-muted/20 p-4 space-y-3">
              {/* Add Note */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[70px] bg-background rounded-lg resize-none text-sm border-border/50 focus:border-primary/50"
                />
                <Button 
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="shrink-0 rounded-lg h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes List */}
              {client.notes.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {client.notes.slice().reverse().map((note) => (
                    <div 
                      key={note.id}
                      className="p-3 bg-background rounded-lg border border-border/50 text-sm group/note hover:border-border transition-colors"
                    >
                      <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                        <span className="font-medium">{note.createdBy}</span>
                        <span>{formatDistanceToNow(note.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <StickyNote className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
                  No notes yet
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
});
