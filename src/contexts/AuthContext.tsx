
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // Backward compatibility helpers
  login: () => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Isolated helper to fetch or shape profile
  const fetchProfile = async (userId: string, fallbackEmail?: string) => {
    console.log('[AuthProvider] fetchProfile start', userId);
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('[AuthProvider] profile fetch error (fallback if needed):', error);
      }

      if (profileData) {
        setProfile({
          id: profileData.user_id,
          name: profileData.name || fallbackEmail || 'Usuário',
          email: profileData.email || fallbackEmail || '',
          role: profileData.role || 'user',
        });
      } else {
        setProfile({
          id: userId,
          name: fallbackEmail || 'Usuário',
          email: fallbackEmail || '',
          role: 'user',
        });
      }
    } catch (err) {
      console.error('[AuthProvider] unexpected error fetching profile:', err);
      setProfile({
        id: userId,
        name: fallbackEmail || 'Usuário',
        email: fallbackEmail || '',
        role: 'user',
      });
    } finally {
      setLoading(false);
      console.log('[AuthProvider] fetchProfile end -> loading=false');
    }
  };

  useEffect(() => {
    console.log('[AuthProvider] init');

    // 1) Register listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[AuthProvider] onAuthStateChange', event, !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const uid = newSession.user.id;
        const email = newSession.user.email ?? undefined;
        // Defer any async Supabase calls to avoid deadlocks
        setTimeout(() => fetchProfile(uid, email), 0);
      } else {
        setProfile(null);
        setLoading(false);
        console.log('[AuthProvider] no session -> loading=false');
      }
    });

    // 2) Then check current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[AuthProvider] getSession -> hasSession?', !!currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id, currentSession.user.email ?? undefined);
      } else {
        setLoading(false);
        console.log('[AuthProvider] getSession no session -> loading=false');
      }
    });

    return () => {
      console.log('[AuthProvider] cleanup subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: 'Credenciais inválidas ou erro de conexão',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo de volta!',
        });
      }

      return { error };
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: 'Erro de conexão. Tente novamente.',
        variant: 'destructive',
      });
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
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: 'Erro ao criar conta',
          description: 'Erro ao criar conta. Verifique os dados e tente novamente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Conta criada com sucesso',
          description: 'Verifique seu email para confirmar a conta.',
        });
      }

      return { error };
    } catch (error) {
      toast({
        title: 'Erro ao criar conta',
        description: 'Erro de conexão. Tente novamente.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: 'Erro ao sair',
          description: 'Erro ao realizar logout',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Logout realizado',
          description: 'Até logo!',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao sair',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  // Backward compatibility helpers - now use environment variables
  const login = async () => {
    const email = import.meta.env.VITE_DEFAULT_EMAIL;
    const password = import.meta.env.VITE_DEFAULT_PASSWORD;
    
    if (!email || !password) {
      toast({
        title: 'Erro de Configuração',
        description: 'Credenciais padrão não configuradas',
        variant: 'destructive',
      });
      return { error: new Error('Default credentials not configured') };
    }
    
    return signIn(email, password);
  };
  
  const logout = async () => signOut();

  const value: AuthContextValue = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    isLoading: loading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    login,
    logout,
  }), [user, session, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Optional helper if needed elsewhere
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

export { AuthContext };
