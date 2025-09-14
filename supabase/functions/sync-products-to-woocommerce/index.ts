import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WooCommerceConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { organization_id, product_id, operation, product_data, variation_id } = await req.json();

    console.log(`Sincronizando produto ${product_id} para WooCommerce - operação: ${operation}`);

    // Get WooCommerce configuration
    const { data: orgSettings } = await supabaseClient
      .from('organization_settings')
      .select('settings')
      .eq('organization_id', organization_id)
      .eq('key', 'woocommerce_config')
      .single();

    if (!orgSettings?.settings) {
      throw new Error('Configuração do WooCommerce não encontrada');
    }

    const wcConfig: WooCommerceConfig = orgSettings.settings;
    const auth = btoa(`${wcConfig.consumer_key}:${wcConfig.consumer_secret}`);

    let result;

    if (variation_id) {
      // Handle product variation sync
      const variationUrl = `${wcConfig.url}/wp-json/wc/v3/products/${product_id}/variations`;
      
      switch (operation) {
        case 'update':
          const updateVarResponse = await fetch(`${variationUrl}/${variation_id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(product_data),
          });

          if (!updateVarResponse.ok) {
            const error = await updateVarResponse.text();
            throw new Error(`Erro ao atualizar variação no WooCommerce: ${error}`);
          }

          result = await updateVarResponse.json();

          // Update sync timestamp
          await supabaseClient
            .from('wc_product_variations')
            .update({ synced_at: new Date().toISOString() })
            .eq('id', variation_id)
            .eq('parent_id', product_id);

          break;
      }
    } else {
      // Handle main product sync
      const productUrl = `${wcConfig.url}/wp-json/wc/v3/products`;

      switch (operation) {
        case 'create':
          const createResponse = await fetch(productUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(product_data),
          });

          if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`Erro ao criar produto no WooCommerce: ${error}`);
          }

          result = await createResponse.json();
          
          // Update local product with WooCommerce ID
          await supabaseClient
            .from('wc_products')
            .update({ 
              id: result.id,
              synced_at: new Date().toISOString() 
            })
            .eq('id', product_id)
            .eq('organization_id', organization_id);

          break;

        case 'update':
          const updateResponse = await fetch(`${productUrl}/${product_id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(product_data),
          });

          if (!updateResponse.ok) {
            const error = await updateResponse.text();
            throw new Error(`Erro ao atualizar produto no WooCommerce: ${error}`);
          }

          result = await updateResponse.json();

          // Update sync timestamp
          await supabaseClient
            .from('wc_products')
            .update({ synced_at: new Date().toISOString() })
            .eq('id', product_id)
            .eq('organization_id', organization_id);

          break;

        case 'delete':
          const deleteResponse = await fetch(`${productUrl}/${product_id}?force=true`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${auth}`,
            },
          });

          if (!deleteResponse.ok) {
            const error = await deleteResponse.text();
            throw new Error(`Erro ao deletar produto no WooCommerce: ${error}`);
          }

          result = await deleteResponse.json();

          // Remove from local database
          await supabaseClient
            .from('wc_products')
            .delete()
            .eq('id', product_id)
            .eq('organization_id', organization_id);

          break;

        default:
          throw new Error(`Operação não suportada: ${operation}`);
      }
    }

    console.log(`Produto ${product_id} sincronizado com sucesso no WooCommerce`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        message: `Produto ${operation}d com sucesso no WooCommerce`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização do produto:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});