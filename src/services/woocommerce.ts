// Custom WooCommerce REST API implementation for browser compatibility
export interface Customer {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: any[];
  orders_count: number;
  total_spent: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  low_stock_amount: number | null;
  sold_individually: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  grouped_products: number[];
  purchase_note: string;
  categories: any[];
  tags: any[];
  images: any[];
  attributes: any[];
  default_attributes: any[];
  variations: number[];
  grouped_products_count: number;
  menu_order: number;
  price_html: string;
  related_ids: number[];
  meta_data: any[];
  stock_status: string;
  average_rating: string;
  rating_count: number;
  has_options: boolean;
  is_downloadable: boolean;
  is_virtual: boolean;
  is_sold_individually: boolean;
  is_taxable: boolean;
  manage_menu_order: boolean;
  downloadable_files: any[];
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
}

export interface Order {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: "processing" | "completed" | "pending" | "on-hold" | "cancelled" | "refunded" | "failed";
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_paid_gmt: string | null;
  cart_hash: string;
  meta_data: any[];
  line_items: OrderLineItem[];
  tax_lines: any[];
  shipping_lines: any[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
  payment_url: string;
  is_editable: boolean;
  needs_payment: boolean;
  needs_processing: boolean;
  date_completed: string | null;
  date_completed_gmt: string | null;
  customer: Customer;
}

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: any[];
  meta_data: any[];
  sku: string;
  price: number;
  image: {
    src: string;
  };
  parent_name: string | null;
}

export interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

// Custom OAuth1 signature generation
async function generateOAuth1Signature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  // Create signature base string
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  
  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;
  
  // Generate signature using HMAC-SHA1 (simplified for browser)
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(signatureBaseString);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export class WooCommerceService {
  private config?: WooCommerceConfig;

  constructor() {
    this.config = undefined;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any, params?: Record<string, string>) {
    if (!this.config) {
      throw new Error('WooCommerce não configurado');
    }

    const url = `${this.config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/${endpoint}`;
    
    // OAuth1 parameters - widen type to allow adding oauth_signature
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: Math.random().toString(36).substring(2, 15),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version: '1.0',
      ...(params || {})
    };

    // Generate signature
    const signature = await generateOAuth1Signature(method, url, oauthParams, this.config.consumerSecret);
    oauthParams.oauth_signature = signature;

    // Build URL with OAuth parameters
    const urlWithParams = new URL(url);
    Object.keys(oauthParams).forEach(key => {
      urlWithParams.searchParams.append(key, oauthParams[key]);
    });

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(urlWithParams.toString(), requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    return {
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  setConfig(config: WooCommerceConfig) {
    this.config = config;
  }

  async getCustomers(config: WooCommerceConfig, page: number = 1, perPage: number = 10): Promise<{ data: Customer[]; total: number }> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest('customers', 'GET', undefined, { 
        per_page: perPage.toString(), 
        page: page.toString() 
      });
      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      return { data: response.data as Customer[], total };
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }

  async createCustomer(config: WooCommerceConfig, data: Partial<Customer>): Promise<Customer> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest('customers', 'POST', data);
      return response.data as Customer;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  async updateCustomer(config: WooCommerceConfig, id: number, data: Partial<Customer>): Promise<Customer> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest(`customers/${id}`, 'PUT', data);
      return response.data as Customer;
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  async getProducts(config: WooCommerceConfig, page: number = 1, perPage: number = 10): Promise<{ data: Product[]; total: number }> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest('products', 'GET', undefined, { 
        per_page: perPage.toString(), 
        page: page.toString() 
      });
      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      return { data: response.data as Product[], total };
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  // Overloads para compatibilidade: permite chamar getProduct(id) sem passar config
  async getProduct(config: WooCommerceConfig, id: number): Promise<Product>;
  async getProduct(id: number): Promise<Product>;
  async getProduct(arg1: WooCommerceConfig | number, arg2?: number): Promise<Product> {
    if (typeof arg1 === 'number') {
      // Chamada compatível: getProduct(id)
      if (!this.config) {
        throw new Error('WooCommerce não configurado');
      }
      const response = await this.makeRequest(`products/${arg1}`, 'GET');
      return response.data as Product;
    } else {
      // Chamada padrão: getProduct(config, id)
      this.setConfig(arg1);
      if (typeof arg2 !== 'number') {
        throw new Error('ID do produto inválido');
      }
      const response = await this.makeRequest(`products/${arg2}`, 'GET');
      return response.data as Product;
    }
  }

  async createProduct(config: WooCommerceConfig, data: Partial<Product>): Promise<Product> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest('products', 'POST', data);
      return response.data as Product;
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  async updateProduct(config: WooCommerceConfig, id: number, data: Partial<Product>): Promise<Product> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest(`products/${id}`, 'PUT', data);
      return response.data as Product;
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }

  async getOrders(config: WooCommerceConfig, page: number = 1, perPage: number = 10): Promise<{ data: Order[]; total: number }> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest('orders', 'GET', undefined, { 
        per_page: perPage.toString(), 
        page: page.toString() 
      });
      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      return { data: response.data as Order[], total };
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  }

  async createOrder(config: WooCommerceConfig, data: Partial<Order>): Promise<Order> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest('orders', 'POST', data);
      return response.data as Order;
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  async updateOrderStatus(config: WooCommerceConfig, id: number, status: string): Promise<Order> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest(`orders/${id}`, 'PUT', { status: status });
      return response.data as Order;
    } catch (error: any) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  }

  async updateProductStock(config: WooCommerceConfig, productId: number, newStock: number): Promise<Product> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest(`products/${productId}`, 'PUT', { stock_quantity: newStock });
      return response.data as Product;
    } catch (error: any) {
      console.error('Erro ao atualizar estoque do produto:', error);
      throw error;
    }
  }

  async updateVariationStock(config: WooCommerceConfig, productId: number, variationId: number, newStock: number): Promise<any> {
    try {
      this.setConfig(config);
      const response = await this.makeRequest(`products/${productId}/variations/${variationId}`, 'PUT', { stock_quantity: newStock });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar estoque da variação:', error);
      throw error;
    }
  }

  getConfig(): WooCommerceConfig | undefined {
    return this.config;
  }
}

// Export a singleton instance
export const wooCommerceService = new WooCommerceService();

// Export wooCommerceAPI for backwards compatibility
export const wooCommerceAPI = wooCommerceService;
