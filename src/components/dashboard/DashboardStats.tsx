import { Users, Phone, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, PhoneOff, UserCheck, Download, Sparkles, CircleDot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useClientStore } from '@/stores/clientStore';
import { cn } from '@/lib/utils';
import { memo, useMemo } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
}

// Memoized stat card for better performance
const StatCard = memo(function StatCard({ title, value, change, icon, iconBg }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 lg:space-y-2 min-w-0">
            <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs lg:text-sm font-medium",
                change >= 0 ? "text-emerald-600" : "text-destructive"
              )}>
                {change >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 lg:h-4 lg:w-4" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 lg:h-4 lg:w-4" />
                )}
                <span className="hidden sm:inline">{Math.abs(change)}% from last week</span>
                <span className="sm:hidden">{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 lg:p-3 rounded-xl shrink-0", iconBg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Icon and color mapping for different lead statuses
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; iconBg: string }> = {
  'New Lead': {
    icon: <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />,
    iconBg: 'bg-blue-500/10'
  },
  'Hot Lead': {
    icon: <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-red-500" />,
    iconBg: 'bg-red-500/10'
  },
  'Warm Lead': {
    icon: <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-orange-500" />,
    iconBg: 'bg-orange-500/10'
  },
  'Cold Lead': {
    icon: <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-gray-500" />,
    iconBg: 'bg-gray-500/10'
  },
  'Converted': {
    icon: <UserCheck className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />,
    iconBg: 'bg-emerald-500/10'
  },
  'Lost': {
    icon: <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-destructive" />,
    iconBg: 'bg-destructive/10'
  },
  'Installed': {
    icon: <Download className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />,
    iconBg: 'bg-purple-500/10'
  },
  'App Installed': {
    icon: <Download className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />,
    iconBg: 'bg-purple-500/10'
  },
  'Not answered': {
    icon: <PhoneOff className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />,
    iconBg: 'bg-yellow-500/10'
  },
  'App user': {
    icon: <Phone className="h-5 w-5 lg:h-6 lg:w-6 text-violet-600" />,
    iconBg: 'bg-violet-500/10'
  },
};

// Default config for unknown statuses
const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status] || {
    icon: <CircleDot className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />,
    iconBg: 'bg-primary/10'
  };
};

export function DashboardStats() {
  // Subscribe to clients and dropdowns with individual selector for proper reactivity
  const clients = useClientStore((state) => state.clients);
  const dropdowns = useClientStore((state) => state.dropdowns);

  // Memoize all computed values to prevent recalculation on every render
  const { totalClients, statusStats, statusCounts, statusOptions } = useMemo(() => {
    const total = clients.length;
    
    // Get lead status dropdown options
    const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
    const options = leadStatusDropdown?.options || [];

    // Count clients per status
    const counts = clients.reduce((acc, client) => {
      const status = client.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create stats for each lead status option
    const stats = options.map(status => ({
      status,
      count: counts[status] || 0,
      ...getStatusConfig(status)
    }));

    return {
      totalClients: total,
      statusStats: stats,
      statusCounts: counts,
      statusOptions: options
    };
  }, [clients, dropdowns]);

  return (
    <div className="space-y-4">
      {/* Total Clients - Always shown */}
      <div className="grid grid-cols-1">
        <Card className="hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 lg:space-y-2 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-3xl lg:text-4xl font-bold text-foreground">{totalClients}</p>
              </div>
              <div className="p-3 lg:p-4 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Stats Grid */}
      {statusStats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
          {statusStats.map(({ status, count, icon, iconBg }) => (
            <StatCard
              key={status}
              title={status}
              value={count}
              icon={icon}
              iconBg={iconBg}
            />
          ))}
        </div>
      )}

      {/* Fallback if no status options defined */}
      {statusStats.length === 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            title="Lost"
            value={statusCounts['Lost'] || 0}
            icon={<TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-destructive" />}
            iconBg="bg-destructive/10"
          />
          <StatCard
            title="Converted"
            value={statusCounts['Converted'] || 0}
            icon={<Phone className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />}
            iconBg="bg-emerald-500/10"
          />
        </div>
      )}
    </div>
  );
}
