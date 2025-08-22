import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationAuthContext } from '@/contexts/OrganizationAuthContext';
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
  FileImage
} from 'lucide-react';
import { OrganizationSelector } from '@/components/layout/OrganizationSelector';

const Sidebar = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { currentOrganization } = useOrganization();
  const { organizationUser, isOrganizationAuthenticated } = useOrganizationAuthContext();
  const { enabledPages } = useOrganizationPages();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Determinar se é super admin
  const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';
  
  // Menu items para usuários organizacionais (loja)
  const storeMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { path: '/products', label: 'Produtos', icon: Package, key: 'products' },
    { path: '/orders', label: 'Pedidos', icon: ShoppingCart, key: 'orders' },
    { path: '/customers', label: 'Clientes', icon: Users, key: 'customers' },
    { path: '/pos', label: 'PDV', icon: CreditCard, key: 'pos' },
    { path: '/maletas', label: 'Maletas', icon: Briefcase, key: 'maletas' },
    { path: '/financeiro', label: 'Financeiro', icon: DollarSign, key: 'financeiro' },
    { path: '/suppliers', label: 'Fornecedores', icon: Truck, key: 'suppliers' },
    { path: '/reports', label: 'Relatórios', icon: BarChart3, key: 'reports' },
    { path: '/settings', label: 'Configurações', icon: Settings, key: 'settings' },
  ];

  // Menu items para super admin (completo)
  const superAdminMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { path: '/products', label: 'Produtos', icon: Package, key: 'products' },
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

  // Determinar quais itens mostrar baseado no tipo de usuário
  let menuItems = [];
  let showAdminSection = false;
  let organizationName = 'Sistema';
  let userName = 'Usuário';
  let userRole = 'Usuário';

  if (isOrganizationAuthenticated && organizationUser) {
    // Usuário organizacional - usar nome real da organização
    menuItems = storeMenuItems;
    showAdminSection = false;
    organizationName = organizationUser.organization_name || 'Organização';
    userName = organizationUser.name || 'Usuário';
    userRole = 'Administrador';
  } else if (isSuperAdmin) {
    // Super admin - menu completo
    const filteredMenuItems = enabledPages.length > 0 
      ? superAdminMenuItems.filter(item => enabledPages.includes(item.key))
      : superAdminMenuItems;
    menuItems = filteredMenuItems;
    showAdminSection = true;
    organizationName = currentOrganization?.name || 'Sistema';
    userName = profile?.name || user?.email?.split('@')[0] || 'douglas';
    userRole = 'Super Admin';
  }

  return (
    <div className="hidden lg:flex h-full w-64 flex-col fixed left-0 top-0 z-50 bg-background border-r">
      {/* Header com logo e nome da organização */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">
              {organizationName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {organizationName}
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive(item.path)
                  ? "bg-blue-600 text-white font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Admin section - apenas para super admin */}
        {showAdminSection && (
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
                      ? "bg-blue-600 text-white font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer com informações do usuário */}
      <div className="p-4 border-t">
        {/* Organization Selector apenas para super admin */}
        {showAdminSection && (
          <div className="mb-4">
            <OrganizationSelector />
          </div>
        )}
        
        {/* Informações do usuário */}
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {userName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
