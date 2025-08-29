
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/hooks/useSidebar';

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {!isMobile && (
          <Sidebar 
            isCollapsed={isCollapsed} 
            onToggle={toggleSidebar}
          />
        )}

        <div className={`flex flex-col flex-1 min-h-screen ${!isMobile && !isCollapsed ? 'ml-0' : ''}`}>
          <Header />

          <main className={`flex-1 w-full ${isMobile ? 'pb-20' : ''}`}>
            <div className="w-full min-w-0 animate-fade-in p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default DashboardLayout;
