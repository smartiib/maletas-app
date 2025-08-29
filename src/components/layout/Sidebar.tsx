import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Briefcase,
  UserCheck,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string | number | null;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const menuItems: MenuItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/',
      badge: null
    },
    {
      icon: Package,
      label: 'Produtos',
      href: '/products',
      badge: null
    },
    {
      icon: Users,
      label: 'Clientes',
      href: '/customers',
      badge: null
    },
    {
      icon: ShoppingCart,
      label: 'Vendas',
      href: '/sales',
      badge: null
    },
    {
      icon: Briefcase,
      label: 'Maletas',
      href: '/maletas',
      badge: null
    },
    {
      icon: UserCheck,
      label: 'Representantes',
      href: '/representatives',
      badge: null
    },
    {
      icon: Printer,
      label: 'Etiquetas',
      href: '/labels',
      badge: null
    },
    {
      icon: BarChart3,
      label: 'Relatórios',
      href: '/reports',
      badge: null
    },
    {
      icon: Settings,
      label: 'Configurações',
      href: '/settings',
      badge: null
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">Menu</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground font-medium",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Separator className="mb-4" />
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            Sistema de Gestão v1.0
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
