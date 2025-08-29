
import React from 'react';
import { 
  BarChart3, 
  Package, 
  Package2,
  Users, 
  ShoppingCart, 
  Briefcase, 
  CreditCard, 
  DollarSign, 
  Truck, 
  FileText, 
  RefreshCw,
  Tag
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationPages } from '@/hooks/useOrganizationPages';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ isCollapsed = false, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const { enabledPages } = useOrganizationPages();

  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: BarChart3, 
      path: '/dashboard',
      pageKey: 'dashboard'
    },
    { 
      name: 'Produtos', 
      icon: Package, 
      path: '/products',
      pageKey: 'products'
    },
    { 
      name: 'Estoque', 
      icon: Package2, 
      path: '/stock',
      pageKey: 'stock'
    },
    { 
      name: 'Clientes', 
      icon: Users, 
      path: '/customers',
      pageKey: 'customers'
    },
    { 
      name: 'Pedidos', 
      icon: ShoppingCart, 
      path: '/orders',
      pageKey: 'orders'
    },
    { 
      name: 'Maletas', 
      icon: Briefcase, 
      path: '/maletas',
      pageKey: 'maletas'
    },
    { 
      name: 'Etiquetas', 
      icon: Tag, 
      path: '/labels',
      pageKey: 'labels'
    },
    { 
      name: 'PDV', 
      icon: CreditCard, 
      path: '/pos',
      pageKey: 'pos'
    },
    { 
      name: 'Financeiro', 
      icon: DollarSign, 
      path: '/financeiro',
      pageKey: 'financeiro'
    },
    { 
      name: 'Fornecedores', 
      icon: Truck, 
      path: '/suppliers',
      pageKey: 'suppliers'
    },
    { 
      name: 'Relatórios', 
      icon: FileText, 
      path: '/reports',
      pageKey: 'reports'
    },
    { 
      name: 'Sincronização', 
      icon: RefreshCw, 
      path: '/sync',
      pageKey: 'sync'
    }
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background border-r shadow-sm fixed left-0 top-0 z-50",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-center py-4">
        <Button variant="ghost" onClick={onToggle} className="w-auto p-1.5">
          {isCollapsed ? "→" : "←"}
        </Button>
      </div>
      
      <div className="space-y-4 py-4 flex-grow overflow-y-auto">
        <div className="px-3 py-2">
          <div className="space-y-1 font-medium">
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{currentOrganization?.name?.substring(0, 2) || 'ORG'}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <span className="text-sm font-bold">{currentOrganization?.name || 'Organização'}</span>
              )}
            </div>
            {!isCollapsed && currentOrganization?.name && (
              <p className="text-xs text-muted-foreground px-3">
                {currentOrganization.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-1 px-3">
          {menuItems.map((item) => {
            if (item.pageKey && enabledPages && !enabledPages.includes(item.pageKey)) {
              return null;
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-3 border-t">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Customização</h3>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span className="text-sm font-medium">Modo Escuro</span>
              <Switch />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
