import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PrintTemplate } from '@/types/printing';
import { toast } from 'sonner';

export const useLabelTemplates = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch all label templates
  const templatesQuery = useQuery({
    queryKey: ['label-templates', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('is_active', true)
        .or(`type.eq.etiqueta,type.eq.product_label`)
        .order('name');

      if (error) {
        console.error('Erro ao buscar templates:', error);
        throw error;
      }

      return data as PrintTemplate[];
    },
    enabled: !!currentOrganization,
  });

  // Create default template if none exists
  const createDefaultTemplate = useMutation({
    mutationFn: async () => {
      const defaultTemplate = {
        name: 'Template Padrão de Etiquetas',
        type: 'etiqueta',
        format: 'A4',
        html_template: `
          <div class="label">
            <div class="product-name">{{name}}</div>
            <div class="product-sku">SKU: {{sku}}</div>
            <div class="product-price">R$ {{price}}</div>
            {{#if barcode}}<div class="barcode">{{barcode}}</div>{{/if}}
            {{#if qr_code}}<div class="qr-code">{{qr_code}}</div>{{/if}}
          </div>
        `,
        css_styles: `
          .label {
            width: 100%;
            height: 100%;
            padding: 8px;
            font-family: Arial, sans-serif;
            border: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .product-name {
            font-size: 12px;
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 4px;
          }
          .product-sku {
            font-size: 10px;
            color: #666;
            margin-bottom: 4px;
          }
          .product-price {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 4px;
          }
          .barcode, .qr-code {
            font-size: 8px;
            text-align: center;
            margin-top: auto;
          }
        `,
        printer_type: 'pdf',
        paper_size: 'A4',
        orientation: 'portrait',
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        is_active: true,
        is_default: true,
        organization_id: currentOrganization?.id
      };

      const { data, error } = await supabase
        .from('pdf_templates')
        .insert(defaultTemplate)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-templates', currentOrganization?.id] });
      toast.success('Template padrão criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar template padrão:', error);
      toast.error('Erro ao criar template padrão');
    }
  });

  // Get default template
  const getDefaultTemplate = async () => {
    const templates = templatesQuery.data || [];
    const defaultTemplate = templates.find(t => t.is_default);
    
    if (!defaultTemplate && templates.length === 0) {
      // Create default template if none exists
      return await createDefaultTemplate.mutateAsync();
    }
    
    return defaultTemplate || templates[0] || null;
  };

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    getDefaultTemplate,
    createDefaultTemplate: createDefaultTemplate.mutate,
    refetch: templatesQuery.refetch
  };
};