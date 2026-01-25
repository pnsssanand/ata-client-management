import { useState, useCallback, memo } from 'react';
import { Phone, MessageCircle, Clock, Building, Mail, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Client, DropdownField } from '@/types/client';
import { useClientStore } from '@/stores/clientStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ClientCardProps {
  client: Client;
}

// Memoized dropdown component for better performance
const ClientDropdown = memo(({ 
  dropdown, 
  clientId, 
  currentValue,
  onValueChange 
}: { 
  dropdown: DropdownField; 
  clientId: string; 
  currentValue: string;
  onValueChange: (clientId: string, fieldName: string, value: string) => void;
}) => {
  const handleChange = useCallback((value: string) => {
    onValueChange(clientId, dropdown.name, value);
  }, [clientId, dropdown.name, onValueChange]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{dropdown.name}</label>
      <Select
        value={currentValue || ''}
        onValueChange={handleChange}
      >
        <SelectTrigger className="bg-card">
          <SelectValue placeholder={`Select ${dropdown.name}`} />
        </SelectTrigger>
        <SelectContent>
          {dropdown.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

const statusColors: Record<string, string> = {
  'New Lead': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  'Hot Lead': 'bg-destructive/20 text-destructive border-destructive/30',
  'Warm Lead': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Cold Lead': 'bg-muted text-muted-foreground border-muted',
  'Converted': 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  'Lost': 'bg-destructive/10 text-destructive/70 border-destructive/20',
};

const priorityColors: Record<string, string> = {
  'High': 'bg-destructive text-destructive-foreground',
  'Medium': 'bg-chart-2 text-foreground',
  'Low': 'bg-muted text-muted-foreground',
};

export function ClientCard({ client }: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { dropdowns, updateDropdownValue, addNote } = useClientStore();

  const handleCall = () => {
    window.location.href = `tel:${client.phone.replace(/\s/g, '')}`;
  };

  const handleWhatsApp = () => {
    const phone = client.phone.replace(/\s/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(client.id, newNote.trim());
      setNewNote('');
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
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {client.phone}
                  </span>
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

            {/* Status Badge */}
            <Badge variant="outline" className={cn("shrink-0", statusColors[client.status] || statusColors['New Lead'])}>
              {client.status}
            </Badge>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dropdowns.map((dropdown) => (
                <ClientDropdown
                  key={dropdown.id}
                  dropdown={dropdown}
                  clientId={client.id}
                  currentValue={client.dropdownValues[dropdown.name] || ''}
                  onValueChange={updateDropdownValue}
                />
              ))}
            </div>

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
