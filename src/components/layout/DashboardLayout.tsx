
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isMobile && <Sidebar />}

      <div className={`flex flex-col min-h-screen ${!isMobile ? 'lg:ml-64' : ''}`}>
        <Header />

        <main className={`flex-1 w-full ${isMobile ? 'pb-20' : ''}`}>
          <div className="w-full min-w-0 animate-fade-in p-6">
            {children}
          </div>
        </main>
      </div>

      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default DashboardLayout;
