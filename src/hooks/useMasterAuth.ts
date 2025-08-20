
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useMasterAuth = () => {
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('[useMasterAuth] useEffect triggered:', { user: user?.email, loading });
    
    const checkMasterAuth = () => {
      // Verifica se o usuário logado é o super admin (douglas@agencia2b.com.br)
      const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';
      console.log('[useMasterAuth] Verificando super admin:', { 
        userEmail: user?.email, 
        isSuperAdmin 
      });
      
      // Se é super admin, verificar se já tem o modo master ativo no localStorage
      if (isSuperAdmin) {
        const masterActive = localStorage.getItem('master_authenticated') === 'true';
        console.log('[useMasterAuth] Master ativo no localStorage:', masterActive);
        setIsMasterAuthenticated(masterActive);
      } else {
        setIsMasterAuthenticated(false);
        // Limpar localStorage se não é super admin
        localStorage.removeItem('master_authenticated');
      }
      
      setIsLoading(false);
    };

    if (!loading) {
      checkMasterAuth();
    }
  }, [user, loading]);

  const loginMaster = () => {
    // Login master agora só funciona se o usuário já estiver logado como super admin
    const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';
    console.log('[useMasterAuth] Tentando ativar modo master:', { 
      userEmail: user?.email, 
      isSuperAdmin 
    });
    
    if (isSuperAdmin) {
      setIsMasterAuthenticated(true);
      localStorage.setItem('master_authenticated', 'true');
      console.log('[useMasterAuth] Modo master ativado com sucesso');
    } else {
      console.log('[useMasterAuth] Usuário não é super admin, não pode ativar modo master');
    }
  };

  const logoutMaster = () => {
    console.log('[useMasterAuth] Desativando modo master');
    setIsMasterAuthenticated(false);
    localStorage.removeItem('master_authenticated');
  };

  return {
    isMasterAuthenticated,
    isLoading,
    loginMaster,
    logoutMaster,
  };
};
