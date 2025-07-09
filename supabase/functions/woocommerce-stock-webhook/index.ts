import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WooCommerceWebhookPayload {
  id: number;
  type: string; // 'order', 'product', etc.
  created_at: string;
  updated_at: string;
  line_items?: Array<{
    id: number;
    product_id: number;
    variation_id: number | null;
    quantity: number;
    name: string;
    sku: string;
  }>;
  status?: string;
  refunds?: Array<{
    id: number;
    amount: string;
    reason: string;
    line_items: Array<{
      product_id: number;
      variation_id: number | null;
      quantity: number;
    }>;
  }>;
  meta_data?: Array<{
    key: string;
    value: any;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: WooCommerceWebhookPayload = await req.json();
    console.log('Received webhook:', payload.type, payload.id);

    let result;
    
    switch (payload.type) {
      case 'order':
        result = await handleOrderUpdate(supabase, payload);
        break;
      case 'product':
        result = await handleProductUpdate(supabase, payload);
        break;
      default:
        console.log('Unhandled webhook type:', payload.type);
        result = { success: true, message: 'Webhook type not handled' };
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function handleOrderUpdate(supabase: any, payload: WooCommerceWebhookPayload) {
  console.log('Processing order update:', payload.id, payload.status);
  
  if (!payload.line_items || payload.line_items.length === 0) {
    return { success: true, message: 'No line items to process' };
  }

  const results = [];

  // Processar itens da venda
  if (payload.status === 'completed' || payload.status === 'processing') {
    for (const item of payload.line_items) {
      try {
        // Buscar estoque atual do WooCommerce (você precisará implementar esta chamada)
        const currentStock = await getCurrentStockFromWC(item.product_id, item.variation_id);
        const previousStock = currentStock + item.quantity; // Estoque antes da venda
        
        const { data, error } = await supabase.rpc('add_stock_history_entry', {
          p_product_id: item.product_id,
          p_variation_id: item.variation_id,
          p_type: 'sale',
          p_quantity_change: -item.quantity, // Negativo para venda
          p_previous_stock: previousStock,
          p_new_stock: currentStock,
          p_reason: `Venda - Pedido #${payload.id}`,
          p_source: 'woocommerce',
          p_user_id: null,
          p_user_name: 'WooCommerce',
          p_wc_order_id: payload.id,
          p_metadata: {
            order_status: payload.status,
            item_name: item.name,
            item_sku: item.sku,
            webhook_time: new Date().toISOString()
          }
        });

        if (error) {
          console.error('Error adding stock history:', error);
          results.push({ item_id: item.id, success: false, error: error.message });
        } else {
          results.push({ item_id: item.id, success: true, history_id: data });
        }
      } catch (error) {
        console.error('Error processing item:', item.id, error);
        results.push({ item_id: item.id, success: false, error: error.message });
      }
    }
  }

  // Processar reembolsos
  if (payload.refunds && payload.refunds.length > 0) {
    for (const refund of payload.refunds) {
      for (const item of refund.line_items) {
        try {
          const currentStock = await getCurrentStockFromWC(item.product_id, item.variation_id);
          const previousStock = currentStock - item.quantity; // Estoque antes do reembolso
          
          const { data, error } = await supabase.rpc('add_stock_history_entry', {
            p_product_id: item.product_id,
            p_variation_id: item.variation_id,
            p_type: 'refund',
            p_quantity_change: item.quantity, // Positivo para reembolso
            p_previous_stock: previousStock,
            p_new_stock: currentStock,
            p_reason: `Reembolso - ${refund.reason || 'Sem motivo especificado'}`,
            p_source: 'woocommerce',
            p_user_id: null,
            p_user_name: 'WooCommerce',
            p_wc_order_id: payload.id,
            p_metadata: {
              refund_id: refund.id,
              refund_amount: refund.amount,
              refund_reason: refund.reason,
              webhook_time: new Date().toISOString()
            }
          });

          if (error) {
            console.error('Error adding refund history:', error);
            results.push({ refund_item: item.product_id, success: false, error: error.message });
          } else {
            results.push({ refund_item: item.product_id, success: true, history_id: data });
          }
        } catch (error) {
          console.error('Error processing refund item:', item.product_id, error);
          results.push({ refund_item: item.product_id, success: false, error: error.message });
        }
      }
    }
  }

  return { success: true, results, order_id: payload.id };
}

async function handleProductUpdate(supabase: any, payload: WooCommerceWebhookPayload) {
  console.log('Processing product update:', payload.id);
  
  // Aqui você pode implementar lógica para detectar mudanças manuais de estoque
  // Comparando o estoque atual com o anterior armazenado
  
  return { success: true, message: 'Product update processed', product_id: payload.id };
}

// Função auxiliar para buscar estoque atual do WooCommerce
// Você precisará implementar isso usando a API do WooCommerce
async function getCurrentStockFromWC(productId: number, variationId: number | null): Promise<number> {
  // Esta é uma implementação placeholder
  // Você deve implementar a chamada real para a API do WooCommerce aqui
  console.log('Getting current stock for product:', productId, 'variation:', variationId);
  
  // Por enquanto, retorna 0 - você deve implementar a lógica real
  return 0;
}