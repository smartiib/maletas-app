
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
// Removido: useAuth, useNavigate e useEffect - a proteção de rota é feita pelo ProtectedRoute
import { PrintingQuickAccess } from '@/components/printing/PrintingQuickAccess';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle
          </p>
        </div>

        {/* Acesso rápido à impressão */}
        <PrintingQuickAccess />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

