
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

  private async generatePDF(template: PrintTemplate, renderedContent: string, options: PrintServiceOptions): Promise<string> {
    try {
      // Gerar PDF no cliente usando jsPDF para evitar PDF em branco do mock no Edge
      const { default: jsPDF } = await import('jspdf');

      // Dimensões por formato
      const data = options.data as any;
      const format = (data?.format || 'A4') as string;
      const layout = data?.layout || { rows: 2, cols: 2 };

      const sizeByFormat: Record<string, [number, number]> = {
        A4: [210, 297],
        '80mm': [80, 200],
        '58mm': [58, 200],
        '50x30mm': [50, 30],
        '40x20mm': [40, 20],
      };

      const pageSize = sizeByFormat[format] || sizeByFormat['A4'];
      const doc = new jsPDF({ unit: 'mm', format: pageSize });

      const labels: any[] = Array.isArray(data?.labels) ? data.labels : [];
      const rows = layout.rows || 2;
      const cols = layout.cols || 2;
      const labelsPerPage = rows * cols;

      const pageWidth = pageSize[0];
      const pageHeight = pageSize[1];
      const margin = 10;
      const gap = 2;
      const gridWidth = pageWidth - margin * 2;
      const gridHeight = pageHeight - margin * 2;
      const cellWidth = (gridWidth - gap * (cols - 1)) / cols;
      const cellHeight = (gridHeight - gap * (rows - 1)) / rows;

      const totalPages = Math.max(1, Math.ceil(labels.length / labelsPerPage));

      let labelIndex = 0;
      for (let p = 0; p < totalPages; p++) {
        if (p > 0) doc.addPage(pageSize);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = margin + c * (cellWidth + gap);
            const y = margin + r * (cellHeight + gap);

            // Moldura da etiqueta
            doc.setDrawColor(220);
            doc.rect(x, y, cellWidth, cellHeight);

            const label = labels[labelIndex];
            if (label) {
              const lineY = (offset: number) => y + 6 + offset;

              doc.setTextColor(0);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              const name = String(label.name || '').substring(0, 36);
              doc.text(name, x + 2, lineY(0));

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              const sku = `SKU: ${label.sku || ''}`;
              doc.text(sku, x + 2, lineY(6));

              doc.setFont('helvetica', 'bold');
              doc.setFontSize(12);
              const price = `R$ ${(label.price || 0).toFixed(2)}`;
              doc.text(price, x + 2, lineY(14));

              // Opcional: mostrar barcode como texto
              if (label.barcode) {
                doc.setFont('courier', 'normal');
                doc.setFontSize(7);
                doc.text(String(label.barcode), x + 2, y + cellHeight - 4);
              }

              labelIndex++;
            }
          }
        }
      }

      const fileName = `${template.type}-${Date.now()}.pdf`;
      doc.save(fileName);
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
