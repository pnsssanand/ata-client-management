import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Users, 
  UserCheck, 
  PhoneOff, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Search,
  Calendar,
  Filter,
  X,
  ChevronDown,
  Sparkles,
  Phone,
  Clock,
  Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClientCardNew } from './ClientCardNew';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, isToday, isThisWeek, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';

// Status configuration for tabs and badges
const STATUS_TABS = [
  { id: 'all', label: 'All Clients', icon: Users },
  { id: 'Converted', label: 'Converted', icon: UserCheck },
  { id: 'Not answered', label: 'Not Answered', icon: PhoneOff },
  { id: 'New Lead', label: 'New Leads', icon: TrendingUp },
];

// Stat card configuration
const STAT_CARDS = [
  { 
    key: 'total', 
    label: 'Total Clients', 
    icon: Users, 
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10'
  },
  { 
    key: 'Converted', 
    label: 'Converted', 
    icon: UserCheck, 
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10'
  },
  { 
    key: 'Not answered', 
    label: 'Not Answered', 
    icon: PhoneOff, 
    gradient: 'from-yellow-500/10 to-yellow-600/5',
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10'
  },
  { 
    key: 'New Lead', 
    label: 'New Leads', 
    icon: TrendingUp, 
    gradient: 'from-purple-500/10 to-purple-600/5',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10'
  },
];

// Date filter options
const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This Week' },
  { id: 'custom', label: 'Custom Range' },
];

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  iconBg: string;
  onClick?: () => void;
  isActive?: boolean;
}

const StatCard = ({ label, value, icon: Icon, gradient, iconColor, iconBg, onClick, isActive }: StatCardProps) => (
  <Card 
    className={cn(
      "cursor-pointer transition-all duration-200 border-border/50 hover:border-primary/30 hover:shadow-lg group overflow-hidden",
      "active:scale-[0.98] touch-manipulation select-none",
      isActive && "ring-2 ring-primary/50 border-primary/50"
    )}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
  >
    <CardContent className="p-3 sm:p-4 lg:p-5 relative">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">{value}</p>
        </div>
        <div className={cn("p-2 sm:p-2.5 lg:p-3 rounded-xl transition-transform duration-200 group-hover:scale-110 shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6", iconColor)} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Custom Status Filter Dropdown Options
const QUICK_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses', color: 'bg-gray-400' },
  { value: 'New Lead', label: 'New Lead', color: 'bg-purple-500' },
  { value: 'Not answered', label: 'Not answered', color: 'bg-yellow-500' },
  { value: 'App user', label: 'App user', color: 'bg-indigo-500' },
  { value: 'Converted', label: 'Converted', color: 'bg-emerald-500' },
  { value: 'Lost', label: 'Lost', color: 'bg-gray-500' },
  { value: 'App Installed', label: 'App Installed', color: 'bg-violet-500' },
  { value: 'Slot Booked', label: 'Slot Booked', color: 'bg-blue-500' },
];

