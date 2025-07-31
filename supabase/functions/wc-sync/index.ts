import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface WooCommerceConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

interface SyncRequest {
  sync_type: 'products' | 'categories' | 'full';
  config: WooCommerceConfig;
  batch_size?: number;
  force_full_sync?: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  items_processed: number;
  items_failed: number;
  duration_ms: number;
  errors?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { sync_type, config, batch_size = 50, force_full_sync = false }: SyncRequest = await req.json();

    console.log(`Iniciando sincronização: ${sync_type} para usuário ${user.id}`);

    // Log início da sincronização
    await logSyncEvent(supabase, user.id, sync_type, 'sync_started', 'success', 
      `Iniciando sincronização de ${sync_type}`, { batch_size, force_full_sync });

    let result: SyncResult;

    switch (sync_type) {
      case 'products':
        result = await syncProducts(supabase, user.id, config, batch_size, force_full_sync);
        break;
      case 'categories':
        result = await syncCategories(supabase, user.id, config, batch_size, force_full_sync);
        break;
      case 'full':
        // Sincronizar categorias primeiro, depois produtos
        const categoriesResult = await syncCategories(supabase, user.id, config, batch_size, force_full_sync);
        const productsResult = await syncProducts(supabase, user.id, config, batch_size, force_full_sync);
        
        result = {
          success: categoriesResult.success && productsResult.success,
          message: `Categorias: ${categoriesResult.message}. Produtos: ${productsResult.message}`,
          items_processed: categoriesResult.items_processed + productsResult.items_processed,
          items_failed: categoriesResult.items_failed + productsResult.items_failed,
          duration_ms: Date.now() - startTime,
          errors: [...(categoriesResult.errors || []), ...(productsResult.errors || [])]
        };
        break;
      default:
        throw new Error(`Tipo de sincronização não suportado: ${sync_type}`);
    }

    // Log conclusão da sincronização
    await logSyncEvent(supabase, user.id, sync_type, 'sync_completed', 
      result.success ? 'success' : 'error', result.message, {
        items_processed: result.items_processed,
        items_failed: result.items_failed,
        duration_ms: result.duration_ms,
        errors: result.errors
      });

    // Atualizar configuração com última sincronização
    await updateSyncConfig(supabase, user.id, sync_type);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 500
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Erro interno do servidor',
      items_processed: 0,
      items_failed: 0,
      duration_ms: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function syncProducts(
  supabase: any, 
  userId: string, 
  config: WooCommerceConfig, 
  batchSize: number,
  forceFullSync: boolean
): Promise<SyncResult> {
  const startTime = Date.now();
  let itemsProcessed = 0;
  let itemsFailed = 0;
  const errors: string[] = [];

  try {
    console.log('Iniciando sincronização de produtos...');
    
    // Buscar configuração de sincronização para verificar última sincronização
    const { data: syncConfig } = await supabase
      .from('sync_config')
      .select('last_sync_at')
      .eq('user_id', userId)
      .eq('sync_type', 'products')
      .single();

    let page = 1;
    let hasMore = true;
    const lastSync = forceFullSync ? null : syncConfig?.last_sync_at;

    while (hasMore) {
      try {
        console.log(`Buscando página ${page} de produtos...`);
        
        // Fazer requisição para WooCommerce API
        const url = new URL(`${config.url}/wp-json/wc/v3/products`);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('per_page', batchSize.toString());
        url.searchParams.set('orderby', 'date');
        url.searchParams.set('order', 'desc');
        
        if (lastSync) {
          url.searchParams.set('modified_after', lastSync);
        }

        const auth = btoa(`${config.consumer_key}:${config.consumer_secret}`);
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`WooCommerce API erro: ${response.status} ${response.statusText}`);
        }

        const products = await response.json();
        
        if (!Array.isArray(products) || products.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Processando ${products.length} produtos...`);

        // Processar produtos em lote
        for (const product of products) {
          try {
            await upsertProduct(supabase, product);
            itemsProcessed++;
          } catch (error) {
            console.error(`Erro ao processar produto ${product.id}:`, error);
            errors.push(`Produto ${product.id}: ${error.message}`);
            itemsFailed++;
          }
        }

        // Se retornou menos produtos que o batch size, não há mais páginas
        if (products.length < batchSize) {
          hasMore = false;
        } else {
          page++;
        }

      } catch (error) {
        console.error(`Erro na página ${page}:`, error);
        errors.push(`Página ${page}: ${error.message}`);
        hasMore = false;
      }
    }

    const duration = Date.now() - startTime;
    const success = itemsFailed === 0;

    return {
      success,
      message: `Produtos sincronizados: ${itemsProcessed}, falhas: ${itemsFailed}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: duration,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Erro geral na sincronização de produtos:', error);
    return {
      success: false,
      message: `Erro na sincronização de produtos: ${error.message}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: Date.now() - startTime,
      errors: [error.message]
    };
  }
}

async function syncCategories(
  supabase: any, 
  userId: string, 
  config: WooCommerceConfig, 
  batchSize: number,
  forceFullSync: boolean
): Promise<SyncResult> {
  const startTime = Date.now();
  let itemsProcessed = 0;
  let itemsFailed = 0;
  const errors: string[] = [];

  try {
    console.log('Iniciando sincronização de categorias...');
    
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        console.log(`Buscando página ${page} de categorias...`);
        
        const url = new URL(`${config.url}/wp-json/wc/v3/products/categories`);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('per_page', batchSize.toString());
        url.searchParams.set('orderby', 'name');

        const auth = btoa(`${config.consumer_key}:${config.consumer_secret}`);
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`WooCommerce API erro: ${response.status} ${response.statusText}`);
        }

        const categories = await response.json();
        
        if (!Array.isArray(categories) || categories.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Processando ${categories.length} categorias...`);

        for (const category of categories) {
          try {
            await upsertCategory(supabase, category);
            itemsProcessed++;
          } catch (error) {
            console.error(`Erro ao processar categoria ${category.id}:`, error);
            errors.push(`Categoria ${category.id}: ${error.message}`);
            itemsFailed++;
          }
        }

        if (categories.length < batchSize) {
          hasMore = false;
        } else {
          page++;
        }

      } catch (error) {
        console.error(`Erro na página ${page}:`, error);
        errors.push(`Página ${page}: ${error.message}`);
        hasMore = false;
      }
    }

    return {
      success: itemsFailed === 0,
      message: `Categorias sincronizadas: ${itemsProcessed}, falhas: ${itemsFailed}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Erro geral na sincronização de categorias:', error);
    return {
      success: false,
      message: `Erro na sincronização de categorias: ${error.message}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: Date.now() - startTime,
      errors: [error.message]
    };
  }
}

