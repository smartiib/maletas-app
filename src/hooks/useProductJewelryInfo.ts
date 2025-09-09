import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface ProductJewelryInfo {
  id?: string;
  product_id: number;
  organization_id?: string;
  
  // Fornecedores
  fornecedor_bruto?: string;
  codigo_fornecedor_bruto?: string;
  nome_galvanica?: string;
  
  // Banho
  peso_peca?: number;
  milesimo?: number;
  valor_milesimo?: number;
  
  // Custos
  custo_fixo?: number;
  custo_bruto?: number;
  custo_variavel?: number;
  custo_galvanica?: number; // Calculated: peso_peca * valor_milesimo
  custo_final?: number; // Calculated: sum of all costs
  
  // Markup
  markup_desejado?: number;
  preco_venda_sugerido?: number; // Calculated: custo_final * markup_desejado / 100
  
  created_at?: string;
  updated_at?: string;
}

export const useProductJewelryInfo = (productId?: number) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['product-jewelry-info', productId, currentOrganization?.id],
    queryFn: async () => {
      if (!productId || !currentOrganization?.id) return null;
      
      const { data, error } = await supabase
        .from('product_jewelry_info')
        .select('*')
        .eq('product_id', productId)
        .eq('organization_id', currentOrganization.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    },
    enabled: !!productId && !!currentOrganization?.id,
  });
};

export const useSaveProductJewelryInfo = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: ProductJewelryInfo) => {
      if (!currentOrganization?.id) {
        throw new Error('Organization not found');
      }
      
      // Calculate derived values
      const custo_galvanica = (data.peso_peca || 0) * (data.valor_milesimo || 0);
      const custo_final = (data.custo_fixo || 0) + (data.custo_bruto || 0) + custo_galvanica + (data.custo_variavel || 0);
      const preco_venda_sugerido = custo_final + (custo_final * (data.markup_desejado || 0) / 100);
      
      const payload = {
        ...data,
        organization_id: currentOrganization.id,
        custo_galvanica,
        custo_final,
        preco_venda_sugerido,
      };
      
      const { data: result, error } = await supabase
        .from('product_jewelry_info')
        .upsert(payload, { onConflict: 'product_id,organization_id' })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast.success('Informações de joia salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['product-jewelry-info'] });
    },
    onError: (error) => {
      console.error('Error saving jewelry info:', error);
      toast.error('Erro ao salvar informações de joia');
    },
  });
};

export const useDeleteProductJewelryInfo = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (productId: number) => {
      if (!currentOrganization?.id) {
        throw new Error('Organization not found');
      }
      
      const { error } = await supabase
        .from('product_jewelry_info')
        .delete()
        .eq('product_id', productId)
        .eq('organization_id', currentOrganization.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Informações de joia removidas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['product-jewelry-info'] });
    },
    onError: (error) => {
      console.error('Error deleting jewelry info:', error);
      toast.error('Erro ao remover informações de joia');
    },
  });
};

// Helper function to extract jewelry info from WooCommerce meta_data
export const extractJewelryInfoFromMetaData = (metaData: any[]): Partial<ProductJewelryInfo> => {
  if (!Array.isArray(metaData)) return {};
  
  const jewelryInfo: Partial<ProductJewelryInfo> = {};
  
  metaData.forEach((meta: any) => {
    if (!meta || typeof meta !== 'object' || !meta.key) return;
    
    const value = meta.value;
    if (value === null || value === undefined || value === '') return;
    
    switch (meta.key) {
      case '_fornecedor_bruto':
        jewelryInfo.fornecedor_bruto = String(value);
        break;
      case '_codigo_fornecedor_bruto':
        jewelryInfo.codigo_fornecedor_bruto = String(value);
        break;
      case '_nome_galvanica':
        jewelryInfo.nome_galvanica = String(value);
        break;
      case '_peso_peca':
        jewelryInfo.peso_peca = parseFloat(String(value)) || 0;
        break;
      case '_milesimo':
        jewelryInfo.milesimo = parseFloat(String(value)) || 0;
        break;
      case '_valor_milesimo':
        jewelryInfo.valor_milesimo = parseFloat(String(value)) || 0;
        break;
      case '_custo_fixo':
        jewelryInfo.custo_fixo = parseFloat(String(value)) || 0;
        break;
      case '_custo_bruto':
        jewelryInfo.custo_bruto = parseFloat(String(value)) || 0;
        break;
      case '_custo_variavel':
        jewelryInfo.custo_variavel = parseFloat(String(value)) || 0;
        break;
      case '_custo_galvanica':
        jewelryInfo.custo_galvanica = parseFloat(String(value)) || 0;
        break;
      case '_custo_final':
        jewelryInfo.custo_final = parseFloat(String(value)) || 0;
        break;
      case '_markup_desejado':
        jewelryInfo.markup_desejado = parseFloat(String(value)) || 0;
        break;
      case '_preco_venda_sugerido':
        jewelryInfo.preco_venda_sugerido = parseFloat(String(value)) || 0;
        break;
    }
  });
  
  return jewelryInfo;
};