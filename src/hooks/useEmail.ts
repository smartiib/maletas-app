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
  const { currentOrganization } = useSupabaseAuth();

  const sendEmail = async (data: SendEmailData) => {
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
      const { data: response, error } = await supabase.functions.invoke(
        'send-email',
        {
          body: {
            ...data,
            organizationId: currentOrganization.id,
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
    if (!currentOrganization) return [];

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar logs de e-mail:', error);
      return [];
    }

    return data;
  };

  return {
    sendEmail,
    getEmailLogs,
    isLoading,
  };
};