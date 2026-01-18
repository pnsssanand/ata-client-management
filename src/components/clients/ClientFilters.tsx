import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';

export function ClientFilters() {
  const { 
    searchQuery, 
    setSearchQuery, 
    filterStatus, 
    setFilterStatus, 
    filterPriority, 
    setFilterPriority,
    dropdowns 
  } = useClientStore();

  const statusDropdown = dropdowns.find(d => d.name === 'Lead Status');
  const priorityDropdown = dropdowns.find(d => d.name === 'Priority');

  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all';

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border border-border/50">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter by:</span>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="Lead Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusDropdown?.options.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorityDropdown?.options.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {filterStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filterStatus}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
            </Badge>
          )}
          {filterPriority !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Priority: {filterPriority}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterPriority('all')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
