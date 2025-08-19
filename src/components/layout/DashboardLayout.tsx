import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex flex-col flex-1">
        <Header onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-6 ${isMobile ? 'pb-20' : ''}`}>
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default DashboardLayout;
