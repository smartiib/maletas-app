
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FinancialDashboard from '@/components/financial/FinancialDashboard';
import TransactionsList from '@/components/financial/TransactionsList';
import InstallmentManager from '@/components/financial/InstallmentManager';
import QuickActions from '@/components/financial/QuickActions';
import TransactionForm from '@/components/financial/TransactionForm';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { EmptyWooCommerceState } from '@/components/woocommerce/EmptyWooCommerceState';
import { BarChart3, History, Calendar, Zap } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie suas transações, parcelas e acompanhe o fluxo de caixa
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Ações
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="installments" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Parcelas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <QuickActions
            onNewEntry={() => handleNewTransaction('entrada')}
            onNewExit={() => handleNewTransaction('saida')}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionsList />
        </TabsContent>

        <TabsContent value="installments" className="space-y-6">
          <InstallmentManager />
        </TabsContent>
      </Tabs>

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
