import { PrintService } from './PrintService';
import { TemplateType, LabelData, PrintServiceOptions, PaperSize } from '@/types/printing';

export interface LabelGenerationOptions {
  products: any[];
  labelType: 'standard' | 'promotional' | 'zebra' | 'maleta';
  format: 'A4' | 'thermal_80mm' | 'thermal_58mm' | 'label_50x30' | 'label_40x20';
  layout: '1x1' | '2x1' | '3x1' | '2x2' | '3x3';
  includeBarcode: boolean;
  includeQRCode: boolean;
  quantity: number;
}

export interface GeneratedLabel extends LabelData {
  id: string;
  product_id: number;
  generated_at: string;
}

export class LabelGenerator {
  private printService: PrintService;

  constructor() {
    this.printService = new PrintService();
  }

  /**
   * Mapear formato para PaperSize válido
   */
  private mapFormatToPaperSize(format: string): PaperSize {
    switch (format) {
      case 'A4': return 'A4';
      case 'thermal_80mm': return '80mm';
      case 'thermal_58mm': return '58mm';
      case 'label_50x30': return '50x30mm';
      case 'label_40x20': return '40x20mm';
      default: return 'A4';
    }
  }

  /**
   * Gerar etiquetas em lote para múltiplos produtos
   */
  async generateBatch(options: LabelGenerationOptions): Promise<string[]> {
    console.log('LabelGenerator.generateBatch called with:', options);
    
    try {
      const jobIds: string[] = [];
      
      for (const product of options.products) {
        const labelData = this.prepareProductLabelData(product, options);
        
        const templateType = this.getTemplateTypeFromLabelType(options.labelType);
        
        const printOptions: PrintServiceOptions = {
          data: labelData,
          quantity: options.quantity,
          printer_config: {
            printer_type: options.format === 'A4' ? 'pdf' : 'thermal',
            paper_size: this.mapFormatToPaperSize(options.format),
            orientation: 'portrait',
            margins: { top: 5, right: 5, bottom: 5, left: 5 }
          }
        };
        
        const jobId = await this.printService.print(templateType, printOptions);
        jobIds.push(jobId);
      }
      
      return jobIds;
    } catch (error) {
      console.error('Erro ao gerar etiquetas em lote:', error);
      throw error;
    }
  }

  /**
   * Gerar etiqueta individual
   */
  async generateSingle(product: any, options: Partial<LabelGenerationOptions>): Promise<string> {
    const fullOptions: LabelGenerationOptions = {
      products: [product],
      labelType: options.labelType || 'standard',
      format: options.format || 'A4',
      layout: options.layout || '1x1',
      includeBarcode: options.includeBarcode ?? true,
      includeQRCode: options.includeQRCode ?? false,
      quantity: options.quantity || 1
    };
    
    const jobIds = await this.generateBatch(fullOptions);
    return jobIds[0];
  }

  /**
   * Preview de etiqueta (retorna HTML renderizado)
   */
  async generatePreview(product: any, options: Partial<LabelGenerationOptions>): Promise<string> {
    const labelData = this.prepareProductLabelData(product, options as LabelGenerationOptions);
    const template = await this.getPreviewTemplate(options.labelType || 'standard');
    
    if (!template) {
      throw new Error('Template de preview não encontrado');
    }
    
    return this.printService['templateEngine'].render(template, labelData);
  }

