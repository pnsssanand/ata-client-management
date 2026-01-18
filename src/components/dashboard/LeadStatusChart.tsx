import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientStore } from '@/stores/clientStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = {
  'New Lead': 'hsl(198, 93%, 59%)',
  'Hot Lead': 'hsl(0, 72%, 50%)',
  'Warm Lead': 'hsl(213, 93%, 67%)',
  'Cold Lead': 'hsl(215, 20%, 65%)',
  'Converted': 'hsl(142, 76%, 36%)',
  'Lost': 'hsl(0, 84%, 60%)',
};

export function LeadStatusChart() {
  const { clients } = useClientStore();
  const isMobile = useIsMobile();

  const statusCounts = clients.reduce((acc, client) => {
    acc[client.status] = (acc[client.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS] || 'hsl(215, 16%, 46%)',
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 px-4 lg:px-6">
        <CardTitle className="text-base lg:text-lg font-semibold">Lead Status Overview</CardTitle>
      </CardHeader>
      <CardContent className="px-4 lg:px-6">
        {data.length === 0 ? (
          <div className="h-[200px] lg:h-[280px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data to display</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 60}
                outerRadius={isMobile ? 70 : 100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(210, 40%, 98%)', 
                  border: '1px solid hsl(212, 26%, 83%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                formatter={(value) => <span className="text-xs lg:text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
