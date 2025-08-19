
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useMasterAuth = () => {
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkMasterAuth = () => {
      // Verifica se o usuário logado é o super admin (douglas@agencia2b.com.br)
      const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';
      setIsMasterAuthenticated(isSuperAdmin);
      setIsLoading(false);
    };

    if (!loading) {
      checkMasterAuth();
    }
  }, [user, loading]);

  const loginMaster = () => {
    // Login master agora só funciona se o usuário já estiver logado como super admin
    const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';
    setIsMasterAuthenticated(isSuperAdmin);
  };

  const logoutMaster = () => {
    setIsMasterAuthenticated(false);
  };

  return {
    isMasterAuthenticated,
    isLoading,
    loginMaster,
    logoutMaster,
  };
};
