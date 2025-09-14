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

    const { organization_id, order_id, operation, order_data } = await req.json();

    console.log(`Sincronizando pedido ${order_id} para WooCommerce - operação: ${operation}`);

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
    
    // Prepare WooCommerce API URL
    const apiUrl = `${wcConfig.url}/wp-json/wc/v3/orders`;
    const auth = btoa(`${wcConfig.consumer_key}:${wcConfig.consumer_secret}`);

    let result;

    switch (operation) {
      case 'create':
        // Create order in WooCommerce
        const createResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order_data),
        });

        if (!createResponse.ok) {
          const error = await createResponse.text();
          throw new Error(`Erro ao criar pedido no WooCommerce: ${error}`);
        }

        result = await createResponse.json();
        
        // Update local order with WooCommerce ID and number
        await supabaseClient
          .from('wc_orders')
          .update({ 
            id: result.id,
            number: result.number,
            synced_at: new Date().toISOString() 
          })
          .eq('id', order_id)
          .eq('organization_id', organization_id);

        break;

      case 'update':
        // Update order in WooCommerce
        const updateResponse = await fetch(`${apiUrl}/${order_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order_data),
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          throw new Error(`Erro ao atualizar pedido no WooCommerce: ${error}`);
        }

        result = await updateResponse.json();

        // Update sync timestamp
        await supabaseClient
          .from('wc_orders')
          .update({ synced_at: new Date().toISOString() })
          .eq('id', order_id)
          .eq('organization_id', organization_id);

        break;

      case 'delete':
        // Delete/cancel order in WooCommerce
        const deleteResponse = await fetch(`${apiUrl}/${order_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        });

        if (!deleteResponse.ok) {
          const error = await deleteResponse.text();
          throw new Error(`Erro ao cancelar pedido no WooCommerce: ${error}`);
        }

        result = await deleteResponse.json();

        // Update local order status
        await supabaseClient
          .from('wc_orders')
          .update({ 
            status: 'cancelled',
            synced_at: new Date().toISOString() 
          })
          .eq('id', order_id)
          .eq('organization_id', organization_id);

        break;

      default:
        throw new Error(`Operação não suportada: ${operation}`);
    }

    console.log(`Pedido ${order_id} sincronizado com sucesso no WooCommerce`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        message: `Pedido ${operation}d com sucesso no WooCommerce`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização do pedido:', error);
    
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