import { useState } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

interface CreateSubscriptionData {
  planId: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
}

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { currentOrganization } = useSupabaseAuth();

  const createSubscription = async (data: CreateSubscriptionData) => {
    if (!currentOrganization) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Primeiro, criar cliente na Asaas se necessário
      const { data: customerResponse, error: customerError } = await supabase.functions.invoke(
        'create-asaas-customer',
        {
          body: {
            organizationId: currentOrganization.id,
            name: currentOrganization.name,
            email: 'contato@empresa.com', // Você pode adicionar email na organização
          },
        }
      );

      if (customerError) throw customerError;

      // Depois, criar a assinatura
      const { data: subscriptionResponse, error: subscriptionError } = await supabase.functions.invoke(
        'create-subscription',
        {
          body: {
            organizationId: currentOrganization.id,
            ...data,
          },
        }
      );

      if (subscriptionError) throw subscriptionError;

      toast({
        title: "Assinatura criada!",
        description: "Sua assinatura foi criada com sucesso.",
      });

      return subscriptionResponse;
    } catch (error: any) {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentSubscription = async () => {
    if (!currentOrganization) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('organization_id', currentOrganization.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }

    return data;
  };

  const getSubscriptionPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly');

    if (error) {
      console.error('Erro ao buscar planos:', error);
      return [];
    }

    return data;
  };

  return {
    createSubscription,
    getCurrentSubscription,
    getSubscriptionPlans,
    isLoading,
  };
};