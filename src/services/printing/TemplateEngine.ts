
import { PrintTemplate } from '@/types/printing';

export class TemplateEngine {
  /**
   * Renderizar template HTML com dados dinâmicos
   */
  render(template: PrintTemplate, data: Record<string, any>): string {
    console.log('TemplateEngine.render called with:', { template: template.name, data });
    
    try {
      let rendered = template.html_template;
      
      // Substituir variáveis no formato {{variable}}
      rendered = this.replaceVariables(rendered, data);
      
      // Processar loops no formato {{#each items}} ... {{/each}}
      rendered = this.processLoops(rendered, data);
      
      // Processar condicionais no formato {{#if condition}} ... {{/if}}
      rendered = this.processConditionals(rendered, data);
      
      console.log('Template renderizado com sucesso');
      return rendered;
    } catch (error) {
      console.error('Erro ao renderizar template:', error);
      throw new Error(`Erro ao renderizar template: ${error.message}`);
    }
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
