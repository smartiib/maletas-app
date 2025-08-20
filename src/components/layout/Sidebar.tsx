
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationPages } from '@/hooks/useOrganizationPages';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Briefcase,
  DollarSign,
  Truck,
  BarChart3,
  Building2,
  Settings,
  FileText,
  FileImage,
  Package2
} from 'lucide-react';
import { OrganizationSelector } from '@/components/layout/OrganizationSelector';

const Sidebar = () => {
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const { enabledPages } = useOrganizationPages();
  
  const isActive = (path: string) => location.pathname === path;
  
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { path: '/products', label: 'Produtos', icon: Package, key: 'products' },
    { path: '/stock', label: 'Estoque', icon: Package2, key: 'stock' },
    { path: '/orders', label: 'Pedidos', icon: ShoppingCart, key: 'orders' },
    { path: '/customers', label: 'Clientes', icon: Users, key: 'customers' },
    { path: '/pos', label: 'PDV', icon: CreditCard, key: 'pos' },
    { path: '/maletas', label: 'Maletas', icon: Briefcase, key: 'maletas' },
    { path: '/financeiro', label: 'Financeiro', icon: DollarSign, key: 'financeiro' },
    { path: '/suppliers', label: 'Fornecedores', icon: Truck, key: 'suppliers' },
    { path: '/reports', label: 'Relatórios', icon: BarChart3, key: 'reports' },
  ];

  const adminMenuItems = [
    { path: '/organizations', label: 'Organizações', icon: Building2, key: 'organizations' },
    { path: '/billing', label: 'Faturamento', icon: CreditCard, key: 'billing' },
    { path: '/settings', label: 'Configurações', icon: Settings, key: 'settings' },
    { path: '/logs', label: 'Logs', icon: FileText, key: 'logs' },
    { path: '/pdf-templates', label: 'Templates PDF', icon: FileImage, key: 'pdf_templates' },
  ];

  const filteredMenuItems = menuItems.filter(item => enabledPages.includes(item.key));

  return (
    <div className="hidden lg:flex h-full w-64 flex-col fixed left-0 top-0 z-50 bg-background border-r">
      {/* Header with organization name */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <Package className="w-8 h-8 text-primary" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {currentOrganization?.name || 'Sistema'}
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Admin section */}
        <div className="mt-8">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Administração
          </div>
          <div className="space-y-1 mt-2">
            {adminMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <OrganizationSelector />
      </div>
    </div>
  );
};

export default Sidebar;
