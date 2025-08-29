
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface PDFGenerationRequest {
  template_type: string;
  template_data: any;
  template_config: {
    html_template: string;
    css_styles?: string;
    paper_size: string;
    orientation: string;
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template_type, template_data, template_config }: PDFGenerationRequest = await req.json();
    
    console.log('Gerando PDF para template:', template_type);
    console.log('Dados do template:', template_data);

    // Renderizar HTML com os dados
    const renderedHTML = renderTemplate(template_config.html_template, template_data);
    
    // CSS básico para etiquetas
    const defaultCSS = `
      @page {
        size: ${template_config.paper_size === 'A4' ? 'A4' : '80mm 120mm'};
        margin: ${template_config.margins.top}mm ${template_config.margins.right}mm ${template_config.margins.bottom}mm ${template_config.margins.left}mm;
      }
      
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        margin: 0;
        padding: 0;
      }
      
      .label {
        border: 1px solid #ccc;
        padding: 10px;
        margin: 5px;
        display: inline-block;
        width: 200px;
        height: 150px;
        vertical-align: top;
        box-sizing: border-box;
      }
      
      .product-name {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 5px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .product-sku {
        font-size: 10px;
        color: #666;
        margin-bottom: 5px;
      }
      
      .product-price {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
      }
      
      .original-price {
        text-decoration: line-through;
        color: #999;
        font-size: 12px;
      }
      
      .promotion {
        background-color: #ff4444;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
      }
      
      .barcode {
        font-family: 'Courier New', monospace;
        font-size: 8px;
        text-align: center;
        margin-top: 10px;
      }
      
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .label { page-break-inside: avoid; }
      }
    `;

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Etiqueta - ${template_data.name || 'Produto'}</title>
          <style>${defaultCSS}${template_config.css_styles || ''}</style>
        </head>
        <body>
          ${renderedHTML}
        </body>
      </html>
    `;

    // Simular geração de PDF (em produção, usar biblioteca como Puppeteer)
    const pdfBuffer = new TextEncoder().encode(fullHTML);
    
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etiqueta-${template_data.sku || 'produto'}.pdf"`
      }
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function renderTemplate(template: string, data: any): string {
  let rendered = template;
  
  // Template básico para etiquetas de produto
  if (!template || template.trim() === '') {
    rendered = `
      <div class="label">
        <div class="product-name">{{name}}</div>
        <div class="product-sku">SKU: {{sku}}</div>
        <div class="product-price">
          {{#if promotion}}
            <span class="original-price">R$ {{original_price}}</span><br>
            <span>R$ {{price}}</span>
            {{#if discount_percentage}}
              <span class="promotion">{{discount_percentage}}% OFF</span>
            {{/if}}
          {{else}}
            R$ {{price}}
          {{/if}}
        </div>
        {{#if barcode}}
          <div class="barcode">{{barcode}}</div>
        {{/if}}
        {{#if category}}
          <div style="font-size: 10px; color: #666; margin-top: 5px;">{{category}}</div>
        {{/if}}
      </div>
    `;
  }
  
  // Substituições simples (implementação básica de template engine)
  rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
  
  // Tratar condicionais simples
  rendered = rendered.replace(/\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
    return data[condition] ? content : '';
  });
  
  // Formatação de preços
  if (data.price) {
    rendered = rendered.replace('{{price}}', parseFloat(data.price).toFixed(2));
  }
  if (data.original_price) {
    rendered = rendered.replace('{{original_price}}', parseFloat(data.original_price).toFixed(2));
  }
  
  return rendered;
}
