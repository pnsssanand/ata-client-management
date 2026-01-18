import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { 
  Users, 
  LayoutDashboard, 
  Upload, 
  Settings, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'import', label: 'Import Clients', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate, collapsed, onCollapsedChange }: SidebarProps) {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
          <img src={logo} alt="ATA Logo" className="h-10 w-auto object-contain" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">ATA Client</span>
              <span className="text-xs text-muted-foreground">Management</span>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn("shrink-0", collapsed && "absolute -right-3 top-6 bg-card border border-border rounded-full h-6 w-6")}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 transition-all",
              collapsed && "justify-center px-2"
            )}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
