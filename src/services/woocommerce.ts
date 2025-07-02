import { toast } from '@/hooks/use-toast';
import { mockProducts, mockOrders, mockCustomers } from './mockData';

export interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookSecret?: string;
}

export interface ProductVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  attributes: Array<{ name: string; option: string }>;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  status: 'draft' | 'pending' | 'private' | 'publish';
  categories: Array<{ id: number; name: string }>;
  images: Array<{ src: string; alt: string }>;
  date_created: string;
  date_modified: string;
  description: string;
  short_description: string;
  variations?: ProductVariation[];
}

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  total: string;
}

export interface CreateOrderLineItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
  name: string;
  total: string;
}

export interface Order {
  id: number;
  number: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  currency: string;
  total: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  line_items: OrderLineItem[];
}

export interface CreateOrderData {
  payment_method: string;
  payment_method_title: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: CreateOrderLineItem[];
  customer_note?: string;
  total: string;
  meta_data?: Array<{ key: string; value: any }>;
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_created: string;
  date_modified: string;
  date_of_birth?: string; // Novo campo para data de nascimento
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
  orders_count: number;
  total_spent: string;
  meta_data?: Array<{ key: string; value: any }>;
}

class WooCommerceAPI {
  private config: WooCommerceConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const savedConfig = localStorage.getItem('woocommerce_config');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  public setConfig(config: WooCommerceConfig) {
    this.config = config;
    localStorage.setItem('woocommerce_config', JSON.stringify(config));
  }

  public getConfig(): WooCommerceConfig | null {
    return this.config;
  }

  private getAuthString(): string {
    if (!this.config) throw new Error('WooCommerce not configured');
    return btoa(`${this.config.consumerKey}:${this.config.consumerSecret}`);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config) {
      throw new Error('WooCommerce não configurado. Configure nas Configurações.');
    }

    const url = `${this.config.apiUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Basic ${this.getAuthString()}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WooCommerce API Error:', error);
      toast({
        title: "Erro na API",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Products
  async getProducts(page = 1, per_page = 20, search = '', status = ''): Promise<Product[]> {
    // Se não configurado, retornar dados mock
    if (!this.config) {
      let products = [...mockProducts] as any[];
      
      // Aplicar filtros nos dados mock
      if (search) {
        products = products.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (status) {
        products = products.filter(p => p.status === status);
      }
      
      return products;
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ...(search && { search }),
      ...(status && { status }),
    });

    const products = await this.makeRequest(`products?${params}`);
    
    // Para produtos variáveis, buscar as variações
    const productsWithVariations = await Promise.all(
      products.map(async (product: Product) => {
        if (product.type === 'variable') {
          try {
            const variations = await this.getProductVariations(product.id);
            return { ...product, variations };
          } catch (error) {
            console.error(`Error fetching variations for product ${product.id}:`, error);
            return product;
          }
        }
        return product;
      })
    );

    return productsWithVariations;
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.makeRequest(`products/${id}`);
    
    if (product.type === 'variable') {
      try {
        const variations = await this.getProductVariations(id);
        return { ...product, variations };
      } catch (error) {
        console.error(`Error fetching variations for product ${id}:`, error);
      }
    }
    
    return product;
  }

  async getProductVariations(productId: number): Promise<ProductVariation[]> {
    return this.makeRequest(`products/${productId}/variations`);
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.makeRequest('products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    return this.makeRequest(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async updateStock(productId: number, newStock: number, variationId?: number): Promise<Product | ProductVariation> {
    if (variationId) {
      // Atualizar estoque de variação
      return this.makeRequest(`products/${productId}/variations/${variationId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock_quantity: newStock }),
      });
    } else {
      // Atualizar estoque do produto principal
      return this.makeRequest(`products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock_quantity: newStock }),
      });
    }
  }

  async deleteProduct(id: number): Promise<void> {
    return this.makeRequest(`products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(page = 1, per_page = 20, status = ''): Promise<Order[]> {
    // Se não configurado, retornar dados mock
    if (!this.config) {
      let orders = [...mockOrders] as any[];
      
      if (status) {
        orders = orders.filter(o => o.status === status);
      }
      
      return orders;
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ...(status && { status }),
    });

    return this.makeRequest(`orders?${params}`);
  }

  async getOrder(id: number): Promise<Order> {
    return this.makeRequest(`orders/${id}`);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return this.makeRequest(`orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async createOrder(order: CreateOrderData): Promise<Order> {
    return this.makeRequest('orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Customers
  async getCustomers(page = 1, per_page = 20, search = ''): Promise<Customer[]> {
    // Se não configurado, retornar dados mock
    if (!this.config) {
      let customers = [...mockCustomers] as any[];
      
      if (search) {
        customers = customers.filter(c => 
          c.first_name.toLowerCase().includes(search.toLowerCase()) ||
          c.last_name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      return customers;
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ...(search && { search }),
    });

    const customers = await this.makeRequest(`customers?${params}`);
    
    // Adicionar data de nascimento dos meta_data se existir
    return customers.map((customer: any) => ({
      ...customer,
      date_of_birth: customer.meta_data?.find((meta: any) => meta.key === 'date_of_birth')?.value || ''
    }));
  }

  async getBirthdayCustomers(month?: number): Promise<Customer[]> {
    const customers = await this.getCustomers(1, 100); // Buscar mais clientes para filtrar
    const currentMonth = month || new Date().getMonth() + 1;
    
    return customers.filter(customer => {
      if (!customer.date_of_birth) return false;
      
      const birthDate = new Date(customer.date_of_birth);
      return birthDate.getMonth() + 1 === currentMonth;
    });
  }

  async getCustomer(id: number): Promise<Customer> {
    return this.makeRequest(`customers/${id}`);
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    return this.makeRequest('customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
    return this.makeRequest(`customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('products?per_page=1');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const wooCommerceAPI = new WooCommerceAPI();
