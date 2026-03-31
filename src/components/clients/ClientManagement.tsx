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
  Check,
  Download,
  MessageCircle,
  CalendarCheck,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

// Helper: Map status to icon and styling
const getStatusConfig = (status: string, index: number) => {
  // Predefined mappings for common statuses
  const statusMap: Record<string, { icon: typeof Users; color: string; gradient: string; iconColor: string; iconBg: string }> = {
    'Converted': {
      icon: UserCheck,
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10'
    },
    'Not answered': {
      icon: PhoneOff,
      color: 'bg-yellow-500',
      gradient: 'from-yellow-500/10 to-yellow-600/5',
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10'
    },
    'New Lead': {
      icon: TrendingUp,
      color: 'bg-purple-500',
      gradient: 'from-purple-500/10 to-purple-600/5',
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10'
    },
    'Hot Lead': {
      icon: Sparkles,
      color: 'bg-red-500',
      gradient: 'from-red-500/10 to-red-600/5',
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10'
    },
    'Warm Lead': {
      icon: Phone,
      color: 'bg-orange-500',
      gradient: 'from-orange-500/10 to-orange-600/5',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10'
    },
    'Cold Lead': {
      icon: Clock,
      color: 'bg-blue-400',
      gradient: 'from-blue-400/10 to-blue-500/5',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-400/10'
    },
    'Lost': {
      icon: X,
      color: 'bg-gray-500',
      gradient: 'from-gray-500/10 to-gray-600/5',
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-500/10'
    },
    'Hindi': {
      icon: MessageCircle,
      color: 'bg-orange-500',
      gradient: 'from-orange-500/10 to-orange-600/5',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10'
    },
    'Slot Booked': {
      icon: CalendarCheck,
      color: 'bg-cyan-500',
      gradient: 'from-cyan-500/10 to-cyan-600/5',
      iconColor: 'text-cyan-500',
      iconBg: 'bg-cyan-500/10'
    },
    'App user': {
      icon: UserCheck,
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500/10 to-indigo-600/5',
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-500/10'
    },
    'App Installed': {
      icon: Download,
      color: 'bg-violet-500',
      gradient: 'from-violet-500/10 to-violet-600/5',
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10'
    },
  };

  // Return predefined config or generate default based on index
  if (statusMap[status]) {
    return statusMap[status];
  }

  // Fallback colors for custom statuses
  const fallbackColors = [
    { color: 'bg-pink-500', gradient: 'from-pink-500/10 to-pink-600/5', iconColor: 'text-pink-500', iconBg: 'bg-pink-500/10' },
    { color: 'bg-teal-500', gradient: 'from-teal-500/10 to-teal-600/5', iconColor: 'text-teal-500', iconBg: 'bg-teal-500/10' },
    { color: 'bg-amber-500', gradient: 'from-amber-500/10 to-amber-600/5', iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10' },
    { color: 'bg-lime-500', gradient: 'from-lime-500/10 to-lime-600/5', iconColor: 'text-lime-500', iconBg: 'bg-lime-500/10' },
  ];
  
  const colorConfig = fallbackColors[index % fallbackColors.length];
  return {
    icon: TrendingUp,
    ...colorConfig
  };
};

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
      "cursor-pointer transition-all duration-300 ease-out border-border/40 hover:border-primary/40 group overflow-hidden relative",
      "active:scale-[0.97] touch-manipulation select-none",
      "hover:shadow-xl hover:-translate-y-1",
      isActive ? "ring-2 ring-primary/60 border-primary/60 shadow-lg" : "shadow-md"
    )}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
  >
    <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity duration-300 group-hover:opacity-60 z-0", gradient)} />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground/90 uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{value}</p>
        </div>
        <div className={cn("p-3 sm:p-3.5 lg:p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0 shadow-sm", iconBg)}>
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7", iconColor)} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Custom Status Dropdown Component - Pure React, no Radix
interface CustomStatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color: string }[]; // Add options prop
  placeholder?: string;
  disabled?: boolean;
}

