
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { template_type, template_data, template_config } = await req.json()
    
    console.log('Generating PDF for template:', template_type)
    console.log('Template data:', template_data)

    // Aqui seria a lógica para gerar o PDF
    // Por enquanto, vamos simular a geração
    const htmlContent = template_config.html_template || `
      <html>
        <head>
          <style>
            ${template_config.css_styles || ''}
            body { font-family: Arial, sans-serif; margin: 20px; }
            .label { border: 1px solid #ccc; padding: 10px; margin: 10px; }
            .product-name { font-weight: bold; font-size: 16px; }
            .sku { color: #666; font-size: 12px; }
            .price { color: #e74c3c; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${template_data.name || 'Produto'}</div>
            <div class="sku">SKU: ${template_data.sku || 'N/A'}</div>
            <div class="price">R$ ${template_data.price || '0,00'}</div>
          </div>
        </body>
      </html>
    `

    // Simular resposta de PDF (em produção, usar biblioteca como puppeteer)
    const pdfData = new TextEncoder().encode(htmlContent)

    return new Response(pdfData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${template_type}-${Date.now()}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar PDF',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})
