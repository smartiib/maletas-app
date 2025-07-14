import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Import jsPDF from CDN for PDF generation
import jsPDF from 'https://cdn.skypack.dev/jspdf@2.5.1'

interface PdfRequest {
  maleta_id: string;
  template_type?: string;
}

// Função seletiva para corrigir apenas strings com problemas de codificação
function fixUTF8OnlyIfNeeded(str: string): string {
  try {
    if (typeof str !== 'string') return String(str);
    
    // Só aplica correção se a string contém caracteres mal codificados
    if (str.includes('ï¿½')) {
      // Mapeia os caracteres problemáticos conhecidos para suas versões corretas
      const charMap: { [key: string]: string } = {
        'Inspiraï¿½ï¿½o': 'Inspiração',
        'Coraï¿½ï¿½o': 'Coração',
        'Pï¿½rolas': 'Pérolas',
        'Zircï¿½nias': 'Zircônias',
        'ï¿½ï¿½o': 'ão',
        'ï¿½ï¿½': 'ã'
      };
      
      let result = str;
      
      // Aplica as correções específicas
      for (const [wrong, correct] of Object.entries(charMap)) {
        result = result.replace(new RegExp(wrong, 'g'), correct);
      }
      
      // Remove qualquer ï¿½ restante
      result = result.replace(/ï¿½/g, '');
      
      return result;
    }
    
    // Se não tem problemas de codificação, retorna a string original
    return str;
  } catch {
    return str;
  }
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
      // Não aplica correção em dados que já estão corretos
      maleta_number: maleta.number || 'N/A',
      representative_name: maleta.representatives?.name || 'N/A',
      representative_email: maleta.representatives?.email || 'N/A',
      representative_phone: maleta.representatives?.phone || 'N/A',
      departure_date: maleta.departure_date ? new Date(maleta.departure_date).toLocaleDateString('pt-BR') : 'N/A',
      return_date: maleta.return_date ? new Date(maleta.return_date).toLocaleDateString('pt-BR') : 'N/A',
      items: (maleta.maleta_items || []).map((item: any, index: number) => ({
        ...item,
        index: index + 1,
        // Aplica correção apenas nos nomes dos produtos que podem ter problemas
        name: fixUTF8OnlyIfNeeded(item.name || ''),
        sku: item.sku || '', // SKU geralmente não tem problemas de codificação
        price: parseFloat(item.price || '0').toFixed(2).replace('.', ','),
        total: (parseFloat(item.price || '0') * parseInt(item.quantity || '0')).toFixed(2).replace('.', ',')
      })),
      total_value: parseFloat(maleta.total_value || '0').toFixed(2).replace('.', ','),
      total_items: (maleta.maleta_items || []).reduce((sum: number, item: any) => sum + parseInt(item.quantity || '0'), 0),
      current_date: new Date().toLocaleDateString('pt-BR')
    }

    console.log('Template data prepared - items count:', templateData_final.items.length)
    console.log('Sample item name after processing:', templateData_final.items[0]?.name)

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
      doc.text('WhatsApp: Não informado', 20, yPos)
      yPos += 6
      doc.text(`Data Início: ${templateData_final.departure_date}`, 20, yPos)
      yPos += 6
      doc.text(`Data Devolução: ${templateData_final.return_date}`, 20, yPos)
      
      // Right column - Company info
      yPos = 45
      doc.text('Rie Joias', 120, yPos)
      yPos += 6
      doc.text('(11) 99116-0623 - contato@userie.com.br', 120, yPos)
      yPos += 6
      doc.text('Rua Pedro Calmon, 61 - Bela Vista', 120, yPos)
      yPos += 6
      doc.text('Santo André - SP - CEP: 09040-140', 120, yPos)
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
      doc.rect(35, yPos, 25, 8) // Codigo
      doc.rect(60, yPos, 80, 8) // Descricao
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
        doc.rect(35, yPos, 25, 8) // Codigo
        doc.rect(60, yPos, 80, 8) // Descricao
        doc.rect(140, yPos, 25, 8) // Quantidade
        doc.rect(165, yPos, 25, 8) // Valor
        
        doc.text(String(index + 1), 25, yPos + 5)
        doc.text(item.sku || '', 37, yPos + 5)
        
        // Handle long product names com codificação correta
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
      
      // Footer section - All in single column with smaller font (30% smaller)
      yPos += 20
      doc.setFontSize(6) // Reduced from 9 to 6 (about 30% smaller)
      const lineSpacing = 3 // Compact line spacing
      
      doc.text('Comissão de vendas', 20, yPos)
      yPos += lineSpacing
      doc.text('Até R$ 500,00 - Varejo (0%)', 20, yPos)
      yPos += lineSpacing
      doc.text('De R$ 200,00 a R$ 1.500,00 - 20% = R$ 50,00', 20, yPos)
      yPos += lineSpacing
      doc.text('De R$ 1.500,01 a R$ 3.000,00 - 30% = R$ 150,00', 20, yPos)
      yPos += lineSpacing
      doc.text('Acima de R$ 3.000,00 - 40% = R$ 200,00', 20, yPos)
      yPos += lineSpacing + 1
      
      doc.text('Bônus especial', 20, yPos)
      yPos += lineSpacing
      doc.text('A revendedora que alcançar o primeiro lugar no mês poderá escolher', 20, yPos)
      yPos += lineSpacing
      doc.text('qualquer peça da loja. A pessoa precisa vender mais que R$ 1.000,00', 20, yPos)
      yPos += lineSpacing
      doc.text('para ter o benefício.', 20, yPos)
      yPos += lineSpacing + 1
      
      doc.text('Indicação de revendedoras', 20, yPos)
      yPos += lineSpacing
      doc.text('Quem indica uma nova revendedora e ficar responsável por ela ganhará 10%', 20, yPos)
      yPos += lineSpacing
      doc.text('sobre tudo o que ela vender. Essa é uma única oportunidade para aumentar', 20, yPos)
      yPos += lineSpacing
      doc.text('seus ganhos!', 20, yPos)
      yPos += lineSpacing + 1
      
      doc.text('Metas', 20, yPos)
      yPos += lineSpacing
      doc.text('Acima = Pagamento integral', 20, yPos)
      yPos += lineSpacing
      doc.text('1 dia de atraso - -1%', 20, yPos)
      yPos += lineSpacing
      doc.text('2 dias de atraso - -2%', 20, yPos)
      yPos += lineSpacing
      doc.text('3 dias de atraso - -3% ... e assim por diante.', 20, yPos)
      
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

