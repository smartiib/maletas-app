-- Criar tabela para produtos do WooCommerce
CREATE TABLE public.wc_products (
  id integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  slug text,
  permalink text,
  date_created timestamp with time zone,
  date_modified timestamp with time zone,
  type text DEFAULT 'simple',
  status text DEFAULT 'publish',
  featured boolean DEFAULT false,
  catalog_visibility text DEFAULT 'visible',
  description text,
  short_description text,
  sku text,
  price numeric(10,2),
  regular_price numeric(10,2),
  sale_price numeric(10,2),
  date_on_sale_from timestamp with time zone,
  date_on_sale_to timestamp with time zone,
  on_sale boolean DEFAULT false,
  purchasable boolean DEFAULT true,
  total_sales integer DEFAULT 0,
  virtual boolean DEFAULT false,
  downloadable boolean DEFAULT false,
  downloads jsonb DEFAULT '[]',
  download_limit integer DEFAULT -1,
  download_expiry integer DEFAULT -1,
  external_url text,
  button_text text,
  tax_status text DEFAULT 'taxable',
  tax_class text,
  manage_stock boolean DEFAULT false,
  stock_quantity integer,
  backorders text DEFAULT 'no',
  backorders_allowed boolean DEFAULT false,
  backordered boolean DEFAULT false,
  low_stock_amount integer,
  sold_individually boolean DEFAULT false,
  weight text,
  dimensions jsonb DEFAULT '{}',
  shipping_required boolean DEFAULT true,
  shipping_taxable boolean DEFAULT true,
  shipping_class text,
  shipping_class_id integer,
  reviews_allowed boolean DEFAULT true,
  average_rating text DEFAULT '0',
  rating_count integer DEFAULT 0,
  upsell_ids jsonb DEFAULT '[]',
  cross_sell_ids jsonb DEFAULT '[]',
  parent_id integer DEFAULT 0,
  purchase_note text,
  categories jsonb DEFAULT '[]',
  tags jsonb DEFAULT '[]',
  images jsonb DEFAULT '[]',
  attributes jsonb DEFAULT '[]',
  default_attributes jsonb DEFAULT '[]',
  variations jsonb DEFAULT '[]',
  grouped_products jsonb DEFAULT '[]',
  menu_order integer DEFAULT 0,
  price_html text,
  related_ids jsonb DEFAULT '[]',
  meta_data jsonb DEFAULT '[]',
  stock_status text DEFAULT 'instock',
  has_options boolean DEFAULT false,
  post_password text,
  global_unique_id text,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para variações de produtos
CREATE TABLE public.wc_product_variations (
  id integer NOT NULL PRIMARY KEY,
  parent_id integer NOT NULL,
  date_created timestamp with time zone,
  date_modified timestamp with time zone,
  description text,
  permalink text,
  sku text,
  price numeric(10,2),
  regular_price numeric(10,2),
  sale_price numeric(10,2),
  date_on_sale_from timestamp with time zone,
  date_on_sale_to timestamp with time zone,
  on_sale boolean DEFAULT false,
  status text DEFAULT 'publish',
  purchasable boolean DEFAULT true,
  virtual boolean DEFAULT false,
  downloadable boolean DEFAULT false,
  downloads jsonb DEFAULT '[]',
  download_limit integer DEFAULT -1,
  download_expiry integer DEFAULT -1,
  tax_status text DEFAULT 'taxable',
  tax_class text,
  manage_stock boolean DEFAULT false,
  stock_quantity integer,
  backorders text DEFAULT 'no',
  backorders_allowed boolean DEFAULT false,
  backordered boolean DEFAULT false,
  low_stock_amount integer,
  weight text,
  dimensions jsonb DEFAULT '{}',
  shipping_class text,
  shipping_class_id integer,
  image jsonb DEFAULT '{}',
  attributes jsonb DEFAULT '[]',
  menu_order integer DEFAULT 0,
  meta_data jsonb DEFAULT '[]',
  stock_status text DEFAULT 'instock',
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para categorias de produtos
CREATE TABLE public.wc_product_categories (
  id integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  slug text,
  parent integer DEFAULT 0,
  description text,
  display text DEFAULT 'default',
  image jsonb DEFAULT '{}',
  menu_order integer DEFAULT 0,
  count integer DEFAULT 0,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para logs de sincronização
CREATE TABLE public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type text NOT NULL, -- 'products', 'customers', 'orders'
  operation text NOT NULL, -- 'sync_started', 'sync_completed', 'sync_error', 'data_imported', 'data_failed'
  status text NOT NULL DEFAULT 'success', -- 'success', 'error', 'warning'
  message text NOT NULL,
  details jsonb DEFAULT '{}',
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  duration_ms integer,
  error_details text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para configurações de sincronização
CREATE TABLE public.sync_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  sync_type text NOT NULL, -- 'products', 'customers', 'orders'
  is_active boolean DEFAULT true,
  sync_interval text DEFAULT 'manual', -- 'manual', '15min', '30min', '1h', '2h', '6h', '12h', '24h'
  last_sync_at timestamp with time zone,
  next_sync_at timestamp with time zone,
  auto_sync_enabled boolean DEFAULT false,
  sync_on_startup boolean DEFAULT false,
  config_data jsonb DEFAULT '{}', -- configurações específicas do tipo de sync
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, sync_type)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.wc_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wc_product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wc_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para wc_products (acesso total para todos os usuários autenticados)
CREATE POLICY "Allow all operations on wc_products" ON public.wc_products FOR ALL USING (true);

-- Políticas RLS para wc_product_variations
CREATE POLICY "Allow all operations on wc_product_variations" ON public.wc_product_variations FOR ALL USING (true);

-- Políticas RLS para wc_product_categories
CREATE POLICY "Allow all operations on wc_product_categories" ON public.wc_product_categories FOR ALL USING (true);

-- Políticas RLS para sync_logs (usuários podem ver seus próprios logs)
CREATE POLICY "Users can view their own sync logs" ON public.sync_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sync logs" ON public.sync_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para sync_config (usuários podem gerenciar suas próprias configurações)
CREATE POLICY "Users can manage their own sync config" ON public.sync_config FOR ALL USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_wc_products_sku ON public.wc_products(sku);
CREATE INDEX idx_wc_products_status ON public.wc_products(status);
CREATE INDEX idx_wc_products_type ON public.wc_products(type);
CREATE INDEX idx_wc_products_synced_at ON public.wc_products(synced_at);

CREATE INDEX idx_wc_product_variations_parent_id ON public.wc_product_variations(parent_id);
CREATE INDEX idx_wc_product_variations_sku ON public.wc_product_variations(sku);
CREATE INDEX idx_wc_product_variations_synced_at ON public.wc_product_variations(synced_at);

CREATE INDEX idx_wc_product_categories_parent ON public.wc_product_categories(parent);
CREATE INDEX idx_wc_product_categories_slug ON public.wc_product_categories(slug);

CREATE INDEX idx_sync_logs_sync_type ON public.sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at);
CREATE INDEX idx_sync_logs_user_id ON public.sync_logs(user_id);

CREATE INDEX idx_sync_config_user_id ON public.sync_config(user_id);
CREATE INDEX idx_sync_config_sync_type ON public.sync_config(sync_type);
CREATE INDEX idx_sync_config_next_sync_at ON public.sync_config(next_sync_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_wc_products_updated_at
  BEFORE UPDATE ON public.wc_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wc_product_variations_updated_at
  BEFORE UPDATE ON public.wc_product_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wc_product_categories_updated_at
  BEFORE UPDATE ON public.wc_product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_config_updated_at
  BEFORE UPDATE ON public.sync_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();