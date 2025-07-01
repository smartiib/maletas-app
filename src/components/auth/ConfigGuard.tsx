
import React from 'react';
import { useMasterAuth } from '@/hooks/useMasterAuth';
import MasterLogin from './MasterLogin';
import { Loader2 } from 'lucide-react';

interface ConfigGuardProps {
  children: React.ReactNode;
}

const ConfigGuard = ({ children }: ConfigGuardProps) => {
  const { isMasterAuthenticated, isLoading, loginMaster } = useMasterAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isMasterAuthenticated) {
    return <MasterLogin onMasterLogin={loginMaster} />;
  }

  return <>{children}</>;
};

export default ConfigGuard;
