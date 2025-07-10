import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from './use-toast';

interface UserConfiguration {
  id: string;
  user_id: string;
  config_type: string;
  config_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserConfigurations = () => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [configurations, setConfigurations] = useState<UserConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConfigurations();
    }
  }, [isAuthenticated, user]);

  const fetchConfigurations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching configurations:', error);
        return;
      }

      setConfigurations(data || []);
    } catch (error) {
      console.error('Error fetching configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfiguration = (configType: string): any => {
    const config = configurations.find(c => c.config_type === configType);
    return config?.config_data || null;
  };

  const saveConfiguration = async (configType: string, configData: any): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_configurations')
        .upsert({
          user_id: user.id,
          config_type: configType,
          config_data: configData,
          is_active: true,
        }, { 
          onConflict: 'user_id,config_type' 
        });

      if (error) {
        console.error('Error saving configuration:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar configuração",
          variant: "destructive",
        });
        return false;
      }

      // Refresh configurations
      await fetchConfigurations();
      
      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteConfiguration = async (configType: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_configurations')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('config_type', configType);

      if (error) {
        console.error('Error deleting configuration:', error);
        return false;
      }

      // Refresh configurations
      await fetchConfigurations();
      return true;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      return false;
    }
  };

  // Configurações específicas
  const getWooCommerceConfig = () => getConfiguration('woocommerce');
  const saveWooCommerceConfig = (config: any) => saveConfiguration('woocommerce', config);
  
  const getEmailConfig = () => getConfiguration('email');
  const saveEmailConfig = (config: any) => saveConfiguration('email', config);

  return {
    configurations,
    isLoading,
    getConfiguration,
    saveConfiguration,
    deleteConfiguration,
    getWooCommerceConfig,
    saveWooCommerceConfig,
    getEmailConfig,
    saveEmailConfig,
    fetchConfigurations,
  };
};