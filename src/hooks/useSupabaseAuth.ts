import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, organizationName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  currentOrganization: any;
  setCurrentOrganization: (org: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within AuthProvider');
  }
  return context;
};

export const useSupabaseAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Fetch user organizations after login
        if (session?.user) {
          setTimeout(() => {
            fetchUserOrganizations(session.user.id);
          }, 0);
        } else {
          setCurrentOrganization(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        fetchUserOrganizations(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserOrganizations = async (userId: string) => {
    try {
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', userId)
        .single();

      if (userOrgs?.organization) {
        setCurrentOrganization(userOrgs.organization);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const signUp = async (email: string, password: string, organizationName: string) => {
    try {
      setIsLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            organization_name: organizationName
          }
        }
      });

      if (error) throw error;

      // Create organization after signup
      if (data.user) {
        await createOrganizationForUser(data.user.id, organizationName);
      }

      toast({
        title: "Conta criada!",
        description: "Verifique seu email para ativar a conta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganizationForUser = async (userId: string, organizationName: string) => {
    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user to organization as owner
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: org.id,
          role: 'owner'
        });

      if (userOrgError) throw userOrgError;

      // Get trial plan
      const { data: trialPlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('type', 'trial')
        .single();

      if (trialPlan) {
        // Create trial subscription
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days trial

        await supabase
          .from('subscriptions')
          .insert({
            organization_id: org.id,
            plan_id: trialPlan.id,
            status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString()
          });

        // Create organization limits
        await supabase
          .from('organization_limits')
          .insert({
            organization_id: org.id,
            current_stores: 0,
            current_products: 0,
            current_users: 1
          });
      }

    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentOrganization(null);
      
      toast({
        title: "Logout",
        description: "Sessão encerrada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    currentOrganization,
    setCurrentOrganization,
  };
};

export { AuthContext };