
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Import jsPDF from CDN for PDF generation
import jsPDF from 'https://cdn.skypack.dev/jspdf@2.5.1'

interface PdfRequest {
  maleta_id: string;
  template_type?: string;
}

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

    console.log('Step 5: Generating PDF...')

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
        price: parseFloat(item.price || '0').toFixed(2).replace('.', ','),
        total: (parseFloat(item.price || '0') * parseInt(item.quantity || '0')).toFixed(2).replace('.', ',')
      })),
      total_value: parseFloat(maleta.total_value || '0').toFixed(2).replace('.', ','),
      total_items: (maleta.maleta_items || []).reduce((sum: number, item: any) => sum + parseInt(item.quantity || '0'), 0),
      current_date: new Date().toLocaleDateString('pt-BR')
    }

    console.log('Template data prepared - items count:', templateData_final.items.length)

    console.log('Step 8: Generating PDF...')
    
    // Generate PDF using jsPDF
    try {
      console.log('Creating PDF document...')
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
      })
      
      // Set font to support Portuguese characters
      doc.setFont('helvetica', 'normal')
      
      // Header - Romaneio title
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text(`Romaneio #${templateData_final.maleta_number.replace('MAL', '')}`, 20, 25)
      
      // Left column - Consultant info
      doc.setFontSize(10)
      let yPos = 45
      doc.text(`Consultor(a): ${templateData_final.representative_name}`, 20, yPos)
      yPos += 6
      doc.text(`E-mail: ${templateData_final.representative_email}`, 20, yPos)
      yPos += 6
      doc.text('WhatsApp: Nao informado', 20, yPos)
      yPos += 6
      doc.text(`Data Inicio: ${templateData_final.departure_date}`, 20, yPos)
      yPos += 6
      doc.text(`Data Devolucao: ${templateData_final.return_date}`, 20, yPos)
      
      // Right column - Company info
      yPos = 45
      doc.text('Rie Joias', 120, yPos)
      yPos += 6
      doc.text('(11) 99116-0623 - contato@userie.com.br', 120, yPos)
      yPos += 6
      doc.text('Rua Pedro Calmon, 61 - Bela Vista', 120, yPos)
      yPos += 6
      doc.text('Santo Andre - SP - CEP: 09040-140', 120, yPos)
      yPos += 6
      doc.text('54.740.743/0001-27', 120, yPos)
      yPos += 6
      doc.text('Instagram: @riejoias', 120, yPos)
      
      // Table header
      yPos = 90
      doc.setFontSize(9)
      doc.setFillColor(230, 230, 230)
      doc.rect(20, yPos, 170, 8, 'F')
      
      // Table borders
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.1)
      doc.rect(20, yPos, 15, 8) // ID
      doc.rect(35, yPos, 25, 8) // Código
      doc.rect(60, yPos, 80, 8) // Descrição
      doc.rect(140, yPos, 25, 8) // Quantidade
      doc.rect(165, yPos, 25, 8) // Valor
      
      doc.text('ID', 25, yPos + 5)
      doc.text('Código', 40, yPos + 5)
      doc.text('Descrição', 65, yPos + 5)
      doc.text('Quantidade', 145, yPos + 5)
      doc.text('Valor', 170, yPos + 5)
      yPos += 8
      
      // Items
      templateData_final.items.forEach((item: any, index: number) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        // Row borders
        doc.rect(20, yPos, 15, 8) // ID
        doc.rect(35, yPos, 25, 8) // Código
        doc.rect(60, yPos, 80, 8) // Descrição
        doc.rect(140, yPos, 25, 8) // Quantidade
        doc.rect(165, yPos, 25, 8) // Valor
        
        doc.text(String(index + 1), 25, yPos + 5)
        doc.text(item.sku || '', 37, yPos + 5)
        
        // Handle long product names
        const productName = item.name || ''
        if (productName.length > 35) {
          doc.text(productName.substring(0, 32) + '...', 62, yPos + 5)
        } else {
          doc.text(productName, 62, yPos + 5)
        }
        
        doc.text(String(item.quantity || 0), 147, yPos + 5)
        doc.text(`R$ ${item.price || '0,00'}`, 167, yPos + 5)
        yPos += 8
      })
      
      // Summary
      yPos += 10
      doc.setFontSize(11)
      doc.text(`Valor total da maleta: R$ ${templateData_final.total_value.replace('.', ',')}`, 20, yPos)
      yPos += 8
      doc.text(`Quantidade total de produtos: ${templateData_final.total_items}`, 20, yPos)
      
      // Date and signature
      yPos += 30
      doc.text(templateData_final.current_date, 20, yPos)
      yPos += 20
      doc.line(20, yPos, 80, yPos)
      yPos += 5
      doc.text(templateData_final.representative_name, 20, yPos)
      
      // Commission section - Left column
      yPos += 20
      doc.setFontSize(9)
      doc.text('Comissao de vendas', 20, yPos)
      yPos += 6
      doc.text('Ate R$ 500,00 - Varejo (0%)', 20, yPos)
      yPos += 4
      doc.text('De R$ 200,00 a R$ 1.500,00 - 20% = R$ 50,00', 20, yPos)
      yPos += 4
      doc.text('De R$ 1.500,01 a R$ 3.000,00 - 30% = R$ 150,00', 20, yPos)
      yPos += 4
      doc.text('Acima de R$ 3.000,00 - 40% = R$ 200,00', 20, yPos)
      yPos += 6
      doc.text('Bonus especial', 20, yPos)
      yPos += 4
      doc.text('A revendedora que alcancar o primeiro lugar no mes podera escolher', 20, yPos)
      yPos += 4
      doc.text('qualquer peca da loja. A pessoa precisa vender mais que R$ 1.000,00', 20, yPos)
      yPos += 4
      doc.text('para ter o beneficio.', 20, yPos)
      
      // Right column indicators - Reset yPos to align with left column
      let rightYPos = 244 // Start at same level as commission section
      doc.text('Indicacao de revendedoras', 120, rightYPos)
      rightYPos += 4
      doc.text('Quem indica uma nova revendedora e ficar responsavel por ela ganhara 10%', 120, rightYPos)
      rightYPos += 4
      doc.text('sobre tudo o que ela vender. Essa e uma unica oportunidade para aumentar', 120, rightYPos)
      rightYPos += 4
      doc.text('seus ganhos!', 120, rightYPos)
      rightYPos += 6
      doc.text('Metas', 120, rightYPos)
      rightYPos += 4
      doc.text('Acima = Pagamento integral', 120, rightYPos)
      rightYPos += 4
      doc.text('1 dia de atraso - -1%', 120, rightYPos)
      rightYPos += 4
      doc.text('2 dias de atraso - -2%', 120, rightYPos)
      rightYPos += 4
      doc.text('3 dias de atraso - -3% ... e assim por diante.', 120, rightYPos)
      
      console.log('PDF document created successfully')
      
      // Generate PDF buffer
      const pdfBuffer = doc.output('arraybuffer')
      
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
