import { useState, useMemo } from 'react';
import { InternSession } from '@/types/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DaywiseData {
  date: string; // YYYY-MM-DD format
  dateObj: Date;
  totalLeadChanges: number;
  totalWorkingMinutes: number;
  sessionCount: number;
}

interface DaywiseOverviewProps {
  sessions: InternSession[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to calculate duration in minutes between two times
const calculateMinutes = (loginTime: string, logoutTime: string): number => {
  const [loginHours, loginMinutes] = loginTime.split(':').map(Number);
  const [logoutHours, logoutMinutes] = logoutTime.split(':').map(Number);
  
  const loginTotalMinutes = loginHours * 60 + loginMinutes;
  const logoutTotalMinutes = logoutHours * 60 + logoutMinutes;
  
  let diff = logoutTotalMinutes - loginTotalMinutes;
  
  // Handle case where logout is on next day (after midnight)
  if (diff < 0) {
    diff += 24 * 60;
  }
  
  return diff;
};

// Helper to format minutes to hours and minutes
const formatDuration = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Helper to format date
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Aggregate sessions by date
const aggregateSessionsByDate = (sessions: InternSession[]): DaywiseData[] => {
  // Filter only completed sessions (with logout time)
  const completedSessions = sessions.filter(s => !s.isActive && s.logoutTime);
  
  // Group by date
  const dateMap = new Map<string, DaywiseData>();
  
  completedSessions.forEach(session => {
    const dateKey = new Date(session.date).toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        dateObj: new Date(session.date),
        totalLeadChanges: 0,
        totalWorkingMinutes: 0,
        sessionCount: 0
      });
    }
    
    const dayData = dateMap.get(dateKey)!;
    
    // Add lead changes
    dayData.totalLeadChanges += session.totalCallsMade || 0;
    
    // Add working time
    if (session.logoutTime) {
      const minutes = calculateMinutes(session.loginTime, session.logoutTime);
      dayData.totalWorkingMinutes += minutes;
    }
    
    // Increment session count
    dayData.sessionCount++;
  });
  
  // Convert to array and sort by date (most recent first)
  return Array.from(dateMap.values()).sort((a, b) => 
    b.dateObj.getTime() - a.dateObj.getTime()
  );
};

export function DaywiseOverview({ sessions, open, onOpenChange }: DaywiseOverviewProps) {
  const [selectedIntern, setSelectedIntern] = useState<string>('all');
  
  // Get unique intern names from sessions
  const internNames = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(session => {
      if (session.internName) {
        names.add(session.internName);
      }
    });
    return Array.from(names).sort();
  }, [sessions]);
  
  // Filter sessions by selected intern
  const filteredSessions = useMemo(() => {
    if (selectedIntern === 'all') {
      return sessions;
    }
    return sessions.filter(s => s.internName === selectedIntern);
  }, [sessions, selectedIntern]);
  
  const daywiseData = aggregateSessionsByDate(filteredSessions);
  
  // Calculate totals
  const totalLeadChanges = daywiseData.reduce((sum, day) => sum + day.totalLeadChanges, 0);
  const totalWorkingMinutes = daywiseData.reduce((sum, day) => sum + day.totalWorkingMinutes, 0);
  const totalDays = daywiseData.length;
  
  // Reset filter when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedIntern('all');
    }
    onOpenChange(newOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Day-wise Overview
          </DialogTitle>
          <DialogDescription>
            Daily statistics showing lead changes and working hours
          </DialogDescription>
        </DialogHeader>
        
        {/* Intern Filter Dropdown */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Filter by Intern:</span>
          </div>
          <Select value={selectedIntern} onValueChange={setSelectedIntern}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select intern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span>All Interns</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {internNames.length}
                  </Badge>
                </div>
              </SelectItem>
              {internNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedIntern !== 'all' && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              Showing: {selectedIntern}
            </Badge>
          )}
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Days</p>
                <p className="text-3xl font-bold text-primary">{totalDays}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Total Lead Changes
                </p>
                <p className="text-3xl font-bold text-emerald-600">{totalLeadChanges}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  Total Working Time
                </p>
                <p className="text-3xl font-bold text-blue-600">{formatDuration(totalWorkingMinutes)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Daily Data Table */}
        {daywiseData.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-center">Lead Changes</TableHead>
                  <TableHead className="text-center">Working Time</TableHead>
                  <TableHead className="text-center">Avg Time/Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daywiseData.map((day) => {
                  const avgTime = Math.round(day.totalWorkingMinutes / day.sessionCount);
                  const isToday = new Date(day.dateObj).toDateString() === new Date().toDateString();
                  
                  return (
                    <TableRow key={day.date} className={cn(isToday && "bg-primary/5")}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{formatDate(day.dateObj)}</p>
                            {isToday && (
                              <Badge variant="outline" className="mt-1 text-xs border-primary/50 text-primary">
                                Today
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{day.sessionCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-emerald-600">
                          {day.totalLeadChanges}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-blue-600">
                            {formatDuration(day.totalWorkingMinutes)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(avgTime)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No completed sessions found</p>
            <p className="text-sm">Session data will appear here once interns complete their sessions</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
