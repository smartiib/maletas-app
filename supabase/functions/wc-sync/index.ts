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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Adiciona/garante o Supabase client com Service Role (mantém se já existir)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Gets WooCommerce credentials from the Supabase database.
 * Agora busca tanto nos campos diretos quanto no settings JSON.
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
 * Fetches products from WooCommerce API with pagination.
 * @param {string} wcBaseUrl - WooCommerce base URL.
 * @param {string} consumerKey - WooCommerce consumer key.
 * @param {string} consumerSecret - WooCommerce consumer secret.
 * @param {number} [page=1] - Page number for pagination.
 * @param {number} [perPage=100] - Number of products per page.
 * @returns {Promise<any[]>} - Array of products from WooCommerce.
 */
async function fetchProducts(
  wcBaseUrl: string,
  consumerKey: string,
  consumerSecret: string,
  page: number = 1,
  perPage: number = 100,
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

  const perPage = 100;
  let page = 1;
  const all: any[] = [];

  while (true) {
    const url = new URL(
      `${wcBaseUrl}/wp-json/wc/v3/products/${productId}/variations`,
    );
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    // Autenticação via query string (igual ao restante do sync)
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
    sample: all[0],
  });

  return all;
}

/**
 * Upsert das variações na tabela wc_product_variations
 */
