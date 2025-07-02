// Subscription functionality disabled for non-SaaS mode
// This file contains the original subscription logic for future reactivation

import { useState } from 'react';
// import { useSupabaseAuth } from './useSupabaseAuth';
// import { supabase } from '@/integrations/supabase/client';
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
  // const { currentOrganization } = useSupabaseAuth(); // Disabled

  const createSubscription = async (data: CreateSubscriptionData) => {
    toast({
      title: "Funcionalidade desabilitada",
      description: "Funcionalidades de assinatura estão temporariamente desabilitadas.",
      variant: "destructive",
    });
    throw new Error("Subscription functionality disabled");
  };

  const getCurrentSubscription = async () => {
    return null;
  };

  const getSubscriptionPlans = async () => {
    return [];
  };

  return {
    createSubscription,
    getCurrentSubscription,
    getSubscriptionPlans,
    isLoading,
  };
};