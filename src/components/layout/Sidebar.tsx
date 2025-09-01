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
import { Sidebar as RadixSidebar, SidebarTrigger, SidebarContent, SidebarItem, SidebarFooter } from '@/components/ui/sidebar';
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

  return (
    <RadixSidebar className="md:block hidden">
      <SidebarTrigger className="hidden" />
      <SidebarContent className="bg-secondary border-r border-muted min-h-screen">
        <div className="p-4">
          <h1 className="font-bold text-xl">
            {currentOrganization?.name || 'Selecione a organização'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {currentOrganization?.description || 'Gerencie sua empresa'}
          </p>
        </div>
        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          path="/"
          active={isActive("/")}
          onClick={() => navigate('/')}
        />
        <SidebarItem
          icon={ShoppingCart}
          label="Pedidos"
          path="/pedidos"
          active={isActive("/pedidos")}
          onClick={() => navigate('/pedidos')}
        />
        <SidebarItem
          icon={ListChecks}
          label="Tarefas"
          path="/tarefas"
          active={isActive("/tarefas")}
          onClick={() => navigate('/tarefas')}
        />
        <SidebarItem
          icon={Users}
          label="Clientes"
          path="/clientes"
          active={isActive("/clientes")}
          onClick={() => navigate('/clientes')}
        />
        <SidebarItem
          icon={Boxes}
          label="Estoque"
          path="/estoque"
          active={isActive("/estoque")}
          onClick={() => navigate('/estoque')}
        />
        <SidebarItem
          icon={Coins}
          label="Financeiro"
          path="/financeiro"
          active={isActive("/financeiro")}
          onClick={() => navigate('/financeiro')}
          disabled={!isConfigured}
        />
            <SidebarItem
              icon={Gift}
              label="Aniversariantes"
              path="/aniversariantes"
              active={isActive("/aniversariantes")}
              onClick={() => navigate('/aniversariantes')}
            />
            <SidebarItem
              icon={TrendingDown}  
              label="Perdas e Quebras"
              path="/perdas"
              active={isActive("/perdas")}
              onClick={() => navigate('/perdas')}
            />
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
