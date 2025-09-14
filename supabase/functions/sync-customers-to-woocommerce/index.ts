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

    const { organization_id, customer_id, operation, customer_data } = await req.json();

    console.log(`Sincronizando cliente ${customer_id} para WooCommerce - operação: ${operation}`);

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
    const apiUrl = `${wcConfig.url}/wp-json/wc/v3/customers`;
    const auth = btoa(`${wcConfig.consumer_key}:${wcConfig.consumer_secret}`);

    let result;

    switch (operation) {
      case 'create':
        // Create customer in WooCommerce
        const createResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customer_data),
        });

        if (!createResponse.ok) {
          const error = await createResponse.text();
          throw new Error(`Erro ao criar cliente no WooCommerce: ${error}`);
        }

        result = await createResponse.json();
        
        // Update local customer with WooCommerce ID
        await supabaseClient
          .from('wc_customers')
          .update({ 
            id: result.id,
            synced_at: new Date().toISOString() 
          })
          .eq('id', customer_id)
          .eq('organization_id', organization_id);

        break;

      case 'update':
        // Update customer in WooCommerce
        const updateResponse = await fetch(`${apiUrl}/${customer_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customer_data),
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          throw new Error(`Erro ao atualizar cliente no WooCommerce: ${error}`);
        }

        result = await updateResponse.json();

        // Update sync timestamp
        await supabaseClient
          .from('wc_customers')
          .update({ synced_at: new Date().toISOString() })
          .eq('id', customer_id)
          .eq('organization_id', organization_id);

        break;

      case 'delete':
        // Delete customer in WooCommerce
        const deleteResponse = await fetch(`${apiUrl}/${customer_id}?force=true`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        });

        if (!deleteResponse.ok) {
          const error = await deleteResponse.text();
          throw new Error(`Erro ao deletar cliente no WooCommerce: ${error}`);
        }

        result = await deleteResponse.json();

        // Remove from local database
        await supabaseClient
          .from('wc_customers')
          .delete()
          .eq('id', customer_id)
          .eq('organization_id', organization_id);

        break;

      default:
        throw new Error(`Operação não suportada: ${operation}`);
    }

    console.log(`Cliente ${customer_id} sincronizado com sucesso no WooCommerce`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        message: `Cliente ${operation}d com sucesso no WooCommerce`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização do cliente:', error);
    
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