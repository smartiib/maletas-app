import { Product, Category, Order, Customer, WooCommerceConfig } from '@/types';
import { supabase } from '@/integrations/supabase/client';

class WooCommerceService {
  private baseURL: string = '';
  private consumerKey: string = '';
  private consumerSecret: string = '';
  private isConfigured: boolean = false;

  async configure() {
    console.log('[WooCommerceService] Configurando serviço...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[WooCommerceService] Usuário não autenticado');
        return;
      }

      // Buscar organização atual do contexto ou localStorage
      let currentOrg: any = null;
      
      // Tentar pegar do localStorage primeiro (para usuários organizacionais)
      const storedOrgUser = localStorage.getItem('organizationUser');
      if (storedOrgUser) {
        try {
          const orgUser = JSON.parse(storedOrgUser);
          if (orgUser?.organization_id) {
            console.log('[WooCommerceService] Usando organização do localStorage:', orgUser.organization_id);
            
            // Buscar configurações da organização
            const { data: orgData, error } = await supabase
              .from('organizations')
              .select('settings')
              .eq('id', orgUser.organization_id)
              .single();

            if (!error && orgData) {
              currentOrg = { id: orgUser.organization_id, settings: orgData.settings };
            }
          }
        } catch (parseError) {
          console.error('[WooCommerceService] Erro ao parsear organizationUser:', parseError);
        }
      }

      // Se não encontrou no localStorage, buscar organizações do usuário
      if (!currentOrg) {
        console.log('[WooCommerceService] Buscando organizações do usuário...');
        const { data: userOrgs } = await supabase
          .from('user_organizations')
          .select(`
            organization_id,
            organizations!inner(id, settings)
          `)
          .eq('user_id', session.user.id);

        if (userOrgs && userOrgs.length > 0) {
          const firstOrg = userOrgs[0].organizations as any;
          currentOrg = firstOrg;
          console.log('[WooCommerceService] Usando primeira organização encontrada:', firstOrg.id);
        }
      }

      if (!currentOrg?.settings) {
        console.log('[WooCommerceService] Nenhuma organização com configurações encontrada');
        this.isConfigured = false;
        return;
      }

      const settings = currentOrg.settings;
      this.baseURL = settings.woocommerce_url || '';
      this.consumerKey = settings.woocommerce_consumer_key || '';
      this.consumerSecret = settings.woocommerce_consumer_secret || '';
      
      this.isConfigured = !!(this.baseURL && this.consumerKey && this.consumerSecret);
      
      console.log('[WooCommerceService] Configuração completa:', {
        hasBaseURL: !!this.baseURL,
        hasConsumerKey: !!this.consumerKey,
        hasConsumerSecret: !!this.consumerSecret,
        isConfigured: this.isConfigured
      });

    } catch (error) {
      console.error('[WooCommerceService] Erro na configuração:', error);
      this.isConfigured = false;
    }
  }

  getConfig(): WooCommerceConfig {
    return {
      apiUrl: this.baseURL,
      consumerKey: this.consumerKey,
      consumerSecret: this.consumerSecret,
      isConfigured: this.isConfigured,
      url: this.baseURL
    };
  }

  private async ensureConfigured() {
    if (!this.isConfigured) {
      await this.configure();
    }
    
    if (!this.isConfigured) {
      throw new Error('WooCommerce não configurado. Configure nas Configurações.');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    await this.ensureConfigured();

    const url = `${this.baseURL.replace(/\/$/, '')}/wp-json/wc/v3/${endpoint}`;
    const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);

    console.log('[WooCommerceService] Fazendo requisição:', {
      url: url.replace(this.baseURL, '[BASE_URL]'),
      method: options.method || 'GET',
      hasAuth: !!auth
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WooCommerceService] Erro na requisição:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getProducts(perPage: number = 10): Promise<Product[]> {
    return this.makeRequest(`products?per_page=${perPage}&orderby=date&order=desc`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.makeRequest(`products/${id}`);
  }

  async getCategories(): Promise<Category[]> {
    return this.makeRequest('products/categories?per_page=100');
  }

  async getOrders(perPage: number = 10): Promise<Order[]> {
    return this.makeRequest(`orders?per_page=${perPage}&orderby=date&order=desc`);
  }

  async getCustomers(perPage: number = 10): Promise<Customer[]> {
    return this.makeRequest(`customers?per_page=${perPage}&orderby=date&order=desc`);
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    return this.makeRequest('products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    return this.makeRequest(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    return this.makeRequest('customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
    return this.makeRequest(`customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    return this.makeRequest('orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return this.makeRequest(`orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateStock(productId: number, stockQuantity: number, variationId?: number): Promise<any> {
    console.log('[WooCommerceService] updateStock chamado:', {
      productId,
      stockQuantity,
      variationId
    });

    await this.ensureConfigured();

    const stockStatus = stockQuantity > 0 ? 'instock' : 'outofstock';
    const updateData = {
      stock_quantity: stockQuantity,
      stock_status: stockStatus,
      manage_stock: true
    };

    if (variationId) {
      // Atualizar variação
      console.log('[WooCommerceService] Atualizando variação:', variationId);
      return this.makeRequest(`products/${productId}/variations/${variationId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } else {
      // Atualizar produto simples
      console.log('[WooCommerceService] Atualizando produto:', productId);
      return this.makeRequest(`products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    }
  }
}

export const wooCommerceAPI = new WooCommerceService();

// Re-export types for convenience
export type { Product, Category, Order, Customer, WooCommerceConfig } from '@/types';
