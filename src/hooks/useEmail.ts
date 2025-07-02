import { useState } from 'react';
import { toast } from './use-toast';

interface SendEmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export const useEmail = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendEmail = async (data: SendEmailData) => {
    // Modo demo - funcionalidade desabilitada
    toast({
      title: "Modo Demo",
      description: "Funcionalidade de e-mail indisponível no modo demo",
      variant: "destructive",
    });
    return;
  };

  const getEmailLogs = async () => {
    // Disabled for non-SaaS mode - would need to be refactored for user-based logs
    return [];
  };

  return {
    sendEmail,
    getEmailLogs,
    isLoading,
  };
};