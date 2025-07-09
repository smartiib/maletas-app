-- Criar tabela de histórico de estoque
CREATE TABLE public.stock_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id INTEGER NOT NULL,
  variation_id INTEGER NULL,
  type TEXT NOT NULL, -- 'sale', 'refund', 'manual_adjustment', 'webhook_sync'
  quantity_change INTEGER NOT NULL, -- pode ser negativo
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NULL,
  source TEXT NOT NULL DEFAULT 'internal', -- 'internal', 'woocommerce', 'webhook'
  user_id UUID NULL, -- referência para auth.users quando aplicável
  user_name TEXT NULL, -- nome do usuário quando conhecido
  wc_order_id INTEGER NULL, -- ID do pedido no WooCommerce quando aplicável
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB NULL DEFAULT '{}'::jsonb -- dados extras como detalhes da venda/reembolso
);

-- Habilitar RLS
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (já que é histórico interno)
CREATE POLICY "Allow all operations on stock_history" 
ON public.stock_history 
FOR ALL 
USING (true);

-- Índices para performance
CREATE INDEX idx_stock_history_product_id ON public.stock_history(product_id);
CREATE INDEX idx_stock_history_variation_id ON public.stock_history(variation_id);
CREATE INDEX idx_stock_history_created_at ON public.stock_history(created_at DESC);
CREATE INDEX idx_stock_history_type ON public.stock_history(type);
CREATE INDEX idx_stock_history_source ON public.stock_history(source);

-- Função para adicionar entrada no histórico
CREATE OR REPLACE FUNCTION public.add_stock_history_entry(
  p_product_id INTEGER,
  p_variation_id INTEGER DEFAULT NULL,
  p_type TEXT DEFAULT 'manual_adjustment',
  p_quantity_change INTEGER DEFAULT 0,
  p_previous_stock INTEGER DEFAULT 0,
  p_new_stock INTEGER DEFAULT 0,
  p_reason TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'internal',
  p_user_id UUID DEFAULT auth.uid(),
  p_user_name TEXT DEFAULT NULL,
  p_wc_order_id INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  entry_id UUID;
BEGIN
  INSERT INTO public.stock_history (
    product_id,
    variation_id,
    type,
    quantity_change,
    previous_stock,
    new_stock,
    reason,
    source,
    user_id,
    user_name,
    wc_order_id,
    metadata
  ) VALUES (
    p_product_id,
    p_variation_id,
    p_type,
    p_quantity_change,
    p_previous_stock,
    p_new_stock,
    p_reason,
    p_source,
    p_user_id,
    p_user_name,
    p_wc_order_id,
    p_metadata
  ) RETURNING id INTO entry_id;
  
  RETURN entry_id;
END;
$$;