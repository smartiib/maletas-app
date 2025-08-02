import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AdminInfo = () => {
  const { user } = useAuth();

  if (!user || user.email !== 'douglas@agencia2b.com.br') {
    return null;
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-950/20">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 dark:text-green-400">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>
            Você está logado como <strong>Super Administrador</strong> com acesso completo ao sistema.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AdminInfo;