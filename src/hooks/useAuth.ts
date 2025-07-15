import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Verificar se já existe uma sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
      } else {
        // Se não existe sessão, tentar fazer login automático com credenciais demo
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'barbara@riejoias.com',
          password: 'bar#Rie@2025'
        });
        
        if (data.session) {
          setIsAuthenticated(true);
        } else {
          // Se falhar, criar conta demo
          await supabase.auth.signUp({
            email: 'barbara@riejoias.com',
            password: 'bar#Rie@2025'
          });
          setIsAuthenticated(true);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'barbara@riejoias.com',
      password: 'bar#Rie@2025'
    });
    
    if (data.session) {
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};