
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile if user exists
        if (session?.user) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileData) {
              setProfile({
                id: profileData.id,
                name: profileData.name || session.user.email || 'Usuário',
                email: profileData.email || session.user.email || '',
                role: profileData.role || 'user'
              });
            } else {
              // Create basic profile from user data
              setProfile({
                id: session.user.id,
                name: session.user.email || 'Usuário',
                email: session.user.email || '',
                role: 'user'
              });
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            // Fallback profile
            setProfile({
              id: session.user.id,
              name: session.user.email || 'Usuário',
              email: session.user.email || '',
              role: 'user'
            });
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setProfile({
              id: profileData.id,
              name: profileData.name || session.user.email || 'Usuário',
              email: profileData.email || session.user.email || '',
              role: profileData.role || 'user'
            });
          } else {
            setProfile({
              id: session.user.id,
              name: session.user.email || 'Usuário',
              email: session.user.email || '',
              role: 'user'
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfile({
            id: session.user.id,
            name: session.user.email || 'Usuário',
            email: session.user.email || '',
            role: 'user'
          });
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
