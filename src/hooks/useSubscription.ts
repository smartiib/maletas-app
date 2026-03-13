// Subscription functionality temporarily disabled for non-SaaS mode
import { useState } from 'react';
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

  const createSubscription = async (data: CreateSubscriptionData) => {
    toast({
      title: "Funcionalidade desabilitada",
      description: "Funcionalidades de assinatura estão temporariamente desabilitadas.",
      variant: "destructive",
    });
    throw new Error("Subscription functionality disabled");
  };

  const getCurrentSubscription = async () => {
    // Disabled for non-SaaS mode
    return null;
  };

  const getSubscriptionPlans = async () => {
    // Disabled for non-SaaS mode
    return [];
  };

  return {
    createSubscription,
    getCurrentSubscription,
    getSubscriptionPlans,
    isLoading,
  };
};