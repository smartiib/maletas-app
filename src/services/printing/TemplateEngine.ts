
import { PrintTemplate } from '@/types/printing';

export class TemplateEngine {
  /**
   * Renderizar template HTML com dados dinâmicos
   */
  render(template: PrintTemplate, data: Record<string, any>): string {
    console.log('TemplateEngine.render called with:', { template: template.name, data });
    try {
      // Se for um lote de etiquetas (array de labels), renderiza em grade
      if (Array.isArray(data.labels) && data.labels.length > 0) {
        return this.renderGrid(template, data);
      }

      // Caso simples (um único item)
      let rendered = template.html_template;
      rendered = this.replaceVariables(rendered, data);
      rendered = this.processLoops(rendered, data);
      rendered = this.processConditionals(rendered, data);
      console.log('Template renderizado com sucesso');
      return rendered;
    } catch (error: any) {
      console.error('Erro ao renderizar template:', error);
      throw new Error(`Erro ao renderizar template: ${error.message}`);
    }
  }

  /**
   * Renderiza uma grade de etiquetas usando data.labels e layout fornecido
   */
  private renderGrid(template: PrintTemplate, data: Record<string, any>): string {
    const labels: any[] = Array.isArray(data.labels) ? data.labels : [];
    const rows = data.layout?.rows ?? 2;
    const cols = data.layout?.cols ?? 2;
    const format = data.format ?? 'A4';
    const labelsPerPage = rows * cols;
    const totalPages = Math.ceil(labels.length / labelsPerPage) || 1;

    let html = `
      <style>
        ${template.css_styles || ''}
        .page { page-break-after: always; width: ${format === 'A4' ? '210mm' : '80mm'}; min-height: ${format === 'A4' ? '297mm' : '200mm'}; display: grid; grid-template-rows: repeat(${rows}, 1fr); grid-template-columns: repeat(${cols}, 1fr); gap: 2mm; padding: 10mm; }
        .label-item { border: 1px solid #e5e7eb; overflow: hidden; }
      </style>
    `;

    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * labelsPerPage;
      const pageLabels = labels.slice(startIndex, startIndex + labelsPerPage);
      html += '<div class="page">';

      for (let i = 0; i < labelsPerPage; i++) {
        const label = pageLabels[i];
        if (label) {
          const itemHtml = this.renderSingle(template.html_template, label, data);
          html += `<div class="label-item">${itemHtml}</div>`;
        } else {
          html += '<div class="label-item"></div>';
        }
      }

      html += '</div>';
    }

    return html;
  }

  /**
   * Renderiza um único item de etiqueta usando variáveis e condicionais
   */
  private renderSingle(templateStr: string, itemData: Record<string, any>, globalData: Record<string, any>): string {
    // Primeiro substitui com dados do item, depois permite fallback para dados globais
    let rendered = this.replaceVariables(templateStr, itemData);
    rendered = this.processLoops(rendered, itemData);

    // Fallback para variáveis não resolvidas com dados globais
    rendered = this.replaceVariables(rendered, { ...globalData, ...itemData });
    rendered = this.processConditionals(rendered, { ...globalData, ...itemData });
    return rendered;
  }

  /**
   * Substituir variáveis simples
   */
  private replaceVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^#\/][^}]*)\}\}/g, (match, variable) => {
      const trimmedVar = variable.trim();
      const value = this.getNestedValue(data, trimmedVar);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Processar loops
   */
  private processLoops(template: string, data: Record<string, any>): string {
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return template.replace(loopRegex, (match, arrayPath, loopContent) => {
      const arrayData = this.getNestedValue(data, arrayPath.trim());
      
      if (!Array.isArray(arrayData)) {
        return '';
      }
      
      return arrayData.map((item, index) => {
        let itemContent = loopContent;
        
        // Substituir variáveis do item atual
        itemContent = itemContent.replace(/\{\{([^#\/][^}]*)\}\}/g, (varMatch, variable) => {
          const trimmedVar = variable.trim();
          
          // Variáveis especiais do loop
          if (trimmedVar === '@index') return String(index);
          if (trimmedVar === '@first') return String(index === 0);
          if (trimmedVar === '@last') return String(index === arrayData.length - 1);
          
          // Buscar no item atual ou nos dados globais
          const itemValue = this.getNestedValue(item, trimmedVar);
          if (itemValue !== undefined) return String(itemValue);
          
          const globalValue = this.getNestedValue(data, trimmedVar);
          return globalValue !== undefined ? String(globalValue) : varMatch;
        });
        
        return itemContent;
      }).join('');
    });
  }

  /**
   * Processar condicionais
   */
  private processConditionals(template: string, data: Record<string, any>): string {
    const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
    
    return template.replace(ifRegex, (match, condition, trueContent, falseContent = '') => {
      const conditionResult = this.evaluateCondition(condition.trim(), data);
      return conditionResult ? trueContent : falseContent;
    });
  }

  /**
   * Avaliar condição booleana
   */
  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    // Condições simples: variável existe e é truthy
    if (!condition.includes(' ')) {
      const value = this.getNestedValue(data, condition);
      return Boolean(value);
    }
    
    // Condições com operadores
    const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];
    
    for (const op of operators) {
      if (condition.includes(op)) {
        const [left, right] = condition.split(op).map(s => s.trim());
        const leftValue = this.getNestedValue(data, left) ?? left;
        const rightValue = this.getNestedValue(data, right) ?? right;
        
        switch (op) {
          case '===': return leftValue === rightValue;
          case '!==': return leftValue !== rightValue;
          case '==': return leftValue == rightValue;
          case '!=': return leftValue != rightValue;
          case '>=': return Number(leftValue) >= Number(rightValue);
          case '<=': return Number(leftValue) <= Number(rightValue);
          case '>': return Number(leftValue) > Number(rightValue);
          case '<': return Number(leftValue) < Number(rightValue);
        }
      }
    }
    
    return false;
  }

  /**
   * Buscar valor aninhado em objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Renderizar comandos ZPL para impressoras Zebra
   */
  renderZPL(template: PrintTemplate, data: Record<string, any>): string {
    // Implementação básica de ZPL
    // Será expandida na Fase 2 com templates ZPL específicos
    
    const zplTemplate = `
^XA
^CF0,30
^FO50,50^FD${data.name || 'Produto'}^FS
^CF0,20
^FO50,100^FD${data.sku || 'SKU'}^FS
^FO50,130^FDR$ ${data.price || '0,00'}^FS
${data.barcode ? `^FO50,160^BC^FD${data.barcode}^FS` : ''}
^XZ
`;
    
    return zplTemplate.trim();
  }

  /**
   * Validar sintaxe do template
   */
  validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar se tags estão balanceadas
    const openTags = template.match(/\{\{#[^}]+\}\}/g) || [];
    const closeTags = template.match(/\{\{\/[^}]+\}\}/g) || [];
    
    if (openTags.length !== closeTags.length) {
      errors.push('Tags de abertura e fechamento não estão balanceadas');
    }
    
    // Verificar sintaxe de loops
    const loopMatches = template.match(/\{\{#each\s+[^}]+\}\}/g) || [];
    loopMatches.forEach(match => {
      if (!template.includes('{{/each}}')) {
        errors.push(`Loop ${match} não tem tag de fechamento`);
      }
    });
    
    // Verificar sintaxe de condicionais
    const ifMatches = template.match(/\{\{#if\s+[^}]+\}\}/g) || [];
    ifMatches.forEach(match => {
      if (!template.includes('{{/if}}')) {
        errors.push(`Condicional ${match} não tem tag de fechamento`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
