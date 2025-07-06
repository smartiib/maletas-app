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
  Briefcase,
  Warehouse
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

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
    title: 'Relatórios', 
    href: '/relatorios', 
    icon: BarChart3,
    permission: 'reports'
  },
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

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  // Para desenvolvimento sem autenticação - mostrar todos os itens
  const allowedItems = navigationItems;

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-slate-200 dark:border-slate-700"
    >
      <SidebarHeader className="border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-foreground truncate">
              {localStorage.getItem('shop_name') || 'WooAdmin'}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.href
                  : location.pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={isCollapsed ? item.title : undefined}
                      size="lg"
                    >
                      <NavLink to={item.href}>
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}