function CustomStatusDropdown({ value, onChange, options, placeholder, disabled }: CustomStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Find current selected option
  const selectedOption = options.find(opt => opt.value === value) || options[0];

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
    <div ref={dropdownRef} className="relative inline-block w-full sm:w-[190px]">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full h-10 sm:h-11 px-3.5 py-2",
          "bg-background/80 border border-border/50 rounded-xl backdrop-blur-sm",
          "text-sm font-medium text-foreground",
          "hover:border-primary/50 hover:bg-muted/70 hover:shadow-sm",
          "active:scale-[0.98] touch-manipulation select-none",
          "transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
          isOpen && "border-primary/50 ring-2 ring-primary/25 shadow-md",
          disabled && "opacity-60 cursor-not-allowed pointer-events-none"
        )}
      >
        <span className="flex items-center gap-2.5 truncate">
          {placeholder ? (
            // Bulk-action mode: show placeholder text with pencil-like indicator
            <span className="truncate text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              <span className={cn("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", selectedOption.color)} />
              <span className="truncate">{selectedOption.label}</span>
            </>
          )}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
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
              "absolute left-0 mt-2 w-full min-w-[200px]",
              "bg-popover/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl",
              "z-[9999] overflow-hidden",
              // Animation
              "animate-in fade-in-0 zoom-in-95 slide-in-from-top-3",
              "duration-300"
            )}
            style={{ 
              transformOrigin: 'top',
            }}
          >
            <div className="py-2 px-2 max-h-[320px] overflow-y-auto">
              {options.filter(opt => placeholder ? opt.value !== 'all' : true).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2.5 sm:py-2.5",
                    "text-sm rounded-xl font-medium",
                    "transition-all duration-200",
                    "touch-manipulation select-none",
                    value === option.value 
                      ? "bg-primary/15 text-primary shadow-sm scale-[0.98]" 
                      : "text-foreground hover:bg-muted/80 hover:scale-[0.98] active:scale-95"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn("w-3 h-3 rounded-full shrink-0 shadow-sm", option.color)} />
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
  const [activeTab, setActiveTab] = useState('New Lead');
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

  // Excel matching feature state
  const [isMatchingExcel, setIsMatchingExcel] = useState(false);
  const [matchStats, setMatchStats] = useState<{
    total: number;
    matched: number;
    notFound: number;
  } | null>(null);
  const excelMatchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const clients = useClientStore((state) => state.clients);
  const dropdowns = useClientStore((state) => state.dropdowns); // NEW: Get dropdowns from store
  const deleteMultipleClients = useClientStore((state) => state.deleteMultipleClients);
  const updateDropdownValue = useClientStore((state) => state.updateDropdownValue);

  // Generate dynamic STATUS_TABS from Lead Status dropdown
  const STATUS_TABS = useMemo(() => {
    const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
    const statusOptions = leadStatusDropdown?.options || ['New Lead', 'Converted'];
    
    // Show all statuses as tabs
    const tabStatuses = statusOptions;
    
    return [
      { id: 'all', label: 'All Clients', icon: Users },
      ...tabStatuses.map((status, index) => {
        const config = getStatusConfig(status, index);
        return {
          id: status,
          label: status,
          icon: config.icon
        };
      })
    ];
  }, [dropdowns]);

  // Generate dynamic STAT_CARDS from Lead Status dropdown
  const STAT_CARDS = useMemo(() => {
    const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
    const statusOptions = leadStatusDropdown?.options || ['New Lead', 'Converted'];
    
    // Show all statuses as stat cards
    const statStatuses = statusOptions;
    
    const cards = [
      {
        key: 'total',
        label: 'Total Clients',
        icon: Users,
        gradient: 'from-blue-500/10 to-blue-600/5',
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10'
      }
    ];
    
    statStatuses.forEach((status, index) => {
      const config = getStatusConfig(status, index);
      cards.push({
        key: status,
        label: status,
        icon: config.icon,
        gradient: config.gradient,
        iconColor: config.iconColor,
        iconBg: config.iconBg
      });
    });
    
    return cards;
  }, [dropdowns]);

  // Generate dynamic QUICK_STATUS_OPTIONS from Lead Status dropdown
  const QUICK_STATUS_OPTIONS = useMemo(() => {
    const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
    const statusOptions = leadStatusDropdown?.options || ['New Lead', 'Converted'];
    
    return [
      { value: 'all', label: 'All Statuses', color: 'bg-gray-400' },
      ...statusOptions.map((status, index) => {
        const config = getStatusConfig(status, index);
        return {
          value: status,
          label: status,
          color: config.color
        };
      })
    ];
  }, [dropdowns]);

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

  // Export to Excel function
  const handleExportToExcel = useCallback(() => {
    if (clients.length === 0) {
      toast.error('No clients to export');
      return;
    }

    // Prepare data for export
    const exportData = clients.map((client) => ({
      'Name': client.name,
      'Phone': client.phone,
      'Email': client.email || '',
      'Company': client.company || '',
      'Status': client.status,
      'Priority': client.priority,
      'Call Outcome': client.callOutcome || '',
      'Follow Up Required': client.followUpRequired ? 'Yes' : 'No',
      'Last Contacted': client.lastContacted ? format(new Date(client.lastContacted), 'dd/MM/yyyy') : '',
      'Created At': format(new Date(client.createdAt), 'dd/MM/yyyy'),
      'Notes': client.notes.map(n => n.content).join('; ')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Name
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 20 }, // Company
      { wch: 15 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Call Outcome
      { wch: 15 }, // Follow Up Required
      { wch: 12 }, // Last Contacted
      { wch: 12 }, // Created At
      { wch: 40 }, // Notes
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Clients');

    // Generate filename with date
    const fileName = `Clients_Export_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;

    // Download file
    XLSX.writeFile(wb, fileName);
    toast.success(`Exported ${clients.length} clients to Excel`);
  }, [clients]);

  // Normalize phone number for comparison (remove all non-digit characters except +)
  const normalizePhone = useCallback((phone: string): string => {
    return phone.replace(/[^0-9+]/g, '').replace(/^\+?91/, '').replace(/^0+/, '');
  }, []);

  // Handle Excel file upload to match and select contacts
  const handleExcelMatchUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMatchingExcel(true);
    setMatchStats(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        toast.error('No data found in file');
        setIsMatchingExcel(false);
        return;
      }

      // Extract phone numbers from Excel
      const excelPhones: string[] = [];
      const firstRow = jsonData[0] as unknown[];
      const hasHeader = firstRow && firstRow.some(cell =>
        typeof cell === 'string' &&
        (cell.toLowerCase().includes('name') || cell.toLowerCase().includes('phone'))
      );
      const startIndex = hasHeader ? 1 : 0;

      for (let i = startIndex; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.length === 0) continue;

        let phone = '';
        if (row.length === 1) {
          phone = String(row[0] || '').trim();
        } else if (row.length >= 2) {
          // Try second column first (common for Name, Phone format)
          phone = String(row[1] || '').trim();
          // If second column is empty, try first column
          if (!phone) phone = String(row[0] || '').trim();
        }

        if (phone) {
          const normalizedPhone = normalizePhone(phone);
          if (normalizedPhone.length >= 10) {
            excelPhones.push(normalizedPhone);
          }
        }
      }

      if (excelPhones.length === 0) {
        toast.error('No valid phone numbers found in Excel file');
        setIsMatchingExcel(false);
        return;
      }

      // Create a set of normalized Excel phones for quick lookup
      const excelPhoneSet = new Set(excelPhones);

      // Find matching clients
      const matchedClientIds = new Set<string>();
      for (const client of clients) {
        const normalizedClientPhone = normalizePhone(client.phone);
        if (excelPhoneSet.has(normalizedClientPhone)) {
          matchedClientIds.add(client.id);
        }
      }

      // Update selection with matched clients
      setSelectedClients(matchedClientIds);

      // Calculate stats
      const stats = {
        total: excelPhones.length,
        matched: matchedClientIds.size,
        notFound: excelPhones.length - matchedClientIds.size
      };
      setMatchStats(stats);

      // Clear filters to show all matched clients
      setActiveTab('all');
      setQuickStatusFilter('all');
      setDateFilter('all');
      setDateRange({ from: undefined, to: undefined });

      if (matchedClientIds.size > 0) {
        toast.success(`Found ${matchedClientIds.size} matching contacts`, {
          description: `${stats.notFound} contacts from Excel not found in system`
        });
      } else {
        toast.warning('No matching contacts found', {
          description: `${excelPhones.length} phone numbers from Excel did not match any existing contacts`
        });
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Error reading file', {
        description: 'Please ensure the file is a valid Excel or CSV file.'
      });
    } finally {
      setIsMatchingExcel(false);
      // Reset file input
      if (excelMatchInputRef.current) {
        excelMatchInputRef.current.value = '';
      }
    }
  }, [clients, normalizePhone]);

  // Trigger file input for Excel matching
  const handleSelectFromExcelClick = useCallback(() => {
    excelMatchInputRef.current?.click();
  }, []);

  // Clear match stats when selection changes manually
  const handleClearMatchStats = useCallback(() => {
    setMatchStats(null);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Hidden file input for Excel matching */}
      <input
        type="file"
        ref={excelMatchInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleExcelMatchUpload}
        className="hidden"
      />

      {/* Export and Select from Excel Buttons */}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button
          onClick={handleSelectFromExcelClick}
          variant="outline"
          disabled={isMatchingExcel}
          className="gap-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 h-10 sm:h-11 px-4 sm:px-6 border-2 hover:bg-primary hover:text-primary-foreground"
        >
          {isMatchingExcel ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Matching...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              <span>Select from Excel</span>
            </>
          )}
        </Button>
        <Button
          onClick={handleExportToExcel}
          variant="outline"
          className="gap-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 h-10 sm:h-11 px-4 sm:px-6 border-2 hover:bg-primary hover:text-primary-foreground"
        >
          <Download className="h-4 w-4" />
          <span>Export to Excel</span>
        </Button>
      </div>

      {/* Excel Match Stats Banner */}
      {matchStats && (
        <Card className="border-primary/30 bg-primary/5 shadow-md">
          <CardContent className="py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Excel Match Results</p>
                  <p className="text-sm text-muted-foreground">
                    {matchStats.matched} of {matchStats.total} contacts matched
                    {matchStats.notFound > 0 && ` (${matchStats.notFound} not found)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                    {matchStats.matched} Matched
                  </Badge>
                  {matchStats.notFound > 0 && (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      {matchStats.notFound} Not Found
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearMatchStats}
                  className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
      <div className="bg-card rounded-2xl border border-border/40 p-1.5 sm:p-2 shadow-md overflow-x-auto scrollbar-thin">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-transparent h-auto p-0 gap-2 flex flex-nowrap sm:flex-wrap min-w-max sm:min-w-0">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex-shrink-0 sm:flex-1 sm:min-w-[110px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90",
                  "data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25",
                  "data-[state=active]:scale-105",
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground",
                  "data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-foreground",
                  "active:scale-[0.98] touch-manipulation select-none"
                )}
              >
                <tab.icon className="h-4 w-4 sm:h-4 sm:w-4 mr-2" />
                <span className="whitespace-nowrap">{tab.label}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-2 text-xs px-2 py-0.5 rounded-md font-bold transition-colors duration-300",
                    activeTab === tab.id 
                      ? "bg-primary-foreground/25 text-primary-foreground border-primary-foreground/20" 
                      : "bg-muted/80 text-muted-foreground"
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
      <Card className="border-border/40 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary" />
            </div>
            <Input
              placeholder="Search by name, phone, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 sm:pl-12 pr-10 h-11 sm:h-12 bg-muted/30 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300 text-sm sm:text-base placeholder:text-muted-foreground/60 hover:bg-muted/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive touch-manipulation transition-all duration-200"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground/80">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <span>Filters</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Status Filter */}
              <CustomStatusDropdown 
                value={quickStatusFilter} 
                onChange={setQuickStatusFilter}
                options={QUICK_STATUS_OPTIONS}
              />

              {/* Date Filter */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline"
                    type="button"
                    className={cn(
                      "w-full sm:w-[200px] h-10 sm:h-11 justify-start text-left font-medium border-border/50 rounded-xl touch-manipulation transition-all duration-300",
                      "hover:bg-muted/70 hover:border-primary/30",
                      dateFilter !== 'all' && "border-primary/50 bg-primary/5 text-foreground"
                    )}
                  >
                    <Calendar className="mr-2.5 h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">
                      {dateFilter === 'all' && 'All Time'}
                      {dateFilter === 'today' && 'Today'}
                      {dateFilter === 'this-week' && 'This Week'}
                      {dateFilter === 'custom' && dateRange.from && dateRange.to && 
                        `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                      }
                      {dateFilter === 'custom' && (!dateRange.from || !dateRange.to) && 'Custom Range'}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
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
                className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl px-4 h-10 sm:h-11 font-medium transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">Clear all</span>
              </Button>
            )}
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Filters:</span>
              {activeTab !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium touch-manipulation hover:bg-secondary/80 transition-colors group">
                  <span className="hidden sm:inline font-semibold">Tab: </span>{STATUS_TABS.find(t => t.id === activeTab)?.label}
                  <button 
                    className="ml-1 p-0.5 hover:text-destructive transition-colors cursor-pointer rounded" 
                    onClick={() => setActiveTab('all')} 
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {quickStatusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium touch-manipulation hover:bg-secondary/80 transition-colors group">
                  <span className="hidden sm:inline font-semibold">Status: </span>{quickStatusFilter}
                  <button 
                    className="ml-1 p-0.5 hover:text-destructive transition-colors cursor-pointer rounded" 
                    onClick={() => setQuickStatusFilter('all')} 
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {dateFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium touch-manipulation hover:bg-secondary/80 transition-colors group">
                  <span className="hidden sm:inline font-semibold">Date: </span>{DATE_FILTERS.find(d => d.id === dateFilter)?.label}
                  <button 
                    className="ml-1 p-0.5 hover:text-destructive transition-colors cursor-pointer rounded" 
                    onClick={() => {
                      setDateFilter('all');
                      setDateRange({ from: undefined, to: undefined });
                    }} 
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
            </div>
          )}
            </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/40 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="select-all"
              checked={filteredClients.length > 0 && selectedClients.size === filteredClients.length}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
              className="rounded h-5 w-5 border-2 touch-manipulation"
            />
            <label htmlFor="select-all" className="text-sm font-semibold text-foreground cursor-pointer select-none touch-manipulation">
              Select All
            </label>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
            <Users className="h-4 w-4" />
            <span>
              {selectedClients.size > 0 
                ? `${selectedClients.size} selected` 
                : `${filteredClients.length} clients`
              }
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {selectedClients.size > 0 && (
            <div className="flex items-center gap-2.5 flex-1 sm:flex-none">
              {/* Bulk Change Status */}
              <div className="relative flex-1 sm:w-[190px]">
                <CustomStatusDropdown
                  value="all"
                  onChange={handleBulkStatusChange}
                  options={QUICK_STATUS_OPTIONS}
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
                  className="rounded-xl gap-2 flex-1 sm:flex-none h-10 sm:h-11 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg touch-manipulation transition-all duration-200" 
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedClients.size})</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl mx-4 max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg font-bold">Delete {selectedClients.size} clients?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This action cannot be undone. This will permanently delete the selected clients and all their data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2.5">
                  <AlertDialogCancel className="rounded-xl w-full sm:w-auto font-semibold">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl w-full sm:w-auto font-semibold shadow-md"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button className="rounded-xl gap-2 flex-1 sm:flex-none h-10 sm:h-11 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg touch-manipulation transition-all duration-300">
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </Button>
        </div>
      </div>

      {/* Client Cards Grid — renders only visibleCount items for performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {visibleClients.map((client) => (
          <div key={client.id} className="relative group">
            <div className="absolute top-4 sm:top-5 left-4 sm:left-5 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
              <Checkbox
                checked={selectedClients.has(client.id)}
                onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                className="rounded bg-background/95 backdrop-blur-sm h-5 w-5 border-2 touch-manipulation shadow-lg"
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
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="px-4 py-2 bg-muted/50 rounded-xl border border-border/30">
            <p className="text-sm font-semibold text-muted-foreground">
              Showing {visibleClients.length} of {filteredClients.length} clients
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={loadMore} 
            className="rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 h-11 px-6 border-2"
          >
            Load more ({Math.min(PAGE_SIZE, filteredClients.length - visibleCount)} more)
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <Card className="border-border/40 border-dashed shadow-md">
          <CardContent className="py-12 sm:py-20 px-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mb-5 sm:mb-6 shadow-inner">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/70" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">No clients found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6 max-w-md mx-auto leading-relaxed">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 h-11 px-6 border-2"
                >
                  <X className="mr-2 h-4 w-4" />
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