async function upsertProduct(supabase: any, product: any) {
  const productData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    permalink: product.permalink,
    date_created: product.date_created,
    date_modified: product.date_modified,
    type: product.type,
    status: product.status,
    featured: product.featured,
    catalog_visibility: product.catalog_visibility,
    description: product.description,
    short_description: product.short_description,
    sku: product.sku,
    price: parseFloat(product.price) || null,
    regular_price: parseFloat(product.regular_price) || null,
    sale_price: parseFloat(product.sale_price) || null,
    date_on_sale_from: product.date_on_sale_from,
    date_on_sale_to: product.date_on_sale_to,
    on_sale: product.on_sale,
    purchasable: product.purchasable,
    total_sales: product.total_sales,
    virtual: product.virtual,
    downloadable: product.downloadable,
    downloads: product.downloads,
    download_limit: product.download_limit,
    download_expiry: product.download_expiry,
    external_url: product.external_url,
    button_text: product.button_text,
    tax_status: product.tax_status,
    tax_class: product.tax_class,
    manage_stock: product.manage_stock,
    stock_quantity: product.stock_quantity,
    backorders: product.backorders,
    backorders_allowed: product.backorders_allowed,
    backordered: product.backordered,
    low_stock_amount: product.low_stock_amount,
    sold_individually: product.sold_individually,
    weight: product.weight,
    dimensions: product.dimensions,
    shipping_required: product.shipping_required,
    shipping_taxable: product.shipping_taxable,
    shipping_class: product.shipping_class,
    shipping_class_id: product.shipping_class_id,
    reviews_allowed: product.reviews_allowed,
    average_rating: product.average_rating,
    rating_count: product.rating_count,
    upsell_ids: product.upsell_ids,
    cross_sell_ids: product.cross_sell_ids,
    parent_id: product.parent_id,
    purchase_note: product.purchase_note,
    categories: product.categories,
    tags: product.tags,
    images: product.images,
    attributes: product.attributes,
    default_attributes: product.default_attributes,
    variations: product.variations,
    grouped_products: product.grouped_products,
    menu_order: product.menu_order,
    price_html: product.price_html,
    related_ids: product.related_ids,
    meta_data: product.meta_data,
    stock_status: product.stock_status,
    has_options: product.has_options,
    post_password: product.post_password,
    global_unique_id: product.global_unique_id,
    synced_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('wc_products')
    .upsert(productData, { onConflict: 'id' });

  if (error) {
    throw new Error(`Erro ao salvar produto: ${error.message}`);
  }
}

async function upsertCategory(supabase: any, category: any) {
  const categoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent,
    description: category.description,
    display: category.display,
    image: category.image,
    menu_order: category.menu_order,
    count: category.count,
    synced_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('wc_product_categories')
    .upsert(categoryData, { onConflict: 'id' });

  if (error) {
    throw new Error(`Erro ao salvar categoria: ${error.message}`);
  }
}

async function logSyncEvent(
  supabase: any,
  userId: string,
  syncType: string,
  operation: string,
  status: string,
  message: string,
  details: any = {}
) {
  const { error } = await supabase
    .from('sync_logs')
    .insert({
      user_id: userId,
      sync_type: syncType,
      operation,
      status,
      message,
      details,
      items_processed: details.items_processed || 0,
      items_failed: details.items_failed || 0,
      duration_ms: details.duration_ms || null,
      error_details: details.errors ? details.errors.join('; ') : null
    });

  if (error) {
    console.error('Erro ao salvar log:', error);
  }
}

async function updateSyncConfig(supabase: any, userId: string, syncType: string) {
  const { error } = await supabase
    .from('sync_config')
    .upsert({
      user_id: userId,
      sync_type: syncType,
      last_sync_at: new Date().toISOString(),
      is_active: true
    }, { onConflict: 'user_id,sync_type' });

  if (error) {
    console.error('Erro ao atualizar configuração de sync:', error);
  }
}