
import { supabase } from '@/integrations/supabase/client';
import { PrintJob, PrintTemplate, PrinterConfiguration, PrintServiceOptions, TemplateType } from '@/types/printing';
import { TemplateEngine } from './TemplateEngine';
import { QueueManager } from './QueueManager';

export class PrintService {
  private templateEngine: TemplateEngine;
  private queueManager: QueueManager;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.queueManager = new QueueManager();
  }

  /**
   * Método principal para imprimir usando template
   */
  async print(templateType: TemplateType, options: PrintServiceOptions): Promise<string> {
    console.log('PrintService.print called with:', { templateType, options });
    
    try {
      // 1. Buscar template padrão ou usar o fornecido
      const template = options.template || await this.getDefaultTemplate(templateType);
      
      if (!template) {
        throw new Error(`Template padrão não encontrado para tipo: ${templateType}`);
      }

      // 2. Renderizar template com dados
      const renderedContent = await this.templateEngine.render(template, options.data);
      
      // 3. Determinar tipo de impressão
      if (template.printer_type === 'pdf') {
        return await this.generatePDF(template, renderedContent, options);
      } else if (template.printer_type === 'zebra') {
        return await this.generateZPL(template, options.data, options);
      } else {
        // 4. Adicionar à fila de impressão
        const jobId = await this.queueManager.addJob({
          template_type: templateType,
          template_data: options.data,
          printer_config: options.printer_config || this.getDefaultPrinterConfig(),
          quantity: options.quantity || 1,
          priority: options.priority || 0,
          template_id: template.id
        });
        
        return jobId;
      }
    } catch (error) {
      console.error('Erro no PrintService.print:', error);
      throw error;
    }
  }

  /**
   * Gerar PDF usando edge function
   */
  private async generatePDF(template: PrintTemplate, renderedContent: string, options: PrintServiceOptions): Promise<string> {
    try {
      const response = await supabase.functions.invoke('generate-pdf-template', {
        body: {
          template_type: template.type,
          template_data: options.data,
          template_config: {
            html_template: renderedContent,
            css_styles: template.css_styles,
            paper_size: template.paper_size,
            orientation: template.orientation,
            margins: template.margins
          }
        }
      });

      if (response.error) {
        throw new Error(`Erro ao gerar PDF: ${response.error.message}`);
      }

      // Criar blob e URL para download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Download automático
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.type}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return 'PDF gerado e baixado com sucesso';
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Gerar comandos ZPL para impressoras Zebra
   */
  private async generateZPL(template: PrintTemplate, data: any, options: PrintServiceOptions): Promise<string> {
    // Implementação básica de ZPL - será expandida na Fase 2
    const zplCommands = this.templateEngine.renderZPL(template, data);
    
    // Enviar para impressora ou retornar comandos
    console.log('Comandos ZPL gerados:', zplCommands);
    return zplCommands;
  }

  /**
   * Buscar template padrão por tipo
   */
  async getDefaultTemplate(templateType: TemplateType): Promise<PrintTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('type', templateType)
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar template padrão:', error);
        return null;
      }

      return data as PrintTemplate;
    } catch (error) {
      console.error('Erro ao buscar template padrão:', error);
      return null;
    }
  }

  /**
   * Listar templates disponíveis
   */
  async getTemplates(templateType?: TemplateType): Promise<PrintTemplate[]> {
    try {
      let query = supabase
        .from('pdf_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (templateType) {
        query = query.eq('type', templateType);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Erro ao buscar templates: ${error.message}`);
      }
      
      return data as PrintTemplate[];
    } catch (error) {
      console.error('Erro ao listar templates:', error);
      return [];
    }
  }

  /**
   * Configuração padrão de impressora
   */
  private getDefaultPrinterConfig() {
    return {
      printer_type: 'pdf' as const,
      paper_size: 'A4' as const,
      orientation: 'portrait' as const,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      quality: 'normal' as const,
      copies: 1
    };
  }

  /**
   * Buscar configurações de impressora
   */
  async getPrinterConfigurations(): Promise<PrinterConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('printer_configurations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw new Error(`Erro ao buscar configurações de impressora: ${error.message}`);
      }
      
      return data as PrinterConfiguration[];
    } catch (error) {
      console.error('Erro ao buscar configurações de impressora:', error);
      return [];
    }
  }

  /**
   * Buscar jobs da fila de impressão
   */
  async getPrintQueue(): Promise<PrintJob[]> {
    return this.queueManager.getQueue();
  }

  /**
   * Processar fila de impressão
   */
  async processQueue(): Promise<void> {
    return this.queueManager.processQueue();
  }
}

// Instância singleton
export const printService = new PrintService();
