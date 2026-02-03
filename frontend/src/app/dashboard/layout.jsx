'use client';

import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { useAuthStore } from '@/store/useAuthStore';
import { clsx } from 'clsx';

function DashboardLayoutContent({ children }) {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar } = useDashboard();
  const { loadUserProfile } = useAuthStore();

  // Refresh user data from server when entering dashboard
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content */}
      <main
        className={clsx(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
