
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
  sync_type: 'products' | 'categories' | 'orders' | 'customers' | 'full';
  config: WooCommerceConfig;
  batch_size?: number;
  force_full_sync?: boolean;
  organization_id?: string; // <-- incluir org recebida do app
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

    const {
      sync_type,
      config,
      batch_size = 50,
      force_full_sync = false,
      organization_id
    }: SyncRequest = await req.json();

    if (!organization_id) {
      throw new Error('organization_id é obrigatório');
    }

    console.log(`Iniciando sincronização: ${sync_type} para usuário ${user.id} na org ${organization_id}`);

    // Log início da sincronização (com organization_id)
    await logSyncEvent(supabase, user.id, organization_id, sync_type, 'sync_started', 'success', 
      `Iniciando sincronização de ${sync_type}`, { batch_size, force_full_sync });

    let result: SyncResult;

    switch (sync_type) {
      case 'products':
        result = await syncProducts(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        break;
      case 'categories':
        result = await syncCategories(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        break;
      case 'orders':
        result = await syncOrders(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        break;
      case 'customers':
        result = await syncCustomers(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        break;
      case 'full':
        // Sincronizar na ordem: categorias, produtos, clientes, pedidos
        const categoriesResult = await syncCategories(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        const productsResult = await syncProducts(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        const customersResult = await syncCustomers(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        const ordersResult = await syncOrders(supabase, user.id, organization_id, config, batch_size, force_full_sync);
        
        result = {
          success: categoriesResult.success && productsResult.success && customersResult.success && ordersResult.success,
          message: `Categorias: ${categoriesResult.message}. Produtos: ${productsResult.message}. Clientes: ${customersResult.message}. Pedidos: ${ordersResult.message}`,
          items_processed: categoriesResult.items_processed + productsResult.items_processed + customersResult.items_processed + ordersResult.items_processed,
          items_failed: categoriesResult.items_failed + productsResult.items_failed + customersResult.items_failed + ordersResult.items_failed,
          duration_ms: Date.now() - startTime,
          errors: [...(categoriesResult.errors || []), ...(productsResult.errors || []), ...(customersResult.errors || []), ...(ordersResult.errors || [])]
        };
        break;
      default:
        throw new Error(`Tipo de sincronização não suportado: ${sync_type}`);
    }

    // Log conclusão (com organization_id)
    await logSyncEvent(supabase, user.id, organization_id, sync_type, 'sync_completed', 
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

  } catch (error: any) {
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

// ------------------------- PRODUCTS -------------------------
async function syncProducts(
  supabase: any, 
  userId: string,
  organizationId: string,
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
            await upsertProduct(supabase, product, organizationId);
            itemsProcessed++;
          } catch (error: any) {
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

      } catch (error: any) {
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

  } catch (error: any) {
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

// ------------------------- CATEGORIES -------------------------
async function syncCategories(
  supabase: any, 
  userId: string, 
  organizationId: string,
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
            await upsertCategory(supabase, category, organizationId);
            itemsProcessed++;
          } catch (error: any) {
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

      } catch (error: any) {
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

  } catch (error: any) {
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

// ------------------------- UPSERT HELPERS -------------------------
async function upsertProduct(supabase: any, product: any, organizationId: string) {
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
    synced_at: new Date().toISOString(),
    organization_id: organizationId // <-- chave para a UI enxergar
  };

  const { error } = await supabase
    .from('wc_products')
    .upsert(productData, { onConflict: 'id' });

  if (error) {
    throw new Error(`Erro ao salvar produto: ${error.message}`);
  }
}

async function upsertCategory(supabase: any, category: any, organizationId: string) {
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
    synced_at: new Date().toISOString(),
    organization_id: organizationId // <-- incluir org
  };

  const { error } = await supabase
    .from('wc_product_categories')
    .upsert(categoryData, { onConflict: 'id' });

  if (error) {
    throw new Error(`Erro ao salvar categoria: ${error.message}`);
  }
}

// ------------------------- LOGS -------------------------
async function logSyncEvent(
  supabase: any,
  userId: string,
  organizationId: string,
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
      organization_id: organizationId, // <-- incluir org
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

// ------------------------- ORDERS -------------------------
async function syncOrders(
  supabase: any, 
  userId: string, 
  organizationId: string,
  config: WooCommerceConfig, 
  batchSize: number,
  forceFullSync: boolean
): Promise<SyncResult> {
  const startTime = Date.now();
  let itemsProcessed = 0;
  let itemsFailed = 0;
  const errors: string[] = [];

  try {
    console.log('Iniciando sincronização de pedidos...');
    
    const { data: syncConfig } = await supabase
      .from('sync_config')
      .select('last_sync_at')
      .eq('user_id', userId)
      .eq('sync_type', 'orders')
      .single();

    let page = 1;
    let hasMore = true;
    const lastSync = forceFullSync ? null : syncConfig?.last_sync_at;

    while (hasMore) {
      try {
        console.log(`Buscando página ${page} de pedidos...`);
        
        const url = new URL(`${config.url}/wp-json/wc/v3/orders`);
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

        const orders = await response.json();
        
        if (!Array.isArray(orders) || orders.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Processando ${orders.length} pedidos...`);

        for (const order of orders) {
          try {
            await upsertOrder(supabase, order, organizationId);
            itemsProcessed++;
          } catch (error: any) {
            console.error(`Erro ao processar pedido ${order.id}:`, error);
            errors.push(`Pedido ${order.id}: ${error.message}`);
            itemsFailed++;
          }
        }

        if (orders.length < batchSize) {
          hasMore = false;
        } else {
          page++;
        }

      } catch (error: any) {
        console.error(`Erro na página ${page}:`, error);
        errors.push(`Página ${page}: ${error.message}`);
        hasMore = false;
      }
    }

    return {
      success: itemsFailed === 0,
      message: `Pedidos sincronizados: ${itemsProcessed}, falhas: ${itemsFailed}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error: any) {
    console.error('Erro geral na sincronização de pedidos:', error);
    return {
      success: false,
      message: `Erro na sincronização de pedidos: ${error.message}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: Date.now() - startTime,
      errors: [error.message]
    };
  }
}

// ------------------------- CUSTOMERS -------------------------
async function syncCustomers(
  supabase: any, 
  userId: string, 
  organizationId: string,
  config: WooCommerceConfig, 
  batchSize: number,
  forceFullSync: boolean
): Promise<SyncResult> {
  const startTime = Date.now();
  let itemsProcessed = 0;
  let itemsFailed = 0;
  const errors: string[] = [];

  try {
    console.log('Iniciando sincronização de clientes...');
    
    const { data: syncConfig } = await supabase
      .from('sync_config')
      .select('last_sync_at')
      .eq('user_id', userId)
      .eq('sync_type', 'customers')
      .single();

    let page = 1;
    let hasMore = true;
    const lastSync = forceFullSync ? null : syncConfig?.last_sync_at;

    while (hasMore) {
      try {
        console.log(`Buscando página ${page} de clientes...`);
        
        const url = new URL(`${config.url}/wp-json/wc/v3/customers`);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('per_page', batchSize.toString());
        url.searchParams.set('orderby', 'registered_date');
        url.searchParams.set('order', 'desc');
        
        if (lastSync) {
          const syncDate = new Date(lastSync).toISOString();
          url.searchParams.set('after', syncDate);
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

        const customers = await response.json();
        
        if (!Array.isArray(customers) || customers.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Processando ${customers.length} clientes...`);

        for (const customer of customers) {
          try {
            await upsertCustomer(supabase, customer, organizationId);
            itemsProcessed++;
          } catch (error: any) {
            console.error(`Erro ao processar cliente ${customer.id}:`, error);
            errors.push(`Cliente ${customer.id}: ${error.message}`);
            itemsFailed++;
          }
        }

        if (customers.length < batchSize) {
          hasMore = false;
        } else {
          page++;
        }

      } catch (error: any) {
        console.error(`Erro na página ${page}:`, error);
        errors.push(`Página ${page}: ${error.message}`);
        hasMore = false;
      }
    }

    return {
      success: itemsFailed === 0,
      message: `Clientes sincronizados: ${itemsProcessed}, falhas: ${itemsFailed}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error: any) {
    console.error('Erro geral na sincronização de clientes:', error);
    return {
      success: false,
      message: `Erro na sincronização de clientes: ${error.message}`,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      duration_ms: Date.now() - startTime,
      errors: [error.message]
    };
  }
}

// ------------------------- UPSERT HELPERS (orders/customers) -------------------------
async function upsertOrder(supabase: any, order: any, organizationId: string) {
  const orderData = {
    id: order.id,
    parent_id: order.parent_id || 0,
    number: order.number,
    order_key: order.order_key,
    created_via: order.created_via,
    version: order.version,
    status: order.status,
    currency: order.currency,
    currency_symbol: order.currency_symbol,
    date_created: order.date_created,
    date_created_gmt: order.date_created_gmt,
    date_modified: order.date_modified,
    date_modified_gmt: order.date_modified_gmt,
    discount_total: parseFloat(order.discount_total) || 0,
    discount_tax: parseFloat(order.discount_tax) || 0,
    shipping_total: parseFloat(order.shipping_total) || 0,
    shipping_tax: parseFloat(order.shipping_tax) || 0,
    cart_tax: parseFloat(order.cart_tax) || 0,
    total: parseFloat(order.total) || 0,
    total_tax: parseFloat(order.total_tax) || 0,
    prices_include_tax: order.prices_include_tax,
    customer_id: order.customer_id || 0,
    customer_ip_address: order.customer_ip_address,
    customer_user_agent: order.customer_user_agent,
    customer_note: order.customer_note,
    billing: order.billing,
    shipping: order.shipping,
    payment_method: order.payment_method,
    payment_method_title: order.payment_method_title,
    payment_url: order.payment_url,
    transaction_id: order.transaction_id,
    date_paid: order.date_paid,
    date_paid_gmt: order.date_paid_gmt,
    date_completed: order.date_completed,
    date_completed_gmt: order.date_completed_gmt,
    cart_hash: order.cart_hash,
    meta_data: order.meta_data,
    line_items: order.line_items,
    tax_lines: order.tax_lines,
    shipping_lines: order.shipping_lines,
    fee_lines: order.fee_lines,
    coupon_lines: order.coupon_lines,
    refunds: order.refunds,
    is_editable: order.is_editable,
    needs_payment: order.needs_payment,
    needs_processing: order.needs_processing,
    synced_at: new Date().toISOString(),
    organization_id: organizationId // <-- incluir org
  };

  const { error } = await supabase
    .from('wc_orders')
    .upsert(orderData, { onConflict: 'id' });

  if (error) {
    throw new Error(`Erro ao salvar pedido: ${error.message}`);
  }
}

async function upsertCustomer(supabase: any, customer: any, organizationId: string) {
  const customerData = {
    id: customer.id,
    date_created: customer.date_created,
    date_created_gmt: customer.date_created_gmt,
    date_modified: customer.date_modified,
    date_modified_gmt: customer.date_modified_gmt,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    role: customer.role,
    username: customer.username,
    billing: customer.billing,
    shipping: customer.shipping,
    is_paying_customer: customer.is_paying_customer,
    avatar_url: customer.avatar_url,
    meta_data: customer.meta_data,
    orders_count: customer.orders_count || 0,
    total_spent: parseFloat(customer.total_spent) || 0,
    synced_at: new Date().toISOString(),
    organization_id: organizationId // <-- incluir org
  };

  const { error } = await supabase
    .from('wc_customers')
    .upsert(customerData, { onConflict: 'id' });

  if (error) {
    throw new Error(`Erro ao salvar cliente: ${error.message}`);
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
