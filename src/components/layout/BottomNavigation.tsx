
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Store, Package, ShoppingCart, Users } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    {
      title: 'POS',
      href: '/pos',
      icon: Store,
    },
    {
      title: 'Produtos',
      href: '/products', // corrigido
      icon: Package,
    },
    {
      title: 'Pedidos',
      href: '/orders', // corrigido
      icon: ShoppingCart,
    },
    {
      title: 'Clientes',
      href: '/customers', // corrigido
      icon: Users,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
