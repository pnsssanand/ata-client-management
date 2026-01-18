import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentClients } from '@/components/dashboard/RecentClients';
import { LeadStatusChart } from '@/components/dashboard/LeadStatusChart';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { ImportClients } from '@/components/import/ImportClients';
import { DropdownSettings } from '@/components/settings/DropdownSettings';
import { useClientStore } from '@/stores/clientStore';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Client Management',
  import: 'Import Clients',
  settings: 'Settings',
};

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get store values individually to avoid infinite loop
  const clients = useClientStore((state) => state.clients);
  const searchQuery = useClientStore((state) => state.searchQuery);
  const filterStatus = useClientStore((state) => state.filterStatus);
  const filterPriority = useClientStore((state) => state.filterPriority);
  const isLoading = useClientStore((state) => state.isLoading);

  // Compute filtered clients with useMemo
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = !searchQuery || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || client.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [clients, searchQuery, filterStatus, filterPriority]);

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
          {currentPage === 'clients' && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {filteredClients.length} clients found
                  </span>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>

              <ClientFilters />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredClients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>

              {filteredClients.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No clients found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </>
          )}

          {/* Import Page */}
          {currentPage === 'import' && <ImportClients />}

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
