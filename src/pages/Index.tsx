import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentClients } from '@/components/dashboard/RecentClients';
import { LeadStatusChart } from '@/components/dashboard/LeadStatusChart';
import { ClientManagement } from '@/components/clients/ClientManagement';
import { ImportClients } from '@/components/import/ImportClients';
import { DropdownSettings } from '@/components/settings/DropdownSettings';
import { InternTracker } from '@/components/intern/InternTracker';
import { useClientStore } from '@/stores/clientStore';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Client Management',
  intern: 'Intern Login',
  import: 'Import Clients',
  settings: 'Settings',
};

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get loading state only
  const isLoading = useClientStore((state) => state.isLoading);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 flex-1 flex flex-col",
        // No margin on mobile, margin on desktop
        "ml-0 lg:ml-64",
        sidebarCollapsed && "lg:ml-20"
      )}>
        <Header 
          title={pageTitles[currentPage]} 
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 flex-1">
          {/* Dashboard Page */}
          {currentPage === 'dashboard' && (
            <>
              <DashboardStats />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-2">
                  <RecentClients />
                </div>
                <div>
                  <LeadStatusChart />
                </div>
              </div>
            </>
          )}

          {/* Clients Page */}
          {currentPage === 'clients' && <ClientManagement />}

          {/* Import Page */}
          {currentPage === 'import' && <ImportClients />}

          {/* Intern Tracker Page */}
          {currentPage === 'intern' && <InternTracker />}

          {/* Settings Page */}
          {currentPage === 'settings' && <DropdownSettings />}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default Index;
