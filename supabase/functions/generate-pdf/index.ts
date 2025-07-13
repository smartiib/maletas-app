import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

interface PdfRequest {
  maleta_id: string;
  template_type?: string;
}

serve(async (req) => {
  console.log('=== PDF Generation Function Started ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...')
    const requestBody = await req.text()
    console.log('Raw request body:', requestBody)
    
    let parsedBody
    try {
      parsedBody = JSON.parse(requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const { maleta_id, template_type = 'romaneio' }: PdfRequest = parsedBody
    console.log('Extracted params:', { maleta_id, template_type })

    if (!maleta_id) {
      console.error('Missing maleta_id parameter')
      return new Response(
        JSON.stringify({ error: 'maleta_id é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('Environment check:')
    console.log('SUPABASE_URL exists:', !!supabaseUrl)
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseKey)

    // Buscar dados da maleta
    console.log('Fetching maleta data for ID:', maleta_id)
    const maletaResponse = await fetch(`${supabaseUrl}/rest/v1/maletas?id=eq.${maleta_id}&select=*,maleta_items(*),representatives(*)`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Maleta response status:', maletaResponse.status)
    console.log('Maleta response headers:', Object.fromEntries(maletaResponse.headers.entries()))

    if (!maletaResponse.ok) {
      const errorText = await maletaResponse.text()
      console.error('Maleta fetch error:', errorText)
      throw new Error(`Erro ao buscar dados da maleta: ${errorText}`)
    }

    const maletaData = await maletaResponse.json()
    console.log('Maleta data:', JSON.stringify(maletaData, null, 2))
    
    if (!maletaData || maletaData.length === 0) {
      console.error('No maleta found with ID:', maleta_id)
      return new Response(
        JSON.stringify({ error: 'Maleta não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const maleta = maletaData[0]
    console.log('Selected maleta:', JSON.stringify(maleta, null, 2))

    // Buscar template de PDF
    console.log('Fetching PDF template for type:', template_type)
    const templateResponse = await fetch(`${supabaseUrl}/rest/v1/pdf_templates?type=eq.${template_type}&is_active=eq.true&is_default=eq.true&select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Template response status:', templateResponse.status)

    if (!templateResponse.ok) {
      const errorText = await templateResponse.text()
      console.error('Template fetch error:', errorText)
      throw new Error(`Erro ao buscar template de PDF: ${errorText}`)
    }

    const templateData = await templateResponse.json()
    console.log('Template data:', JSON.stringify(templateData, null, 2))
    
    if (!templateData || templateData.length === 0) {
      console.error('No template found for type:', template_type)
      return new Response(
        JSON.stringify({ error: 'Template de PDF não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const template = templateData[0]

    // Preparar dados para o template
    const templateData_final = {
      maleta_number: maleta.number,
      representative_name: maleta.representatives?.name || 'N/A',
      representative_email: maleta.representatives?.email || 'N/A',
      representative_phone: maleta.representatives?.phone || 'N/A',
      departure_date: new Date(maleta.departure_date).toLocaleDateString('pt-BR'),
      return_date: new Date(maleta.return_date).toLocaleDateString('pt-BR'),
      items: maleta.maleta_items?.map((item: any, index: number) => ({
        ...item,
        index: index + 1,
        price: parseFloat(item.price).toFixed(2)
      })) || [],
      total_value: parseFloat(maleta.total_value || '0').toFixed(2),
      total_items: maleta.maleta_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      current_date: new Date().toLocaleDateString('pt-BR'),
      commission_percentage: maleta.commission_settings?.tiers?.[0]?.percentage || 0,
      commission_tiers: maleta.commission_settings?.use_global ? maleta.commission_settings?.tiers : null
    }

    // Processar template com substituições melhoradas
    let htmlContent = template.html_template
    
    console.log('Processando template com dados:', templateData_final)
    
    // Substituir variáveis básicas
    Object.entries(templateData_final).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`{{${key}}}`, 'g')
        htmlContent = htmlContent.replace(regex, String(value))
      }
    })

    // Processar loop de items
    const itemsMatch = htmlContent.match(/{{#each items}}([\s\S]*?){{\/each}}/s)
    if (itemsMatch && templateData_final.items.length > 0) {
      const itemTemplate = itemsMatch[1]
      let itemsHtml = ''
      
      templateData_final.items.forEach((item: any, index: number) => {
        let itemHtml = itemTemplate
        itemHtml = itemHtml.replace(/{{@index}}/g, String(index + 1))
        itemHtml = itemHtml.replace(/{{sku}}/g, item.sku)
        itemHtml = itemHtml.replace(/{{name}}/g, item.name)
        itemHtml = itemHtml.replace(/{{quantity}}/g, String(item.quantity))
        itemHtml = itemHtml.replace(/{{price}}/g, item.price)
        itemsHtml += itemHtml
      })
      
      htmlContent = htmlContent.replace(/{{#each items}}[\s\S]*?{{\/each}}/s, itemsHtml)
    }

    // Processar condicional de commission_tiers
    const commissionMatch = htmlContent.match(/{{#if commission_tiers}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/s)
    if (commissionMatch) {
      if (templateData_final.commission_tiers) {
        const tiersTemplate = commissionMatch[1]
        let tiersHtml = ''
        
        templateData_final.commission_tiers.forEach((tier: any) => {
          let tierHtml = tiersTemplate
          tierHtml = tierHtml.replace(/{{label}}/g, tier.label)
          tierHtml = tierHtml.replace(/{{min_amount}}/g, String(tier.min_amount))
          tierHtml = tierHtml.replace(/{{max_amount}}/g, tier.max_amount ? String(tier.max_amount) : '∞')
          tierHtml = tierHtml.replace(/{{percentage}}/g, String(tier.percentage))
          tierHtml = tierHtml.replace(/{{bonus}}/g, String(tier.bonus))
          tiersHtml += tierHtml
        })
        
        htmlContent = htmlContent.replace(/{{#if commission_tiers}}[\s\S]*?{{\/if}}/s, tiersHtml)
      } else {
        const elseTemplate = commissionMatch[2]
        htmlContent = htmlContent.replace(/{{#if commission_tiers}}[\s\S]*?{{\/if}}/s, elseTemplate)
      }
    }

    // Criar HTML completo
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${template.css_styles}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `

    // Gerar PDF usando Puppeteer
    console.log('Iniciando geração de PDF com Puppeteer...')
    console.log('HTML length:', fullHtml.length)
    
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })
      console.log('Browser launched successfully')
      
      const page = await browser.newPage()
      console.log('New page created')
      
      // Configurar a página para A4
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' })
      console.log('Content set successfully')
      
      // Gerar PDF
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
    
      console.log('PDF gerado com sucesso!')
      
      // Retornar PDF como resposta
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Maleta-${maleta.number}-Romaneio.pdf"`
        }
      })
    } catch (puppeteerError) {
      console.error('Puppeteer error:', puppeteerError)
      if (browser) {
        await browser.close()
      }
      throw new Error(`Erro no Puppeteer: ${puppeteerError.message}`)
    }

  } catch (error) {
    console.error('=== PDF Generation Error ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error object:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message,
        name: error.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})