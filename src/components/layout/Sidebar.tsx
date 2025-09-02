
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Briefcase, 
  DollarSign,
  TrendingUp,
  UserCheck,
  Archive,
  FileText,
  Tag,
  Settings,
  Building,
  Receipt,
  Bug,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface MenuItem {
  title: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false, 
  onToggle = () => {} 
}) => {
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  // Determinar super administrador por role (super_admin) com fallback para o e-mail específico
  const isSuperAdmin = profile?.role === 'super_admin' || user?.email === 'douglas@agencia2b.com.br';
  console.log('[Sidebar] email:', user?.email, 'role:', profile?.role, 'isSuperAdmin:', isSuperAdmin);
  
  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/dashboard',
    },
    {
      title: 'Produtos',
      icon: Package,
      path: '/products',
    },
    {
      title: 'Pedidos',
      icon: ShoppingCart,
      path: '/orders',
    },
    {
      title: 'Clientes',
      icon: Users,
      path: '/customers',
    },
    {
      title: 'PDV',
      icon: CreditCard,
      path: '/pos',
    },
    {
      title: 'Maletas',
      icon: Briefcase,
      path: '/maletas',
    },
    {
      title: 'Financeiro',
      icon: DollarSign,
      path: '/financeiro',
    },
    {
      title: 'Fornecedores',
      icon: UserCheck,
      path: '/suppliers',
    },
    {
      title: 'Estoque',
      icon: Archive,
      path: '/stock',
    },
    {
      title: 'Relatórios',
      icon: TrendingUp,
      path: '/reports',
    },
    {
      title: 'Etiquetas',
      icon: Tag,
      path: '/labels',
      badge: 'Em breve'
    },
    {
      title: 'Configurações',
      icon: Settings,
      path: '/settings',
    },
  ];

  // Itens que só aparecem para super administrador
  const adminOnlyItems: MenuItem[] = [
    {
      title: 'Organizações',
      icon: Building,
      path: '/organizations',
    },
    {
      title: 'Cobrança',
      icon: Receipt,
      path: '/billing',
    },
    {
      title: 'Templates PDF',
      icon: FileText,
      path: '/pdf-templates',
    },
    {
      title: 'Logs',
      icon: Bug,
      path: '/logs',
    },
  ];

  // Combinar itens normais com itens de admin (se for super admin)
  const allMenuItems = isSuperAdmin ? [...menuItems, ...adminOnlyItems] : menuItems;

  if (isMobile) {
    return null;
  }

  return (
    <div className={cn(
      'fixed left-0 top-0 z-50 h-full bg-card text-card-foreground border-r border-border transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {allMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                      isCollapsed && 'justify-center px-2'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
