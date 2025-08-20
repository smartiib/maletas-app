
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationAuthContext } from '@/contexts/OrganizationAuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const { isOrganizationAuthenticated } = useOrganizationAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[Index] Estado da autenticação:', { 
      isAuthenticated, 
      isOrganizationAuthenticated, 
      loading 
    });
    
    if (!loading) {
      if (isAuthenticated || isOrganizationAuthenticated) {
        // Redirecionar para o dashboard imediatamente
        console.log('[Index] Usuário autenticado, redirecionando para dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('[Index] Usuário não autenticado, redirecionando para auth');
        navigate('/auth', { replace: true });
      }
    }
  }, [isAuthenticated, isOrganizationAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-xl text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;
