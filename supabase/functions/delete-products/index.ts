import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { productIds, organizationId } = await req.json()
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Product IDs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Deleting ${productIds.length} products for organization:`, organizationId)
    console.log('Product IDs:', productIds)

    // Delete products with the specified IDs and organization
    const { data: deletedProducts, error: deleteError } = await supabaseClient
      .from('wc_products')
      .delete()
      .in('id', productIds)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting products:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete products', details: deleteError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Products deleted successfully')

    // Get final count of products for the organization
    const { count: finalCount, error: countError } = await supabaseClient
      .from('wc_products')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (countError) {
      console.error('Error getting final count:', countError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${productIds.length} produtos excluídos com sucesso`,
        deletedCount: productIds.length,
        finalProductCount: finalCount || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})