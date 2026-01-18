import { Phone, MessageCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = {
  'High': 'border-l-destructive',
  'Medium': 'border-l-chart-2',
  'Low': 'border-l-muted',
};

export function RecentClients() {
  const { clients } = useClientStore();

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Recent Clients
          <Badge variant="secondary" className="font-normal">
            {clients.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentClients.map((client) => (
          <div 
            key={client.id}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg bg-muted/30 border-l-4 hover:bg-muted/50 transition-colors",
              priorityColors[client.priority]
            )}
          >
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{client.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Added {formatDistanceToNow(client.createdAt, { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                onClick={() => window.location.href = `tel:${client.phone.replace(/\s/g, '')}`}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600"
                onClick={() => {
                  const phone = client.phone.replace(/\s/g, '').replace('+', '');
                  window.open(`https://wa.me/${phone}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
