import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { organizationId } = await req.json()
    
    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting product cleanup for organization:', organizationId)

    // 1. Delete products with SKU starting with "USC"
    console.log('Deleting USC products...')
    const { data: deletedProducts, error: deleteError } = await supabaseClient
      .from('wc_products')
      .delete()
      .like('sku', 'USC%')

    if (deleteError) {
      console.error('Error deleting USC products:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete USC products', details: deleteError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('USC products deleted successfully')

    // 2. Update products with NULL organization_id to the specified organization
    console.log('Updating products with NULL organization_id...')
    const { data: updatedProducts, error: updateError } = await supabaseClient
      .from('wc_products')
      .update({ organization_id: organizationId })
      .is('organization_id', null)

    if (updateError) {
      console.error('Error updating products organization_id:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update products organization_id', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Products organization_id updated successfully')

    // 3. Get final count of products for the organization
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
        message: 'Product cleanup completed successfully',
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