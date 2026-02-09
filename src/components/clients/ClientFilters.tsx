import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { useCallback, memo, useState, useEffect, useRef } from 'react';

// Memoized filter select for better performance
const FilterSelect = memo(({ 
  value, 
  onChange, 
  placeholder, 
  options, 
  allLabel,
  className = ""
}: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  allLabel: string;
  className?: string;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className={`bg-background h-11 md:h-10 ${className}`}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent 
      position="popper" 
      side="bottom" 
      align="start"
      className="max-h-[50vh]"
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <SelectItem value="all" className="py-2.5 md:py-2">{allLabel}</SelectItem>
      {options.map((option) => (
        <SelectItem key={option} value={option} className="py-2.5 md:py-2">{option}</SelectItem>
      ))}
    </SelectContent>
  </Select>
));

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

  // Local search state for instant UI feedback
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when store changes externally
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced search update
  const handleSearchChange = useCallback((value: string) => {
    // Update local state immediately for responsive UI
    setLocalSearch(value);
    
    // Debounce the store update
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 200);
  }, [setSearchQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const statusDropdown = dropdowns.find(d => d.name === 'Lead Status');
  const priorityDropdown = dropdowns.find(d => d.name === 'Priority');
  const callOutcomeDropdown = dropdowns.find(d => d.name === 'Call Outcome');

  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterCallOutcome !== 'all';

  const clearFilters = useCallback(() => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterCallOutcome('all');
  }, [setFilterStatus, setFilterPriority, setFilterCallOutcome]);

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border border-border/50">
      {/* Search with debounced input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email, or company..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
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
            <FilterSelect
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Lead Status"
              options={statusDropdown.options}
              allLabel="All Statuses"
              className="w-full md:w-[160px]"
            />
          )}

          {priorityDropdown && (
            <FilterSelect
              value={filterPriority}
              onChange={setFilterPriority}
              placeholder="Priority"
              options={priorityDropdown.options}
              allLabel="All Priorities"
              className="w-full md:w-[140px]"
            />
          )}

          {callOutcomeDropdown && (
            <FilterSelect
              value={filterCallOutcome}
              onChange={setFilterCallOutcome}
              placeholder="Call Outcome"
              options={callOutcomeDropdown.options}
              allLabel="All Outcomes"
              className="w-full md:w-[160px]"
            />
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
              <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => setFilterStatus('all')} />
            </Badge>
          )}
          {filterPriority !== 'all' && (
            <Badge variant="secondary" className="gap-1 py-1.5 md:py-1">
              Priority: {filterPriority}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => setFilterPriority('all')} />
            </Badge>
          )}
          {filterCallOutcome !== 'all' && (
            <Badge variant="secondary" className="gap-1 py-1.5 md:py-1">
              Call Outcome: {filterCallOutcome}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => setFilterCallOutcome('all')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
