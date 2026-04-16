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
import { WAMessenger } from '@/components/wa-messenger/WAMessenger';
import { WhatsAppBusiness } from '@/components/wa-messenger/WhatsAppBusiness';
import { useClientStore } from '@/stores/clientStore';
import { useState, useEffect } from 'react';
import { Loader2, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Client Management',
  intern: 'Intern Login',
  import: 'Import Clients',
  settings: 'Settings',
  'wa-messenger': 'WA Messenger',
  'whatsapp': 'WhatsApp Business',
};

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get loading state only
  const isLoading = useClientStore((state) => state.isLoading);

  // Minimum loading duration state (2.5 seconds)
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  // Start 2.5 second timer when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading until both conditions are met: data loaded AND 5 seconds passed
  const showLoading = isLoading || !minLoadingComplete;

  // Show loading state
  if (showLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Loading content */}
        <div className="relative flex flex-col items-center gap-8 px-4 w-full max-w-md">
          {/* Logo with 3D animation */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />

            {/* Logo container with 3D effect */}
            <div
              className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl"
              style={{
                transform: 'perspective(1000px) rotateX(0deg)',
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              <img
                src={logo}
                alt="ATA Client Management"
                className="h-24 w-24 sm:h-32 sm:w-32 object-contain"
                style={{
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
                }}
              />
            </div>
          </div>

          {/* Loading spinner and text */}
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-1">Loading ATA Client Management</p>
              <p className="text-sm text-muted-foreground">Please wait while we set up everything...</p>
            </div>
          </div>

          {/* Footer Credits - Highlighted */}
          <div className="absolute bottom-8 left-0 right-0 px-4">
            <div className="bg-card/80 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-4 shadow-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
                  <Code2 className="h-4 w-4 text-primary animate-pulse" />
                  <span className="font-medium text-muted-foreground">Software designed and developed by</span>
                </div>
                <div className="bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 px-4 py-2 rounded-lg border border-primary/50 shadow-lg">
                  <span className="font-bold text-lg text-foreground">Mr. Anand Pinisetty</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom keyframes for float animation */}
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: perspective(1000px) rotateX(0deg) translateY(0px);
            }
            50% {
              transform: perspective(1000px) rotateX(5deg) translateY(-10px);
            }
          }
        `}</style>
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
          {currentPage === 'intern' && (
            <InternTracker onSessionStarted={() => setCurrentPage('clients')} />
          )}

          {/* Settings Page */}
          {currentPage === 'settings' && <DropdownSettings />}

          {/* WA Messenger Page */}
          {currentPage === 'wa-messenger' && <WAMessenger />}

          {/* WhatsApp Business Page */}
          {currentPage === 'whatsapp' && <WhatsAppBusiness />}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default Index;
