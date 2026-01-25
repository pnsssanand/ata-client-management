import { Users, Phone, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useClientStore } from '@/stores/clientStore';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, change, icon, iconBg }: StatCardProps) {
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
}

export function DashboardStats() {
  // Subscribe to clients with individual selector for proper reactivity
  const clients = useClientStore((state) => state.clients);

  const totalClients = clients.length;
  const hotLeads = clients.filter(c => c.status === 'Hot Lead').length;
  const converted = clients.filter(c => c.status === 'Converted').length;
  const pendingFollowup = clients.filter(c => c.followUpRequired).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <StatCard
        title="Total Clients"
        value={totalClients}
        icon={<Users className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />}
        iconBg="bg-primary/10"
      />
      <StatCard
        title="Hot Leads"
        value={hotLeads}
        icon={<TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-destructive" />}
        iconBg="bg-destructive/10"
      />
      <StatCard
        title="Converted"
        value={converted}
        icon={<Phone className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />}
        iconBg="bg-emerald-500/10"
      />
      <StatCard
        title="Follow-up"
        value={pendingFollowup}
        icon={<Clock className="h-5 w-5 lg:h-6 lg:w-6 text-chart-2" />}
        iconBg="bg-chart-2/10"
      />
    </div>
  );
}
