import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { useState, useEffect } from 'react';

export function ClientFilters() {
  const { 
    searchQuery, 
    setSearchQuery, 
    filterStatus, 
    setFilterStatus, 
    filterPriority, 
    setFilterPriority,
    filterCallOutcome,
    setFilterCallOutcome,
    dropdowns 
  } = useClientStore();

  // Local state for dropdowns to ensure smooth mobile updates
  const [localFilterStatus, setLocalFilterStatus] = useState(filterStatus);
  const [localFilterPriority, setLocalFilterPriority] = useState(filterPriority);
  const [localFilterCallOutcome, setLocalFilterCallOutcome] = useState(filterCallOutcome);

  // Sync local state with store when dropdowns or filters change from other devices
  useEffect(() => {
    setLocalFilterStatus(filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    setLocalFilterPriority(filterPriority);
  }, [filterPriority]);

  useEffect(() => {
    setLocalFilterCallOutcome(filterCallOutcome);
  }, [filterCallOutcome]);

  const statusDropdown = dropdowns.find(d => d.name === 'Lead Status');
  const priorityDropdown = dropdowns.find(d => d.name === 'Priority');
  const callOutcomeDropdown = dropdowns.find(d => d.name === 'Call Outcome');

  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterCallOutcome !== 'all';

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterCallOutcome('all');
    setLocalFilterStatus('all');
    setLocalFilterPriority('all');
    setLocalFilterCallOutcome('all');
  };

  const handleStatusChange = (value: string) => {
    setLocalFilterStatus(value);
    setFilterStatus(value);
  };

  const handlePriorityChange = (value: string) => {
    setLocalFilterPriority(value);
    setFilterPriority(value);
  };

  const handleCallOutcomeChange = (value: string) => {
    setLocalFilterCallOutcome(value);
    setFilterCallOutcome(value);
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
          className="pl-10 bg-background h-11 md:h-10"
        />
      </div>

      {/* Filters - Only show if there are dropdowns configured */}
      {dropdowns.length > 0 && (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground w-full md:w-auto">
          <Filter className="h-4 w-4" />
          <span>Filter by:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:flex md:flex-wrap">
          {statusDropdown && (
          <Select value={localFilterStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-[160px] bg-background h-11 md:h-10">
              <SelectValue placeholder="Lead Status" />
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="start"
              className="max-h-[50vh]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <SelectItem value="all" className="py-3 md:py-2">All Statuses</SelectItem>
              {statusDropdown?.options.map((option) => (
                <SelectItem key={option} value={option} className="py-3 md:py-2">{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}

          {priorityDropdown && (
          <Select value={localFilterPriority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-full md:w-[140px] bg-background h-11 md:h-10">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="start"
              className="max-h-[50vh]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <SelectItem value="all" className="py-3 md:py-2">All Priorities</SelectItem>
              {priorityDropdown?.options.map((option) => (
                <SelectItem key={option} value={option} className="py-3 md:py-2">{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}

          {callOutcomeDropdown && (
          <Select value={localFilterCallOutcome} onValueChange={handleCallOutcomeChange}>
            <SelectTrigger className="w-full md:w-[160px] bg-background h-11 md:h-10">
              <SelectValue placeholder="Call Outcome" />
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="start"
              className="max-h-[50vh]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <SelectItem value="all" className="py-3 md:py-2">All Outcomes</SelectItem>
              {callOutcomeDropdown?.options.map((option) => (
                <SelectItem key={option} value={option} className="py-3 md:py-2">{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground h-11 md:h-9">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
      )}

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {filterStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1 py-1.5 md:py-1">
              Status: {filterStatus}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setFilterStatus('all'); setLocalFilterStatus('all'); }} />
            </Badge>
          )}
          {filterPriority !== 'all' && (
            <Badge variant="secondary" className="gap-1 py-1.5 md:py-1">
              Priority: {filterPriority}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setFilterPriority('all'); setLocalFilterPriority('all'); }} />
            </Badge>
          )}
          {filterCallOutcome !== 'all' && (
            <Badge variant="secondary" className="gap-1 py-1.5 md:py-1">
              Call Outcome: {filterCallOutcome}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setFilterCallOutcome('all'); setLocalFilterCallOutcome('all'); }} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
