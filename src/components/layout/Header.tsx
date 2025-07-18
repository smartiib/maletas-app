
import React from 'react';
import { Bell, Search, Sun, Moon, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  hideSidebarToggle?: boolean;
}

const Header = ({ isDarkMode, onToggleTheme }: HeaderProps) => {
  const { logout } = useAuth();
  
  // Dados mock para desenvolvimento sem autenticação
  const mockUser = {
    display_name: 'Riê Joias',
    email: 'rie@joias.com',
    roles: ['administrator']
  };

  const handleLogout = () => {
    logout();
  };


  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Busca */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar produtos, pedidos, clientes..."
              className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Toggle Theme */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="relative overflow-hidden"
          >
            <div className={cn(
              "flex items-center transition-transform duration-300",
              isDarkMode ? "transform rotate-180" : ""
            )}>
              {isDarkMode ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </div>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Info - Simplificado */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium">{mockUser.display_name}</div>
              <div className="text-xs text-slate-500 capitalize">
                {mockUser.roles[0] || 'Usuário'}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
