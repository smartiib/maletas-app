/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cors } from "../_shared/cors.ts";
import { load } from "https://deno.land/std@0.182.0/dotenv/mod.ts";

const env = await load();

const logger = {
  log: (...args: any[]) => {
    console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
};

// Normaliza valores numéricos vindos como "", string ou number
function numOrNull(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  // Troca vírgula por ponto se vier "0,10"
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Sanitiza valores de texto que podem vir vazios
function textOrNull(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// Sanitiza valores inteiros
function intOrNull(v: any): number | null {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isInteger(n) ? n : null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Adiciona/garante o Supabase client com Service Role (mantém se já existir)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

// Time budget constants (18 seconds to leave 2 seconds buffer for response)
const TIME_BUDGET_MS = 18000;

/**
 * Gets WooCommerce credentials from the Supabase database.
 */
async function getWooCommerceCredentials(organizationId: string | null) {
  if (!organizationId) {
    logger.error("Organization ID is null. Cannot fetch WooCommerce credentials.");
    return null;
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("wc_base_url, wc_consumer_key, wc_consumer_secret, settings")
    .eq("id", organizationId)
    .single();

  if (error) {
    logger.error(
      `Failed to fetch WooCommerce credentials for organization ${organizationId}:`,
      error,
    );
    return null;
  }

  if (!data) {
    logger.warn(
      `No WooCommerce credentials found for organization ${organizationId}.`,
    );
    return null;
  }

  // Tentar primeiro os campos diretos (formato legado)
  let { wc_base_url, wc_consumer_key, wc_consumer_secret } = data;

  // Se não encontrou nos campos diretos, buscar no settings JSON
  if (!wc_base_url || !wc_consumer_key || !wc_consumer_secret) {
    const settings = (data.settings as any) || {};
    wc_base_url = wc_base_url || settings.woocommerce_url;
    wc_consumer_key = wc_consumer_key || settings.woocommerce_consumer_key;
    wc_consumer_secret = wc_consumer_secret || settings.woocommerce_consumer_secret;

    logger.log(`[wc-sync] Usando credenciais do campo settings para org ${organizationId}`);
  }

  if (!wc_base_url || !wc_consumer_key || !wc_consumer_secret) {
    logger.warn(
      `Incomplete WooCommerce credentials for organization ${organizationId}.`,
      {
        hasUrl: !!wc_base_url,
        hasKey: !!wc_consumer_key,
        hasSecret: !!wc_consumer_secret,
      }
    );
    return null;
  }

  return {
    wcBaseUrl: wc_base_url,
    consumerKey: wc_consumer_key,
    consumerSecret: wc_consumer_secret,
  };
}

/**
 * Check if we've exceeded our time budget
 */
function isTimeBudgetExceeded(startTime: number): boolean {
  return (Date.now() - startTime) > TIME_BUDGET_MS;
}

/**
 * Fetches products from WooCommerce API with pagination.
 */
async function fetchProducts(
  wcBaseUrl: string,
  consumerKey: string,
  consumerSecret: string,
  page: number = 1,
  perPage: number = 50,
): Promise<any[]> {
  const url = new URL(`${wcBaseUrl}/wp-json/wc/v3/products`);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      logger.error(
        `WooCommerce API responded with an error: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const products = await response.json();
    return products;
  } catch (error) {
    logger.error("Error fetching products from WooCommerce:", error);
    return [];
  }
}

/**
 * Busca variações de um produto no WooCommerce com paginação
 */
async function fetchProductVariations(opts: {
  wcBaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  productId: number;
}): Promise<any[]> {
  const { wcBaseUrl, consumerKey, consumerSecret, productId } = opts;

  const perPage = 50; // Reduced from 100
  let page = 1;
  const all: any[] = [];

  while (true) {
    const url = new URL(
      `${wcBaseUrl}/wp-json/wc/v3/products/${productId}/variations`,
    );
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);

    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      console.error("[wc-sync] Erro ao buscar variações", {
        productId,
        status: res.status,
        text: await res.text().catch(() => ""),
      });
      break;
    }
    const data = (await res.json()) as any[];
    if (!Array.isArray(data) || data.length === 0) break;

    all.push(...data);
    if (data.length < perPage) break;
    page += 1;
  }

  console.log("[wc-sync] Variações buscadas", {
    productId,
    count: all.length,
  });

  return all;
}

/**
 * Upsert das variações na tabela wc_product_variations com sanitização adequada
 */
async function upsertVariations(
  variations: any[],
  organizationId: string | null | undefined,
) {
  if (!variations || variations.length === 0) return;

  // Mapeia campos pertinentes para a tabela wc_product_variations COM SANITIZAÇÃO
  const rows = variations.map((v) => ({
    id: Number(v.id),
    parent_id: Number(v.parent_id ?? v.product_id),
    date_created: v.date_created ? new Date(v.date_created).toISOString() : null,
    date_modified: v.date_modified ? new Date(v.date_modified).toISOString() : null,
    price: numOrNull(v.price),
    regular_price: numOrNull(v.regular_price),
    sale_price: numOrNull(v.sale_price),
    date_on_sale_from: v.date_on_sale_from
      ? new Date(v.date_on_sale_from).toISOString()
      : null,
    date_on_sale_to: v.date_on_sale_to
      ? new Date(v.date_on_sale_to).toISOString()
      : null,
    on_sale: !!v.on_sale,
    purchasable: v.purchasable ?? true,
    virtual: !!v.virtual,
    downloadable: !!v.downloadable,
    downloads: v.downloads ?? [],
    download_limit: intOrNull(v.download_limit) ?? -1,
    download_expiry: intOrNull(v.download_expiry) ?? -1,
    manage_stock: !!v.manage_stock,
    stock_quantity: intOrNull(v.stock_quantity),
    backorders_allowed: !!v.backorders_allowed,
    backordered: !!v.backordered,
    low_stock_amount: intOrNull(v.low_stock_amount),
    dimensions: v.dimensions ?? {},
    shipping_class_id: intOrNull(v.shipping_class_id),
    image: v.image ?? {},
    attributes: Array.isArray(v.attributes) ? v.attributes : [],
    menu_order: intOrNull(v.menu_order) ?? 0,
    meta_data: Array.isArray(v.meta_data) ? v.meta_data : [],
    synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization_id: organizationId ?? null,
    tax_status: textOrNull(v.tax_status) ?? "taxable",
    tax_class: textOrNull(v.tax_class),
    backorders: textOrNull(v.backorders) ?? "no",
    description: textOrNull(v.description),
    permalink: textOrNull(v.permalink),
    sku: textOrNull(v.sku),
    weight: textOrNull(v.weight),
    shipping_class: textOrNull(v.shipping_class),
    status: textOrNull(v.status) ?? "publish",
    stock_status: textOrNull(v.stock_status) ?? "instock",
  }));

  const { data, error } = await supabase
    .from("wc_product_variations")
    .upsert(rows, { onConflict: "id" })
    .select("id, parent_id, sku, stock_quantity, stock_status, attributes")
    .order("id", { ascending: true });

  if (error) {
    console.error("[wc-sync] Erro ao upsert variações:", error);
    return;
  }

  console.log("[wc-sync] Variações upsert concluído", {
    count: data?.length ?? 0,
  });
}

/**
 * Sincroniza variações para um produto variável com time budget check
 */
async function syncVariationsForProduct(opts: {
  wcBaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  productId: number;
  organizationId?: string | null;
  variationIds?: number[];
  startTime: number;
}): Promise<boolean> {
  const { wcBaseUrl, consumerKey, consumerSecret, productId, organizationId, variationIds, startTime } = opts;

  // Check time budget before processing variations
  if (isTimeBudgetExceeded(startTime)) {
    logger.log(`[wc-sync] Time budget exceeded, skipping variations for product ${productId}`);
    return false;
  }

  logger.log(`[wc-sync] Sincronizando variações para produto ${productId}`);

  // Se temos IDs específicos, buscar só essas variações
  if (variationIds && variationIds.length > 0) {
    const variations = [];
    
    for (const variationId of variationIds) {
      if (isTimeBudgetExceeded(startTime)) {
        logger.log(`[wc-sync] Time budget exceeded during specific variation sync`);
        break;
      }

      try {
        const url = new URL(`${wcBaseUrl}/wp-json/wc/v3/products/${productId}/variations/${variationId}`);
        url.searchParams.set("consumer_key", consumerKey);
        url.searchParams.set("consumer_secret", consumerSecret);

        const response = await fetch(url.toString());
        if (response.ok) {
          const variation = await response.json();
          variations.push(variation);
        } else {
          logger.warn(`[wc-sync] Erro ao buscar variação ${variationId}: ${response.status}`);
        }
      } catch (error) {
        logger.error(`[wc-sync] Erro ao buscar variação ${variationId}:`, error);
      }
    }

    if (variations.length > 0) {
      await upsertVariations(variations, organizationId ?? null);
      logger.log(`[wc-sync] ${variations.length} variações específicas sincronizadas para produto ${productId}`);
    }
    return true;
  }

  // SEMPRE buscar todas as variações do produto
  const variations = await fetchProductVariations({
    wcBaseUrl,
    consumerKey,
    consumerSecret,
    productId,
  });

  if (!variations || variations.length === 0) {
    logger.log(`[wc-sync] Produto variável ${productId} sem variações no WooCommerce`);
    return true;
  }

  await upsertVariations(variations, organizationId ?? null);
  logger.log(`[wc-sync] ${variations.length} variações sincronizadas para produto ${productId}`);
  return true;
}

/**
 * Sincroniza produtos específicos por IDs com time budget
 */
async function syncSpecificProducts(
  organizationId: string | null,
  productIds: number[],
  creds?: { wcBaseUrl: string; consumerKey: string; consumerSecret: string },
) {
  const startTime = Date.now();
  logger.log(`[wc-sync] Sincronizando produtos específicos:`, productIds);

  if (!organizationId) {
    throw new Error("Organization ID is required for specific product sync");
  }

  const wooCommerceCredentials = creds ?? (await getWooCommerceCredentials(organizationId));
  if (!wooCommerceCredentials) {
    throw new Error(`Could not retrieve WooCommerce credentials for organization ${organizationId}`);
  }

  const { wcBaseUrl, consumerKey, consumerSecret } = wooCommerceCredentials;
  let processed = 0;
  let errors = 0;

  for (const productId of productIds) {
    if (isTimeBudgetExceeded(startTime)) {
      logger.log(`[wc-sync] Time budget exceeded during specific product sync`);
      break;
    }

    try {
      // Buscar produto individual
      const url = new URL(`${wcBaseUrl}/wp-json/wc/v3/products/${productId}`);
      url.searchParams.set("consumer_key", consumerKey);
      url.searchParams.set("consumer_secret", consumerSecret);

      const response = await fetch(url.toString());
      if (!response.ok) {
        logger.error(`[wc-sync] Erro ao buscar produto ${productId}: ${response.status}`);
        errors++;
        continue;
      }

      const product = await response.json();

      // Upsert do produto
      const payload = [{
        id: product.id,
        name: product.name,
        sku: textOrNull(product.sku),
        type: product.type,
        status: product.status,
        description: product.description,
        short_description: product.short_description,
        permalink: product.permalink,
        price: numOrNull(product.price),
        regular_price: numOrNull(product.regular_price),
        sale_price: numOrNull(product.sale_price),
        on_sale: !!product.on_sale,
        featured: !!product.featured,
        catalog_visibility: product.catalog_visibility,
        date_created: product.date_created,
        date_modified: product.date_modified,
        images: Array.isArray(product.images) ? product.images : [],
        variations: Array.isArray(product.variations) ? product.variations : [],
        organization_id: organizationId,
        stock_quantity: intOrNull(product.stock_quantity),
        stock_status: product.stock_status,
      }];

      const { error } = await supabase
        .from("wc_products")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        logger.error(`[wc-sync] Erro ao upsert produto ${productId}:`, error);
        errors++;
        continue;
      }

      // SEMPRE sincronizar variações para produtos variáveis
      if (product.type === "variable") {
        const success = await syncVariationsForProduct({
          wcBaseUrl,
          consumerKey,
          consumerSecret,
          productId: Number(product.id),
          organizationId: organizationId,
          startTime,
        });
        
        if (!success) break; // Time budget exceeded
      }

      processed++;
      logger.log(`[wc-sync] Produto ${productId} sincronizado com sucesso`);
    } catch (error) {
      logger.error(`[wc-sync] Erro ao processar produto ${productId}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}

/**
 * Synchronizes products from WooCommerce to Supabase with TIME BUDGET and reduced batch size
 */
async function syncProducts(
  organizationId: string | null,
  options: {
    creds?: { wcBaseUrl: string; consumerKey: string; consumerSecret: string };
    page?: number;
    perPage?: number;
    maxPages?: number;
  } = {}
) {
  const startTime = Date.now();
  const { creds, page = 1, perPage = 25, maxPages = 1 } = options; // REDUCED: perPage 50->25, maxPages 5->1
  
  logger.log(`[wc-sync] Starting product sync for organization: ${organizationId}, page: ${page}, perPage: ${perPage}, maxPages: ${maxPages}`);

  if (!organizationId) {
    throw new Error("Organization ID is required for product sync");
  }

  const wooCommerceCredentials = creds ?? (await getWooCommerceCredentials(organizationId));
  if (!wooCommerceCredentials) {
    throw new Error(`Could not retrieve WooCommerce credentials for organization ${organizationId}`);
  }

  const { wcBaseUrl, consumerKey, consumerSecret } = wooCommerceCredentials;

  let currentPage = page;
  let totalProcessed = 0;
  let totalErrors = 0;
  let pagesProcessed = 0;

  while (pagesProcessed < maxPages) {
    // Check time budget before processing each page
    if (isTimeBudgetExceeded(startTime)) {
      logger.log("[wc-sync] Time budget exceeded, stopping sync");
      break;
    }

    const productsFromWoo = await fetchProducts(
      wcBaseUrl,
      consumerKey,
      consumerSecret,
      currentPage,
      perPage,
    );

    if (!productsFromWoo || productsFromWoo.length === 0) {
      logger.log("[wc-sync] No more products to fetch from WooCommerce.");
      break;
    }

    logger.log(`[wc-sync] Processing ${productsFromWoo.length} products from page ${currentPage}`);

    for (const product of productsFromWoo) {
      // Check time budget before processing each product
      if (isTimeBudgetExceeded(startTime)) {
        logger.log("[wc-sync] Time budget exceeded during product processing");
        break;
      }

      try {
        // upsert do produto em wc_products com normalização de números
        const payload = [{
          id: product.id,
          name: product.name,
          sku: textOrNull(product.sku),
          type: product.type,
          status: product.status,
          description: product.description,
          short_description: product.short_description,
          permalink: product.permalink,
          price: numOrNull(product.price),
          regular_price: numOrNull(product.regular_price),
          sale_price: numOrNull(product.sale_price),
          on_sale: !!product.on_sale,
          featured: !!product.featured,
          catalog_visibility: product.catalog_visibility,
          date_created: product.date_created,
          date_modified: product.date_modified,
          images: Array.isArray(product.images) ? product.images : [],
          variations: Array.isArray(product.variations) ? product.variations : [],
          organization_id: organizationId,
          stock_quantity: intOrNull(product.stock_quantity),
          stock_status: product.stock_status,
        }];

        const { error } = await supabase
          .from("wc_products")
          .upsert(payload, { onConflict: "id" });

        if (error) {
          logger.error(`[wc-sync] Error upserting product ${product.id}:`, error);
          totalErrors++;
          continue;
        }

        // SEMPRE SINCRONIZAR VARIAÇÕES PARA PRODUTOS VARIÁVEIS (com time budget)
        if (product.type === "variable") {
          const success = await syncVariationsForProduct({
            wcBaseUrl,
            consumerKey,
            consumerSecret,
            productId: Number(product.id),
            organizationId: organizationId,
            startTime,
          });
          
          if (!success) break; // Time budget exceeded
        }

        totalProcessed++;
      } catch (err) {
        logger.error(`[wc-sync] Erro ao processar produto ${product.id}:`, err);
        totalErrors++;
      }
    }

    currentPage++;
    pagesProcessed++;

    // Se pegou menos produtos que o perPage, acabaram os produtos
    if (productsFromWoo.length < perPage) {
      logger.log("[wc-sync] Reached end of products");
      break;
    }

    // Additional time budget check at end of page
    if (isTimeBudgetExceeded(startTime)) {
      logger.log("[wc-sync] Time budget exceeded after page completion");
      break;
    }
  }

  const timeElapsed = Date.now() - startTime;
  const hasMore = pagesProcessed >= maxPages && !isTimeBudgetExceeded(startTime);
  const nextPage = hasMore ? currentPage : null;

  logger.log(`[wc-sync] Batch completed in ${timeElapsed}ms. Processed: ${totalProcessed}, Errors: ${totalErrors}, NextPage: ${nextPage}`);

  return {
    processed: totalProcessed,
    errors: totalErrors,
    currentPage: currentPage - 1,
    nextPage,
    hasMore,
    timeElapsed
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const organizationId: string | null = body?.organization_id || body?.organizationId || null;
    const syncType = body?.sync_type || 'products';
    const batchSize = body?.batch_size || 25; // REDUCED from 50
    const maxPages = body?.max_pages || 1; // REDUCED from 5
    const startPage = body?.page || 1;
    const productIds = body?.product_ids; // Novo: IDs específicos

    if (!organizationId) {
      logger.error("Organization ID is missing in the request body.");
      return new Response(
        JSON.stringify({ success: false, message: "Organization ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let creds: { wcBaseUrl: string; consumerKey: string; consumerSecret: string } | undefined;
    const cfg = body?.config;
    const hasConfig = cfg && typeof cfg?.url === "string" && typeof cfg?.consumer_key === "string" && typeof cfg?.consumer_secret === "string";

    if (hasConfig) {
      creds = {
        wcBaseUrl: cfg.url,
        consumerKey: cfg.consumer_key,
        consumerSecret: cfg.consumer_secret,
      };
      logger.log("[wc-sync] Using credentials from request body.config");
    } else {
      logger.log("[wc-sync] No config provided, will load credentials from database.");
    }

    // Novo: Sync de produtos específicos
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      logger.log(`[wc-sync] Syncing specific products: ${productIds.join(', ')}`);
      const result = await syncSpecificProducts(organizationId, productIds, creds);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Synced ${result.processed} specific products, ${result.errors} errors`,
          processed: result.processed,
          errors: result.errors,
          sync_type: 'specific_products'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Sync normal com paginação E TIME BUDGET
    if (syncType === 'products' || syncType === 'full') {
      const result = await syncProducts(organizationId, {
        creds,
        page: startPage,
        perPage: batchSize,
        maxPages
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${result.processed} products from page ${startPage}${result.nextPage ? `, next page: ${result.nextPage}` : ' (completed)'} in ${result.timeElapsed}ms`,
          processed: result.processed,
          errors: result.errors,
          currentPage: result.currentPage,
          nextPage: result.nextPage,
          hasMore: result.hasMore,
          sync_type: syncType,
          timeElapsed: result.timeElapsed
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Outros tipos de sync (categories, orders, etc.) podem ser implementados aqui
    return new Response(
      JSON.stringify({
        success: false,
        message: `Sync type '${syncType}' not implemented yet`
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  } catch (error: any) {
    logger.error("An unexpected error occurred:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || "Unexpected error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
