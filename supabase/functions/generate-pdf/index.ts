import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

interface PdfRequest {
  maleta_id: string;
  template_type?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { maleta_id, template_type = 'romaneio' }: PdfRequest = await req.json()

    if (!maleta_id) {
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

    // Buscar dados da maleta
    const maletaResponse = await fetch(`${supabaseUrl}/rest/v1/maletas?id=eq.${maleta_id}&select=*,maleta_items(*),representatives(*)`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    })

    if (!maletaResponse.ok) {
      throw new Error('Erro ao buscar dados da maleta')
    }

    const maletaData = await maletaResponse.json()
    
    if (!maletaData || maletaData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Maleta não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const maleta = maletaData[0]

    // Buscar template de PDF
    const templateResponse = await fetch(`${supabaseUrl}/rest/v1/pdf_templates?type=eq.${template_type}&is_active=eq.true&is_default=eq.true&select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    })

    if (!templateResponse.ok) {
      throw new Error('Erro ao buscar template de PDF')
    }

    const templateData = await templateResponse.json()
    
    if (!templateData || templateData.length === 0) {
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

    // Renderizar template simples (sem Handlebars por simplicidade)
    let htmlContent = template.html_template
    
    // Substituir variáveis básicas
    Object.entries(templateData_final).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      }
    })

    // Tratar items (simplificado)
    if (templateData_final.items.length > 0) {
      let itemsHtml = ''
      templateData_final.items.forEach((item: any) => {
        itemsHtml += `
          <tr>
            <td>${item.index}</td>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>R$ ${item.price}</td>
          </tr>
        `
      })
      htmlContent = htmlContent.replace(/{{#each items}}.*?{{\/each}}/s, itemsHtml)
    }

    // Tratar commission_tiers
    if (templateData_final.commission_tiers) {
      let tiersHtml = ''
      templateData_final.commission_tiers.forEach((tier: any) => {
        tiersHtml += `<p>${tier.label}: De R$ ${tier.min_amount},00 a R$ ${tier.max_amount || '∞'} = ${tier.percentage}% + R$ ${tier.bonus},00</p>`
      })
      htmlContent = htmlContent.replace(/{{#if commission_tiers}}.*?{{else}}.*?{{\/if}}/s, tiersHtml)
    } else {
      const customCommission = `<p>Comissão personalizada: ${templateData_final.commission_percentage}%</p>`
      htmlContent = htmlContent.replace(/{{#if commission_tiers}}.*?{{else}}(.*?){{\/if}}/s, customCommission)
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
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Configurar a página para A4
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })
    
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
    
    await browser.close()
    
    console.log('PDF gerado com sucesso!')
    
    // Retornar PDF como resposta
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Maleta-${maleta.number}-Romaneio.pdf"`
      }
    })

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})