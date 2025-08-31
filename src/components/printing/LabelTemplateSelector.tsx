
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PrintTemplate } from '@/types/printing';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Check, Eye, Star } from 'lucide-react';
import { toast } from 'sonner';

interface LabelTemplateSelectorProps {
  labelType: 'standard' | 'promotional' | 'zebra' | 'maleta';
  onSelectTemplate: (template: PrintTemplate) => void;
  selectedTemplate?: PrintTemplate | null;
}

export const LabelTemplateSelector: React.FC<LabelTemplateSelectorProps> = ({
  labelType,
  onSelectTemplate,
  selectedTemplate
}) => {
  const { currentOrganization } = useOrganization();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Templates padrão
  const defaultTemplates: Partial<PrintTemplate>[] = [
    {
      id: 'default-standard',
      name: 'Padrão Simples',
      type: 'product_label',
      html_template: `
        <div style="width: 100%; height: 100%; padding: 8px; border: 1px solid #e5e7eb; font-family: Arial, sans-serif;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">{{name}}</div>
          <div style="color: #666; font-size: 10px; margin-bottom: 4px;">SKU: {{sku}}</div>
          <div style="font-size: 16px; font-weight: bold; color: #2563eb;">{{price}}</div>
          <div style="margin-top: auto; font-family: monospace; font-size: 8px;">{{barcode}}</div>
        </div>
      `,
      is_default: true
    },
    {
      id: 'default-promotional',
      name: 'Promocional',
      type: 'promo_label',
      html_template: `
        <div style="width: 100%; height: 100%; padding: 8px; border: 2px solid #ef4444; background: linear-gradient(45deg, #fef2f2, #ffffff); font-family: Arial, sans-serif;">
          <div style="background: #ef4444; color: white; text-align: center; padding: 2px; margin: -8px -8px 4px -8px; font-weight: bold; font-size: 10px;">PROMOÇÃO</div>
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 2px;">{{name}}</div>
          <div style="color: #666; font-size: 9px; margin-bottom: 4px;">{{sku}}</div>
          <div style="text-decoration: line-through; color: #666; font-size: 10px;">DE: {{original_price}}</div>
          <div style="font-size: 14px; font-weight: bold; color: #ef4444;">POR: {{price}}</div>
        </div>
      `,
      is_default: true
    },
    {
      id: 'default-zebra',
      name: 'Zebra Térmica',
      type: 'product_label',
      html_template: `
        <div style="width: 100%; height: 100%; padding: 4px; border: 1px solid #000; font-family: 'Courier New', monospace; font-size: 10px;">
          <div style="font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">{{name}}</div>
          <div style="margin-bottom: 2px;">SKU: {{sku}}</div>
          <div style="font-size: 12px; font-weight: bold;">R$ {{price}}</div>
          <div style="text-align: center; margin-top: 4px; font-size: 8px;">||||||||{{barcode}}||||||||</div>
        </div>
      `,
      is_default: true
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, [labelType, currentOrganization]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .or(`type.eq.product_label,type.eq.promo_label,type.eq.maleta_label`)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;

      // Combinar templates padrão com templates salvos
      const allTemplates = [
        ...defaultTemplates.map(t => ({ ...t, organization_id: null }) as PrintTemplate),
        ...(data || [])
      ];

      setTemplates(allTemplates);

      // Selecionar template padrão se nenhum estiver selecionado
      if (!selectedTemplate && allTemplates.length > 0) {
        const defaultTemplate = allTemplates.find(t => t.is_default) || allTemplates[0];
        onSelectTemplate(defaultTemplate);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: PrintTemplate) => {
    onSelectTemplate(template);
  };

  const renderTemplatePreview = (template: PrintTemplate) => {
    const previewHtml = template.html_template
      .replace(/\{\{name\}\}/g, 'Produto Exemplo')
      .replace(/\{\{sku\}\}/g, 'SKU123')
      .replace(/\{\{price\}\}/g, 'R$ 29,90')
      .replace(/\{\{original_price\}\}/g, 'R$ 39,90')
      .replace(/\{\{barcode\}\}/g, '123456789');

    return (
      <div
        className="w-full h-24 border rounded bg-white scale-75 origin-top-left"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
        style={{ width: '133%', height: '133%' }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Selecionar Template</h3>
        <p className="text-sm text-muted-foreground">
          Escolha um template para suas etiquetas ou crie um personalizado
        </p>
      </div>

      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.id === template.id
                  ? 'ring-2 ring-primary border-primary'
                  : ''
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {template.is_default && (
                      <Star className="h-3 w-3 text-yellow-500" />
                    )}
                    {selectedTemplate?.id === template.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {template.type?.replace('_', ' ')}
                  </Badge>
                  {template.organization_id ? (
                    <Badge variant="outline" className="text-xs">Personalizado</Badge>
                  ) : (
                    <Badge variant="default" className="text-xs">Padrão</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-18 overflow-hidden rounded border">
                  {renderTemplatePreview(template)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {template.paper_size || 'A4'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
