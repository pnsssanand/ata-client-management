import { useState, useCallback, memo, useEffect } from 'react';
import { Phone, MessageCircle, Clock, Building, Mail, ChevronDown, ChevronUp, Plus, Trash2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Client, DropdownField } from '@/types/client';
import { useClientStore } from '@/stores/clientStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ClientCardProps {
  client: Client;
}

// Memoized dropdown component for better performance with improved mobile support
const ClientDropdown = memo(({ 
  dropdown, 
  clientId, 
  currentValue,
  onValueChange,
  onUpdate 
}: { 
  dropdown: DropdownField; 
  clientId: string; 
  currentValue: string;
  onValueChange: (clientId: string, fieldName: string, value: string) => void;
  onUpdate?: () => void;
}) => {
  const [localValue, setLocalValue] = useState(currentValue);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Sync with prop value only when it changes from external source
  useEffect(() => {
    if (!isUpdating) {
      setLocalValue(currentValue);
    }
  }, [currentValue, isUpdating]);

  const handleChange = useCallback(async (value: string) => {
    if (isUpdating || value === localValue) return;
    
    // Immediately update local state for responsive UI
    setLocalValue(value);
    setIsUpdating(true);
    
    // Propagate to store
    try {
      await onValueChange(clientId, dropdown.name, value);
      // Show feedback toast on mobile
      if (window.innerWidth < 768) {
        toast.success(`${dropdown.name} updated`, { duration: 1500 });
      }
    } catch (error) {
      // Revert on error
      setLocalValue(currentValue);
      toast.error('Failed to update', { duration: 1500 });
    } finally {
      setIsUpdating(false);
    }
    
    // Auto-close expanded section after update
    if (onUpdate) {
      setTimeout(() => onUpdate(), 300);
    }
  }, [clientId, dropdown.name, onValueChange, currentValue, isUpdating, localValue]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{dropdown.name}</label>
      <Select
        value={localValue || ''}
        onValueChange={handleChange}
        disabled={isUpdating}
      >
        <SelectTrigger className={cn(
          "bg-card h-11 md:h-10 transition-all duration-150",
          isUpdating && "opacity-60 pointer-events-none"
        )}>
          <SelectValue placeholder={`Select ${dropdown.name}`} />
          {isUpdating && (
            <span className="absolute right-8 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </SelectTrigger>
        <SelectContent 
          position="popper" 
          side="bottom" 
          align="start"
          className="max-h-[50vh] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {dropdown.options.map((option) => (
            <SelectItem 
              key={option} 
              value={option}
              className="py-2.5 md:py-2"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render when these change
  return (
    prevProps.clientId === nextProps.clientId &&
    prevProps.currentValue === nextProps.currentValue &&
    prevProps.dropdown.id === nextProps.dropdown.id &&
    prevProps.dropdown.options.length === nextProps.dropdown.options.length
  );
});

const statusColors: Record<string, string> = {
  'New Lead': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  'Hot Lead': 'bg-destructive/20 text-destructive border-destructive/30',
  'Warm Lead': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Cold Lead': 'bg-muted text-muted-foreground border-muted',
  'Converted': 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  'Lost': 'bg-destructive/10 text-destructive/70 border-destructive/20',
  'Installed': 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  'App Installed': 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  'Not answered': 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  'App user': 'bg-violet-500/20 text-violet-600 border-violet-500/30',
};

const priorityColors: Record<string, string> = {
  'High': 'bg-destructive text-destructive-foreground',
  'Medium': 'bg-chart-2 text-foreground',
  'Low': 'bg-muted text-muted-foreground',
};

export function ClientCard({ client }: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const { dropdowns, updateDropdownValue, addNote } = useClientStore();

  // Get lead status dropdown options
  const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
  const statusOptions = leadStatusDropdown?.options || [];

  // Use optimistic status if set, otherwise use client status
  const displayStatus = optimisticStatus || client.status;

  // Sync optimistic status when client status changes (from server or other updates)
  useEffect(() => {
    if (optimisticStatus && client.status === optimisticStatus) {
      setOptimisticStatus(null);
    }
  }, [client.status, optimisticStatus]);

  const handleCall = () => {
    // Clean phone number - remove spaces and keep the + for international format
    const cleanPhone = client.phone.replace(/[\s\-\(\)]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleWhatsApp = () => {
    // Clean phone number for WhatsApp - remove spaces, dashes, parentheses, and + sign
    const cleanPhone = client.phone.replace(/[\s\-\(\)\+]/g, '');
    // Use wa.me deep link format
    const waUrl = `https://wa.me/${cleanPhone}`;
    window.open(waUrl, '_blank');
  };

  // Handler for clicking phone number - opens WhatsApp
  const handlePhoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleWhatsApp();
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await addNote(client.id, newNote.trim());
        setNewNote('');
        toast.success('Note added successfully', { duration: 1500 });
        // Auto-close expanded section after adding note
        setTimeout(() => setExpanded(false), 300);
      } catch (error) {
        toast.error('Failed to add note', { duration: 1500 });
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingStatus || newStatus === displayStatus) {
      setStatusOpen(false);
      return;
    }
    
    setIsUpdatingStatus(true);
    setOptimisticStatus(newStatus); // Immediate visual feedback
    setStatusOpen(false);
    
    try {
      await updateDropdownValue(client.id, 'Lead Status', newStatus);
      toast.success(`Status updated to "${newStatus}"`, { duration: 1500 });
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticStatus(null);
      toast.error('Failed to update status', { duration: 1500 });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Main Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Client Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                  <Badge variant="outline" className={cn("text-xs shrink-0", priorityColors[client.priority])}>
                    {client.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <button 
                    onClick={handlePhoneClick}
                    className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer touch-manipulation"
                    title="Open WhatsApp"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span className="underline decoration-dotted underline-offset-2">{client.phone}</span>
                  </button>
                  {client.company && (
                    <span className="flex items-center gap-1.5 hidden sm:flex">
                      <Building className="h-3.5 w-3.5" />
                      {client.company}
                    </span>
                  )}
                </div>

                {client.lastContacted && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Last contacted {formatDistanceToNow(client.lastContacted, { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>

            {/* Status Badge - Clickable to update */}
            {statusOptions.length > 0 ? (
              <Popover open={statusOpen} onOpenChange={(open) => !isUpdatingStatus && setStatusOpen(open)}>
                <PopoverTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all touch-manipulation select-none",
                      statusColors[displayStatus] || 'bg-muted/50 text-muted-foreground border-muted',
                      isUpdatingStatus && "opacity-70 pointer-events-none"
                    )}
                  >
                    {isUpdatingStatus ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Updating...
                      </span>
                    ) : (
                      <>
                        {displayStatus || 'Set Status'}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-48 p-1 z-[100]" 
                  align="end"
                  side="bottom"
                  sideOffset={5}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onPointerDownOutside={(e) => {
                    // Prevent closing when clicking on scroll bar
                    if ((e.target as HTMLElement)?.closest?.('[data-radix-scroll-area-viewport]')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Update Status</p>
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={isUpdatingStatus}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-2.5 md:py-2 text-sm rounded-md transition-colors touch-manipulation",
                          displayStatus === status 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted active:bg-muted/80",
                          isUpdatingStatus && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            status === 'New Lead' && "bg-chart-1",
                            status === 'Hot Lead' && "bg-destructive",
                            status === 'Warm Lead' && "bg-chart-2",
                            status === 'Cold Lead' && "bg-muted-foreground",
                            status === 'Converted' && "bg-emerald-500",
                            status === 'Lost' && "bg-destructive/70",
                            status === 'Installed' && "bg-purple-500",
                            status === 'App Installed' && "bg-purple-500",
                            status === 'Not answered' && "bg-yellow-500",
                            status === 'App user' && "bg-violet-500",
                            !['New Lead', 'Hot Lead', 'Warm Lead', 'Cold Lead', 'Converted', 'Lost', 'Installed', 'App Installed', 'Not answered', 'App user'].includes(status) && "bg-primary"
                          )} />
                          {status}
                        </span>
                        {displayStatus === status && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Badge variant="outline" className={cn("shrink-0", statusColors[displayStatus] || 'bg-muted/50 text-muted-foreground border-muted')}>
                {displayStatus || 'No Status'}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button 
              onClick={handleCall}
              className="flex-1 gap-2 bg-primary hover:bg-primary/90"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button 
              onClick={handleWhatsApp}
              variant="outline"
              className="flex-1 gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-border bg-muted/30 p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
            {/* Contact Details */}
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors">
                  {client.email}
                </a>
              </div>
            )}

            {/* Dropdowns */}
            {dropdowns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dropdowns.map((dropdown) => (
                  <ClientDropdown
                    key={dropdown.id}
                    dropdown={dropdown}
                    clientId={client.id}
                    currentValue={client.dropdownValues[dropdown.name] || ''}
                    onValueChange={updateDropdownValue}
                    onUpdate={() => setExpanded(false)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 px-4 bg-muted/20 rounded-lg border border-dashed border-border">
                <p className="text-sm text-muted-foreground">
                  No dropdown fields configured. Go to Settings to create custom dropdowns.
                </p>
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                Notes
                <Badge variant="secondary" className="text-xs">
                  {client.notes.length}
                </Badge>
              </h4>
              
              {/* Add Note */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px] bg-card resize-none"
                />
                <Button 
                  size="icon" 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes List */}
              {client.notes.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {client.notes.slice().reverse().map((note) => (
                    <div 
                      key={note.id}
                      className="p-3 bg-card rounded-lg border border-border/50 text-sm"
                    >
                      <p className="text-foreground">{note.content}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{note.createdBy}</span>
                        <span>{formatDistanceToNow(note.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
