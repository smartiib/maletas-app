
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type ProductStatus = 'normal' | 'em-revisao' | 'nao-alterar';

interface ProductReviewStatus {
  id: string;
  product_id: number;
  organization_id: string;
  status: ProductStatus;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const useProductReviewStatus = () => {
  const [statuses, setStatuses] = useState<Record<number, ProductStatus>>({});
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  // Carregar status salvos do banco de dados
  useEffect(() => {
    if (currentOrganization?.id) {
      loadStatuses();
    }
  }, [currentOrganization?.id]);

  const loadStatuses = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_review_status')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (error) {
        console.error('Erro ao carregar status de revisão:', error);
        toast.error('Erro ao carregar status de revisão dos produtos');
        return;
      }

      const statusesMap: Record<number, ProductStatus> = {};
      data?.forEach((item: ProductReviewStatus) => {
        statusesMap[item.product_id] = item.status;
      });

      setStatuses(statusesMap);
    } catch (error) {
      console.error('Erro ao carregar status de revisão:', error);
      toast.error('Erro ao carregar status de revisão dos produtos');
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (productId: number, status: ProductStatus) => {
    if (!currentOrganization?.id) {
      toast.error('Nenhuma organização selecionada');
      return;
    }

    try {
      // Se o status for 'normal', remover da tabela
      if (status === 'normal') {
        const { error } = await supabase
          .from('product_review_status')
          .delete()
          .eq('product_id', productId)
          .eq('organization_id', currentOrganization.id);

        if (error) {
          console.error('Erro ao remover status:', error);
          toast.error('Erro ao atualizar status do produto');
          return;
        }
      } else {
        // Caso contrário, upsert na tabela
        const { error } = await supabase
          .from('product_review_status')
          .upsert({
            product_id: productId,
            organization_id: currentOrganization.id,
            status: status,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }, {
            onConflict: 'product_id,organization_id'
          });

        if (error) {
          console.error('Erro ao salvar status:', error);
          toast.error('Erro ao atualizar status do produto');
          return;
        }
      }

      // Atualizar estado local
      setStatuses(prev => {
        const newStatuses = { ...prev };
        if (status === 'normal') {
          delete newStatuses[productId];
        } else {
          newStatuses[productId] = status;
        }
        return newStatuses;
      });

      toast.success('Status do produto atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do produto');
    }
  };

  const bulkUpdateStatuses = async (productIds: number[], status: ProductStatus) => {
    if (!currentOrganization?.id) {
      toast.error('Nenhuma organização selecionada');
      return;
    }

    try {
      if (status === 'normal') {
        // Remover todos os status especificados
        const { error } = await supabase
          .from('product_review_status')
          .delete()
          .eq('organization_id', currentOrganization.id)
          .in('product_id', productIds);

        if (error) {
          console.error('Erro ao remover status em massa:', error);
          toast.error('Erro ao atualizar status dos produtos');
          return;
        }
      } else {
        // Upsert em massa
        const records = productIds.map(productId => ({
          product_id: productId,
          organization_id: currentOrganization.id,
          status: status,
          user_id: undefined // Será preenchido pelo trigger se necessário
        }));

        const { error } = await supabase
          .from('product_review_status')
          .upsert(records, {
            onConflict: 'product_id,organization_id'
          });

        if (error) {
          console.error('Erro ao salvar status em massa:', error);
          toast.error('Erro ao atualizar status dos produtos');
          return;
        }
      }

      // Atualizar estado local
      setStatuses(prev => {
        const newStatuses = { ...prev };
        productIds.forEach(productId => {
          if (status === 'normal') {
            delete newStatuses[productId];
          } else {
            newStatuses[productId] = status;
          }
        });
        return newStatuses;
      });

      toast.success(`Status de ${productIds.length} produtos atualizados com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar status em massa:', error);
      toast.error('Erro ao atualizar status dos produtos');
    }
  };

  const getProductStatus = (productId: number): ProductStatus => {
    return statuses[productId] || 'normal';
  };

  return {
    statuses,
    loading,
    updateProductStatus,
    bulkUpdateStatuses,
    getProductStatus,
    loadStatuses
  };
};
