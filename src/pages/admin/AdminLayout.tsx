import { useState } from 'react';
import { Header } from '@/components/Header';
import { AdminSidebar } from '@/components/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * AdminLayout
 * Wrapper for all /admin/* pages.
 * Uses the standard Header (unchanged) + AdminSidebar (gold, direction-only).
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0F0C24' }}>
      {/* Top bar — identical to user layout */}
      <Header onMenuToggle={() => setSidebarOpen(true)} />

      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
