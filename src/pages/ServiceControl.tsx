import React from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

const ServiceControl = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => {}} />
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Service Control - En maintenance</h1>
          <p className="text-muted-foreground mt-4">
            Cette page est temporairement indisponible. 
            Utilisez ServiceControl2 en attendant : /service-control2
          </p>
        </div>
      </main>
    </div>
  );
};

export default ServiceControl;