// Custom Status Dropdown Component - Pure React, no Radix
interface CustomStatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function CustomStatusDropdown({ value, onChange, placeholder, disabled }: CustomStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Find current selected option
  const selectedOption = QUICK_STATUS_OPTIONS.find(opt => opt.value === value) || QUICK_STATUS_OPTIONS[0];

  // Close dropdown when clicking outside — listener only active while open
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Small delay to skip the opening click bubbling to document
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, { passive: true });
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }, 50);

    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // When used as a bulk-action picker (placeholder provided), reset value after picking
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block w-full sm:w-[170px]">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full h-10 px-3 py-2",
          "bg-background border border-border/50 rounded-lg",
          "text-sm font-medium text-foreground",
          "hover:border-primary/50 hover:bg-accent/30",
          "active:scale-[0.98] touch-manipulation select-none",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
          isOpen && "border-primary/50 ring-2 ring-primary/20",
          disabled && "opacity-60 cursor-not-allowed pointer-events-none"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {placeholder ? (
            // Bulk-action mode: show placeholder text with pencil-like indicator
            <span className="truncate text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              <span className={cn("w-2 h-2 rounded-full shrink-0", selectedOption.color)} />
              <span className="truncate">{selectedOption.label}</span>
            </>
          )}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Invisible overlay to capture clicks - lower z-index than dropdown */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown content */}
          <div
            className={cn(
              "absolute left-0 mt-1.5 w-full min-w-[180px]",
              "bg-popover border border-border rounded-xl shadow-xl",
              "z-[9999] overflow-hidden",
              // Animation
              "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
              "duration-150"
            )}
            style={{ 
              transformOrigin: 'top',
            }}
          >
            <div className="py-1.5 px-1.5 max-h-[300px] overflow-y-auto">
              {QUICK_STATUS_OPTIONS.filter(opt => placeholder ? opt.value !== 'all' : true).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-2.5 sm:py-2",
                    "text-sm rounded-lg",
                    "transition-colors duration-100",
                    "touch-manipulation select-none",
                    value === option.value 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-foreground hover:bg-muted/70 active:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", option.color)} />
                    <span>{option.label}</span>
                  </span>
                  {value === option.value && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PAGE_SIZE = 50;

export function ClientManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickStatusFilter, setQuickStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false);
  const bulkUpdatingRef = useRef(false);           // ref guard — no stale closure
  const bulkSafetyTimerRef = useRef<number | null>(null); // force-reset if API hangs
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const clients = useClientStore((state) => state.clients);
  const deleteMultipleClients = useClientStore((state) => state.deleteMultipleClients);
  const updateDropdownValue = useClientStore((state) => state.updateDropdownValue);

  // Compute stats - independent of filter state
  const stats = useMemo(() => {
    const total = clients.length;
    const statusCounts: Record<string, number> = {};
    for (let i = 0; i < clients.length; i++) {
      const status = clients[i].status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
    return { total, ...statusCounts };
  }, [clients]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, quickStatusFilter, dateFilter, debouncedSearchQuery]);

  // Clear selection when filters change (without creating Set in effect body)
  useEffect(() => {
    setSelectedClients(prev => prev.size > 0 ? new Set() : prev);
  }, [activeTab, quickStatusFilter, dateFilter, debouncedSearchQuery]);

  // Filter clients with debounced search
  const filteredClients = useMemo(() => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    const hasSearch = debouncedSearchQuery.length > 0;
    const hasTabFilter = activeTab !== 'all';
    const hasQuickFilter = quickStatusFilter !== 'all';
    const hasDateFilter = dateFilter !== 'all';
    const rangeStart = dateRange.from ? startOfDay(dateRange.from) : null;
    const rangeEnd = dateRange.to ? endOfDay(dateRange.to) : null;

    return clients.filter((client) => {
      if (hasSearch) {
        const matchesSearch =
          client.name.toLowerCase().includes(searchLower) ||
          client.phone.includes(debouncedSearchQuery) ||
          (client.email?.toLowerCase().includes(searchLower) ?? false) ||
          (client.company?.toLowerCase().includes(searchLower) ?? false);
        if (!matchesSearch) return false;
      }
      if (hasTabFilter && client.status !== activeTab) return false;
      if (hasQuickFilter && client.status !== quickStatusFilter) return false;
      if (hasDateFilter) {
        if (dateFilter === 'today' && !isToday(client.createdAt)) return false;
        if (dateFilter === 'this-week' && !isThisWeek(client.createdAt)) return false;
        if (dateFilter === 'custom' && rangeStart && rangeEnd) {
          if (!isWithinInterval(client.createdAt, { start: rangeStart, end: rangeEnd })) return false;
        }
      }
      return true;
    });
  }, [clients, debouncedSearchQuery, activeTab, quickStatusFilter, dateFilter, dateRange]);

  // Paginated slice for rendering — never renders more than visibleCount at once
  const visibleClients = useMemo(
    () => filteredClients.slice(0, visibleCount),
    [filteredClients, visibleCount]
  );

  const hasMore = visibleCount < filteredClients.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  }, []);

  // Navigate to tab
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Handle select all — only over visible clients
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    } else {
      setSelectedClients(new Set());
    }
  }, [filteredClients]);

  // FIXED: uses functional updater, no stale closure, stable reference
  const handleSelectClient = useCallback((clientId: string, checked: boolean) => {
    setSelectedClients(prev => {
      const next = new Set(prev);
      if (checked) next.add(clientId); else next.delete(clientId);
      return next;
    });
  }, []); // empty deps — never recreates, no cascade re-renders

  // Handle bulk status change
  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    if (newStatus === 'all' || bulkUpdatingRef.current) return;
    bulkUpdatingRef.current = true;
    setIsBulkUpdatingStatus(true);
    const ids = Array.from(selectedClients);

    // Safety net: force-reset after 10s if any Firestore write hangs
    if (bulkSafetyTimerRef.current) window.clearTimeout(bulkSafetyTimerRef.current);
    bulkSafetyTimerRef.current = window.setTimeout(() => {
      bulkUpdatingRef.current = false;
      setIsBulkUpdatingStatus(false);
      bulkSafetyTimerRef.current = null;
    }, 10000);

    try {
      await Promise.all(ids.map(id => updateDropdownValue(id, 'Lead Status', newStatus)));
      toast.success(`Updated ${ids.length} client${ids.length !== 1 ? 's' : ''} to "${newStatus}"`);
      setSelectedClients(new Set());
    } catch (error) {
      toast.error('Failed to update some clients');
    } finally {
      if (bulkSafetyTimerRef.current) {
        window.clearTimeout(bulkSafetyTimerRef.current);
        bulkSafetyTimerRef.current = null;
      }
      bulkUpdatingRef.current = false;
      setIsBulkUpdatingStatus(false);
    }
  }, [selectedClients, updateDropdownValue]); // no isBulkUpdatingStatus dep — ref handles guard

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedClients);
      await deleteMultipleClients(ids);
      toast.success(`Successfully deleted ${ids.length} clients`);
      setSelectedClients(new Set());
    } catch (error) {
      toast.error('Failed to delete some clients');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedClients, deleteMultipleClients]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setQuickStatusFilter('all');
    setDateFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setActiveTab('all');
  }, []);

  const hasActiveFilters = debouncedSearchQuery || quickStatusFilter !== 'all' || dateFilter !== 'all' || activeTab !== 'all';

  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.key === 'total' ? stats.total : (stats[stat.key] || 0)}
            icon={stat.icon}
            gradient={stat.gradient}
            iconColor={stat.iconColor}
            iconBg={stat.iconBg}
            onClick={() => setActiveTab(stat.key === 'total' ? 'all' : stat.key)}
            isActive={activeTab === (stat.key === 'total' ? 'all' : stat.key)}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border/50 p-1 sm:p-1.5 shadow-sm overflow-x-auto scrollbar-thin">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-transparent h-auto p-0 gap-1 flex flex-nowrap sm:flex-wrap min-w-max sm:min-w-0">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex-shrink-0 sm:flex-1 sm:min-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground",
                  "data-[state=inactive]:hover:bg-muted/50",
                  "active:scale-[0.97] touch-manipulation select-none"
                )}
              >
                <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="whitespace-nowrap">{tab.label}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1.5 sm:ml-2 text-xs px-1.5",
                    activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"
                  )}
                >
                  {tab.id === 'all' ? stats.total : (stats[tab.id] || 0)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-10 sm:h-11 bg-background border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 touch-manipulation"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Status Filter */}
              <CustomStatusDropdown 
                value={quickStatusFilter} 
                onChange={setQuickStatusFilter} 
              />

              {/* Date Filter */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline"
                    type="button"
                    className={cn(
                      "w-full sm:w-[180px] h-10 justify-start text-left font-normal border-border/50 rounded-lg touch-manipulation active:scale-[0.98]",
                      dateFilter !== 'all' && "text-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {dateFilter === 'all' && 'All Time'}
                      {dateFilter === 'today' && 'Today'}
                      {dateFilter === 'this-week' && 'This Week'}
                      {dateFilter === 'custom' && dateRange.from && dateRange.to && 
                        `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                      }
                      {dateFilter === 'custom' && (!dateRange.from || !dateRange.to) && 'Custom Range'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start" sideOffset={4}>
                  <div className="p-3 border-b">
                    <p className="font-medium text-sm mb-2">Quick Filters</p>
                    <div className="flex flex-wrap gap-2">
                      {DATE_FILTERS.slice(0, -1).map((filter) => (
                        <Button
                          key={filter.id}
                        variant={dateFilter === filter.id ? "default" : "outline"}
                        size="sm"
                        type="button"
                        className="rounded-lg touch-manipulation"
                        onClick={() => {
                          setDateFilter(filter.id);
                          if (filter.id !== 'custom') {
                            setCalendarOpen(false);
                          }
                        }}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm mb-2">Custom Range</p>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      setDateFilter('custom');
                    }}
                    numberOfMonths={2}
                    className="rounded-lg"
                  />
                  {dateRange.from && dateRange.to && (
                    <Button 
                      className="w-full mt-3 rounded-lg" 
                      onClick={() => setCalendarOpen(false)}
                    >
                      Apply Range
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Active:</span>
              {activeTab !== 'all' && (
                <Badge variant="secondary" className="gap-1 py-0.5 sm:py-1 px-2 sm:px-2.5 rounded-lg text-xs touch-manipulation">
                  <span className="hidden sm:inline">Tab: </span>{STATUS_TABS.find(t => t.id === activeTab)?.label}
                  <button 
                    className="ml-1 p-0.5 hover:text-destructive transition-colors cursor-pointer" 
                    onClick={() => setActiveTab('all')} 
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {quickStatusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1 py-0.5 sm:py-1 px-2 sm:px-2.5 rounded-lg text-xs touch-manipulation">
                  <span className="hidden sm:inline">Status: </span>{quickStatusFilter}
                  <button 
                    className="ml-1 p-0.5 hover:text-destructive transition-colors cursor-pointer" 
                    onClick={() => setQuickStatusFilter('all')} 
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {dateFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1 py-0.5 sm:py-1 px-2 sm:px-2.5 rounded-lg text-xs touch-manipulation">
                  <span className="hidden sm:inline">Date: </span>{DATE_FILTERS.find(d => d.id === dateFilter)?.label}
                  <button 
                    className="ml-1 p-0.5 hover:text-destructive transition-colors cursor-pointer" 
                    onClick={() => {
                      setDateFilter('all');
                      setDateRange({ from: undefined, to: undefined });
                    }} 
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
            </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={filteredClients.length > 0 && selectedClients.size === filteredClients.length}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
              className="rounded h-4 w-4 touch-manipulation"
            />
            <label htmlFor="select-all" className="text-xs sm:text-sm text-muted-foreground cursor-pointer select-none touch-manipulation">
              Select All
            </label>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {selectedClients.size > 0 
                ? `${selectedClients.size} selected` 
                : `${filteredClients.length} clients`
              }
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedClients.size > 0 && (
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              {/* Bulk Change Status */}
              <div className="relative flex-1 sm:w-[170px]">
                <CustomStatusDropdown
                  value="all"
                  onChange={handleBulkStatusChange}
                  placeholder={isBulkUpdatingStatus ? 'Updating...' : 'Change Status'}
                  disabled={isBulkUpdatingStatus}
                />
              </div>
            </div>
          )}
          {selectedClients.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="rounded-lg gap-1.5 sm:gap-2 flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm touch-manipulation" 
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Delete ({selectedClients.size})</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-xl mx-4 max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedClients.size} clients?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected clients and all their data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="rounded-lg w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg w-full sm:w-auto"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button className="rounded-lg gap-1.5 sm:gap-2 flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm touch-manipulation">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Add Client</span>
          </Button>
        </div>
      </div>

      {/* Client Cards Grid — renders only visibleCount items for performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {visibleClients.map((client) => (
          <div key={client.id} className="relative group">
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
              <Checkbox
                checked={selectedClients.has(client.id)}
                onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                className="rounded bg-background/90 backdrop-blur-sm h-4 w-4 sm:h-5 sm:w-5 touch-manipulation shadow-sm"
              />
            </div>
            <ClientCardNew 
              client={client} 
              isSelected={selectedClients.has(client.id)}
            />
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex flex-col items-center gap-1.5 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {visibleClients.length} of {filteredClients.length} clients
          </p>
          <Button variant="outline" onClick={loadMore} className="rounded-lg touch-manipulation">
            Load more ({Math.min(PAGE_SIZE, filteredClients.length - visibleCount)} more)
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-10 sm:py-16 px-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">No clients found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 max-w-sm mx-auto">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="rounded-lg touch-manipulation">
                  Clear all filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
