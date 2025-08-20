
import React, { useState } from 'react';
import FinancialDashboard from '@/components/financial/FinancialDashboard';
import TransactionsList from '@/components/financial/TransactionsList';
import InstallmentManager from '@/components/financial/InstallmentManager';
import QuickActions from '@/components/financial/QuickActions';
import TransactionForm from '@/components/financial/TransactionForm';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { EmptyWooCommerceState } from '@/components/woocommerce/EmptyWooCommerceState';

const Financeiro = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [initialType, setInitialType] = useState<'entrada' | 'saida' | null>(null);

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

  const handleNewTransaction = (type: 'entrada' | 'saida') => {
    setInitialType(type);
    setTransactionFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie suas transações, parcelas e acompanhe o fluxo de caixa
          </p>
        </div>
      </div>

      {/* Ações Rápidas no Topo */}
      <QuickActions
        onNewEntry={() => handleNewTransaction('entrada')}
        onNewExit={() => handleNewTransaction('saida')}
      />

      {/* Cards com Parâmetros Principais */}
      <FinancialDashboard />

      {/* Duas Colunas: Transações e Parcelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Transações */}
        <div className="space-y-4">
          <TransactionsList />
        </div>

        {/* Coluna 2: Parcelas */}
        <div className="space-y-4">
          <InstallmentManager />
        </div>
      </div>

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        transaction={undefined}
        initialType={initialType}
      />
    </div>
  );
};

export default Financeiro;
