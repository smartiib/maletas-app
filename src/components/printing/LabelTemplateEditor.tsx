
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrintTemplate, TemplateType, TemplateFormat, PaperSize } from '@/types/printing';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Save, X, Eye, Code } from 'lucide-react';
import { toast } from 'sonner';

interface LabelTemplateEditorProps {
  template?: PrintTemplate | null;
  labelType: 'standard' | 'promotional' | 'zebra' | 'maleta';
  onSave: (template: PrintTemplate) => void;
  onCancel: () => void;
}

export const LabelTemplateEditor: React.FC<LabelTemplateEditorProps> = ({
  template,
  labelType,
  onSave,
  onCancel
}) => {
  const { currentOrganization } = useOrganization();
  const [formData, setFormData] = useState({
    name: '',
    type: 'etiqueta' as TemplateType,
    paper_size: 'A4',
    orientation: 'portrait',
    html_template: '',
    css_styles: ''
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [saving, setSaving] = useState(false);

  // Mapeia o paper_size selecionado para o format aceito no banco
  const mapPaperSizeToFormat = (paperSize: PaperSize | string): TemplateFormat => {
    switch (paperSize) {
      case 'A4':
        return 'A4';
      case '80mm':
        return 'thermal_80mm';
      case '58mm':
        return 'thermal_58mm';
      case '50x30mm':
        return 'label_50x30';
      case '40x20mm':
        return 'label_40x20';
      default:
        return 'custom';
    }
  };

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        type: (template.type as TemplateType) || 'etiqueta',
        paper_size: template.paper_size || 'A4',
        orientation: template.orientation || 'portrait',
        html_template: template.html_template,
        css_styles: template.css_styles || ''
      });
    } else {
      // Template padrão para novos templates
      setFormData({
        name: `Novo Template ${labelType}`,
        type: 'etiqueta',
        paper_size: 'A4',
        orientation: 'portrait',
        html_template: getDefaultHtmlTemplate(),
        css_styles: getDefaultCssStyles()
      });
    }
  }, [template, labelType]);

  useEffect(() => {
    updatePreview();
  }, [formData.html_template]);

  const getTemplateType = (type: string): TemplateType => {
    return 'etiqueta';
  };

  const getDefaultHtmlTemplate = () => `
<div class="label">
  <div class="header">
    <h1 class="product-name">{{name}}</h1>
    <p class="sku">SKU: {{sku}}</p>
  </div>
  <div class="price-section">
    {{#if original_price}}
      <div class="original-price">DE: R$ {{original_price}}</div>
      <div class="sale-price">POR: R$ {{price}}</div>
    {{else}}
      <div class="price">R$ {{price}}</div>
    {{/if}}
  </div>
  {{#if barcode}}
    <div class="barcode">{{barcode}}</div>
  {{/if}}
</div>
  `.trim();

  const getDefaultCssStyles = () => `
.label {
  width: 100%;
  height: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 8px;
}

.product-name {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.sku {
  font-size: 10px;
  color: #666;
  margin: 0;
}

.price-section {
  margin-bottom: 8px;
}

.price {
  font-size: 16px;
  font-weight: bold;
  color: #2563eb;
}

.original-price {
  font-size: 10px;
  color: #666;
  text-decoration: line-through;
}

.sale-price {
  font-size: 14px;
  font-weight: bold;
  color: #ef4444;
}

.barcode {
  margin-top: auto;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  text-align: center;
}
  `.trim();

  const updatePreview = () => {
    const html = formData.html_template
      .replace(/\{\{name\}\}/g, 'Produto Exemplo')
      .replace(/\{\{sku\}\}/g, 'SKU123')
      .replace(/\{\{price\}\}/g, '29.90')
      .replace(/\{\{original_price\}\}/g, '39.90')
      .replace(/\{\{barcode\}\}/g, '||||| 123456789 |||||')
      .replace(/\{\{#if original_price\}\}/g, '')
      .replace(/\{\{else\}\}/g, '<!--')
      .replace(/\{\{\/if\}\}/g, '-->')
      .replace(/\{\{#if barcode\}\}/g, '')
      .replace(/\{\{\/if\}\}/g, '');

    const fullHtml = `
      <style>${formData.css_styles}</style>
      ${html}
    `;
    setPreviewHtml(fullHtml);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: formData.name,
        type: 'etiqueta' as const,
        format: mapPaperSizeToFormat(formData.paper_size),
        html_template: formData.html_template,
        css_styles: formData.css_styles,
        printer_type: 'pdf',
        paper_size: formData.paper_size,
        orientation: formData.orientation,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        is_active: true,
        is_default: false,
        organization_id: currentOrganization?.id
      };

      let savedTemplate;
      if (template && template.id && !template.id.startsWith('default-')) {
        // Atualizar template existente
        const { data, error } = await supabase
          .from('pdf_templates')
          .update(templateData)
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        savedTemplate = data;
      } else {
        // Criar novo template
        const { data, error } = await supabase
          .from('pdf_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        savedTemplate = data;
      }

      toast.success('Template salvo com sucesso!');
      onSave(savedTemplate as PrintTemplate);
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Editor de Template</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do template"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paper_size">Tamanho do Papel</Label>
                <Select
                  value={formData.paper_size}
                  onValueChange={(value) => setFormData({ ...formData, paper_size: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="50x30mm">50x30mm</SelectItem>
                    <SelectItem value="40x20mm">40x20mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orientation">Orientação</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4" />
              HTML Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.html_template}
              onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
              placeholder="HTML do template..."
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CSS Styles</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.css_styles}
              onChange={(e) => setFormData({ ...formData, css_styles: e.target.value })}
              placeholder="CSS do template..."
              className="min-h-[150px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4" />
          <h3 className="text-lg font-semibold">Preview</h3>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="border-2 border-dashed border-gray-300 p-4">
              <div
                className="w-full bg-white border rounded"
                style={{
                  height: formData.paper_size === 'A4' ? '300px' : '200px',
                  maxWidth: '100%'
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Variáveis Disponíveis:</h4>
          <div className="text-sm space-y-1">
            <code>{'{{name}}'}</code> - Nome do produto<br />
            <code>{'{{sku}}'}</code> - SKU do produto<br />
            <code>{'{{price}}'}</code> - Preço atual<br />
            <code>{'{{original_price}}'}</code> - Preço original<br />
            <code>{'{{barcode}}'}</code> - Código de barras<br />
            <code>{'{{qr_code}}'}</code> - QR Code
          </div>
        </div>
      </div>
    </div>
  );
};
