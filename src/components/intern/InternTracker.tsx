import { useState, useMemo, useEffect } from 'react';
import { useClientStore } from '@/stores/clientStore';
import { InternSession, LeadStatusSnapshot, InternName } from '@/types/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';
import {
  Clock,
  LogIn,
  LogOut,
  Eye,
  Trash2,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Phone,
  Users,
  Plus,
  X,
  Activity,
  Sparkles,
  PartyPopper,
  History,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Colorful 3D Greeting Popup Component
function GreetingPopup({
  isOpen,
  type,
  internName,
  onClose
}: {
  isOpen: boolean;
  type: 'login' | 'logout';
  internName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLogin = type === 'login';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* 3D Popup Box */}
      <div
        className={cn(
          "relative z-10 w-[90%] max-w-md",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-500",
          "transform-gpu perspective-1000"
        )}
        style={{
          transform: 'perspective(1000px) rotateX(5deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Main Card with 3D effect */}
        <div
          className={cn(
            "relative rounded-3xl p-8 text-center overflow-hidden",
            "shadow-2xl border-2",
            isLogin
              ? "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 border-emerald-300"
              : "bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 border-orange-300"
          )}
          style={{
            boxShadow: isLogin
              ? '0 25px 50px -12px rgba(16, 185, 129, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset'
              : '0 25px 50px -12px rgba(244, 63, 94, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
            transform: 'translateZ(20px)'
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

          {/* Icon */}
          <div
            className={cn(
              "mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center",
              "bg-white/20 backdrop-blur-sm shadow-lg",
              "animate-bounce"
            )}
            style={{ animationDuration: '2s' }}
          >
            {isLogin ? (
              <Sparkles className="h-10 w-10 text-white drop-shadow-lg" />
            ) : (
              <PartyPopper className="h-10 w-10 text-white drop-shadow-lg" />
            )}
          </div>

          {/* Greeting Text */}
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {isLogin ? 'Welcome!' : 'Great Work!'}
          </h2>

          <p className="text-xl font-semibold text-white/90 mb-4">
            {isLogin ? (
              <>Hello, <span className="text-yellow-200">{internName}</span>!</>
            ) : (
              <>Goodbye, <span className="text-yellow-200">{internName}</span>!</>
            )}
          </p>

          <p className="text-white/80 text-sm mb-6">
            {isLogin
              ? "Your session has started. Let's make it a productive day!"
              : "Your session has been completed successfully. See you next time!"}
          </p>

          {/* Progress bar for auto-close */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full"
              style={{
                animation: 'shrink 5s linear forwards'
              }}
            />
          </div>

          <p className="text-white/60 text-xs mt-2">Auto-closing in 5 seconds...</p>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* 3D Shadow layer */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl -z-10",
            isLogin ? "bg-emerald-800" : "bg-rose-800"
          )}
          style={{
            transform: 'translateZ(-10px) translateY(10px)',
            filter: 'blur(4px)',
            opacity: 0.5
          }}
        />
      </div>

      {/* CSS for animation */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Helper to format date
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper to format time from 24h to 12h format
const formatTime = (time: string) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Helper to get current time in HH:MM format
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Helper to calculate working duration
const calculateDuration = (loginTime: string) => {
  const [loginHours, loginMinutes] = loginTime.split(':').map(Number);
  const now = new Date();
  const loginDate = new Date();
  loginDate.setHours(loginHours, loginMinutes, 0, 0);

  const diffMs = now.getTime() - loginDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

// Component to display lead status comparison
function LeadStatusComparison({
  entryStatuses,
  exitStatuses,
  conversions
}: {
  entryStatuses: LeadStatusSnapshot[];
  exitStatuses?: LeadStatusSnapshot[];
  conversions?: Record<string, number>;
}) {
  // Combine all unique statuses from both entry and exit
  const allStatuses = new Set<string>();
  entryStatuses.forEach(e => allStatuses.add(e.status));
  exitStatuses?.forEach(e => allStatuses.add(e.status));

  // Convert to array and sort (entry statuses first, then alphabetically)
  const statusList = Array.from(allStatuses).sort((a, b) => {
    const aInEntry = entryStatuses.some(e => e.status === a);
    const bInEntry = entryStatuses.some(e => e.status === b);
    if (aInEntry && !bInEntry) return -1;
    if (!aInEntry && bInEntry) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
        <span>Status</span>
        <span className="text-center">Entry</span>
        <span className="text-center">{exitStatuses ? 'Exit' : 'Current'}</span>
      </div>
      {statusList.map((status) => {
        const entryStatus = entryStatuses.find(e => e.status === status);
        const exitStatus = exitStatuses?.find(e => e.status === status);
        const entryCount = entryStatus?.count || 0;
        const exitCount = exitStatus?.count ?? entryCount;
        const change = conversions?.[status] || (exitCount - entryCount);

        return (
          <div key={status} className="grid grid-cols-3 gap-2 items-center text-sm">
            <span className="font-medium truncate">{status}</span>
            <span className="text-center">{entryCount}</span>
            <div className="flex items-center justify-center gap-1">
              <span>{exitCount}</span>
              {conversions && change !== 0 && (
                <Badge
                  variant={change > 0 ? "default" : "destructive"}
                  className={cn(
                    "text-xs px-1",
                    change > 0 && "bg-emerald-500 hover:bg-emerald-600"
                  )}
                >
                  {change > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {change > 0 ? '+' : ''}{change}
                </Badge>
              )}
              {conversions && change === 0 && (
                <Badge variant="outline" className="text-xs px-1">
                  <Minus className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Session Summary Dialog
function SessionSummaryDialog({
  session,
  open,
  onOpenChange,
  isEndSession = false,
  onConfirmEnd
}: {
  session: InternSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEndSession?: boolean;
  onConfirmEnd?: () => void;
}) {
  const totalCalls = session.totalCallsMade || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEndSession ? 'Session Summary' : 'Session Details'}
          </DialogTitle>
          <DialogDescription>
            {isEndSession ? (
              <>Great work, <span className="font-semibold text-primary">{session.internName}</span>! Here's your session summary.</>
            ) : (
              <>Session details for <span className="font-semibold">{session.internName}</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date and Time Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Date
              </span>
              <span className="font-medium">{formatDate(session.date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                Login Time
              </span>
              <span className="font-medium">{formatTime(session.loginTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Logout Time
              </span>
              <span className="font-medium">{session.logoutTime ? formatTime(session.logoutTime) : '-'}</span>
            </div>
          </div>

          {/* Calls Made Summary */}
          {session.logoutTime && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Lead Changes</span>
              </div>
              <p className="text-3xl font-bold text-primary">{totalCalls}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Leads were moved between statuses
              </p>
            </div>
          )}

          {/* Lead Status Comparison */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Lead Status Changes
            </h4>
            <LeadStatusComparison
              entryStatuses={session.entryLeadStatuses}
              exitStatuses={session.exitLeadStatuses}
              conversions={session.conversions}
            />
          </div>
        </div>

        <DialogFooter>
          {isEndSession && onConfirmEnd ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={onConfirmEnd} className="flex-1">
                Confirm Logout
              </Button>
            </div>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Active Intern Card Component
function ActiveInternCard({
  session,
  currentLeadStatuses,
  onEndSession
}: {
  session: InternSession;
  currentLeadStatuses: LeadStatusSnapshot[];
  onEndSession: (session: InternSession) => void;
}) {
  // Calculate live changes
  const liveChanges = useMemo(() => {
    let totalChanges = 0;
    session.entryLeadStatuses.forEach(entry => {
      const current = currentLeadStatuses.find(c => c.status === entry.status);
      const change = Math.abs((current?.count || 0) - entry.count);
      totalChanges += change;
    });
    return Math.ceil(totalChanges / 2);
  }, [session.entryLeadStatuses, currentLeadStatuses]);

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{session.internName}</p>
            <p className="text-xs text-muted-foreground">
              Since {formatTime(session.loginTime)} ({calculateDuration(session.loginTime)})
            </p>
          </div>
        </div>
        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
          <Activity className="h-3 w-3 mr-1" />
          Active
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-muted/50 rounded p-2 text-center">
          <p className="text-xs text-muted-foreground">Working</p>
          <p className="font-semibold text-primary">{calculateDuration(session.loginTime)}</p>
        </div>
        <div className="bg-muted/50 rounded p-2 text-center">
          <p className="text-xs text-muted-foreground">Lead Changes</p>
          <p className="font-semibold text-primary">{liveChanges}</p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive hover:text-destructive"
        onClick={() => onEndSession(session)}
      >
        <LogOut className="h-4 w-4 mr-2" />
        End Session
      </Button>
    </div>
  );
}

// Intern Name Card with Session Stats
function InternNameCard({
  intern,
  sessions,
  isActive,
  onClick
}: {
  intern: InternName;
  sessions: InternSession[];
  isActive: boolean;
  onClick: () => void;
}) {
  // Calculate total stats
  const totalSessions = sessions.length;
  const totalLeadChanges = sessions.reduce((acc, s) => acc + (s.totalCallsMade || 0), 0);

  // Calculate slot booked from sessions
  const sessionSlotBooked = sessions.reduce((acc, s) => {
    if (s.conversions && s.conversions['Slot Booked']) {
      return acc + s.conversions['Slot Booked'];
    }
    return acc;
  }, 0);

  // Total slot booked = session calculated + manual (if exists)
  const totalSlotBooked = sessionSlotBooked + (intern.manualSlotBooked || 0);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        "group"
      )}
      style={{
        backgroundColor: `${intern.color}10`,
        borderColor: `${intern.color}40`
      }}
    >
      {isActive && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-emerald-500 text-white text-xs px-2">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: intern.color }}
        >
          {intern.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{intern.name}</h3>
          <p className="text-xs text-muted-foreground">
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background/60 rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground">Sessions</p>
          <p className="font-bold text-lg" style={{ color: intern.color }}>{totalSessions}</p>
        </div>
        <div className="bg-background/60 rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground">Lead Changes</p>
          <p className="font-bold text-lg" style={{ color: intern.color }}>{totalLeadChanges}</p>
        </div>
        <div className="bg-emerald-500/20 rounded-lg p-2 text-center border border-emerald-500/30">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Slot Booked</p>
          <p className="font-bold text-lg text-emerald-600 dark:text-emerald-500">{totalSlotBooked}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        <span>View History</span>
        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

// Intern History Dialog
function InternHistoryDialog({
  intern,
  sessions,
  open,
  onOpenChange,
  onViewSession
}: {
  intern: InternName;
  sessions: InternSession[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewSession: (session: InternSession) => void;
}) {
  const updateInternName = useClientStore((state) => state.updateInternName);
  const [isEditingSlotBooked, setIsEditingSlotBooked] = useState(false);
  const [slotBookedInput, setSlotBookedInput] = useState('');

  const totalLeadChanges = sessions.reduce((acc, s) => acc + (s.totalCallsMade || 0), 0);

  // Calculate total slot booked from sessions
  const sessionSlotBooked = sessions.reduce((acc, s) => {
    if (s.conversions && s.conversions['Slot Booked']) {
      return acc + s.conversions['Slot Booked'];
    }
    return acc;
  }, 0);

  // Total = session calculated + manual (if exists)
  const totalSlotBooked = sessionSlotBooked + (intern.manualSlotBooked || 0);

  const handleEditSlotBooked = () => {
    setSlotBookedInput(String(totalSlotBooked));
    setIsEditingSlotBooked(true);
  };

  const handleSaveSlotBooked = async () => {
    const newValue = parseInt(slotBookedInput, 10);
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    try {
      await updateInternName(intern.id, { manualSlotBooked: newValue });
      toast.success('Slot booked count updated');
      setIsEditingSlotBooked(false);
    } catch (error) {
      toast.error('Failed to update slot booked count');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: intern.color }}
              >
                {intern.name.charAt(0).toUpperCase()}
              </div>
              <span>{intern.name}'s Session History</span>
            </DialogTitle>
            <DialogDescription>
              Complete session history and performance statistics
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold" style={{ color: intern.color }}>{sessions.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Lead Changes</p>
                <p className="text-2xl font-bold" style={{ color: intern.color }}>{totalLeadChanges}</p>
              </div>
              <div
                className="bg-emerald-500/10 rounded-lg p-3 text-center cursor-pointer hover:bg-emerald-500/20 transition-colors border-2 border-emerald-500/30 group"
                onClick={handleEditSlotBooked}
              >
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  Total Slot Booked
                  <span className="text-[10px] text-emerald-600 group-hover:text-emerald-700">(Click to edit)</span>
                </p>
                <p className="text-2xl font-bold text-emerald-600 group-hover:text-emerald-700">{totalSlotBooked}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Avg. per Session</p>
                <p className="text-2xl font-bold" style={{ color: intern.color }}>
                  {sessions.length > 0 ? Math.round(totalLeadChanges / sessions.length) : 0}
                </p>
              </div>
            </div>

            {/* Sessions Table */}
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No session records yet</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Logout</TableHead>
                      <TableHead className="text-center">Lead Changes</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{formatDate(session.date)}</TableCell>
                        <TableCell>{formatTime(session.loginTime)}</TableCell>
                        <TableCell>{formatTime(session.logoutTime || '')}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{session.totalCallsMade || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewSession(session)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Booked Dialog */}
      <Dialog open={isEditingSlotBooked} onOpenChange={setIsEditingSlotBooked}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Total Slot Booked</DialogTitle>
            <DialogDescription>
              Update the total slot booked count for {intern.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="slotBooked">Total Slot Booked</Label>
            <Input
              id="slotBooked"
              type="number"
              min="0"
              value={slotBookedInput}
              onChange={(e) => setSlotBookedInput(e.target.value)}
              className="mt-2"
              placeholder="Enter slot booked count"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Sessions calculated: {sessionSlotBooked}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingSlotBooked(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlotBooked}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InternTracker() {
  const clients = useClientStore((state) => state.clients);
  const dropdowns = useClientStore((state) => state.dropdowns);
  const internSessions = useClientStore((state) => state.internSessions);
  const activeInternSessions = useClientStore((state) => state.activeInternSessions);
  const internNames = useClientStore((state) => state.internNames);
  const startInternSession = useClientStore((state) => state.startInternSession);
  const endInternSession = useClientStore((state) => state.endInternSession);
  const deleteInternSessionRecord = useClientStore((state) => state.deleteInternSessionRecord);
  const deleteMultipleInternSessions = useClientStore((state) => state.deleteMultipleInternSessions);
  const getLeadStatusSnapshot = useClientStore((state) => state.getLeadStatusSnapshot);

  // Form states
  const [selectedInternName, setSelectedInternName] = useState('');
  const [customInternName, setCustomInternName] = useState('');
  const [loginTime, setLoginTime] = useState(getCurrentTime());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // End session states
  const [logoutTime, setLogoutTime] = useState(getCurrentTime());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<InternSession | null>(null);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [previewEndSession, setPreviewEndSession] = useState<InternSession | null>(null);

  // Dialog states
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<InternSession | null>(null);

  // Intern history dialog
  const [selectedInternForHistory, setSelectedInternForHistory] = useState<InternName | null>(null);
  const [showInternHistoryDialog, setShowInternHistoryDialog] = useState(false);

  // History selection states
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Greeting popup states
  const [showGreetingPopup, setShowGreetingPopup] = useState(false);
  const [greetingType, setGreetingType] = useState<'login' | 'logout'>('login');
  const [greetingInternName, setGreetingInternName] = useState('');

  // Get current lead status snapshot
  const currentLeadStatuses = useMemo(() => {
    return getLeadStatusSnapshot();
  }, [clients, dropdowns, getLeadStatusSnapshot]);

  // Get sessions for a specific intern
  const getInternSessions = (internName: string) => {
    return internSessions.filter(
      s => s.internName.toLowerCase() === internName.toLowerCase() && !s.isActive
    );
  };

  // Check if an intern is currently active
  const isInternActive = (internName: string) => {
    return activeInternSessions.some(
      s => s.internName.toLowerCase() === internName.toLowerCase()
    );
  };

  // Handle login
  const handleLogin = async () => {
    const nameToUse = selectedInternName === 'custom' ? customInternName.trim() : selectedInternName;
    if (!nameToUse) {
      toast.error('Please select or enter an intern name');
      return;
    }
    if (!loginTime) {
      toast.error('Please enter login time');
      return;
    }

    setIsLoggingIn(true);
    try {
      await startInternSession(nameToUse, loginTime);
      // Show greeting popup
      setGreetingInternName(nameToUse);
      setGreetingType('login');
      setShowGreetingPopup(true);
      setSelectedInternName('');
      setCustomInternName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start session');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle end session preview
  const handleEndSession = (session: InternSession) => {
    setSessionToEnd(session);
    setLogoutTime(getCurrentTime());
    setShowEndSessionDialog(true);
  };

  // Preview logout (show summary with option to confirm)
  const handlePreviewLogout = () => {
    if (!sessionToEnd) return;
    if (!logoutTime) {
      toast.error('Please enter logout time');
      return;
    }

    // Create preview session with exit statuses
    const exitStatuses = getLeadStatusSnapshot();
    const preview: InternSession = {
      ...sessionToEnd,
      logoutTime,
      exitLeadStatuses: exitStatuses,
      conversions: {},
      totalCallsMade: 0
    };

    // Calculate conversions for preview
    let totalChanges = 0;
    const conversions: Record<string, number> = {};

    // Check all entry statuses
    preview.entryLeadStatuses.forEach(entry => {
      const exitStatus = exitStatuses.find(e => e.status === entry.status);
      const exitCount = exitStatus?.count || 0;
      const change = exitCount - entry.count;
      conversions[entry.status] = change;
      if (change !== 0) {
        totalChanges += Math.abs(change);
      }
    });

    // Also check for any new statuses at exit that weren't in entry
    exitStatuses.forEach(exit => {
      if (!conversions.hasOwnProperty(exit.status)) {
        conversions[exit.status] = exit.count;
        if (exit.count > 0) {
          totalChanges += Math.abs(exit.count);
        }
      }
    });

    preview.conversions = conversions;
    preview.totalCallsMade = Math.ceil(totalChanges / 2);

    setPreviewEndSession(preview);
    setShowEndSessionDialog(false);
  };

  // Confirm logout
  const handleConfirmLogout = async () => {
    if (!sessionToEnd) return;

    const internNameForGreeting = sessionToEnd.internName;
    setIsLoggingOut(true);
    try {
      await endInternSession(sessionToEnd.id, logoutTime);
      // Show greeting popup
      setGreetingInternName(internNameForGreeting);
      setGreetingType('logout');
      setShowGreetingPopup(true);
      setLogoutTime(getCurrentTime());
    } catch (error: any) {
      toast.error(error.message || 'Failed to end session');
    } finally {
      setIsLoggingOut(false);
      setPreviewEndSession(null);
      setSessionToEnd(null);
    }
  };

  // View session details
  const handleViewSession = (session: InternSession) => {
    setSelectedSession(session);
    setShowSummaryDialog(true);
  };

  // Handle intern card click
  const handleInternCardClick = (intern: InternName) => {
    setSelectedInternForHistory(intern);
    setShowInternHistoryDialog(true);
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteInternSessionRecord(sessionId);
      setSelectedSessionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      toast.success('Session record deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session');
    }
  };

  // Past sessions (completed)
  const pastSessions = internSessions.filter(s => !s.isActive);

  // Toggle session selection
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedSessionIds.size === pastSessions.length) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(pastSessions.map(s => s.id)));
    }
  };

  // Bulk delete sessions
  const handleBulkDelete = async () => {
    if (selectedSessionIds.size === 0) return;

    try {
      await deleteMultipleInternSessions(Array.from(selectedSessionIds));
      toast.success(`${selectedSessionIds.size} session${selectedSessionIds.size > 1 ? 's' : ''} deleted`);
      setSelectedSessionIds(new Set());
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sessions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Intern Name Cards Section */}
      {internNames.length > 0 && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Interns Overview
            </CardTitle>
            <CardDescription>
              Click on an intern to view their session history and stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {internNames.map((intern) => (
                <InternNameCard
                  key={intern.id}
                  intern={intern}
                  sessions={getInternSessions(intern.name)}
                  isActive={isInternActive(intern.name)}
                  onClick={() => handleInternCardClick(intern)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sessions Section */}
      {activeInternSessions.length > 0 && (
        <Card className="border-emerald-500/30 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Active Interns ({activeInternSessions.length})
                </CardTitle>
                <CardDescription>
                  Currently working interns and their progress
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeInternSessions.map((session) => (
                <ActiveInternCard
                  key={session.id}
                  session={session}
                  currentLeadStatuses={currentLeadStatuses}
                  onEndSession={handleEndSession}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Card */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                Start Intern Session
              </CardTitle>
              <CardDescription>
                {internNames.length > 0
                  ? 'Select an intern or enter a custom name to start session'
                  : 'Enter intern name to start a work session'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Intern Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Intern Name</Label>
              {internNames.length > 0 ? (
                <Select
                  value={selectedInternName}
                  onValueChange={(value) => {
                    setSelectedInternName(value);
                    if (value !== 'custom') {
                      setCustomInternName('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intern" />
                  </SelectTrigger>
                  <SelectContent>
                    {internNames.map((intern) => (
                      <SelectItem key={intern.id} value={intern.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: intern.color }}
                          />
                          {intern.name}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Enter custom name
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={customInternName}
                  onChange={(e) => setCustomInternName(e.target.value)}
                  placeholder="Enter intern name"
                />
              )}
            </div>

            {selectedInternName === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Name</Label>
                <Input
                  value={customInternName}
                  onChange={(e) => setCustomInternName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="loginTime">Login Time</Label>
              <Input
                id="loginTime"
                type="time"
                value={loginTime}
                onChange={(e) => setLoginTime(e.target.value)}
              />
            </div>
          </div>

          {/* Current Lead Status Preview */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Current Lead Status (will be recorded at login)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentLeadStatuses.map((status) => (
                <div key={status.status} className="bg-background rounded-md p-2 text-center border">
                  <p className="text-xs text-muted-foreground truncate">{status.status}</p>
                  <p className="text-lg font-bold">{status.count}</p>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn || (!selectedInternName && !customInternName.trim())}
            className="w-full sm:w-auto"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {isLoggingIn ? 'Starting Session...' : 'Start Session'}
          </Button>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Session History
              </CardTitle>
              <CardDescription>
                View past session records and performance
              </CardDescription>
            </div>
            {selectedSessionIds.size > 0 && (
              <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedSessionIds.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedSessionIds.size} Session{selectedSessionIds.size > 1 ? 's' : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the selected session records. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No session records yet</p>
              <p className="text-sm">Complete your first session to see it here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={pastSessions.length > 0 && selectedSessionIds.size === pastSessions.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Intern</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Logout</TableHead>
                    <TableHead className="text-center">Lead Changes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSessionIds.has(session.id)}
                          onCheckedChange={() => toggleSessionSelection(session.id)}
                          aria-label={`Select session for ${session.internName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDate(session.date)}
                      </TableCell>
                      <TableCell>{session.internName}</TableCell>
                      <TableCell>{formatTime(session.loginTime)}</TableCell>
                      <TableCell>{formatTime(session.logoutTime || '')}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {session.totalCallsMade || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSession(session)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Session Record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the session record from {formatDate(session.date)}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSession(session.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* End Session Time Dialog */}
      <Dialog open={showEndSessionDialog} onOpenChange={(open) => {
        setShowEndSessionDialog(open);
        if (!open) setSessionToEnd(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              End Session
            </DialogTitle>
            <DialogDescription>
              Set logout time for <span className="font-semibold">{sessionToEnd?.internName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="endLogoutTime">Logout Time</Label>
            <Input
              id="endLogoutTime"
              type="time"
              value={logoutTime}
              onChange={(e) => setLogoutTime(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndSessionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePreviewLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Preview & End
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Session Dialog */}
      {selectedSession && (
        <SessionSummaryDialog
          session={selectedSession}
          open={showSummaryDialog}
          onOpenChange={(open) => {
            setShowSummaryDialog(open);
            if (!open) setSelectedSession(null);
          }}
        />
      )}

      {/* End Session Preview Dialog */}
      {previewEndSession && (
        <SessionSummaryDialog
          session={previewEndSession}
          open={!!previewEndSession}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewEndSession(null);
              setSessionToEnd(null);
            }
          }}
          isEndSession={true}
          onConfirmEnd={handleConfirmLogout}
        />
      )}

      {/* Intern History Dialog */}
      {selectedInternForHistory && (
        <InternHistoryDialog
          intern={selectedInternForHistory}
          sessions={getInternSessions(selectedInternForHistory.name)}
          open={showInternHistoryDialog}
          onOpenChange={(open) => {
            setShowInternHistoryDialog(open);
            if (!open) setSelectedInternForHistory(null);
          }}
          onViewSession={(session) => {
            setShowInternHistoryDialog(false);
            setSelectedInternForHistory(null);
            handleViewSession(session);
          }}
        />
      )}

      {/* Greeting Popup */}
      <GreetingPopup
        isOpen={showGreetingPopup}
        type={greetingType}
        internName={greetingInternName}
        onClose={() => setShowGreetingPopup(false)}
      />
    </div>
  );
}
