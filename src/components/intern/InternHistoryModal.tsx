import { useState, useMemo, useCallback } from 'react';
import { useClientStore } from '@/stores/clientStore';
import { InternActivityLog, InternSession } from '@/types/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  History, 
  Users, 
  UserCheck, 
  PhoneOff, 
  Smartphone, 
  TrendingUp,
  TrendingDown,
  Download,
  CalendarDays,
  Search,
  X,
  Clock,
  Phone,
  ArrowRight,
  FileSpreadsheet,
  Filter,
  Sparkles,
  Package
} from 'lucide-react';
import { format, isToday, isThisWeek, isWithinInterval, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';

// Helper to format date
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper to format time
const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Status color configuration
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'New Lead': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  'Not answered': { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  'App user': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  'Converted': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  'Lost': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  'App Installed': { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  'Slot Booked': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  'Hot Lead': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  'Warm Lead': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  'Cold Lead': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  'Login': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  'Logout': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

const getStatusColors = (status: string) => {
  return STATUS_COLORS[status] || { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' };
};

// Date filter options
const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This Week' },
  { id: 'custom', label: 'Custom Range' },
];

// Stat card component
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

const StatCard = ({ label, value, icon, gradient }: StatCardProps) => (
  <Card className="border-border/50 hover:shadow-md transition-all duration-200">
    <CardContent className="p-3 lg:p-4">
      <div className={cn("absolute inset-0 rounded-lg bg-gradient-to-br opacity-30", gradient)} />
      <div className="relative flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-xl lg:text-2xl font-bold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface InternHistoryModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function InternHistoryModal({ trigger, open: controlledOpen, onOpenChange }: InternHistoryModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [selectedIntern, setSelectedIntern] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const activityLogs = useClientStore((state) => state.activityLogs);
  const internSessions = useClientStore((state) => state.internSessions);

  // Get unique intern names from activity logs and sessions
  const internNames = useMemo(() => {
    const namesFromLogs = new Set(activityLogs.map(log => log.internName));
    const namesFromSessions = new Set(internSessions.map(s => s.internName));
    return Array.from(new Set([...namesFromLogs, ...namesFromSessions])).sort();
  }, [activityLogs, internSessions]);

  // Filter activity logs
  const filteredLogs = useMemo(() => {
    console.log(`[InternHistory] activityLogs total: ${activityLogs.length}, filter: intern=${selectedIntern} date=${dateFilter} search="${searchQuery}"`);

    const searchLower = searchQuery.toLowerCase().trim();
    const hasSearch = searchLower.length > 0;

    return activityLogs.filter((log) => {
      // Intern filter — trim + case-insensitive to avoid whitespace mismatches
      const matchesIntern = selectedIntern === 'all' ||
        (log.internName || '').trim().toLowerCase() === selectedIntern.trim().toLowerCase();

      // Search filter — guard every field against null/undefined
      const matchesSearch = !hasSearch ||
        (log.clientName || '').toLowerCase().includes(searchLower) ||
        (log.clientPhone || '').includes(searchLower) ||
        (log.previousStatus || '').toLowerCase().includes(searchLower) ||
        (log.newStatus || '').toLowerCase().includes(searchLower) ||
        (log.internName || '').toLowerCase().includes(searchLower) ||
        (log.actionType || '').toLowerCase().includes(searchLower);

      // Date filter
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = isToday(log.timestamp);
      } else if (dateFilter === 'this-week') {
        matchesDate = isThisWeek(log.timestamp);
      } else if (dateFilter === 'custom' && dateRange.from && dateRange.to) {
        matchesDate = isWithinInterval(log.timestamp, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        });
      }

      return matchesIntern && matchesSearch && matchesDate;
    });
  }, [activityLogs, selectedIntern, searchQuery, dateFilter, dateRange]);

  // Calculate statistics for selected intern
  const stats = useMemo(() => {
    const logs = filteredLogs;
    
    const statusCounts: Record<string, number> = {};
    const uniqueClients = new Set<string>();
    let loginCount = 0;
    let logoutCount = 0;
    
    logs.forEach(log => {
      // Count status changes (new status)
      statusCounts[log.newStatus] = (statusCounts[log.newStatus] || 0) + 1;
      
      // Only count actual clients (exclude login/logout which have empty clientId)
      if (log.clientId) {
        uniqueClients.add(log.clientId);
      }
      
      // Track session events separately
      if (log.actionType === 'login') loginCount++;
      if (log.actionType === 'logout') logoutCount++;
    });
    
    return {
      totalActivities: logs.length,
      newLeads: statusCounts['New Lead'] || 0,
      notAnswered: statusCounts['Not answered'] || 0,
      appUser: statusCounts['App user'] || 0,
      converted: statusCounts['Converted'] || 0,
      lost: statusCounts['Lost'] || 0,
      appInstalled: statusCounts['App Installed'] || 0,
      slotBooked: statusCounts['Slot Booked'] || 0,
      hotLeads: statusCounts['Hot Lead'] || 0,
      warmLeads: statusCounts['Warm Lead'] || 0,
      totalClientsHandled: uniqueClients.size,
      loginCount,
      logoutCount,
      statusCounts
    };
  }, [filteredLogs]);

  // Export to Excel
  const handleExport = useCallback(() => {
    if (filteredLogs.length === 0) return;
    
    // Create CSV content
    const headers = ['Date', 'Time', 'Intern', 'Client Name', 'Phone', 'Previous Status', 'New Status', 'Action Type'];
    const rows = filteredLogs.map(log => [
      formatDate(log.timestamp),
      formatTime(log.timestamp),
      log.internName,
      log.clientName,
      log.clientPhone,
      log.previousStatus || '-',
      log.newStatus,
      log.actionType
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `intern-history-${selectedIntern === 'all' ? 'all' : selectedIntern}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  }, [filteredLogs, selectedIntern]);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setSelectedIntern('all');
  };

  const hasActiveFilters = searchQuery || dateFilter !== 'all' || selectedIntern !== 'all';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 rounded-lg">
            <History className="h-4 w-4" />
            View Intern History
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Intern Activity History
          </SheetTitle>
          <SheetDescription>
            View complete activity history and performance metrics for interns.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filters Section */}
          <div className="p-4 lg:p-6 border-b space-y-4 bg-background">
            {/* Intern Selection */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedIntern} onValueChange={setSelectedIntern}>
                <SelectTrigger className="w-[200px] rounded-lg">
                  <SelectValue placeholder="Select Intern" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">All Interns</SelectItem>
                  {internNames.map((name) => (
                    <SelectItem key={name} value={name} className="rounded-lg">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-[180px] justify-start text-left font-normal rounded-lg",
                      dateFilter !== 'all' && "text-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateFilter === 'all' && 'All Time'}
                    {dateFilter === 'today' && 'Today'}
                    {dateFilter === 'this-week' && 'This Week'}
                    {dateFilter === 'custom' && dateRange.from && dateRange.to && 
                      `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                    }
                    {dateFilter === 'custom' && (!dateRange.from || !dateRange.to) && 'Custom Range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <div className="p-3 border-b">
                    <p className="font-medium text-sm mb-2">Quick Filters</p>
                    <div className="flex flex-wrap gap-2">
                      {DATE_FILTERS.slice(0, -1).map((filter) => (
                        <Button
                          key={filter.id}
                          variant={dateFilter === filter.id ? "default" : "outline"}
                          size="sm"
                          className="rounded-lg"
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
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        setDateRange({ from: range?.from, to: range?.to });
                        setDateFilter('custom');
                      }}
                      numberOfMonths={1}
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

              {/* Export Button */}
              <Button 
                variant="outline" 
                className="gap-2 rounded-lg ml-auto"
                onClick={handleExport}
                disabled={filteredLogs.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name, phone, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Active:</span>
                {selectedIntern !== 'all' && (
                  <Badge variant="secondary" className="gap-1.5 py-1 rounded-lg">
                    Intern: {selectedIntern}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setSelectedIntern('all')} />
                  </Badge>
                )}
                {dateFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1.5 py-1 rounded-lg">
                    Date: {DATE_FILTERS.find(d => d.id === dateFilter)?.label}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => {
                      setDateFilter('all');
                      setDateRange({ from: undefined, to: undefined });
                    }} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 lg:p-6 space-y-6">
              {/* Summary Stats Cards */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Summary
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard 
                    label="Total Activities" 
                    value={stats.totalActivities} 
                    icon={<Clock className="h-4 w-4 text-blue-500" />}
                    gradient="from-blue-500/20 to-blue-600/10"
                  />
                  <StatCard 
                    label="Clients Handled" 
                    value={stats.totalClientsHandled} 
                    icon={<Users className="h-4 w-4 text-purple-500" />}
                    gradient="from-purple-500/20 to-purple-600/10"
                  />
                  <StatCard 
                    label="Converted" 
                    value={stats.converted} 
                    icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
                    gradient="from-emerald-500/20 to-emerald-600/10"
                  />
                  <StatCard 
                    label="Not Answered" 
                    value={stats.notAnswered} 
                    icon={<PhoneOff className="h-4 w-4 text-yellow-500" />}
                    gradient="from-yellow-500/20 to-yellow-600/10"
                  />
                </div>
              </div>

              {/* Status Updates Breakdown */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Status Updates Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <StatCard 
                    label="New Leads" 
                    value={stats.newLeads} 
                    icon={<Sparkles className="h-4 w-4 text-purple-500" />}
                    gradient="from-purple-500/20 to-purple-600/10"
                  />
                  <StatCard 
                    label="Hot Leads" 
                    value={stats.hotLeads} 
                    icon={<TrendingUp className="h-4 w-4 text-red-500" />}
                    gradient="from-red-500/20 to-red-600/10"
                  />
                  <StatCard 
                    label="App Installed" 
                    value={stats.appInstalled} 
                    icon={<Download className="h-4 w-4 text-violet-500" />}
                    gradient="from-violet-500/20 to-violet-600/10"
                  />
                  <StatCard 
                    label="App User" 
                    value={stats.appUser} 
                    icon={<Smartphone className="h-4 w-4 text-indigo-500" />}
                    gradient="from-indigo-500/20 to-indigo-600/10"
                  />
                  <StatCard 
                    label="Slot Booked" 
                    value={stats.slotBooked} 
                    icon={<Package className="h-4 w-4 text-blue-500" />}
                    gradient="from-blue-500/20 to-blue-600/10"
                  />
                  <StatCard 
                    label="Lost" 
                    value={stats.lost} 
                    icon={<TrendingDown className="h-4 w-4 text-gray-500" />}
                    gradient="from-gray-500/20 to-gray-600/10"
                  />
                </div>
              </div>

              {/* Detailed Activity Table */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Detailed Activity Log ({filteredLogs.length} records)
                </h3>
                
                {filteredLogs.length > 0 ? (
                  <Card className="border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="font-semibold">Date & Time</TableHead>
                          <TableHead className="font-semibold">Client</TableHead>
                          <TableHead className="font-semibold">Status Change</TableHead>
                          <TableHead className="font-semibold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.slice(0, 100).map((log) => {
                          const prevColors = getStatusColors(log.previousStatus);
                          const newColors = getStatusColors(log.newStatus);
                          const isSessionEvent = log.actionType === 'login' || log.actionType === 'logout';
                          
                          return (
                            <TableRow key={log.id} className="group hover:bg-muted/30">
                              <TableCell>
                                <div className="space-y-0.5">
                                  <p className="font-medium text-sm">{formatDate(log.timestamp)}</p>
                                  <p className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {isSessionEvent ? (
                                  <div className="space-y-0.5">
                                    <p className="font-medium text-sm text-muted-foreground">Session Event</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {log.internName}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <p className="font-medium text-sm">{log.clientName || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {log.clientPhone || '-'}
                                    </p>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {log.previousStatus ? (
                                    <>
                                      <Badge 
                                        variant="outline" 
                                        className={cn("text-xs", prevColors.bg, prevColors.text, prevColors.border)}
                                      >
                                        {log.previousStatus}
                                      </Badge>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                    </>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">New →</span>
                                  )}
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-xs", newColors.bg, newColors.text, newColors.border)}
                                  >
                                    {log.newStatus}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {log.actionType.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {filteredLogs.length > 100 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t bg-muted/20">
                        Showing first 100 of {filteredLogs.length} records. Export for full data.
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="border-border/50 border-dashed">
                    <CardContent className="py-12">
                      <div className="text-center">
                        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No activity records found</h3>
                        <p className="text-muted-foreground text-sm">
                          {hasActiveFilters 
                            ? "Try adjusting your filters to see more results."
                            : "Activity will be logged when interns make status changes."}
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-lg">
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
