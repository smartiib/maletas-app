
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface PdfRequest {
  maleta_id: string;
  template_type?: string;
}

// Template padrão de fallback caso não encontre no banco
const DEFAULT_TEMPLATE = {
  html_template: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Romaneio - Maleta {{maleta_number}}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info-section { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .totals { margin-top: 20px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ROMANEIO DE MALETA</h1>
        <h2>Maleta: {{maleta_number}}</h2>
      </div>
      
      <div class="info-section">
        <p><strong>Representante:</strong> {{representative_name}}</p>
        <p><strong>Data de Saída:</strong> {{departure_date}}</p>
        <p><strong>Data de Devolução:</strong> {{return_date}}</p>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>SKU</th>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Valor Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{@index}}</td>
            <td>{{sku}}</td>
            <td>{{name}}</td>
            <td>{{quantity}}</td>
            <td>R$ {{price}}</td>
            <td>R$ {{total}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      
      <div class="totals">
        <p><strong>Total de Itens:</strong> {{total_items}}</p>
        <p><strong>Valor Total:</strong> R$ {{total_value}}</p>
      </div>
    </body>
    </html>
  `,
  css_styles: '',
  type: 'romaneio',
  format: 'A4'
};

serve(async (req) => {
  console.log('=== PDF Generation Function Started ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Step 1: Parsing request body...')
    const requestBody = await req.text()
    console.log('Raw request body:', requestBody)
    
    if (!requestBody || requestBody.trim() === '') {
      throw new Error('Request body is empty')
    }
    
    let parsedBody: PdfRequest
    try {
      parsedBody = JSON.parse(requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error(`Invalid JSON in request body: ${parseError.message}`)
    }
    
    const { maleta_id, template_type = 'romaneio' } = parsedBody
    console.log('Extracted params:', { maleta_id, template_type })

    if (!maleta_id) {
      throw new Error('maleta_id é obrigatório')
    }

    console.log('Step 2: Checking environment variables...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    console.log('Environment OK - SUPABASE_URL exists:', !!supabaseUrl)

    console.log('Step 3: Fetching maleta data for ID:', maleta_id)
    const maletaResponse = await fetch(`${supabaseUrl}/rest/v1/maletas?id=eq.${maleta_id}&select=*,maleta_items(*),representatives(*)`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Maleta response status:', maletaResponse.status)

    if (!maletaResponse.ok) {
      const errorText = await maletaResponse.text()
      console.error('Maleta fetch error:', errorText)
      throw new Error(`Erro ao buscar dados da maleta: ${maletaResponse.status} - ${errorText}`)
    }

    const maletaData = await maletaResponse.json()
    console.log('Maleta data length:', maletaData?.length)
    
    if (!maletaData || maletaData.length === 0) {
      throw new Error(`Maleta não encontrada com ID: ${maleta_id}`)
    }

    const maleta = maletaData[0]
    console.log('Step 4: Maleta found:', maleta.number)
    console.log('Items count:', maleta.maleta_items?.length || 0)

    console.log('Step 5: Fetching PDF template...')
    let template = DEFAULT_TEMPLATE;
    
    try {
      const templateResponse = await fetch(`${supabaseUrl}/rest/v1/pdf_templates?type=eq.${template_type}&is_active=eq.true&is_default=eq.true&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      })
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json()
        if (templateData && templateData.length > 0) {
          template = templateData[0];
          console.log('Custom template found:', template.name || 'Unnamed')
        } else {
          console.log('No custom template found, using default template')
        }
      } else {
        console.log('Template fetch failed, using default template')
      }
    } catch (templateError) {
      console.error('Template fetch error (using default):', templateError.message)
    }

    console.log('Step 6: Preparing template data...')
    const templateData_final = {
      maleta_number: maleta.number || 'N/A',
      representative_name: maleta.representatives?.name || 'N/A',
      representative_email: maleta.representatives?.email || 'N/A',
      representative_phone: maleta.representatives?.phone || 'N/A',
      departure_date: maleta.departure_date ? new Date(maleta.departure_date).toLocaleDateString('pt-BR') : 'N/A',
      return_date: maleta.return_date ? new Date(maleta.return_date).toLocaleDateString('pt-BR') : 'N/A',
      items: (maleta.maleta_items || []).map((item: any, index: number) => ({
        ...item,
        index: index + 1,
        price: parseFloat(item.price || '0').toFixed(2),
        total: (parseFloat(item.price || '0') * parseInt(item.quantity || '0')).toFixed(2)
      })),
      total_value: parseFloat(maleta.total_value || '0').toFixed(2),
      total_items: (maleta.maleta_items || []).reduce((sum: number, item: any) => sum + parseInt(item.quantity || '0'), 0),
      current_date: new Date().toLocaleDateString('pt-BR')
    }

    console.log('Template data prepared - items count:', templateData_final.items.length)

    console.log('Step 7: Processing template...')
    let htmlContent = template.html_template
    
    // Simple template variable replacement
    Object.entries(templateData_final).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`{{${key}}}`, 'g')
        htmlContent = htmlContent.replace(regex, String(value))
      }
    })

    // Process items loop
    if (templateData_final.items.length > 0) {
      const itemsMatch = htmlContent.match(/{{#each items}}([\s\S]*?){{\/each}}/s)
      if (itemsMatch) {
        const itemTemplate = itemsMatch[1]
        let itemsHtml = ''
        
        templateData_final.items.forEach((item: any, index: number) => {
          let itemHtml = itemTemplate
          itemHtml = itemHtml.replace(/{{@index}}/g, String(index + 1))
          itemHtml = itemHtml.replace(/{{sku}}/g, item.sku || 'N/A')
          itemHtml = itemHtml.replace(/{{name}}/g, item.name || 'N/A')
          itemHtml = itemHtml.replace(/{{quantity}}/g, String(item.quantity || 0))
          itemHtml = itemHtml.replace(/{{price}}/g, item.price || '0.00')
          itemHtml = itemHtml.replace(/{{total}}/g, item.total || '0.00')
          itemsHtml += itemHtml
        })
        
        htmlContent = htmlContent.replace(/{{#each items}}[\s\S]*?{{\/each}}/s, itemsHtml)
      }
    } else {
      // Remove the items loop if no items
      htmlContent = htmlContent.replace(/{{#each items}}[\s\S]*?{{\/each}}/s, '<tr><td colspan="6">Nenhum item encontrado</td></tr>')
    }

    console.log('Step 8: Generating PDF...')
    console.log('HTML content length:', htmlContent.length)

    // Try to use a simpler PDF generation approach
    try {
      // Import Puppeteer
      const puppeteer = await import("https://deno.land/x/puppeteer@16.2.0/mod.ts")
      
      console.log('Puppeteer imported, launching browser...')
      
      const browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      })
      
      console.log('Browser launched successfully')
      
      const page = await browser.newPage()
      console.log('New page created')
      
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      })
      console.log('Content set successfully')
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      })
      
      console.log('PDF generated successfully, size:', pdfBuffer.length)
      
      await browser.close()
      console.log('Browser closed')
      
      console.log('Step 9: Returning PDF response')
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Maleta-${maleta.number}-Romaneio.pdf"`
        }
      })
    } catch (pdfError) {
      console.error('PDF Generation Error:', pdfError)
      throw new Error(`Erro na geração do PDF: ${pdfError.message}`)
    }

  } catch (error) {
    console.error('=== COMPLETE ERROR DETAILS ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message,
        name: error.name,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
