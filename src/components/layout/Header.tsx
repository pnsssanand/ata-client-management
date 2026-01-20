import { Bell, Search, Moon, Sun, Menu, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClientStore } from '@/stores/clientStore';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { searchQuery, setSearchQuery, isSynced, isLoading, lastSyncTime } = useClientStore();
  const { user } = useAuthStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-48 lg:w-64 bg-card"
            />
          </div>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="text-muted-foreground h-9 w-9"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Sync Status Indicator */}
          <div className="flex items-center gap-1" title={lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString()}` : 'Not synced'}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : isSynced ? (
              <Cloud className="h-4 w-4 text-green-500" />
            ) : (
              <CloudOff className="h-4 w-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isLoading ? 'Syncing...' : isSynced ? 'Synced' : 'Offline'}
            </span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User */}
          <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-border">
            <Avatar className="h-8 w-8 lg:h-9 lg:w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'admin'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
