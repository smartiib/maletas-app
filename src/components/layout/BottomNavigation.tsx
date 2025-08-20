import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Package2, ShoppingCart, Users } from 'lucide-react';
import { useOrganizationPages } from '@/hooks/useOrganizationPages';

const BottomNavigation = () => {
  const location = useLocation();
  const { enabledPages } = useOrganizationPages();
  
  const isActive = (path: string) => location.pathname === path;
  
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { path: '/products', label: 'Produtos', icon: Package, key: 'products' },
    { path: '/stock', label: 'Estoque', icon: Package2, key: 'stock' },
    { path: '/orders', label: 'Pedidos', icon: ShoppingCart, key: 'orders' },
    { path: '/customers', label: 'Clientes', icon: Users, key: 'customers' },
  ];

  const filteredMenuItems = menuItems.filter(item => enabledPages.includes(item.key));

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid grid-cols-5 h-16">
        {filteredMenuItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 text-xs transition-colors",
              isActive(item.path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full px-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
