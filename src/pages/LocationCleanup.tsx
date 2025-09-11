import React from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useState } from 'react';
import LocationDiagnosticComponent from '@/components/LocationDiagnosticComponent';
import LocationCleanupExecutor from '@/components/LocationCleanupExecutor';

const LocationCleanup = () => {
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
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl decoeur-title text-foreground mb-2">Nettoyage des Locations</h1>
            <p className="decoeur-body text-muted-foreground text-lg">
              Diagnostic et nettoyage des locations hardcodées
            </p>
          </div>

          {/* Diagnostic Component */}
          <div className="space-y-8">
            <LocationDiagnosticComponent />
            
            {/* Separator */}
            <div className="border-t border-gray-200" />
            
            {/* Cleanup Executor */}
            <LocationCleanupExecutor />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationCleanup;