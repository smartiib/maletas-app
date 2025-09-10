import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface WooCommerceConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

interface SyncProductRequest {
  productId: number;
  organizationId: string;
  includeImages?: boolean;
  includeTags?: boolean;
  includeCategories?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, organizationId, includeImages = true, includeTags = true, includeCategories = true }: SyncProductRequest = await req.json();

    console.log('Sincronizando produto:', { productId, organizationId, includeImages, includeTags, includeCategories });

    // Get WooCommerce configuration
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (orgError || !orgData?.settings?.woocommerce) {
      throw new Error('WooCommerce não configurado para esta organização');
    }

    const wcConfig: WooCommerceConfig = orgData.settings.woocommerce;

    // Get product data
    const { data: product, error: productError } = await supabase
      .from('wc_products')
      .select('*')
      .eq('id', productId)
      .eq('organization_id', organizationId)
      .single();

    if (productError) {
      throw new Error(`Produto não encontrado: ${productError.message}`);
    }

    // Prepare update data
    const updateData: any = {
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock_quantity: product.stock_quantity,
      stock_status: product.stock_status,
      manage_stock: product.manage_stock,
      status: product.status,
    };

    // Include images if requested
    if (includeImages) {
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('organization_id', organizationId)
        .order('display_order');

      if (images && images.length > 0) {
        updateData.images = images.map(img => ({
          src: img.image_url,
          alt: img.alt_text || '',
          position: img.display_order,
        }));
      }
    }

    // Include tags if requested
    if (includeTags) {
      const { data: tagRelations } = await supabase
        .from('product_tag_relations')
        .select(`
          tag:product_tags (
            name,
            slug
          )
        `)
        .eq('product_id', productId);

      if (tagRelations && tagRelations.length > 0) {
        updateData.tags = tagRelations
          .map(rel => rel.tag)
          .filter(tag => tag)
          .map(tag => ({
            name: tag.name,
            slug: tag.slug,
          }));
      }
    }

    // Include categories if requested
    if (includeCategories) {
      // For now, we'll use the existing WooCommerce categories
      // Custom categories could be synced separately if needed
      if (product.categories && product.categories.length > 0) {
        updateData.categories = product.categories;
      }
    }

    // Include jewelry metadata
    const { data: jewelryInfo } = await supabase
      .from('product_jewelry_info')
      .select('*')
      .eq('product_id', productId)
      .eq('organization_id', organizationId)
      .single();

    if (jewelryInfo) {
      updateData.meta_data = [
        ...(product.meta_data || []),
        {
          key: 'jewelry_peso_peca',
          value: jewelryInfo.peso_peca?.toString() || '0'
        },
        {
          key: 'jewelry_milesimo',
          value: jewelryInfo.milesimo?.toString() || '0'
        },
        {
          key: 'jewelry_valor_milesimo',
          value: jewelryInfo.valor_milesimo?.toString() || '0'
        },
        {
          key: 'jewelry_custo_fixo',
          value: jewelryInfo.custo_fixo?.toString() || '0'
        },
        {
          key: 'jewelry_custo_bruto',
          value: jewelryInfo.custo_bruto?.toString() || '0'
        },
        {
          key: 'jewelry_custo_variavel',
          value: jewelryInfo.custo_variavel?.toString() || '0'
        },
        {
          key: 'jewelry_custo_galvanica',
          value: jewelryInfo.custo_galvanica?.toString() || '0'
        },
        {
          key: 'jewelry_custo_final',
          value: jewelryInfo.custo_final?.toString() || '0'
        },
        {
          key: 'jewelry_markup_desejado',
          value: jewelryInfo.markup_desejado?.toString() || '0'
        },
        {
          key: 'jewelry_preco_venda_sugerido',
          value: jewelryInfo.preco_venda_sugerido?.toString() || '0'
        },
        {
          key: 'jewelry_nome_galvanica',
          value: jewelryInfo.nome_galvanica || ''
        },
        {
          key: 'jewelry_fornecedor_bruto',
          value: jewelryInfo.fornecedor_bruto || ''
        },
        {
          key: 'jewelry_codigo_fornecedor_bruto',
          value: jewelryInfo.codigo_fornecedor_bruto || ''
        },
      ].filter(meta => meta.value !== '' && meta.value !== '0');
    }

    // Make WooCommerce API call
    const auth = btoa(`${wcConfig.consumer_key}:${wcConfig.consumer_secret}`);
    const wcUrl = `${wcConfig.url}/wp-json/wc/v3/products/${productId}`;

    console.log('Enviando para WooCommerce:', wcUrl);
    console.log('Dados de atualização:', JSON.stringify(updateData, null, 2));

    const response = await fetch(wcUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro WooCommerce:', response.status, errorText);
      throw new Error(`Erro WooCommerce: ${response.status} - ${errorText}`);
    }

    const updatedProduct = await response.json();
    console.log('Produto atualizado no WooCommerce:', updatedProduct.id);

    // Update local product data
    await supabase
      .from('wc_products')
      .update({
        ...updateData,
        synced_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('organization_id', organizationId);

    // Log sync operation
    await supabase
      .from('sync_logs')
      .insert({
        organization_id: organizationId,
        sync_type: 'product_data',
        operation: 'update',
        status: 'success',
        message: `Produto ${productId} sincronizado com sucesso`,
        details: {
          product_id: productId,
          included_images: includeImages,
          included_tags: includeTags,
          included_categories: includeCategories,
          meta_data_count: updateData.meta_data?.length || 0,
        },
        items_processed: 1,
        items_failed: 0,
      });

    return new Response(JSON.stringify({
      success: true,
      message: 'Produto sincronizado com sucesso',
      product_id: productId,
      wc_product: updatedProduct,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);

    // Log error
    const body = await req.json().catch(() => ({}));
    if (body.organizationId) {
      await supabase
        .from('sync_logs')
        .insert({
          organization_id: body.organizationId,
          sync_type: 'product_data',
          operation: 'update',
          status: 'error',
          message: `Erro na sincronização do produto ${body.productId}`,
          error_details: error.message,
          items_processed: 0,
          items_failed: 1,
        });
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});