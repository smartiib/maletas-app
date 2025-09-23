import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface SyncRequest {
  operation: 'discover' | 'sync_to_wc' | 'sync_from_wc' | 'reconcile' | 'process_queue';
  organizationId: string;
  config?: WooCommerceConfig;
  entityType?: 'products' | 'customers' | 'orders' | 'categories';
  entityIds?: number[];
  batchSize?: number;
  maxRetries?: number;
}

interface WooCommerceConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

interface SyncDiscoveryResult {
  totalItems: number;
  missingIds: number[];
  changedIds: number[];
  toCreateInWooCommerce: any[];
  toUpdateInWooCommerce: any[];
  toDeleteInWooCommerce: number[];
  conflicts: any[];
  lastModified: string | null;
}

const logger = {
  log: (message: string, data?: any) => console.log(`[SyncManager] ${message}`, data),
  error: (message: string, error?: any) => console.error(`[SyncManager] ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[SyncManager] ${message}`, data)
};

/**
 * Get WooCommerce configuration from organization settings
 */
async function getWooCommerceConfig(organizationId: string): Promise<WooCommerceConfig | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (error || !data?.settings) {
    logger.error('Failed to get WooCommerce config', error);
    return null;
  }

  const settings = data.settings as any;
  const wcUrl = settings.woocommerce_url;
  const wcKey = settings.woocommerce_consumer_key;
  const wcSecret = settings.woocommerce_consumer_secret;

  if (!wcUrl || !wcKey || !wcSecret) {
    logger.error('Incomplete WooCommerce configuration');
    return null;
  }

  return {
    url: wcUrl,
    consumer_key: wcKey,
    consumer_secret: wcSecret
  };
}

/**
 * Fetch all product metadata from WooCommerce
 */
