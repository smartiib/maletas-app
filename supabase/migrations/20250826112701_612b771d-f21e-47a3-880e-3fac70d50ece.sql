
-- Criar tabela sync_logs com estrutura completa
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  operation text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  message text NOT NULL,
  error_details text,
  details jsonb DEFAULT '{}',
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  duration_ms integer,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para sync_logs
CREATE POLICY "Select sync_logs by org" ON public.sync_logs
  FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Insert sync_logs by org" ON public.sync_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    (organization_id IS NULL OR organization_id IN (SELECT get_user_organizations()))
  );

CREATE POLICY "Update sync_logs by org" ON public.sync_logs
  FOR UPDATE USING (
    organization_id IS NULL OR organization_id IN (SELECT get_user_organizations())
  );

-- Criar tabela sync_configs (baseada em organização, não usuário)
CREATE TABLE IF NOT EXISTS public.sync_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_type text NOT NULL CHECK (sync_type IN ('products', 'categories', 'orders', 'customers')),
  is_active boolean DEFAULT true,
  sync_interval text DEFAULT 'manual' CHECK (sync_interval IN ('manual', '15min', '30min', '1h', '2h', '6h', '12h', '24h')),
  auto_sync_enabled boolean DEFAULT false,
  sync_on_startup boolean DEFAULT false,
  config_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, sync_type)
);

-- Habilitar RLS na tabela sync_configs
ALTER TABLE public.sync_configs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para sync_configs
CREATE POLICY "Select sync_configs by org" ON public.sync_configs
  FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Insert sync_configs by org" ON public.sync_configs
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Update sync_configs by org" ON public.sync_configs
  FOR UPDATE USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Delete sync_configs by org" ON public.sync_configs
  FOR DELETE USING (organization_id IN (SELECT get_user_organizations()));

-- Criar tabela wc_categories se não existir
CREATE TABLE IF NOT EXISTS public.wc_categories (
  id integer PRIMARY KEY,
  name text NOT NULL,
  slug text,
  parent integer DEFAULT 0,
  description text,
  display text DEFAULT 'default',
  image jsonb DEFAULT '{}',
  menu_order integer DEFAULT 0,
  count integer DEFAULT 0,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela wc_categories
ALTER TABLE public.wc_categories ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para wc_categories
CREATE POLICY "Select categories by org or null" ON public.wc_categories
  FOR SELECT USING (
    organization_id IS NULL OR organization_id IN (SELECT get_user_organizations())
  );

CREATE POLICY "Insert categories by org" ON public.wc_categories
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Update categories by org" ON public.wc_categories
  FOR UPDATE USING (organization_id IN (SELECT get_user_organizations()));

-- Adicionar colunas WooCommerce na tabela organizations se não existirem
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS wc_base_url text,
  ADD COLUMN IF NOT EXISTS wc_consumer_key text,
  ADD COLUMN IF NOT EXISTS wc_consumer_secret text;

-- Adicionar trigger para updated_at nas novas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sync_configs_updated_at 
  BEFORE UPDATE ON public.sync_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wc_categories_updated_at 
  BEFORE UPDATE ON public.wc_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS sync_logs_organization_id_idx ON public.sync_logs (organization_id);
CREATE INDEX IF NOT EXISTS sync_logs_created_at_idx ON public.sync_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS sync_configs_organization_id_idx ON public.sync_configs (organization_id);
CREATE INDEX IF NOT EXISTS wc_categories_organization_id_idx ON public.wc_categories (organization_id);
