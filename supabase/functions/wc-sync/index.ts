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
 * @param {string} organizationId - The ID of the organization.
 * @returns {Promise<{wcBaseUrl: string, consumerKey: string, consumerSecret: string} | null>} - WooCommerce credentials or null if not found.
 */
async function getWooCommerceCredentials(organizationId: string | null) {
  if (!organizationId) {
    logger.error("Organization ID is null. Cannot fetch WooCommerce credentials.");
    return null;
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("wc_base_url, wc_consumer_key, wc_consumer_secret")
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

  const { wc_base_url, wc_consumer_key, wc_consumer_secret } = data;

  if (!wc_base_url || !wc_consumer_key || !wc_consumer_secret) {
    logger.warn(
      `Incomplete WooCommerce credentials for organization ${organizationId}.`,
      data,
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
 * Upserts products into the Supabase database.
 * @param {any[]} products - Array of products to upsert.
 * @param {string | null} organizationId - Organization ID to associate with the products.
 */
async function upsertProducts(products: any[], organizationId: string | null) {
  if (!products || products.length === 0) {
    logger.log("No products to upsert.");
    return;
  }

  const productsToUpsert = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    type: product.type,
    status: product.status,
    description: product.description,
    short_description: product.short_description,
    permalink: product.permalink,
    price: product.price,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    on_sale: product.on_sale,
    featured: product.featured,
    catalog_visibility: product.catalog_visibility,
    date_created: product.date_created,
    date_modified: product.date_modified,
    images: product.images,
    variations: product.variations,
    organization_id: organizationId,
    stock_quantity: product.stock_quantity,
    stock_status: product.stock_status,
  }));

  const { data, error } = await supabase
    .from("wc_products")
    .upsert(productsToUpsert, { onConflict: "id" })
    .select();

  if (error) {
    logger.error("Error upserting products into Supabase:", error);
  } else {
    logger.log(`Successfully upserted ${products.length} products.`);
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
 * Sincroniza variações para um produto variável
 */
async function syncVariationsForProduct(opts: {
  wcBaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  productId: number;
  organizationId?: string | null;
}) {
  const { wcBaseUrl, consumerKey, consumerSecret, productId, organizationId } =
    opts;

  const variations = await fetchProductVariations({
    wcBaseUrl,
    consumerKey,
    consumerSecret,
    productId,
  });

  if (!variations || variations.length === 0) {
    console.log("[wc-sync] Produto variável sem variações no Woo", { productId });
    return;
  }

  await upsertVariations(variations, organizationId ?? null);
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
    return;
  }

  // Buscar credenciais: preferir as fornecidas no body (config), senão buscar no banco
  const wooCommerceCredentials =
    creds ??
    (await getWooCommerceCredentials(organizationId));

  if (!wooCommerceCredentials) {
    logger.error(
      `Could not retrieve WooCommerce credentials for organization ${organizationId}.`,
    );
    return;
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
    // Attach WooCommerce credentials to the product object
    product.__wcBaseUrl = wcBaseUrl;
    product.__consumerKey = consumerKey;
    product.__consumerSecret = consumerSecret;

    // upsert do produto em wc_products
    const { data, error } = await supabase
      .from("wc_products")
      .upsert(
        [
          {
            id: product.id,
            name: product.name,
            sku: product.sku,
            type: product.type,
            status: product.status,
            description: product.description,
            short_description: product.short_description,
            permalink: product.permalink,
            price: product.price,
            regular_price: product.regular_price,
            sale_price: product.sale_price,
            on_sale: product.on_sale,
            featured: product.featured,
            catalog_visibility: product.catalog_visibility,
            date_created: product.date_created,
            date_modified: product.date_modified,
            images: product.images,
            variations: product.variations,
            organization_id: organizationId,
            stock_quantity: product.stock_quantity,
            stock_status: product.stock_status,
          },
        ],
        { onConflict: "id" },
      )
      .select();

    if (error) {
      logger.error("Error upserting products into Supabase:", error);
    } else {
      logger.log(`Successfully upserted product ${product.id}.`);
    }

    // Passe a organizationId já determinada no arquivo
    await afterProductUpsertHook(product, organizationId);
  }

  logger.log("Product sync completed.");
}

/**
 * Integra a sync de variações dentro do fluxo de sync de produtos.
 * Chame esta função logo após upsert de cada produto variável.
 */
async function afterProductUpsertHook(
  product: any,
  organizationId?: string | null,
) {
  try {
    if (product && product.type === "variable") {
      // Recupera credenciais existentes (mantém a mesma estratégia utilizada no arquivo)
      const wcBaseUrl = (product.__wcBaseUrl ||
        Deno.env.get("WC_BASE_URL") || "").toString();
      const consumerKey = (product.__consumerKey ||
        Deno.env.get("WC_CONSUMER_KEY") || "").toString();
      const consumerSecret = (product.__consumerSecret ||
        Deno.env.get("WC_CONSUMER_SECRET") || "").toString();

      if (wcBaseUrl && consumerKey && consumerSecret) {
        await syncVariationsForProduct({
          wcBaseUrl,
          consumerKey,
          consumerSecret,
          productId: Number(product.id),
          organizationId: organizationId ?? null,
        });
      } else {
        console.warn(
          "[wc-sync] Credenciais WooCommerce ausentes para sync de variações",
        );
      }
    }
  } catch (err) {
    console.error("[wc-sync] afterProductUpsertHook error:", err);
  }
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
