import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PrintingQuickAccess } from '@/components/printing/PrintingQuickAccess';

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle
          </p>
        </div>
        
        {/* Adicionar componente de impressão */}
        <PrintingQuickAccess />
        
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
