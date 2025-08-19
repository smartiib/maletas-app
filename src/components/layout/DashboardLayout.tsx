
import React from 'react';
// Removido Outlet porque o layout renderiza children
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Header />

        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-6 ${isMobile ? 'pb-20' : ''}`}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default DashboardLayout;
