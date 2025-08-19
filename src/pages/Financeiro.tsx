
import React from 'react';
import FinancialDashboard from '@/components/financial/FinancialDashboard';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { EmptyWooCommerceState } from '@/components/woocommerce/EmptyWooCommerceState';

const Financeiro = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            Selecione uma organização
          </h2>
          <p className="text-muted-foreground">
            Para acessar o sistema financeiro, selecione uma organização primeiro.
          </p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <EmptyWooCommerceState
        title="WooCommerce Não Configurado"
        description="Configure a integração com o WooCommerce para acessar o financeiro."
      />
    );
  }

  return <FinancialDashboard />;
};

export default Financeiro;

