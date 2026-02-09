import { useState, useMemo } from 'react';
import { useClientStore } from '@/stores/clientStore';
import { InternSession, LeadStatusSnapshot } from '@/types/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
        <span>Status</span>
        <span className="text-center">Entry</span>
        <span className="text-center">{exitStatuses ? 'Exit' : 'Current'}</span>
      </div>
      {entryStatuses.map((entry) => {
        const exitStatus = exitStatuses?.find(e => e.status === entry.status);
        const change = conversions?.[entry.status] || 0;
        
        return (
          <div key={entry.status} className="grid grid-cols-3 gap-2 items-center text-sm">
            <span className="font-medium truncate">{entry.status}</span>
            <span className="text-center">{entry.count}</span>
            <div className="flex items-center justify-center gap-1">
              <span>{exitStatus?.count ?? entry.count}</span>
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

export function InternTracker() {
  const clients = useClientStore((state) => state.clients);
  const dropdowns = useClientStore((state) => state.dropdowns);
  const internSessions = useClientStore((state) => state.internSessions);
  const activeInternSession = useClientStore((state) => state.activeInternSession);
  const startInternSession = useClientStore((state) => state.startInternSession);
  const endInternSession = useClientStore((state) => state.endInternSession);
  const deleteInternSessionRecord = useClientStore((state) => state.deleteInternSessionRecord);
  const getLeadStatusSnapshot = useClientStore((state) => state.getLeadStatusSnapshot);

  // Form states
  const [internName, setInternName] = useState('Renuka');
  const [loginTime, setLoginTime] = useState(getCurrentTime());
  const [logoutTime, setLogoutTime] = useState(getCurrentTime());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Dialog states
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<InternSession | null>(null);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [previewEndSession, setPreviewEndSession] = useState<InternSession | null>(null);

  // Get current lead status snapshot
  const currentLeadStatuses = useMemo(() => {
    return getLeadStatusSnapshot();
  }, [clients, dropdowns, getLeadStatusSnapshot]);

  // Handle login
  const handleLogin = async () => {
    if (!internName.trim()) {
      toast.error('Please enter intern name');
      return;
    }
    if (!loginTime) {
      toast.error('Please enter login time');
      return;
    }

    setIsLoggingIn(true);
    try {
      await startInternSession(internName.trim(), loginTime);
      toast.success(`Welcome ${internName}! Session started.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start session');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Preview logout (show summary with option to confirm)
  const handlePreviewLogout = () => {
    if (!activeInternSession) return;
    if (!logoutTime) {
      toast.error('Please enter logout time');
      return;
    }
    
    // Create preview session with exit statuses
    const preview: InternSession = {
      ...activeInternSession,
      logoutTime,
      exitLeadStatuses: getLeadStatusSnapshot(),
      conversions: {},
      totalCallsMade: 0
    };
    
    // Calculate conversions for preview
    let totalChanges = 0;
    preview.entryLeadStatuses.forEach(entry => {
      const exitStatus = preview.exitLeadStatuses?.find(e => e.status === entry.status);
      const change = (exitStatus?.count || 0) - entry.count;
      preview.conversions![entry.status] = change;
      if (change !== 0) {
        totalChanges += Math.abs(change);
      }
    });
    preview.totalCallsMade = Math.ceil(totalChanges / 2);
    
    setPreviewEndSession(preview);
    setShowEndSessionDialog(true);
  };

  // Confirm logout
  const handleConfirmLogout = async () => {
    if (!activeInternSession) return;
    
    setShowEndSessionDialog(false);
    setIsLoggingOut(true);
    try {
      await endInternSession(activeInternSession.id, logoutTime);
      toast.success(`Goodbye ${activeInternSession.internName}! Session completed.`);
      // Reset logout time for next session
      setLogoutTime(getCurrentTime());
    } catch (error: any) {
      toast.error(error.message || 'Failed to end session');
    } finally {
      setIsLoggingOut(false);
      setPreviewEndSession(null);
    }
  };

  // View session details
  const handleViewSession = (session: InternSession) => {
    setSelectedSession(session);
    setShowSummaryDialog(true);
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteInternSessionRecord(sessionId);
      toast.success('Session record deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session');
    }
  };

  // Past sessions (completed)
  const pastSessions = internSessions.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Active Session or Login Card */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Renuka Login
              </CardTitle>
              <CardDescription>
                {activeInternSession 
                  ? 'Active session in progress' 
                  : 'Start your work session to track lead conversions'}
              </CardDescription>
            </div>
            {activeInternSession && (
              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                <Clock className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeInternSession ? (
            // Login Form
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="internName">Intern Name</Label>
                  <Input
                    id="internName"
                    value={internName}
                    onChange={(e) => setInternName(e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
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
                disabled={isLoggingIn}
                className="w-full sm:w-auto"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {isLoggingIn ? 'Starting Session...' : 'Start Session'}
              </Button>
            </>
          ) : (
            // Active Session View
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Logged in as</p>
                    <p className="text-xl font-bold text-primary">{activeInternSession.internName}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span className="font-medium">{formatDate(activeInternSession.date)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Login: </span>
                      <span className="font-medium">{formatTime(activeInternSession.loginTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Entry Lead Status */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Lead Status at Login vs Current
                </h4>
                <LeadStatusComparison 
                  entryStatuses={activeInternSession.entryLeadStatuses}
                  exitStatuses={currentLeadStatuses}
                />
              </div>
              
              {/* Logout Section */}
              <div className="flex flex-col sm:flex-row gap-4 items-end pt-2 border-t">
                <div className="space-y-2 w-full sm:w-auto">
                  <Label htmlFor="logoutTime">Logout Time</Label>
                  <Input
                    id="logoutTime"
                    type="time"
                    value={logoutTime}
                    onChange={(e) => setLogoutTime(e.target.value)}
                    className="w-full sm:w-40"
                  />
                </div>
                <Button 
                  onClick={handlePreviewLogout}
                  disabled={isLoggingOut}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? 'Ending Session...' : 'End Session'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Session History
          </CardTitle>
          <CardDescription>
            View past session records and performance
          </CardDescription>
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
          open={showEndSessionDialog}
          onOpenChange={(open) => {
            setShowEndSessionDialog(open);
            if (!open) setPreviewEndSession(null);
          }}
          isEndSession={true}
          onConfirmEnd={handleConfirmLogout}
        />
      )}
    </div>
  );
}
