import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientStore } from '@/stores/clientStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

// Dynamic color palette for lead statuses - generates consistent colors for any status
const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'hsl(198, 93%, 59%)',
  'Hot Lead': 'hsl(0, 72%, 50%)',
  'Warm Lead': 'hsl(213, 93%, 67%)',
  'Cold Lead': 'hsl(215, 20%, 65%)',
  'Converted': 'hsl(142, 76%, 36%)',
  'Lost': 'hsl(0, 84%, 60%)',
  'Installed': 'hsl(280, 65%, 60%)',
  'App Installed': 'hsl(280, 65%, 60%)',
  'Not answered': 'hsl(38, 92%, 50%)',
  'App user': 'hsl(262, 83%, 58%)',
};

// Fallback color generator for custom statuses not in the predefined list
const getStatusColor = (status: string, index: number): string => {
  if (STATUS_COLORS[status]) return STATUS_COLORS[status];
  // Generate a consistent color based on the status string
  const hue = (index * 137.5) % 360; // Golden angle for good distribution
  return `hsl(${hue}, 70%, 50%)`;
};

export function LeadStatusChart() {
  // Subscribe to clients and dropdowns with individual selector for proper reactivity
  const clients = useClientStore((state) => state.clients);
  const dropdowns = useClientStore((state) => state.dropdowns);
  const isMobile = useIsMobile();

  // Get lead status dropdown options
  const leadStatusDropdown = dropdowns.find(d => d.name === 'Lead Status');
  const statusOptions = leadStatusDropdown?.options || [];

  // Count clients per status, including all defined status options (even if 0)
  const statusCounts = clients.reduce((acc, client) => {
    const status = client.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Create data array with all status options, ensuring all are shown
  const data = statusOptions.length > 0
    ? statusOptions.map((status, index) => ({
        name: status,
        value: statusCounts[status] || 0,
        color: getStatusColor(status, index),
      }))
    : Object.entries(statusCounts).map(([name, value], index) => ({
        name,
        value,
        color: getStatusColor(name, index),
      }));

  // Filter out zero values for the pie chart (but keep them in legend)
  const chartData = data.filter(d => d.value > 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 px-4 lg:px-6">
        <CardTitle className="text-base lg:text-lg font-semibold">Lead Status Overview</CardTitle>
      </CardHeader>
      <CardContent className="px-4 lg:px-6">
        {chartData.length === 0 ? (
          <div className="h-[200px] lg:h-[280px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data to display</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 60}
                outerRadius={isMobile ? 70 : 100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
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
