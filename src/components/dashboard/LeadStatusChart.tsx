import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientStore } from '@/stores/clientStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Lead Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
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
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
