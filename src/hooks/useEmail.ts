import { useState } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

interface SendEmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export const useEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSupabaseAuth(); // Simplified - no organization needed

  const sendEmail = async (data: SendEmailData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke(
        'send-email',
        {
          body: {
            ...data,
            userId: user.id, // Simplified - use user ID instead of organization
          },
        }
      );

      if (error) throw error;

      toast({
        title: "E-mail enviado!",
        description: "Mensagem enviada com sucesso.",
      });

      return response;
    } catch (error: any) {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
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