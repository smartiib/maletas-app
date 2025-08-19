
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useAuth] initializing auth hook');

    // Função auxiliar para buscar/criar o perfil
    const fetchProfile = async (userId: string, fallbackEmail?: string) => {
      console.log('[useAuth] fetchProfile start', userId);
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.warn('[useAuth] profile fetch error (will fallback/create shape):', error);
        }

        if (profileData) {
          setProfile({
            id: profileData.user_id,
            name: profileData.name || fallbackEmail || 'Usuário',
            email: profileData.email || fallbackEmail || '',
            role: profileData.role || 'user',
          });
        } else {
          // Fallback profile baseado no usuário da sessão
          setProfile({
            id: userId,
            name: fallbackEmail || 'Usuário',
            email: fallbackEmail || '',
            role: 'user',
          });
        }
      } catch (err) {
        console.error('[useAuth] unexpected error fetching profile:', err);
        setProfile({
          id: userId,
          name: fallbackEmail || 'Usuário',
          email: fallbackEmail || '',
          role: 'user',
        });
      } finally {
        setLoading(false);
        console.log('[useAuth] fetchProfile end -> loading=false');
      }
    };

    // Listener de auth - callback síncrono; não chamar supabase aqui
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[useAuth] onAuthStateChange', event, !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const uid = newSession.user.id;
        const email = newSession.user.email ?? undefined;
        // Deferir a chamada Supabase para evitar deadlock
        setTimeout(() => fetchProfile(uid, email), 0);
      } else {
        setProfile(null);
        setLoading(false);
        console.log('[useAuth] no session -> loading=false');
      }
    });

    // Checar sessão existente depois de registrar o listener
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[useAuth] getSession -> hasSession?', !!currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id, currentSession.user.email ?? undefined);
      } else {
        setLoading(false);
        console.log('[useAuth] getSession no session -> loading=false');
      }
    });

    return () => {
      console.log('[useAuth] cleanup subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta!",
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso",
          description: "Verifique seu email para confirmar a conta.",
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Até logo!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  // Backward compatibility
  const login = async () => {
    return signIn('douglas@agencia2b.com.br', '#Dgskua1712');
  };

  const logout = async () => {
    return signOut();
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
    isLoading: loading,
    // Backward compatibility
    login,
    logout,
  };
};
