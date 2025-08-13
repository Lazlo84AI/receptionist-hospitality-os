import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import { IncidentsCard } from '@/components/IncidentsCard';
import { ClientRequestsCard } from '@/components/ClientRequestsCard';
import { FollowUpsCard } from '@/components/FollowUpsCard';
import TestActions from '@/components/TestActions';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard: Top Priorities</h1>
            <p className="text-muted-foreground text-lg">with the highest impact on customer experience.</p>
          </div>

          {/* Dashboard Grid - Row 1: 50/50 Layout */}
          <div className="flex flex-row space-x-8 mb-8">
            <div className="flex-1">
              <IncidentsCard />
            </div>
            <div className="flex-1">
              <ClientRequestsCard />
            </div>
          </div>

          {/* Zone 3: Relances - Full Width */}
          <div className="w-full">
            <FollowUpsCard />
          </div>

          {/* Test Actions - Development Only */}
          {process.env.NODE_ENV === 'development' && (
            <div className="w-full mt-8">
              <TestActions />
            </div>
          )}

        </div>
      </main>
      
      {/* Floating Voice Command Button */}
      <VoiceCommandButton />
    </div>
  );
};

export default Index;
