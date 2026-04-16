import { useState, useMemo } from 'react';
import { useClientStore } from '@/stores/clientStore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  CheckSquare,
  Square,
  MessageCircle,
  Phone,
  Users,
} from 'lucide-react';
import { SendMessageDialog } from './SendMessageDialog';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  iphone: 'bg-blue-100 text-blue-700',
  converted: 'bg-green-100 text-green-700',
  'not answered': 'bg-red-100 text-red-700',
  'wrong number': 'bg-gray-100 text-gray-700',
  'app installed': 'bg-purple-100 text-purple-700',
  stalled: 'bg-orange-100 text-orange-700',
  'new lead': 'bg-cyan-100 text-cyan-700',
  default: 'bg-gray-100 text-gray-700',
};

function getStatusColor(status: string) {
  return statusColors[status.toLowerCase()] || statusColors.default;
}

export function WAMessenger() {
  const clients = useClientStore((state) => state.clients);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSendDialog, setShowSendDialog] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((c) => {
      const status = c.status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [clients]);

  const statuses = useMemo(() => Object.keys(statusCounts).sort(), [statusCounts]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.status || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  function toggleClient(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }

  const selectedClients = clients.filter((c) => selectedIds.has(c.id));
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Selected</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{selectedIds.size}</p>
          </CardContent>
        </Card>
        {statuses.slice(0, 3).map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{status}</p>
              <p className="text-2xl font-bold">{statusCounts[status]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s} ({statusCounts[s]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={selectAll}>
          {allSelected ? (
            <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>

        {selectedIds.size > 0 && (
          <Button
            onClick={() => setShowSendDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Send Message ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Selected count */}
      {selectedIds.size > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedIds.size} of {filtered.length} clients selected
        </p>
      )}

      {/* Client grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((client) => {
          const isSelected = selectedIds.has(client.id);
          return (
            <Card
              key={client.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'border-green-500 bg-green-50 ring-2 ring-green-200'
              )}
              onClick={() => toggleClient(client.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold pr-8">{client.name}</h3>
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{client.phone}</span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant="secondary"
                    className={cn(getStatusColor(client.status))}
                  >
                    {client.status || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No clients found.
        </div>
      )}

      {/* Send Message Dialog */}
      {showSendDialog && (
        <SendMessageDialog
          selectedClients={selectedClients}
          onClose={() => {
            setShowSendDialog(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}