  /**
   * Gerar comandos ZPL para impressoras Zebra
   */
  generateZPL(product: any, options: Partial<LabelGenerationOptions>): string {
    const labelData = this.prepareProductLabelData(product, options as LabelGenerationOptions);
    
    // Template ZPL básico para etiquetas de produto
    let zplCommands = `^XA\n`;
    
    // Configurações da etiqueta
    zplCommands += `^CF0,30\n`; // Fonte padrão, tamanho 30
    
    // Nome do produto
    zplCommands += `^FO50,50^FD${this.truncateText(labelData.name, 20)}^FS\n`;
    
    // SKU
    zplCommands += `^CF0,20\n`; // Fonte menor
    zplCommands += `^FO50,100^FDSKU: ${labelData.sku}^FS\n`;
    
    // Preço
    if (labelData.promotion && labelData.original_price) {
      // Preço original riscado
      zplCommands += `^FO50,130^FDDE: R$ ${labelData.original_price.toFixed(2)}^FS\n`;
      zplCommands += `^FO50,160^FDPOR: R$ ${labelData.price.toFixed(2)}^FS\n`;
      
      if (labelData.discount_percentage) {
        zplCommands += `^FO200,130^FD${labelData.discount_percentage}% OFF^FS\n`;
      }
    } else {
      zplCommands += `^FO50,130^FDR$ ${labelData.price.toFixed(2)}^FS\n`;
    }
    
    // Código de barras
    if (options.includeBarcode && labelData.barcode) {
      zplCommands += `^FO50,200^BC^FD${labelData.barcode}^FS\n`;
    }
    
    // QR Code
    if (options.includeQRCode && labelData.qr_code) {
      zplCommands += `^FO200,200^BQ^FDMA,${labelData.qr_code}^FS\n`;
    }
    
    zplCommands += `^XZ`;
    
    return zplCommands;
  }

  /**
   * Preparar dados do produto para a etiqueta
   */
  private prepareProductLabelData(product: any, options: LabelGenerationOptions): LabelData {
    const isPromotion = product.on_sale && product.sale_price && product.regular_price;
    const discountPercentage = isPromotion 
      ? Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)
      : 0;

    return {
      product_id: product.id,
      name: product.name || 'Produto sem nome',
      sku: product.sku || `PROD-${product.id}`,
      price: parseFloat(product.price || product.sale_price || product.regular_price || '0'),
      original_price: isPromotion ? parseFloat(product.regular_price) : undefined,
      barcode: product.sku || `${product.id}`,
      qr_code: options.includeQRCode ? this.generateQRCodeData(product) : undefined,
      category: this.extractCategory(product),
      brand: product.brand || undefined,
      size: product.size || undefined,
      color: product.color || undefined,
      promotion: isPromotion,
      discount_percentage: discountPercentage > 0 ? discountPercentage : undefined,
      expiry_date: product.expiry_date || undefined,
      batch_number: product.batch_number || undefined
    };
  }

  /**
   * Gerar dados para QR Code
   */
  private generateQRCodeData(product: any): string {
    return JSON.stringify({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      url: product.permalink || `${window.location.origin}/products/${product.id}`
    });
  }

  /**
   * Extrair categoria principal do produto
   */
  private extractCategory(product: any): string | undefined {
    if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
      return product.categories[0].name;
    }
    return undefined;
  }

  /**
   * Truncar texto para caber na etiqueta
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Converter tipo de etiqueta para tipo de template
   */
  private getTemplateTypeFromLabelType(labelType: string): TemplateType {
    switch (labelType) {
      case 'promotional':
        return 'promo_label';
      case 'maleta':
        return 'maleta_label';
      case 'zebra':
      case 'standard':
      default:
        return 'product_label';
    }
  }

  /**
   * Obter template para preview
   */
  private async getPreviewTemplate(labelType: string) {
    const templateType = this.getTemplateTypeFromLabelType(labelType);
    return await this.printService.getDefaultTemplate(templateType);
  }

  /**
   * Calcular layout de etiquetas por página
   */
  getLabelsPerPage(layout: string): { rows: number; cols: number; total: number } {
    switch (layout) {
      case '1x1': return { rows: 1, cols: 1, total: 1 };
      case '2x1': return { rows: 1, cols: 2, total: 2 };
      case '3x1': return { rows: 1, cols: 3, total: 3 };
      case '2x2': return { rows: 2, cols: 2, total: 4 };
      case '3x3': return { rows: 3, cols: 3, total: 9 };
      default: return { rows: 1, cols: 1, total: 1 };
    }
  }

  /**
   * Validar configurações de etiqueta
   */
  validateLabelOptions(options: LabelGenerationOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!options.products || options.products.length === 0) {
      errors.push('Nenhum produto selecionado');
    }
    
    if (options.quantity < 1 || options.quantity > 100) {
      errors.push('Quantidade deve estar entre 1 e 100');
    }
    
    if (options.products && options.products.length > 1000) {
      errors.push('Máximo de 1000 produtos por vez');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Instância singleton
export const labelGenerator = new LabelGenerator();
