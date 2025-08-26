import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

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
  status: string;
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

interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export class WooCommerceService {
  private api: WooCommerceRestApi | null = null;

  constructor() {
    this.api = null;
  }

  private getApiInstance(config: WooCommerceConfig) {
    if (this.api) {
      return this.api;
    }

    this.api = new WooCommerceRestApi({
      url: config.apiUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: 'wc/v3'
    });

    return this.api;
  }

  async getCustomers(config: WooCommerceConfig, page: number = 1, perPage: number = 10): Promise<{ data: Customer[]; total: number }> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.get('customers', { per_page: perPage, page: page });
      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      return { data: response.data as Customer[], total };
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }

  async createCustomer(config: WooCommerceConfig, data: Partial<Customer>): Promise<Customer> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.post('customers', data);
      return response.data as Customer;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  async updateCustomer(config: WooCommerceConfig, id: number, data: Partial<Customer>): Promise<Customer> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.put(`customers/${id}`, data);
      return response.data as Customer;
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  async getProducts(config: WooCommerceConfig, page: number = 1, perPage: number = 10): Promise<{ data: Product[]; total: number }> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.get('products', { per_page: perPage, page: page });
      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      return { data: response.data as Product[], total };
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  async createProduct(config: WooCommerceConfig, data: Partial<Product>): Promise<Product> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.post('products', data);
      return response.data as Product;
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  async updateProduct(config: WooCommerceConfig, id: number, data: Partial<Product>): Promise<Product> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.put(`products/${id}`, data);
      return response.data as Product;
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }

  async getOrders(config: WooCommerceConfig, page: number = 1, perPage: number = 10): Promise<{ data: Order[]; total: number }> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.get('orders', { per_page: perPage, page: page });
      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      return { data: response.data as Order[], total };
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  }

  async createOrder(config: WooCommerceConfig, data: Partial<Order>): Promise<Order> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.post('orders', data);
      return response.data as Order;
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  async updateOrderStatus(config: WooCommerceConfig, id: number, status: string): Promise<Order> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.put(`orders/${id}`, { status: status });
      return response.data as Order;
    } catch (error: any) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  }

  async updateProductStock(config: WooCommerceConfig, productId: number, newStock: number): Promise<Product> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.put(`products/${productId}`, { stock_quantity: newStock });
      return response.data as Product;
    } catch (error: any) {
      console.error('Erro ao atualizar estoque do produto:', error);
      throw error;
    }
  }

  async updateVariationStock(config: WooCommerceConfig, productId: number, variationId: number, newStock: number): Promise<any> {
    try {
      const api = this.getApiInstance(config);
      const response = await api.put(`products/${productId}/variations/${variationId}`, { stock_quantity: newStock });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar estoque da variação:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const wooCommerceService = new WooCommerceService();
