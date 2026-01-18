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
      <CardHeader className="pb-3 lg:pb-4 px-4 lg:px-6">
        <CardTitle className="text-base lg:text-lg font-semibold flex items-center justify-between">
          Recent Clients
          <Badge variant="secondary" className="font-normal text-xs">
            {clients.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 lg:space-y-3 px-4 lg:px-6">
        {recentClients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No clients yet</p>
        ) : (
          recentClients.map((client) => (
            <div 
              key={client.id}
              className={cn(
                "flex items-center gap-3 lg:gap-4 p-2 lg:p-3 rounded-lg bg-muted/30 border-l-4 hover:bg-muted/50 transition-colors",
                priorityColors[client.priority]
              )}
            >
              <Avatar className="h-8 w-8 lg:h-10 lg:w-10 border border-border shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs lg:text-sm font-medium">
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate text-sm lg:text-base">{client.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">{formatDistanceToNow(client.createdAt, { addSuffix: true })}</span>
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 lg:h-8 lg:w-8 hover:bg-primary/10 hover:text-primary"
                  onClick={() => window.location.href = `tel:${client.phone.replace(/\s/g, '')}`}
                >
                  <Phone className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 lg:h-8 lg:w-8 hover:bg-emerald-500/10 hover:text-emerald-600"
                  onClick={() => {
                    const phone = client.phone.replace(/\s/g, '').replace('+', '');
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