async function upsertVariations(
  variations: any[],
  organizationId: string | null | undefined,
) {
  if (!variations || variations.length === 0) return;

  // Mapeia campos pertinentes para a tabela wc_product_variations
  const rows = variations.map((v) => ({
    id: Number(v.id),
    parent_id: Number(v.parent_id ?? v.product_id),
    date_created: v.date_created ? new Date(v.date_created).toISOString() : null,
    date_modified: v.date_modified ? new Date(v.date_modified).toISOString() : null,
    price: v.price ?? null,
    regular_price: v.regular_price ?? null,
    sale_price: v.sale_price ?? null,
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
    download_limit: v.download_limit ?? -1,
    download_expiry: v.download_expiry ?? -1,
    manage_stock: !!v.manage_stock,
    stock_quantity:
      typeof v.stock_quantity === "number"
        ? v.stock_quantity
        : v.stock_quantity
        ? Number(v.stock_quantity)
        : null,
    backorders_allowed: !!v.backorders_allowed,
    backordered: !!v.backordered,
    low_stock_amount:
      typeof v.low_stock_amount === "number"
        ? v.low_stock_amount
        : v.low_stock_amount
        ? Number(v.low_stock_amount)
        : null,
    dimensions: v.dimensions ?? {},
    shipping_class_id:
      typeof v.shipping_class_id === "number" ? v.shipping_class_id : null,
    image: v.image ?? {},
    attributes: Array.isArray(v.attributes) ? v.attributes : [],
    menu_order: typeof v.menu_order === "number" ? v.menu_order : 0,
    meta_data: Array.isArray(v.meta_data) ? v.meta_data : [],
    synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization_id: organizationId ?? null,
    tax_status: v.tax_status ?? "taxable",
    tax_class: v.tax_class ?? null,
    backorders: v.backorders ?? "no",
    description: v.description ?? null,
    permalink: v.permalink ?? null,
    sku: typeof v.sku === "string" && v.sku.trim().length > 0 ? v.sku.trim() : null,
    weight: v.weight ?? null,
    shipping_class: v.shipping_class ?? null,
    status: v.status ?? "publish",
    stock_status: v.stock_status ?? "instock",
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
    sample: data?.[0],
  });
}

/**
 * Sincroniza variações para um produto variável - VERSÃO MELHORADA
 */
async function syncVariationsForProduct(opts: {
  wcBaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  productId: number;
  organizationId?: string | null;
  variationIds?: number[];
}) {
  const { wcBaseUrl, consumerKey, consumerSecret, productId, organizationId, variationIds } = opts;

  logger.log(`[wc-sync] Sincronizando variações para produto ${productId}`);

  // Se temos IDs específicos, buscar só essas variações
  if (variationIds && variationIds.length > 0) {
    const variations = [];
    
    for (const variationId of variationIds) {
      try {
        const url = new URL(`${wcBaseUrl}/wp-json/wc/v3/products/${productId}/variations/${variationId}`);
        url.searchParams.set("consumer_key", consumerKey);
        url.searchParams.set("consumer_secret", consumerSecret);

        const response = await fetch(url.toString());
        if (response.ok) {
          const variation = await response.json();
          variations.push(variation);
          logger.log(`[wc-sync] Variação ${variationId} buscada com sucesso`);
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
    return;
  }

  // Senão, buscar todas as variações do produto
  const variations = await fetchProductVariations({
    wcBaseUrl,
    consumerKey,
    consumerSecret,
    productId,
  });

  if (!variations || variations.length === 0) {
    logger.log(`[wc-sync] Produto variável ${productId} sem variações no WooCommerce`);
    return;
  }

  await upsertVariations(variations, organizationId ?? null);
  logger.log(`[wc-sync] ${variations.length} variações sincronizadas para produto ${productId}`);
}

/**
 * Synchronizes products from WooCommerce to Supabase.
 * Agora aceita credenciais opcionais (vindo do body.config) além do organizationId.
 */
async function syncProducts(
  organizationId: string | null,
  creds?: { wcBaseUrl: string; consumerKey: string; consumerSecret: string },
) {
  logger.log(`Starting product sync for organization: ${organizationId}`);

  if (!organizationId) {
    logger.error("Organization ID is null. Cannot proceed with product sync.");
    throw new Error("Organization ID is required for product sync");
  }

  // Buscar credenciais: preferir as fornecidas no body (config), senão buscar no banco
  const wooCommerceCredentials =
    creds ??
    (await getWooCommerceCredentials(organizationId));

  if (!wooCommerceCredentials) {
    const errorMsg = `Could not retrieve WooCommerce credentials for organization ${organizationId}. Please configure WooCommerce settings first.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const { wcBaseUrl, consumerKey, consumerSecret } = wooCommerceCredentials;

  let page = 1;
  const perPage = 100;
  let allProducts: any[] = [];

  while (true) {
    const productsFromWoo = await fetchProducts(
      wcBaseUrl,
      consumerKey,
      consumerSecret,
      page,
      perPage,
    );

    if (!productsFromWoo || productsFromWoo.length === 0) {
      logger.log("No more products to fetch from WooCommerce.");
      break;
    }

    logger.log(
      `Fetched ${productsFromWoo.length} products from WooCommerce (page ${page}).`,
    );
    allProducts = allProducts.concat(productsFromWoo);
    page++;
  }

  logger.log(`Total products fetched from WooCommerce: ${allProducts.length}`);

  for (const product of allProducts) {
    try {
      // upsert do produto em wc_products com normalização de números
      const payload = [
        {
          id: product.id,
          name: product.name,
          sku: typeof product.sku === "string" && product.sku.trim().length > 0 ? product.sku.trim() : null,
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
          stock_quantity: numOrNull(product.stock_quantity),
          stock_status: product.stock_status,
        },
      ];

      const { data, error } = await supabase
        .from("wc_products")
        .upsert(payload, { onConflict: "id" })
        .select();

      if (error) {
        logger.error(`Error upserting product ${product.id}:`, error);

        // Mesmo com erro no produto, tentar sincronizar variações para não bloquear
        if (product && product.type === "variable" && Array.isArray(product.variations) && product.variations.length > 0) {
          const variationIds = product.variations
            .map((v: any) => (typeof v === "object" && v?.id ? Number(v.id) : Number(v)))
            .filter((id: any) => typeof id === "number" && !Number.isNaN(id));

          if (variationIds.length > 0) {
            await syncVariationsForProduct({
              wcBaseUrl,
              consumerKey,
              consumerSecret,
              productId: Number(product.id),
              organizationId: organizationId,
              variationIds: variationIds,
            });
          }
        }
        continue;
      }

      logger.log(`Successfully upserted product ${product.id}.`);

      // SINCRONIZAR VARIAÇÕES IMEDIATAMENTE APÓS SALVAR O PRODUTO
      if (product && product.type === "variable" && Array.isArray(product.variations) && product.variations.length > 0) {
        logger.log(`[wc-sync] Produto ${product.id} é variável com ${product.variations.length} variações`);
        
        // Extrair IDs das variações
        const variationIds = product.variations
          .map((v: any) => typeof v === 'object' && v?.id ? Number(v.id) : Number(v))
          .filter((id: any) => typeof id === 'number' && !Number.isNaN(id));

        if (variationIds.length > 0) {
          await syncVariationsForProduct({
            wcBaseUrl,
            consumerKey,
            consumerSecret,
            productId: Number(product.id),
            organizationId: organizationId,
            variationIds: variationIds,
          });
        }
      }
    } catch (err) {
      logger.error(`[wc-sync] Erro ao processar produto ${product.id}:`, err);
    }
  }

  logger.log("Product sync completed.");
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Tentar ler o body (pode vir em dois formatos)
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Suporte aos dois formatos:
    // - legado: { organizationId }
    // - novo: { organization_id, config: { url, consumer_key, consumer_secret }, ... }
    const organizationId: string | null =
      body?.organization_id || body?.organizationId || null;

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

    let creds:
      | { wcBaseUrl: string; consumerKey: string; consumerSecret: string }
      | undefined;

    const cfg = body?.config;
    const hasConfig =
      cfg &&
      typeof cfg?.url === "string" &&
      typeof cfg?.consumer_key === "string" &&
      typeof cfg?.consumer_secret === "string";

    if (hasConfig) {
      // Usar credenciais enviadas pelo frontend para esta execução
      creds = {
        wcBaseUrl: cfg.url,
        consumerKey: cfg.consumer_key,
        consumerSecret: cfg.consumer_secret,
      };
      logger.log("[wc-sync] Using credentials from request body.config (masked):", {
        url: creds.wcBaseUrl,
        consumer_key: "***",
        consumer_secret: "***",
        organizationId,
      });
    } else {
      logger.log("[wc-sync] No config provided, will load credentials from database.", {
        organizationId,
      });
    }

    await syncProducts(organizationId, creds);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Product sync completed successfully.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
