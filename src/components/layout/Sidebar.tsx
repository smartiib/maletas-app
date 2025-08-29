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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const { enabledPages } = useOrganizationPages();

  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const collapsed = isCollapsed ?? internalCollapsed;
  const handleToggle = onToggle ?? (() => setInternalCollapsed((prev) => !prev));

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
        "flex flex-col h-full bg-background border-r shadow-sm",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-center py-4">
        <Button variant="ghost" onClick={handleToggle} className="w-auto p-1.5">
          {collapsed ? "Expandir" : "Minimizar"}
        </Button>
      </div>
      <div className="space-y-4 py-4 flex-grow">
        <div className="px-3 py-2">
          <div className="space-y-1 font-medium">
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{currentOrganization?.name?.substring(0, 2) || 'ORG'}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <span className="text-sm font-bold">{currentOrganization?.name || 'Organização'}</span>
              )}
            </div>
            {!collapsed && currentOrganization?.name && (
              <p className="text-xs text-muted-foreground px-3">
                {currentOrganization.name}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {menuItems.map((item) => {
            if (item.pageKey && !enabledPages[item.pageKey as any]) {
              return null;
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="p-3">
        {!collapsed && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Customização</h3>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span className="text-sm font-medium">Modo Escuro</span>
              <Switch />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
