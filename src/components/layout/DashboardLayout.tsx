
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {!isMobile && <Sidebar />}

      <div className="flex flex-col flex-1 min-w-0 w-full">
        <Header />

        <main className={`flex-1 w-full overflow-x-hidden overflow-y-auto ${isMobile ? 'p-4 pb-20' : 'p-6'}`}>
          <div className="w-full max-w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default DashboardLayout;
