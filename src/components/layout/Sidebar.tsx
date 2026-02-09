import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { 
  Users, 
  LayoutDashboard, 
  Upload, 
  Settings, 
  LogOut,
  ChevronLeft,
  X,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useClientStore } from '@/stores/clientStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'intern', label: 'Renuka Login', icon: UserCheck },
  { id: 'import', label: 'Import Clients', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate, collapsed, onCollapsedChange, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const { logout } = useAuthStore();
  const { cleanup } = useClientStore();
  const navigate = useNavigate();

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onMobileOpenChange(false); // Close mobile sidebar on navigation
  };

  const handleLogout = () => {
    cleanup(); // Cleanup Firebase subscriptions
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      )}
      
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
          // Desktop styles
          "hidden lg:flex",
          collapsed ? "lg:w-20" : "lg:w-64"
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
              onClick={() => handleNavigate(item.id)}
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
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={logo} alt="ATA Logo" className="h-10 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">ATA Client</span>
              <span className="text-xs text-muted-foreground">Management</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onMobileOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className="w-full justify-start gap-3 transition-all"
              onClick={() => handleNavigate(item.id)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
