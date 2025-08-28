
import { supabase } from '@/integrations/supabase/client';

interface WooProduct {
  id: number;
  date_modified: string;
  name: string;
  sku: string;
  type: string;
  status: string;
}

interface SyncDiscoveryResult {
  totalItems: number;
  missingIds: number[];
  changedIds: number[];
  lastModified: string | null;
}

interface IncrementalSyncConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

export class IncrementalSyncService {
  private config: IncrementalSyncConfig;
  private organizationId: string;

  constructor(config: IncrementalSyncConfig, organizationId: string) {
    this.config = config;
    this.organizationId = organizationId;
  }

  /**
   * Descobre quais produtos precisam ser sincronizados
   */
  async discoverProductsToSync(): Promise<SyncDiscoveryResult> {
    console.log('[IncrementalSync] Iniciando descoberta de produtos...');
    
    // 1. Buscar todos os IDs e datas de modificação do WooCommerce
    const wooProducts = await this.fetchAllWooProductsMetadata();
    
    // 2. Buscar produtos existentes na base local
    const { data: localProducts, error } = await supabase
      .from('wc_products')
      .select('id, date_modified')
      .eq('organization_id', this.organizationId);

    if (error) {
      throw new Error(`Erro ao buscar produtos locais: ${error.message}`);
    }

    // 3. Criar mapa dos produtos locais para comparação rápida
    const localProductsMap = new Map<number, string>();
    (localProducts || []).forEach(p => {
      localProductsMap.set(p.id, p.date_modified || '');
    });

    // 4. Identificar produtos ausentes e modificados
    const missingIds: number[] = [];
    const changedIds: number[] = [];
    let lastModified: string | null = null;

    for (const wooProduct of wooProducts) {
      const localDateModified = localProductsMap.get(wooProduct.id);
      
      if (!localDateModified) {
        // Produto não existe localmente
        missingIds.push(wooProduct.id);
      } else if (wooProduct.date_modified !== localDateModified) {
        // Produto foi modificado
        changedIds.push(wooProduct.id);
      }
      
      // Manter track da data de modificação mais recente
      if (!lastModified || wooProduct.date_modified > lastModified) {
        lastModified = wooProduct.date_modified;
      }
    }

    console.log('[IncrementalSync] Descoberta concluída:', {
      total: wooProducts.length,
      missing: missingIds.length,
      changed: changedIds.length,
      lastModified
    });

    return {
      totalItems: wooProducts.length,
      missingIds,
      changedIds,
      lastModified
    };
  }

  /**
   * Busca apenas metadados (ID e date_modified) de todos os produtos do WooCommerce
   */
  private async fetchAllWooProductsMetadata(): Promise<WooProduct[]> {
    const allProducts: WooProduct[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = new URL(`${this.config.url}/wp-json/wc/v3/products`);
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));
      url.searchParams.set('status', 'any');
      url.searchParams.set('_fields', 'id,date_modified,name,sku,type,status'); // Apenas campos essenciais
      url.searchParams.set('consumer_key', this.config.consumer_key);
      url.searchParams.set('consumer_secret', this.config.consumer_secret);

      try {
        console.log(`[IncrementalSync] Buscando metadados da página ${page}...`);
        
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
        }

        const products = await response.json() as WooProduct[];
        
        if (!products || products.length === 0) {
          break;
        }

        allProducts.push(...products);
        
        // Se retornou menos que perPage, é a última página
        if (products.length < perPage) {
          break;
        }

        page++;
        
        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`[IncrementalSync] Erro na página ${page}:`, error);
        throw error;
      }
    }

    console.log(`[IncrementalSync] Metadados coletados: ${allProducts.length} produtos`);
    return allProducts;
  }

  /**
   * Atualiza status de sincronização no banco
   */
  async updateSyncStatus(data: {
    total_items?: number;
    processed_items?: number;
    status?: string;
    last_sync_at?: string;
    last_discover_at?: string;
    metadata?: any;
  }) {
    const { error } = await supabase
      .from('sync_status')
      .upsert({
        organization_id: this.organizationId,
        sync_type: 'products',
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,sync_type'
      });

    if (error) {
      console.error('[IncrementalSync] Erro ao atualizar status:', error);
    }
  }

  /**
   * Busca status atual de sincronização
   */
  async getSyncStatus() {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('sync_type', 'products')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar status: ${error.message}`);
    }

    return data;
  }
}
