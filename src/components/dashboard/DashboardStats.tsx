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
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                change >= 0 ? "text-emerald-600" : "text-destructive"
              )}>
                {change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(change)}% from last week</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconBg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { clients } = useClientStore();

  const totalClients = clients.length;
  const hotLeads = clients.filter(c => c.status === 'Hot Lead').length;
  const converted = clients.filter(c => c.status === 'Converted').length;
  const pendingFollowup = clients.filter(c => c.followUpRequired).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Clients"
        value={totalClients}
        icon={<Users className="h-6 w-6 text-primary" />}
        iconBg="bg-primary/10"
      />
      <StatCard
        title="Hot Leads"
        value={hotLeads}
        icon={<TrendingUp className="h-6 w-6 text-destructive" />}
        iconBg="bg-destructive/10"
      />
      <StatCard
        title="Converted"
        value={converted}
        icon={<Phone className="h-6 w-6 text-emerald-600" />}
        iconBg="bg-emerald-500/10"
      />
      <StatCard
        title="Pending Follow-up"
        value={pendingFollowup}
        icon={<Clock className="h-6 w-6 text-chart-2" />}
        iconBg="bg-chart-2/10"
      />
    </div>
  );
}
