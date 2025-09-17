// WooCommerce API Types
export interface Product {
  id: number;
  name: string;
  slug: string;
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
  date_on_sale_to: string | null;
  price_html: string;
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
  stock_status: string;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Category[];
  tags: any[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  default_attributes: any[];
  variations: number[];
  grouped_products: any[];
  menu_order: number;
  meta_data: MetaData[];
  date_created: string;
  date_modified: string;
  permalink: string;
}

export interface ProductImage {
  id: number;
  date_created: string;
  date_modified: string;
  src: string;
  name: string;
  alt: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: CategoryImage | null;
  menu_order: number;
  count: number;
}

export interface CategoryImage {
  id: number;
  date_created: string;
  date_modified: string;
  src: string;
  name: string;
  alt: string;
}

// Order status type for better type safety
export type OrderStatus = 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';

export interface Order {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: OrderStatus;
  currency: string;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  subtotal?: string; // Added for POS discount support
  total_tax: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_completed: string | null;
  cart_hash: string;
  meta_data: MetaData[];
  line_items: LineItem[];
  tax_lines: any[];
  shipping_lines: any[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
}

export interface Customer {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: MetaData[];
  total_spent?: string;
  orders_count?: number; // Add the missing orders_count property
}

export interface BillingAddress {
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
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface LineItem {
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
  meta_data: MetaData[];
  sku: string;
  price: number;
}

export interface MetaData {
  id: number;
  key: string;
  value: any;
}

// Configuration Types
export interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
  isConfigured?: boolean;
  url?: string;
}

// Cart Types for POS
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  images?: ProductImage[];
}

export interface SavedCart {
  id: string;
  name: string;
  items: CartItem[];
  savedAt: Date;
}

// Local Database Types
export interface LocalCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  username?: string;
  billing?: BillingAddress;
  shipping?: ShippingAddress;
  is_paying_customer?: boolean;
  avatar_url?: string;
  meta_data?: MetaData[];
  total_spent?: number;
  orders_count?: number;
  date_created?: string;
  date_modified?: string;
  organization_id?: string;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LocalProduct {
  id: number;
  name: string;
  sku: string;
  slug?: string;
  type?: string;
  status?: string;
  featured?: boolean;
  description?: string;
  short_description?: string;
  price?: number;
  regular_price?: number;
  sale_price?: number;
  on_sale?: boolean;
  manage_stock?: boolean;
  stock_quantity?: number;
  stock_status?: string;
  categories?: any[];
  tags?: any[];
  images?: any[];
  attributes?: any[];
  variations?: any[];
  meta_data?: any[];
  date_created?: string;
  date_modified?: string;
  organization_id?: string;
}

export interface LocalOrder {
  id: number;
  order_number: string;
  status: string;
  currency?: string;
  total: number;
  customer_id?: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: any;
  shipping_address?: any;
  payment_method?: string;
  payment_methods?: any;
  notes?: string;
  line_items?: any[];
  metadata?: any;
  date_created?: string;
  date_modified?: string;
  organization_id?: string;
}

// Type conversion utilities
export const convertLocalCustomerToWooCommerce = (customer: LocalCustomer): Partial<Customer> => ({
  ...customer,
  total_spent: customer.total_spent?.toString() || "0",
  date_created: customer.date_created || new Date().toISOString(),
  date_modified: customer.date_modified || new Date().toISOString(),
});

export const convertLocalProductToWooCommerce = (product: LocalProduct): Partial<Product> => ({
  ...product,
  price: product.price?.toString() || "0",
  regular_price: product.regular_price?.toString() || "0",
  sale_price: product.sale_price?.toString() || "0",
  catalog_visibility: "visible",
  date_on_sale_from: null,
  date_on_sale_to: null,
  price_html: `$${product.price || 0}`,
  purchasable: true,
  total_sales: 0,
  virtual: false,
  downloadable: false,
  downloads: [],
  download_limit: -1,
  download_expiry: -1,
  external_url: "",
  button_text: "",
  tax_status: "taxable",
  tax_class: "",
  backorders: "no",
  backorders_allowed: false,
  backordered: false,
  sold_individually: false,
  weight: "",
  dimensions: { length: "", width: "", height: "" },
  shipping_required: true,
  shipping_taxable: true,
  shipping_class: "",
  shipping_class_id: 0,
  reviews_allowed: true,
  average_rating: "0",
  rating_count: 0,
  related_ids: [],
  upsell_ids: [],
  cross_sell_ids: [],
  parent_id: 0,
  purchase_note: "",
  tags: [],
  default_attributes: [],
  grouped_products: [],
  menu_order: 0,
  permalink: "",
  date_created: product.date_created || new Date().toISOString(),
  date_modified: product.date_modified || new Date().toISOString(),
});

export const convertLocalOrderToWooCommerce = (order: LocalOrder): Partial<Order> => ({
  ...order,
  id: order.id,
  parent_id: 0,
  number: order.order_number,
  order_key: `wc_order_${order.id}`,
  created_via: "manual",
  version: "1.0",
  status: order.status as OrderStatus,
  currency: order.currency || "BRL",
  date_created: order.date_created || new Date().toISOString(),
  date_modified: order.date_modified || new Date().toISOString(),
  discount_total: "0",
  discount_tax: "0",
  shipping_total: "0",
  shipping_tax: "0",
  cart_tax: "0",
  total: order.total?.toString() || "0",
  total_tax: "0",
  prices_include_tax: false,
  customer_ip_address: "",
  customer_user_agent: "",
  customer_note: order.notes || "",
  billing: order.billing_address || {} as BillingAddress,
  shipping: order.shipping_address || {} as ShippingAddress,
  payment_method: order.payment_method || "",
  payment_method_title: order.payment_method || "",
  transaction_id: "",
  date_paid: null,
  date_completed: null,
  cart_hash: "",
  meta_data: [],
  line_items: order.line_items || [],
  tax_lines: [],
  shipping_lines: [],
  fee_lines: [],
  coupon_lines: [],
  refunds: [],
});
