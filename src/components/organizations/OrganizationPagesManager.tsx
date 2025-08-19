
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useOrganizationPages } from '@/hooks/useOrganizationPages';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Store, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const AVAILABLE_PAGES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visão geral e métricas', icon: LayoutDashboard },
  { key: 'products', label: 'Produtos', description: 'Gestão de produtos e estoque', icon: Package },
  { key: 'customers', label: 'Clientes', description: 'Gestão de clientes', icon: Users },
  { key: 'orders', label: 'Pedidos', description: 'Gestão de pedidos e vendas', icon: ShoppingCart },
  { key: 'pos', label: 'PDV', description: 'Ponto de venda', icon: Store },
  { key: 'reports', label: 'Relatórios', description: 'Relatórios e análises', icon: BarChart3 },
  { key: 'settings', label: 'Configurações', description: 'Configurações do sistema', icon: Settings },
];

interface OrganizationPagesManagerProps {
  organizationId: string;
}

export function OrganizationPagesManager({ organizationId }: OrganizationPagesManagerProps) {
  const { pages, loading, updatePageStatus } = useOrganizationPages(organizationId);
  const [updatingPage, setUpdatingPage] = useState<string | null>(null);

  const handlePageToggle = async (pageKey: string, enabled: boolean) => {
    setUpdatingPage(pageKey);
    await updatePageStatus(pageKey, enabled);
    setUpdatingPage(null);
  };

  const getPageStatus = (pageKey: string) => {
    const page = pages.find(p => p.page_key === pageKey);
    return page?.is_enabled ?? true; // padrão é habilitado
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Páginas Disponíveis</CardTitle>
          <CardDescription>Configurando páginas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Páginas Disponíveis</CardTitle>
        <CardDescription>
          Configure quais páginas esta organização pode acessar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {AVAILABLE_PAGES.map((pageConfig) => {
          const Icon = pageConfig.icon;
          const isEnabled = getPageStatus(pageConfig.key);
          const isUpdating = updatingPage === pageConfig.key;

          return (
            <div key={pageConfig.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor={`page-${pageConfig.key}`} className="font-medium">
                    {pageConfig.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {pageConfig.description}
                  </p>
                </div>
              </div>
              <Switch
                id={`page-${pageConfig.key}`}
                checked={isEnabled}
                onCheckedChange={(checked) => handlePageToggle(pageConfig.key, checked)}
                disabled={isUpdating}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
