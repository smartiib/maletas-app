import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { organization_id, batch_size = 10 } = await req.json();

    console.log(`Processando fila de sincronização para organização ${organization_id}`);

    // Get pending sync items
    const { data: syncItems, error: fetchError } = await supabaseClient
      .from('sync_queue')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batch_size);

    if (fetchError) {
      throw new Error(`Erro ao buscar itens da fila: ${fetchError.message}`);
    }

    if (!syncItems || syncItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          message: 'Nenhum item pendente na fila'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processed = [];
    const failed = [];

    // Process each sync item
    for (const item of syncItems) {
      try {
        // Mark as syncing
        await supabaseClient
          .from('sync_queue')
          .update({ 
            status: 'syncing',
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Determine which sync function to call
        let functionName = '';
        switch (item.entity_type) {
          case 'customer':
            functionName = 'sync-customers-to-woocommerce';
            break;
          case 'product':
            functionName = 'sync-products-to-woocommerce';
            break;
          case 'order':
            functionName = 'sync-orders-to-woocommerce';
            break;
          case 'category':
            functionName = 'sync-categories-to-woocommerce';
            break;
          default:
            throw new Error(`Tipo de entidade não suportado: ${item.entity_type}`);
        }

        // Call the appropriate sync function
        const syncResult = await supabaseClient.functions.invoke(functionName, {
          body: {
            organization_id: item.organization_id,
            [`${item.entity_type}_id`]: item.entity_id,
            operation: item.operation,
            [`${item.entity_type}_data`]: item.data,
          },
        });

        if (syncResult.error) {
          throw new Error(syncResult.error.message || 'Erro na sincronização');
        }

        // Mark as completed
        await supabaseClient
          .from('sync_queue')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        processed.push({
          id: item.id,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          operation: item.operation
        });

        console.log(`Item ${item.id} processado com sucesso`);

      } catch (error) {
        console.error(`Erro ao processar item ${item.id}:`, error);

        const shouldRetry = item.attempts < item.max_attempts;
        const nextStatus = shouldRetry ? 'pending' : 'failed';
        const nextScheduled = shouldRetry 
          ? new Date(Date.now() + Math.pow(2, item.attempts) * 60000).toISOString() // Exponential backoff
          : null;

        // Mark as failed or retry
        await supabaseClient
          .from('sync_queue')
          .update({ 
            status: nextStatus,
            last_error: error.message,
            scheduled_at: nextScheduled,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        failed.push({
          id: item.id,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          operation: item.operation,
          error: error.message,
          will_retry: shouldRetry
        });
      }
    }

    console.log(`Processamento concluído: ${processed.length} sucessos, ${failed.length} falhas`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: processed.length,
        failed: failed.length,
        details: {
          processed,
          failed
        },
        message: `Processados ${processed.length} itens, ${failed.length} falhas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no processamento da fila:', error);
    
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