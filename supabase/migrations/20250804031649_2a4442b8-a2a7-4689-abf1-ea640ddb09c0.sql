-- Create table for WooCommerce orders
CREATE TABLE public.wc_orders (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  currency TEXT DEFAULT 'BRL',
  version TEXT DEFAULT '1.0.0',
  prices_include_tax BOOLEAN DEFAULT false,
  date_created TIMESTAMP WITH TIME ZONE,
  date_modified TIMESTAMP WITH TIME ZONE,
  discount_total NUMERIC DEFAULT 0,
  discount_tax NUMERIC DEFAULT 0,
  shipping_total NUMERIC DEFAULT 0,
  shipping_tax NUMERIC DEFAULT 0,
  cart_tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  total_tax NUMERIC DEFAULT 0,
  customer_id INTEGER DEFAULT 0,
  order_key TEXT,
  billing JSONB DEFAULT '{}',
  shipping JSONB DEFAULT '{}',
  payment_method TEXT,
  payment_method_title TEXT,
  transaction_id TEXT,
  customer_ip_address TEXT,
  customer_user_agent TEXT,
  created_via TEXT,
  customer_note TEXT,
  date_completed TIMESTAMP WITH TIME ZONE,
  date_paid TIMESTAMP WITH TIME ZONE,
  cart_hash TEXT,
  number TEXT,
  meta_data JSONB DEFAULT '[]',
  line_items JSONB DEFAULT '[]',
  tax_lines JSONB DEFAULT '[]',
  shipping_lines JSONB DEFAULT '[]',
  fee_lines JSONB DEFAULT '[]',
  coupon_lines JSONB DEFAULT '[]',
  refunds JSONB DEFAULT '[]',
  payment_url TEXT,
  is_editable BOOLEAN DEFAULT true,
  needs_payment BOOLEAN DEFAULT false,
  needs_processing BOOLEAN DEFAULT false,
  date_created_gmt TIMESTAMP WITH TIME ZONE,
  date_modified_gmt TIMESTAMP WITH TIME ZONE,
  date_completed_gmt TIMESTAMP WITH TIME ZONE,
  date_paid_gmt TIMESTAMP WITH TIME ZONE,
  currency_symbol TEXT DEFAULT 'R$',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wc_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for access
CREATE POLICY "Allow all operations on wc_orders" 
ON public.wc_orders 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_wc_orders_status ON public.wc_orders(status);
CREATE INDEX idx_wc_orders_customer_id ON public.wc_orders(customer_id);
CREATE INDEX idx_wc_orders_date_created ON public.wc_orders(date_created);
CREATE INDEX idx_wc_orders_synced_at ON public.wc_orders(synced_at);

-- Create trigger for updated_at
CREATE TRIGGER update_wc_orders_updated_at
BEFORE UPDATE ON public.wc_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for WooCommerce customers
CREATE TABLE public.wc_customers (
  id INTEGER PRIMARY KEY,
  date_created TIMESTAMP WITH TIME ZONE,
  date_modified TIMESTAMP WITH TIME ZONE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'customer',
  username TEXT,
  billing JSONB DEFAULT '{}',
  shipping JSONB DEFAULT '{}',
  is_paying_customer BOOLEAN DEFAULT false,
  avatar_url TEXT,
  meta_data JSONB DEFAULT '[]',
  orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  date_created_gmt TIMESTAMP WITH TIME ZONE,
  date_modified_gmt TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for customers
ALTER TABLE public.wc_customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Allow all operations on wc_customers" 
ON public.wc_customers 
FOR ALL 
USING (true);

-- Create indexes for customers
CREATE INDEX idx_wc_customers_email ON public.wc_customers(email);
CREATE INDEX idx_wc_customers_date_created ON public.wc_customers(date_created);
CREATE INDEX idx_wc_customers_synced_at ON public.wc_customers(synced_at);

-- Create trigger for updated_at
CREATE TRIGGER update_wc_customers_updated_at
BEFORE UPDATE ON public.wc_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();