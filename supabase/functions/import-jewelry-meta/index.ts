import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

interface JewelryMetaData {
  _fornecedor_bruto?: string;
  _codigo_fornecedor_bruto?: string;
  _nome_galvanica?: string;
  _peso_peca?: string;
  _milesimo?: string;
  _valor_milesimo?: string;
  _custo_fixo?: string;
  _custo_bruto?: string;
  _custo_variavel?: string;
  _custo_galvanica?: string;
  _custo_final?: string;
  _markup_desejado?: string;
  _preco_venda_sugerido?: string;
}

function extractJewelryFromMetaData(metaData: any[]): Partial<JewelryMetaData> | null {
  if (!Array.isArray(metaData)) return null;
  
  const jewelry: Partial<JewelryMetaData> = {};
  let hasJewelryData = false;
  
  metaData.forEach((meta: any) => {
    if (!meta || typeof meta !== 'object' || !meta.key) return;
    
    const value = meta.value;
    if (value === null || value === undefined || value === '') return;
    
    switch (meta.key) {
      case '_fornecedor_bruto':
      case '_codigo_fornecedor_bruto':
      case '_nome_galvanica':
      case '_peso_peca':
      case '_milesimo':
      case '_valor_milesimo':
      case '_custo_fixo':
      case '_custo_bruto':
      case '_custo_variavel':
      case '_custo_galvanica':
      case '_custo_final':
      case '_markup_desejado':
      case '_preco_venda_sugerido':
        jewelry[meta.key as keyof JewelryMetaData] = String(value);
        hasJewelryData = true;
        break;
    }
  });
  
  return hasJewelryData ? jewelry : null;
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();
    
    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[import-jewelry-meta] Starting import for organization: ${organization_id}`);

    // Get all products with meta_data for this organization
    const { data: products, error: productsError } = await supabase
      .from('wc_products')
      .select('id, name, meta_data, organization_id')
      .eq('organization_id', organization_id)
      .not('meta_data', 'is', null);

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No products found with meta_data',
        imported: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[import-jewelry-meta] Found ${products.length} products with meta_data`);

    let imported = 0;
    let errors = 0;

    for (const product of products) {
      try {
        const jewelryMeta = extractJewelryFromMetaData(product.meta_data);
        
        if (!jewelryMeta) {
          continue; // No jewelry data found
        }

        // Calculate derived values
        const peso_peca = parseNumber(jewelryMeta._peso_peca);
        const valor_milesimo = parseNumber(jewelryMeta._valor_milesimo);
        const custo_fixo = parseNumber(jewelryMeta._custo_fixo);
        const custo_bruto = parseNumber(jewelryMeta._custo_bruto);
        const custo_variavel = parseNumber(jewelryMeta._custo_variavel);
        const markup_desejado = parseNumber(jewelryMeta._markup_desejado);

        const custo_galvanica = peso_peca * valor_milesimo;
        const custo_final = custo_fixo + custo_bruto + custo_galvanica + custo_variavel;
        const preco_venda_sugerido = custo_final + (custo_final * markup_desejado / 100);

        const jewelryInfo = {
          product_id: product.id,
          organization_id: organization_id,
          fornecedor_bruto: jewelryMeta._fornecedor_bruto || null,
          codigo_fornecedor_bruto: jewelryMeta._codigo_fornecedor_bruto || null,
          nome_galvanica: jewelryMeta._nome_galvanica || null,
          peso_peca: peso_peca,
          milesimo: parseNumber(jewelryMeta._milesimo),
          valor_milesimo: valor_milesimo,
          custo_fixo: custo_fixo,
          custo_bruto: custo_bruto,
          custo_variavel: custo_variavel,
          custo_galvanica: custo_galvanica,
          custo_final: custo_final,
          markup_desejado: markup_desejado,
          preco_venda_sugerido: preco_venda_sugerido,
        };

        // Upsert jewelry info
        const { error: upsertError } = await supabase
          .from('product_jewelry_info')
          .upsert(jewelryInfo, { onConflict: 'product_id,organization_id' });

        if (upsertError) {
          console.error(`[import-jewelry-meta] Error upserting jewelry info for product ${product.id}:`, upsertError);
          errors++;
        } else {
          imported++;
          console.log(`[import-jewelry-meta] Imported jewelry info for product ${product.id} (${product.name})`);
        }

      } catch (error) {
        console.error(`[import-jewelry-meta] Error processing product ${product.id}:`, error);
        errors++;
      }
    }

    console.log(`[import-jewelry-meta] Import completed. Imported: ${imported}, Errors: ${errors}`);

    return new Response(JSON.stringify({ 
      message: 'Import completed',
      imported,
      errors,
      total_products: products.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[import-jewelry-meta] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});