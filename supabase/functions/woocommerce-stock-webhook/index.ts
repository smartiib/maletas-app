import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types
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

interface ProcessingResult {
  success: boolean;
  message: string;
  results?: any[];
  order_id?: number;
  history_id?: string;
  error?: string;
}

// Webhook signature validation
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
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Webhook logging
async function logWebhookEvent(
  supabase: any,
  payload: WooCommerceWebhookPayload,
  req: Request,
  status: string = 'received'
) {
  const { error } = await supabase
    .from('webhook_logs')
    .insert({
      event_type: payload.line_items ? 'order' : 'product',
      event_data: payload,
      status,
      source_ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
      webhook_id: payload.id
    });

  if (error) {
    console.error('Error logging webhook:', error);
  }
}

// Stock history management
async function addStockHistoryEntry(
  supabase: any,
  params: {
    productId: number;
    variationId?: number | null;
    type: string;
    quantityChange: number;
    previousStock: number;
    newStock: number;
    reason: string;
    source: string;
    wcOrderId?: number;
    metadata: Record<string, any>;
  }
) {
  return await supabase.rpc('add_stock_history_entry', {
    p_product_id: params.productId,
    p_variation_id: params.variationId,
    p_type: params.type,
    p_quantity_change: params.quantityChange,
    p_previous_stock: params.previousStock,
    p_new_stock: params.newStock,
    p_reason: params.reason,
    p_source: params.source,
    p_user_id: null,
    p_user_name: 'WooCommerce',
    p_wc_order_id: params.wcOrderId,
    p_metadata: params.metadata
  });
}

async function getLastStockEntry(
  supabase: any,
  productId: number,
  variationId: number | null = null
) {
  const query = supabase
    .from('stock_history')
    .select('new_stock')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (variationId) {
    query.eq('variation_id', variationId);
  } else {
    query.is('variation_id', null);
  }

  return await query;
}

// Order processing
async function handleOrderUpdate(
  supabase: any, 
  payload: WooCommerceWebhookPayload
): Promise<ProcessingResult> {
  console.log('Processing order update:', payload.id, payload.status);
  
  if (!payload.line_items || payload.line_items.length === 0) {
    return { 
      success: true, 
      message: 'No line items to process' 
    };
  }

  // Only process completed or processing orders
  if (!['completed', 'processing'].includes(payload.status || '')) {
    return { 
      success: true, 
      message: `Order status '${payload.status}' does not require stock processing` 
    };
  }

  const results = [];

  for (const item of payload.line_items) {
    try {
      const { data: lastEntry } = await getLastStockEntry(
        supabase, 
        item.product_id, 
        item.variation_id
      );
      
      const previousStock = lastEntry?.[0]?.new_stock || item.stock_quantity || 0;
      const newStock = previousStock - item.quantity;
      
      const { data, error } = await addStockHistoryEntry(supabase, {
        productId: item.product_id,
        variationId: item.variation_id,
        type: 'sale',
        quantityChange: -item.quantity,
        previousStock,
        newStock,
        reason: `Venda - Pedido #${payload.id}`,
        source: 'woocommerce',
        wcOrderId: payload.id,
        metadata: {
          order_status: payload.status,
          item_name: item.name,
          item_sku: item.sku,
          webhook_time: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error adding stock history:', error);
        results.push({ 
          item_id: item.id, 
          success: false, 
          error: error.message 
        });
      } else {
        results.push({ 
          item_id: item.id, 
          success: true, 
          history_id: data 
        });
        console.log(`Stock updated for product ${item.product_id}: ${previousStock} → ${newStock}`);
      }
    } catch (error) {
      console.error('Error processing item:', item.id, error);
      results.push({ 
        item_id: item.id, 
        success: false, 
        error: error.message 
      });
    }
  }

  return { 
    success: true, 
    results, 
    order_id: payload.id, 
    message: `Processed ${results.length} items` 
  };
}

// Product processing
async function handleProductUpdate(
  supabase: any, 
  payload: WooCommerceWebhookPayload
): Promise<ProcessingResult> {
  console.log('Processing product update:', payload.id, 'stock:', payload.stock_quantity);
  
  try {
    const productId = payload.id;
    const newStock = payload.stock_quantity || 0;
    
    const { data: lastEntry } = await getLastStockEntry(supabase, productId);
    const previousStock = lastEntry?.[0]?.new_stock || 0;
    const quantityChange = newStock - previousStock;
    
    // Only register if there's a change
    if (quantityChange === 0) {
      return { 
        success: true, 
        message: 'No stock change detected' 
      };
    }

    const { data, error } = await addStockHistoryEntry(supabase, {
      productId,
      variationId: null,
      type: 'sync',
      quantityChange,
      previousStock,
      newStock,
      reason: 'Sincronização automática via webhook',
      source: 'woocommerce',
      metadata: {
        product_name: payload.name,
        product_sku: payload.sku,
        webhook_time: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Error adding product stock history:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    console.log(`Product ${productId} stock updated: ${previousStock} → ${newStock} (${quantityChange > 0 ? '+' : ''}${quantityChange})`);
    
    return { 
      success: true, 
      message: 'Product stock updated successfully', 
      history_id: data 
    };
  } catch (error) {
    console.error('Error processing product update:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Main webhook handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse webhook payload
    const payloadText = await req.text();
    const payload: WooCommerceWebhookPayload = JSON.parse(payloadText);
    
    console.log('Received webhook for:', payload.id, 'with data:', Object.keys(payload));

    // Log webhook event
    await logWebhookEvent(supabase, payload, req);

    // Validate webhook signature if secret is configured
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

    // Process webhook based on content type
    let result: ProcessingResult;
    
    if (payload.line_items) {
      result = await handleOrderUpdate(supabase, payload);
    } else if (payload.stock_quantity !== undefined) {
      result = await handleProductUpdate(supabase, payload);
    } else {
      console.log('Unknown webhook payload structure');
      result = { 
        success: true, 
        message: 'Webhook received but not processed' 
      };
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