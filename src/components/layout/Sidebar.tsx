
import React from 'react';
import {
  LayoutDashboard,
  ListChecks,
  ShoppingCart,
  Users,
  Boxes,
  Coins,
  TrendingDown,
  Gift
} from 'lucide-react';
import { 
  Sidebar as RadixSidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';

const Sidebar = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/",
      disabled: false
    },
    {
      icon: ShoppingCart,
      label: "Pedidos",
      path: "/pedidos",
      disabled: false
    },
    {
      icon: ListChecks,
      label: "Tarefas",
      path: "/tarefas",
      disabled: false
    },
    {
      icon: Users,
      label: "Clientes",
      path: "/clientes",
      disabled: false
    },
    {
      icon: Boxes,
      label: "Estoque",
      path: "/estoque",
      disabled: false
    },
    {
      icon: Coins,
      label: "Financeiro",
      path: "/financeiro",
      disabled: !isConfigured
    },
    {
      icon: Gift,
      label: "Aniversariantes",
      path: "/aniversariantes",
      disabled: false
    },
    {
      icon: TrendingDown,
      label: "Perdas e Quebras",
      path: "/perdas",
      disabled: false
    }
  ];

  return (
    <RadixSidebar>
      <SidebarContent className="bg-secondary border-r border-muted">
        <div className="p-4">
          <h1 className="font-bold text-xl">
            {currentOrganization?.name || 'Selecione a organização'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie sua empresa
          </p>
        </div>
        
        <SidebarMenu className="px-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={isActive(item.path)}
                className={`w-full justify-start gap-3 ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={item.disabled ? undefined : () => navigate(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarFooter className="p-4">
          <Button variant="outline" onClick={() => navigate('/configuracoes')}>
            Configurações
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </RadixSidebar>
  );
};

export default Sidebar;
