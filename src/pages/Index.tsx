import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import { IncidentsCard } from '@/components/IncidentsCard';
import { ClientRequestsCard } from '@/components/ClientRequestsCard';
import { FollowUpsCard } from '@/components/FollowUpsCard';

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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-playfair font-bold text-palace-navy mb-2">
              Operations Dashboard
            </h1>
            <p className="text-soft-pewter">
              Centralized operations management • Real-time overview
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Zone 1: Incidents */}
            <IncidentsCard />
            
            {/* Zone 2: Client Requests */}
            <ClientRequestsCard />
          </div>

          {/* Zone 3: Relances - Full Width */}
          <div className="w-full">
            <FollowUpsCard />
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="luxury-card p-6 text-center">
              <div className="text-3xl font-bold text-champagne-gold mb-2">98%</div>
              <div className="text-sm text-soft-pewter">Satisfaction Client</div>
            </div>
            <div className="luxury-card p-6 text-center">
              <div className="text-3xl font-bold text-success-green mb-2">12min</div>
              <div className="text-sm text-soft-pewter">Temps Réponse Moyen</div>
            </div>
            <div className="luxury-card p-6 text-center">
              <div className="text-3xl font-bold text-palace-navy mb-2">24/7</div>
              <div className="text-sm text-soft-pewter">Service Disponible</div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Voice Command Button */}
      <VoiceCommandButton />
    </div>
  );
};

export default Index;
