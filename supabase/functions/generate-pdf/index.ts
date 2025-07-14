
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
        price: parseFloat(item.price || '0').toFixed(2),
        total: (parseFloat(item.price || '0') * parseInt(item.quantity || '0')).toFixed(2)
      })),
      total_value: parseFloat(maleta.total_value || '0').toFixed(2),
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
        format: 'a4'
      })
      
      // Set font
      doc.setFont('helvetica')
      
      // Header
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 0)
      doc.text('ROMANEIO DE MALETA', 105, 20, { align: 'center' })
      
      doc.setFontSize(16)
      doc.text(`Maleta: ${templateData_final.maleta_number}`, 105, 30, { align: 'center' })
      
      // Representative info
      doc.setFontSize(12)
      let yPos = 50
      doc.text(`Representante: ${templateData_final.representative_name}`, 20, yPos)
      yPos += 8
      doc.text(`Data de Saída: ${templateData_final.departure_date}`, 20, yPos)
      yPos += 8
      doc.text(`Data de Devolução: ${templateData_final.return_date}`, 20, yPos)
      yPos += 15
      
      // Items table header
      doc.setFontSize(10)
      doc.setFillColor(242, 242, 242)
      doc.rect(20, yPos, 170, 8, 'F')
      doc.text('Item', 25, yPos + 5)
      doc.text('SKU', 40, yPos + 5)
      doc.text('Produto', 70, yPos + 5)
      doc.text('Qtd', 130, yPos + 5)
      doc.text('Valor Unit.', 145, yPos + 5)
      doc.text('Total', 170, yPos + 5)
      yPos += 8
      
      // Items
      templateData_final.items.forEach((item: any, index: number) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        
        doc.text(String(index + 1), 25, yPos + 5)
        doc.text(item.sku || 'N/A', 40, yPos + 5)
        doc.text(item.name || 'N/A', 70, yPos + 5)
        doc.text(String(item.quantity || 0), 130, yPos + 5)
        doc.text(`R$ ${item.price || '0.00'}`, 145, yPos + 5)
        doc.text(`R$ ${item.total || '0.00'}`, 170, yPos + 5)
        yPos += 6
      })
      
      // Totals
      yPos += 10
      doc.setFontSize(12)
      doc.text(`Total de Itens: ${templateData_final.total_items}`, 20, yPos)
      yPos += 8
      doc.text(`Valor Total: R$ ${templateData_final.total_value}`, 20, yPos)
      
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
