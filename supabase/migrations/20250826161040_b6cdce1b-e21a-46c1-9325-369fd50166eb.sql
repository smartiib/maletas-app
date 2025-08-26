
-- Criar índices para melhorar performance das consultas de variações
CREATE INDEX IF NOT EXISTS idx_wc_product_variations_org_parent 
ON wc_product_variations (organization_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_wc_product_variations_parent 
ON wc_product_variations (parent_id);

CREATE INDEX IF NOT EXISTS idx_wc_products_org_id 
ON wc_products (organization_id, id);

-- Verificar se existe tabela wc_categories (erro 404) e criar alias se necessário
-- Primeira, vamos criar a tabela sync_configs se não existir (erro 404 nos logs)
CREATE TABLE IF NOT EXISTS sync_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_interval TEXT DEFAULT 'manual',
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_on_startup BOOLEAN DEFAULT false,
  config_data JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para sync_configs
ALTER TABLE sync_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sync configs for their org" 
ON sync_configs 
FOR ALL 
USING (organization_id IN (SELECT get_user_organizations()));

-- Criar tabela wc_categories como alias/view da wc_product_categories para compatibilidade
CREATE OR REPLACE VIEW wc_categories AS 
SELECT * FROM wc_product_categories;