async function fetchWooCommerceProducts(config: WooCommerceConfig): Promise<any[]> {
  const allProducts: any[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = new URL(`${config.url}/wp-json/wc/v3/products`);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    url.searchParams.set('status', 'any');
    url.searchParams.set('_fields', 'id,date_modified,name,sku,type,status,price,regular_price,sale_price,stock_quantity,stock_status');
    // Using Basic Auth header instead of query params for better compatibility
    // url.searchParams.set('consumer_key', config.consumer_key);
    // url.searchParams.set('consumer_secret', config.consumer_secret);

    try {
      // Try multiple authentication methods for compatibility
      let response;
      
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // Method 1: Try Basic Auth with proper encoding
      try {
        const credentials = `${config.consumer_key}:${config.consumer_secret}`;
        const base64Credentials = btoa(credentials);
        
        response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${base64Credentials}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Lovable-Sync-Manager/1.0'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        // Check for auth errors and try fallback
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          const errorText = await response.text();
          logger.warn(`Auth failed with Basic header (${response.status}), trying query params. Error: ${errorText}`);
          throw new Error(`Auth failed: ${response.status}`);
        }
      } catch (authError) {
        clearTimeout(timeoutId);
        logger.warn(`Basic Auth failed, trying query params for page ${page}`, authError);
        
        // Method 2: Fallback to query parameters
        url.searchParams.set('consumer_key', config.consumer_key);
        url.searchParams.set('consumer_secret', config.consumer_secret);
        
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 30000);
        
        response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Lovable-Sync-Manager/1.0'
          },
          signal: controller2.signal
        });
        clearTimeout(timeoutId2);
      }
      if (!response.ok) {
        const errorBody = await response.text();
        let parsedError;
        try {
          parsedError = JSON.parse(errorBody);
        } catch (e) {
          parsedError = { message: errorBody };
        }
        
        logger.error(`Error fetching WooCommerce products page ${page}`, {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
          parsedError
        });
        
        const errorMessage = parsedError?.message || response.statusText || 'Unknown error';
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Erro de autenticação WooCommerce (${response.status}): ${errorMessage}. Verifique suas credenciais nas configurações.`);
        }
        throw new Error(`WooCommerce API error: ${response.status} - ${errorMessage}`);
      }

      const products = await response.json();
      if (!products || products.length === 0) break;

      allProducts.push(...products);
      if (products.length < perPage) break;
      page++;

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error(`Error fetching WooCommerce products page ${page}`, error);
      throw error;
    }
  }

  return allProducts;
}

/**
 * Discover products that need synchronization (bidirectional)
 */
async function discoverChanges(request: SyncRequest): Promise<SyncDiscoveryResult> {
  const { organizationId, config: providedConfig } = request;
  logger.log('Starting bidirectional discovery', { organizationId });

  const config = providedConfig || await getWooCommerceConfig(organizationId);
  if (!config) {
    throw new Error('WooCommerce configuration not found');
  }

  // Validate and normalize WooCommerce URL format
  let normalizedUrl = config.url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  if (!normalizedUrl.endsWith('/')) {
    normalizedUrl += '/';
  }
  config.url = normalizedUrl;
  
  logger.log('Using WooCommerce URL:', config.url);

  // 1. Fetch WooCommerce products
  let wooProducts;
  try {
    wooProducts = await fetchWooCommerceProducts(config);
  } catch (error) {
    // Update sync status with error
    await supabase
      .from('sync_status')
      .upsert({
        organization_id: organizationId,
        sync_type: 'products',
        status: 'error',
        last_discover_at: new Date().toISOString(),
        metadata: {
          error: error.message,
          error_type: 'woocommerce_auth_error'
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,sync_type'
      });
    
    throw error;
  }
  logger.log(`Found ${wooProducts.length} products in WooCommerce`);

  // 2. Fetch local products
  const { data: localProducts, error: localError } = await supabase
    .from('wc_products')
    .select('id, date_modified, synced_at')
    .eq('organization_id', organizationId);

  if (localError) {
    throw new Error(`Failed to fetch local products: ${localError.message}`);
  }

  // 3. Fetch sync queue for local changes
  const { data: queueItems, error: queueError } = await supabase
    .from('sync_queue')
    .select('entity_id, operation, entity_type, data')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'products')
    .eq('status', 'pending');

  if (queueError) {
    logger.warn('Failed to fetch sync queue', queueError);
  }

  // 4. Build comparison maps
  const localProductsMap = new Map<number, any>();
  (localProducts || []).forEach(p => {
    localProductsMap.set(p.id, p);
  });

  const wooProductsMap = new Map<number, any>();
  wooProducts.forEach(p => {
    wooProductsMap.set(p.id, p);
  });

  // 5. Analyze differences
  const missingIds: number[] = [];
  const changedIds: number[] = [];
  const toCreateInWooCommerce: any[] = [];
  const toUpdateInWooCommerce: any[] = [];
  const toDeleteInWooCommerce: number[] = [];
  const conflicts: any[] = [];
  let lastModified: string | null = null;

  // WooCommerce → Local changes
  for (const wooProduct of wooProducts) {
    const localProduct = localProductsMap.get(wooProduct.id);
    
    if (!localProduct) {
      missingIds.push(wooProduct.id);
    } else if (wooProduct.date_modified !== localProduct.date_modified) {
      changedIds.push(wooProduct.id);
    }
    
    if (!lastModified || wooProduct.date_modified > lastModified) {
      lastModified = wooProduct.date_modified;
    }
  }

  // Local → WooCommerce changes (from sync queue)
  const localChanges = new Map<number, any>();
  (queueItems || []).forEach(item => {
    const existingChange = localChanges.get(item.entity_id);
    if (!existingChange || item.operation === 'delete') {
      localChanges.set(item.entity_id, item);
    }
  });

  for (const [entityId, queueItem] of localChanges) {
    switch (queueItem.operation) {
      case 'create':
        if (!wooProductsMap.has(entityId)) {
          toCreateInWooCommerce.push({
            id: entityId,
            data: queueItem.data
          });
        } else {
          conflicts.push({
            id: entityId,
            type: 'create_conflict',
            local: queueItem.data,
            woocommerce: wooProductsMap.get(entityId)
          });
        }
        break;
      
      case 'update':
        if (wooProductsMap.has(entityId)) {
          toUpdateInWooCommerce.push({
            id: entityId,
            data: queueItem.data
          });
        } else {
          conflicts.push({
            id: entityId,
            type: 'update_missing',
            local: queueItem.data
          });
        }
        break;
      
      case 'delete':
        if (wooProductsMap.has(entityId)) {
          toDeleteInWooCommerce.push(entityId);
        }
        break;
    }
  }

  // Update sync status
  await supabase
    .from('sync_status')
    .upsert({
      organization_id: organizationId,
      sync_type: 'products',
      status: 'discovered',
      total_items: wooProducts.length,
      processed_items: 0,
      last_discover_at: new Date().toISOString(),
      metadata: {
        woocommerce_count: wooProducts.length,
        local_count: localProducts?.length || 0,
        missing_from_local: missingIds.length,
        changed_in_woo: changedIds.length,
        to_create_in_woo: toCreateInWooCommerce.length,
        to_update_in_woo: toUpdateInWooCommerce.length,
        to_delete_in_woo: toDeleteInWooCommerce.length,
        conflicts: conflicts.length,
        last_modified: lastModified
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'organization_id,sync_type'
    });

  const result = {
    totalItems: wooProducts.length,
    missingIds,
    changedIds,
    toCreateInWooCommerce,
    toUpdateInWooCommerce,
    toDeleteInWooCommerce,
    conflicts,
    lastModified
  };

  logger.log('Discovery completed', {
    total: result.totalItems,
    missing: result.missingIds.length,
    changed: result.changedIds.length,
    toCreateInWoo: result.toCreateInWooCommerce.length,
    toUpdateInWoo: result.toUpdateInWooCommerce.length,
    toDeleteInWoo: result.toDeleteInWooCommerce.length,
    conflicts: result.conflicts.length
  });

  return result;
}

/**
 * Sync products from WooCommerce to local database
 */
async function syncFromWooCommerce(request: SyncRequest) {
  const { organizationId, config: providedConfig, entityIds = [], batchSize = 25 } = request;
  logger.log('Syncing from WooCommerce to local', { organizationId, entityIds: entityIds.length });

  const config = providedConfig || await getWooCommerceConfig(organizationId);
  if (!config) {
    throw new Error('WooCommerce configuration not found');
  }

  let processed = 0;
  let errors = 0;
  const failedIds: number[] = [];

  // Process in batches
  for (let i = 0; i < entityIds.length; i += batchSize) {
    const batch = entityIds.slice(i, i + batchSize);
    
    try {
      // Fetch products from WooCommerce
      const products = [];
      for (const productId of batch) {
        try {
          const url = new URL(`${config.url}/wp-json/wc/v3/products/${productId}`);
          // Using Basic Auth header instead of query params
          // url.searchParams.set('consumer_key', config.consumer_key);
          // url.searchParams.set('consumer_secret', config.consumer_secret);

          // Try multiple authentication methods
          let response;
          
          // Create timeout controller
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          try {
            const credentials = `${config.consumer_key}:${config.consumer_secret}`;
            const base64Credentials = btoa(credentials);
            
            response = await fetch(url.toString(), {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Lovable-Sync-Manager/1.0'
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
          } catch (authError) {
            clearTimeout(timeoutId);
            // Fallback to query parameters
            url.searchParams.set('consumer_key', config.consumer_key);
            url.searchParams.set('consumer_secret', config.consumer_secret);
            
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 15000);
            
            response = await fetch(url.toString(), {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Lovable-Sync-Manager/1.0'
              },
              signal: controller2.signal
            });
            clearTimeout(timeoutId2);
          }
          if (response.ok) {
            const product = await response.json();
            products.push(product);
          } else {
            logger.warn(`Failed to fetch product ${productId}: ${response.status}`);
            failedIds.push(productId);
            errors++;
          }
        } catch (error) {
          logger.error(`Error fetching product ${productId}`, error);
          failedIds.push(productId);
          errors++;
        }
      }

      // Upsert products to local database
      if (products.length > 0) {
        const productsData = products.map(product => ({
          id: product.id,
          name: product.name || '',
          sku: product.sku || null,
          type: product.type || 'simple',
          status: product.status || 'publish',
          description: product.description || null,
          short_description: product.short_description || null,
          permalink: product.permalink || null,
          price: parseFloat(product.price) || 0,
          regular_price: parseFloat(product.regular_price) || 0,
          sale_price: parseFloat(product.sale_price) || 0,
          on_sale: !!product.on_sale,
          featured: !!product.featured,
          catalog_visibility: product.catalog_visibility || 'visible',
          date_created: product.date_created || null,
          date_modified: product.date_modified || null,
          stock_quantity: parseInt(product.stock_quantity) || 0,
          stock_status: product.stock_status || 'instock',
          manage_stock: !!product.manage_stock,
          backorders: product.backorders || 'no',
          weight: product.weight || null,
          categories: Array.isArray(product.categories) ? product.categories : [],
          tags: Array.isArray(product.tags) ? product.tags : [],
          images: Array.isArray(product.images) ? product.images : [],
          attributes: Array.isArray(product.attributes) ? product.attributes : [],
          meta_data: Array.isArray(product.meta_data) ? product.meta_data : [],
          synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: organizationId
        }));

        const { error: upsertError } = await supabase
          .from('wc_products')
          .upsert(productsData, { onConflict: 'id,organization_id' });

        if (upsertError) {
          logger.error('Failed to upsert products', upsertError);
          errors += products.length;
          failedIds.push(...products.map(p => p.id));
        } else {
          processed += products.length;
          logger.log(`Batch ${Math.floor(i/batchSize) + 1}: ${products.length} products synced`);
        }
      }

      // Small delay between batches
      if (i + batchSize < entityIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      logger.error(`Batch error`, error);
      errors += batch.length;
      failedIds.push(...batch);
    }
  }

  // Update sync status
  await supabase
    .from('sync_status')
    .upsert({
      organization_id: organizationId,
      sync_type: 'products',
      status: processed === entityIds.length ? 'completed' : 'partial',
      processed_items: processed,
      last_sync_at: new Date().toISOString(),
      metadata: {
        sync_direction: 'from_woocommerce',
        requested: entityIds.length,
        processed,
        errors,
        failed_ids: failedIds
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'organization_id,sync_type'
    });

  return { processed, errors, failedIds };
}

/**
 * Process sync queue items
 */
async function processQueue(request: SyncRequest) {
  const { organizationId, batchSize = 10, maxRetries = 3 } = request;
  logger.log('Processing sync queue', { organizationId });

  const config = await getWooCommerceConfig(organizationId);
  if (!config) {
    throw new Error('WooCommerce configuration not found');
  }

  // Get pending queue items
  const { data: queueItems, error: queueError } = await supabase
    .from('sync_queue')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .lt('attempts', maxRetries)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (queueError) {
    throw new Error(`Failed to fetch queue items: ${queueError.message}`);
  }

  if (!queueItems || queueItems.length === 0) {
    return { processed: 0, errors: 0, skipped: 0 };
  }

  let processed = 0;
  let errors = 0;
  let skipped = 0;

  for (const item of queueItems) {
    try {
      // Mark as processing
      await supabase
        .from('sync_queue')
        .update({ 
          status: 'processing',
          attempts: item.attempts + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      let success = false;

      switch (item.entity_type) {
        case 'products':
          success = await processProductQueueItem(config, item);
          break;
        case 'customers':
          success = await processCustomerQueueItem(config, item);
          break;
        case 'orders':
          success = await processOrderQueueItem(config, item);
          break;
        default:
          logger.warn(`Unknown entity type: ${item.entity_type}`);
          skipped++;
          continue;
      }

      if (success) {
        // Mark as completed
        await supabase
          .from('sync_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        processed++;
      } else {
        // Mark as failed if max retries reached
        const shouldFail = item.attempts + 1 >= maxRetries;
        await supabase
          .from('sync_queue')
          .update({
            status: shouldFail ? 'failed' : 'pending',
            last_error: 'Processing failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        errors++;
      }

    } catch (error) {
      logger.error(`Error processing queue item ${item.id}`, error);
      
      // Update error info
      const shouldFail = item.attempts + 1 >= maxRetries;
      await supabase
        .from('sync_queue')
        .update({
          status: shouldFail ? 'failed' : 'pending',
          last_error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      errors++;
    }

    // Small delay between items
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { processed, errors, skipped };
}

/**
 * Process individual product queue item
 */
async function processProductQueueItem(config: WooCommerceConfig, item: any): Promise<boolean> {
  // Prepare authentication
  const credentials = `${config.consumer_key}:${config.consumer_secret}`;
  const auth = btoa(credentials);
  
  try {
    switch (item.operation) {
      case 'create': {
        const url = `${config.url}/wp-json/wc/v3/products`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Lovable-Sync-Manager/1.0'
          },
          body: JSON.stringify(item.data),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const createdProduct = await response.json();
          // Update local product with WooCommerce ID
          await supabase
            .from('wc_products')
            .update({ 
              id: createdProduct.id,
              synced_at: new Date().toISOString()
            })
            .eq('id', item.entity_id)
            .eq('organization_id', item.organization_id);
          return true;
        }
        break;
      }
      
      case 'update': {
        const url = `${config.url}/wp-json/wc/v3/products/${item.entity_id}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Lovable-Sync-Manager/1.0'
          },
          body: JSON.stringify(item.data),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          // Update local sync timestamp
          await supabase
            .from('wc_products')
            .update({ synced_at: new Date().toISOString() })
            .eq('id', item.entity_id)
            .eq('organization_id', item.organization_id);
          return true;
        }
        break;
      }
      
      case 'delete': {
        const url = `${config.url}/wp-json/wc/v3/products/${item.entity_id}?force=true`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Lovable-Sync-Manager/1.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          // Remove from local database
          await supabase
            .from('wc_products')
            .delete()
            .eq('id', item.entity_id)
            .eq('organization_id', item.organization_id);
          return true;
        }
        break;
      }
    }
  } catch (error) {
    logger.error(`Product queue item processing failed`, error);
    return false;
  }
  
  return false;
}

/**
 * Process individual customer queue item  
 */
async function processCustomerQueueItem(config: WooCommerceConfig, item: any): Promise<boolean> {
  // Similar implementation for customers
  return true; // Placeholder
}

/**
 * Process individual order queue item
 */
async function processOrderQueueItem(config: WooCommerceConfig, item: any): Promise<boolean> {
  // Similar implementation for orders
  return true; // Placeholder
}

/**
 * Main request handler
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      }
    });
  }

  try {
    let request: SyncRequest;
    
    // Parse JSON with timeout
    try {
      const requestText = await req.text();
      request = JSON.parse(requestText);
    } catch (parseError) {
      logger.error('Failed to parse request JSON', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON request'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    logger.log('Received request', { operation: request.operation, organizationId: request.organizationId });

    let result;

    switch (request.operation) {
      case 'discover':
        result = await discoverChanges(request);
        break;
      
      case 'sync_from_wc':
        result = await syncFromWooCommerce(request);
        break;
      
      case 'process_queue':
        result = await processQueue(request);
        break;
      
      default:
        throw new Error(`Unknown operation: ${request.operation}`);
    }

    return new Response(JSON.stringify({
      success: true,
      operation: request.operation,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Request failed', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});