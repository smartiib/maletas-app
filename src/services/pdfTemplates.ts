import { supabase } from '@/integrations/supabase/client';

export interface PdfTemplate {
  id: string;
  name: string;
  type: 'romaneio' | 'etiqueta' | 'relatorio';
  format: 'A4' | 'thermal_80mm' | 'thermal_58mm';
  html_template: string;
  css_styles?: string;
  settings?: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export class PdfTemplateService {
  static async getTemplates(type?: string) {
    let query = supabase
      .from('pdf_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar templates: ${error.message}`);
    }
    
    return data as PdfTemplate[];
  }

  static async getDefaultTemplate(type: string) {
    const { data, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();
    
    if (error) {
      throw new Error(`Erro ao buscar template padrão: ${error.message}`);
    }
    
    return data as PdfTemplate;
  }

  static async generatePdf(maleta_id: string, template_type: string = 'romaneio') {
    const response = await supabase.functions.invoke('generate-pdf', {
      body: { 
        maleta_id,
        template_type
      }
    });

    if (response.error) {
      throw new Error(`Erro ao gerar PDF: ${response.error.message}`);
    }

    // A response.data agora contém o PDF como blob
    return response.data;
  }

  static async createTemplate(template: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('pdf_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao criar template: ${error.message}`);
    }
    
    return data as PdfTemplate;
  }

  static async updateTemplate(id: string, updates: Partial<PdfTemplate>) {
    const { data, error } = await supabase
      .from('pdf_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao atualizar template: ${error.message}`);
    }
    
    return data as PdfTemplate;
  }

  static async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('pdf_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Erro ao deletar template: ${error.message}`);
    }
  }

  static downloadHtmlAsFile(html: string, filename: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}