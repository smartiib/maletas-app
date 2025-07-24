
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  Briefcase,
  Warehouse,
  File,
  Building2,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { 
    title: 'Dashboard', 
    href: '/', 
    icon: LayoutDashboard,
    exact: true,
    permission: 'dashboard'
  },
  { 
    title: 'Produtos', 
    href: '/produtos', 
    icon: Package,
    permission: 'products'
  },
  { 
    title: 'Estoque', 
    href: '/estoque', 
    icon: Warehouse,
    permission: 'stock'
  },
  { 
    title: 'Pedidos', 
    href: '/pedidos', 
    icon: ShoppingCart,
    permission: 'orders'
  },
  { 
    title: 'Clientes', 
    href: '/clientes', 
    icon: Users,
    permission: 'customers'
  },
  { 
    title: 'POS', 
    href: '/pos', 
    icon: CreditCard,
    permission: 'pos'
  },
  { 
    title: 'Maletas', 
    href: '/maletas', 
    icon: Briefcase,
    permission: 'maletas'
  },
  { 
    title: 'Fornecedores', 
    href: '/fornecedores', 
    icon: Building2,
    permission: 'suppliers',
    isNew: true
  },
  { 
    title: 'Financeiro', 
    href: '/financeiro', 
    icon: DollarSign,
    permission: 'financial',
    isNew: true
  },
  { 
    title: 'Relatórios', 
    href: '/relatorios', 
    icon: BarChart3,
    permission: 'reports'
  },
  // { 
  //   title: 'Templates PDF', 
  //   href: '/templates-pdf', 
  //   icon: File,
  //   permission: 'templates'
  // },
  { 
    title: 'Logs', 
    href: '/logs', 
    icon: FileText,
    permission: 'logs'
  },
  { 
    title: 'Configurações', 
    href: '/configuracoes', 
    icon: Settings,
    permission: 'settings'
  },
];

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  
  // Para desenvolvimento sem autenticação - mostrar todos os itens
  const allowedItems = navigationItems;

  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all-smooth shadow-lg",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo e Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">
              {localStorage.getItem('shop_name') || 'WooAdmin'}
            </span>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all-smooth"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-all-smooth group relative",
                "hover:bg-slate-100 dark:hover:bg-slate-700",
                 isActive 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-slate-600 dark:text-slate-300"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-all-smooth",
                collapsed ? "mx-auto" : "mr-3"
              )} />
              
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  {item.isNew && (
                    <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full">
                      novo
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip para sidebar colapsada */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.title}
                </div>
              )}

              {/* Indicador ativo */}
              {isActive && (
                <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse-soft" />
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
