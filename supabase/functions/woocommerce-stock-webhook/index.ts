import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para validar a assinatura do webhook
async function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.log('Missing signature or secret for validation');
    return false;
  }

  try {
    // WooCommerce usa HMAC-SHA256 com formato base64
    const expectedSignature = await generateHmacSignature(payload, secret);
    const isValid = signature === expectedSignature;
    
    console.log('Webhook signature validation:', {
      received: signature.substring(0, 20) + '...',
      expected: expectedSignature.substring(0, 20) + '...',
      isValid
    });
    
    return isValid;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return base64Signature;
}

interface WooCommerceWebhookPayload {
  id: number;
  name?: string;
  sku?: string;
  stock_quantity?: number;
  status?: string;
  line_items?: Array<{
    id: number;
    product_id: number;
    variation_id: number | null;
    quantity: number;
    name: string;
    sku: string;
    stock_quantity?: number;
  }>;
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

    // Ler o payload como texto para validação de assinatura
    const payloadText = await req.text();
    const payload: WooCommerceWebhookPayload = JSON.parse(payloadText);
    
    console.log('Received webhook for:', payload.id, 'with data:', Object.keys(payload));

    // Log webhook para tracking
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: payload.line_items ? 'order' : 'product',
        event_data: payload,
        status: 'received',
        source_ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        webhook_id: payload.id
      });

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Validar assinatura do webhook se secret estiver configurado
    const webhookSecret = Deno.env.get('WOOCOMMERCE_WEBHOOK_SECRET');
    const webhookSignature = req.headers.get('X-WC-Webhook-Signature');
    
    if (webhookSecret) {
      const isValidSignature = await validateWebhookSignature(
        payloadText,
        webhookSignature,
        webhookSecret
      );
      
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }
      
      console.log('Webhook signature validated successfully');
    } else {
      console.warn('Webhook secret not configured - skipping signature validation');
    }

    let result;
    
    // Detectar tipo de webhook baseado no conteúdo
    if (payload.line_items) {
      // É um pedido
      result = await handleOrderUpdate(supabase, payload);
    } else if (payload.stock_quantity !== undefined) {
      // É um produto
      result = await handleProductUpdate(supabase, payload);
    } else {
      console.log('Unknown webhook payload structure');
      result = { success: true, message: 'Webhook received but not processed' };
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
        // Buscar último estoque do produto no histórico
        const { data: lastEntry } = await supabase
          .from('stock_history')
          .select('new_stock')
          .eq('product_id', item.product_id)
          .eq('variation_id', item.variation_id || null)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const previousStock = lastEntry?.[0]?.new_stock || item.stock_quantity || 0;
        const newStock = previousStock - item.quantity; // Reduzir estoque pela venda
        
        const { data, error } = await supabase.rpc('add_stock_history_entry', {
          p_product_id: item.product_id,
          p_variation_id: item.variation_id,
          p_type: 'sale',
          p_quantity_change: -item.quantity, // Negativo para venda
          p_previous_stock: previousStock,
          p_new_stock: newStock,
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

        if (error) {
          console.error('Error adding stock history:', error);
          results.push({ item_id: item.id, success: false, error: error.message });
        } else {
          results.push({ item_id: item.id, success: true, history_id: data });
          console.log(`Stock updated for product ${item.product_id}: ${previousStock} → ${newStock}`);
          
          // Log successful processing
          await supabase.from('webhook_logs').update({
            status: 'success',
            processing_time_ms: Date.now() - startTime
          }).eq('id', logId);
        }
      } catch (error) {
        console.error('Error processing item:', item.id, error);
        results.push({ item_id: item.id, success: false, error: error.message });
      }
    }
  }

  return { success: true, results, order_id: payload.id, message: `Processed ${results.length} items` };
}

async function handleProductUpdate(supabase: any, payload: WooCommerceWebhookPayload) {
  console.log('Processing product update:', payload.id, 'stock:', payload.stock_quantity);
  
  try {
    const productId = payload.id;
    const newStock = payload.stock_quantity || 0;
    
    // Buscar último registro de estoque para calcular mudança
    const { data: lastEntry } = await supabase
      .from('stock_history')
      .select('new_stock')
      .eq('product_id', productId)
      .is('variation_id', null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const previousStock = lastEntry?.[0]?.new_stock || 0;
    const quantityChange = newStock - previousStock;
    
    // Só registrar se houver mudança
    if (quantityChange !== 0) {
      const { data, error } = await supabase.rpc('add_stock_history_entry', {
        p_product_id: productId,
        p_variation_id: null,
        p_type: 'sync',
        p_quantity_change: quantityChange,
        p_previous_stock: previousStock,
        p_new_stock: newStock,
        p_reason: 'Sincronização automática via webhook',
        p_source: 'woocommerce',
        p_user_id: null,
        p_user_name: 'WooCommerce',
        p_metadata: {
          product_name: payload.name,
          product_sku: payload.sku,
          webhook_time: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error adding product stock history:', error);
        return { success: false, error: error.message };
      }

      console.log(`Product ${productId} stock updated: ${previousStock} → ${newStock} (${quantityChange > 0 ? '+' : ''}${quantityChange})`);
      return { success: true, message: 'Product stock updated successfully', history_id: data };
    }
    
    return { success: true, message: 'No stock change detected' };
  } catch (error) {
    console.error('Error processing product update:', error);
    return { success: false, error: error.message };
  }
}