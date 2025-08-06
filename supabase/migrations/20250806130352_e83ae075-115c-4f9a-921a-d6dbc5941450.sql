-- Criar tabelas para gerenciar pedidos localmente no Supabase

-- Tabela principal de pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wc_order_id INTEGER, -- ID do pedido no WooCommerce (nulo até sincronizar)
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  
  -- Dados do cliente
  customer_id INTEGER, -- ID do customer no WooCommerce
  customer_email TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Endereços
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Informações de pagamento
  payment_method TEXT,
  payment_methods JSONB, -- Array de métodos de pagamento do POS
  payment_plan_id UUID REFERENCES public.payment_plans(id),
  
  -- Dados adicionais
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Controle de sincronização
  sync_status TEXT NOT NULL DEFAULT 'pending', -- pending, syncing, synced, failed
  sync_error TEXT,
  synced_at TIMESTAMP WITH TIME ZONE,
  sync_attempts INTEGER NOT NULL DEFAULT 0,
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  product_id INTEGER NOT NULL,
  variation_id INTEGER,
  name TEXT NOT NULL,
  sku TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Dados do produto/variação
  product_data JSONB,
  variation_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações de sincronização
CREATE TABLE public.sync_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  
  -- Configurações de pedidos
  orders_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  orders_sync_mode TEXT NOT NULL DEFAULT 'immediate', -- immediate, scheduled
  orders_sync_delay INTEGER NOT NULL DEFAULT 0, -- segundos de delay para sync imediato
  orders_sync_schedule TEXT, -- cron expression para sync agendado
  
  -- Configurações gerais
  max_sync_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay INTEGER NOT NULL DEFAULT 300, -- segundos entre tentativas
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Tabela de logs de sincronização
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- orders, products, etc
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL, -- create, update, delete
  status TEXT NOT NULL, -- success, failed, retrying
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  execution_time INTEGER, -- milliseconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_orders_wc_order_id ON public.orders(wc_order_id);
CREATE INDEX idx_orders_sync_status ON public.orders(sync_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_sync_logs_entity ON public.sync_logs(entity_type, entity_id);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at);

-- Triggers para updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_settings_updated_at
  BEFORE UPDATE ON public.sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies para orders
CREATE POLICY "Users can view orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update orders" ON public.orders
  FOR UPDATE USING (true);

-- Policies para order_items
CREATE POLICY "Users can view order items" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- Policies para sync_settings
CREATE POLICY "Users can view sync settings" ON public.sync_settings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage sync settings" ON public.sync_settings
  FOR ALL USING (true);

-- Policies para sync_logs
CREATE POLICY "Users can view sync logs" ON public.sync_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can create sync logs" ON public.sync_logs
  FOR INSERT WITH CHECK (true);

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Buscar o próximo número baseado nos existentes
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0
    ) + 1
    INTO next_number
    FROM public.orders
    WHERE order_number ~ '^ORD[0-9]+$';
    
    -- Formatar com zeros à esquerda
    formatted_number := 'ORD' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$;