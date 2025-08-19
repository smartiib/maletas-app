
import React from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/services/logger';
import { useAuth } from '@/hooks/useAuth';

const GlobalDiagnostics: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, loading, session } = useAuth();

  // Inicializa captura de console e erros globais (uma única vez)
  React.useEffect(() => {
    logger.captureConsole();
    logger.captureGlobalErrors();

    // Performance inicial
    try {
      const nav = performance.getEntriesByType?.('navigation') as PerformanceEntry[] | undefined;
      if (nav && nav[0]) {
        logger.info('Performance', 'Navigation timing disponível', {
          ...Object.fromEntries(
            Object.entries(nav[0]).filter(([k, v]) => typeof v !== 'function')
          ),
        });
      } else {
        logger.info('Performance', 'Navigation timing não disponível');
      }
    } catch {
      // silencioso
    }

    logger.info('Diagnostics', 'Global diagnostics initialized');
  }, []);

  // Contexto do usuário nos logs
  React.useEffect(() => {
    const identifier = user?.email || user?.id || null;
    logger.setUser(identifier);
    logger.info('AuthState', isAuthenticated ? 'Autenticado' : 'Não autenticado', {
      loading,
      userId: user?.id,
      email: user?.email,
      sessionId: session?.access_token ? session?.access_token.slice(0, 12) + '...' : undefined,
    });
  }, [user?.id, user?.email, isAuthenticated, loading, session?.access_token]);

  // Log de navegação
  React.useEffect(() => {
    logger.navigation(location.pathname, location.search, {
      statePresent: !!location.state,
    });
  }, [location.key, location.pathname, location.search, location.state]);

  return null;
};

export default GlobalDiagnostics;
