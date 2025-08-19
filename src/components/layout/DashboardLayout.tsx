
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();

  // Estado simples para controlar o ícone de tema no Header (não altera o tema global)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const handleToggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar não recebe props */}
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onToggleSidebar={() => {
            // noop por enquanto; o Sidebar controla seu próprio estado internamente
          }}
        />

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
