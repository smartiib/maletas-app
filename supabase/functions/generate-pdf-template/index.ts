
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { template_type, template_data, template_config } = await req.json()
    
    console.log('[generate-pdf-template] Recebido:', {
      template_type,
      template_data: template_data ? 'dados presentes' : 'sem dados',
      template_config: template_config ? 'config presente' : 'sem config'
    })

    // Gerar HTML baseado no tipo de template
    let htmlContent = ''

    if (template_type === 'etiqueta') {
      htmlContent = generateLabelHTML(template_data, template_config)
    } else if (template_type === 'romaneio') {
      htmlContent = generateRomaneioHTML(template_data, template_config)
    } else {
      throw new Error(`Tipo de template não suportado: ${template_type}`)
    }

    console.log('[generate-pdf-template] HTML gerado, tamanho:', htmlContent.length)

    // Simular geração de PDF (aqui você usaria uma lib como puppeteer ou similar)
    const pdfBuffer = await generatePDFFromHTML(htmlContent, template_config)

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${template_type}-${Date.now()}.pdf"`
      }
    })

  } catch (error) {
    console.error('[generate-pdf-template] Erro:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro interno na geração do PDF'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateLabelHTML(data: any, config: any): string {
  const { labels = [], layout = { rows: 2, cols: 2 }, format = 'A4' } = data
  const { html_template = '', css_styles = '' } = config

  console.log('[generateLabelHTML] Processando', labels.length, 'etiquetas')

  const labelsPerPage = layout.rows * layout.cols
  const totalPages = Math.ceil(labels.length / labelsPerPage)

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .page {
          page-break-after: always;
          width: ${format === 'A4' ? '210mm' : '80mm'};
          min-height: ${format === 'A4' ? '297mm' : '200mm'};
          display: grid;
          grid-template-rows: repeat(${layout.rows}, 1fr);
          grid-template-columns: repeat(${layout.cols}, 1fr);
          gap: 2mm;
          padding: 10mm;
          box-sizing: border-box;
        }
        .label-item {
          border: 1px solid #ddd;
          padding: 4mm;
          box-sizing: border-box;
          overflow: hidden;
        }
        ${css_styles}
      </style>
    </head>
    <body>
  `

  for (let page = 0; page < totalPages; page++) {
    const startIndex = page * labelsPerPage
    const pageLabels = labels.slice(startIndex, startIndex + labelsPerPage)
    
    html += '<div class="page">'
    
    for (let i = 0; i < labelsPerPage; i++) {
      const label = pageLabels[i]
      if (label) {
        let labelHtml = html_template || `
          <div style="text-align: center;">
            <h3 style="margin: 0; font-size: 12px;">\${name}</h3>
            <p style="margin: 2px 0; font-size: 10px;">SKU: \${sku}</p>
            <p style="margin: 2px 0; font-size: 14px; font-weight: bold;">R$ \${price}</p>
            \${barcode ? '<div style="font-family: monospace; font-size: 8px; margin-top: 4px;">' + barcode + '</div>' : ''}
          </div>
        `
        
        // Substituir variáveis
        labelHtml = labelHtml
          .replace(/\$\{name\}/g, label.name || '')
          .replace(/\$\{sku\}/g, label.sku || '')
          .replace(/\$\{price\}/g, (label.price || 0).toFixed(2))
          .replace(/\$\{barcode\}/g, label.barcode || '')
          .replace(/\$\{qr_code\}/g, label.qr_code || '')
          
        html += `<div class="label-item">${labelHtml}</div>`
      } else {
        html += '<div class="label-item"></div>'
      }
    }
    
    html += '</div>'
  }

  html += '</body></html>'
  return html
}

function generateRomaneioHTML(data: any, config: any): string {
  // Implementação básica para romaneio
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Romaneio</title>
      <style>
        body { margin: 20px; font-family: Arial, sans-serif; }
        h1 { text-align: center; }
        .info { margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>ROMANEIO</h1>
      <div class="info">
        <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
      </div>
      <div class="info">
        <strong>Dados:</strong> ${JSON.stringify(data)}
      </div>
    </body>
    </html>
  `
}

async function generatePDFFromHTML(html: string, config: any): Promise<ArrayBuffer> {
  // Esta é uma implementação mock - em produção você usaria uma lib como puppeteer
  // Por enquanto, retornamos um PDF simples como demonstração
  
  console.log('[generatePDFFromHTML] Gerando PDF mock')
  
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Criar um PDF básico mock (em produção usar puppeteer ou similar)
  const encoder = new TextEncoder()
  const mockPdf = encoder.encode(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
384
%%EOF`)

  return mockPdf.buffer
}
