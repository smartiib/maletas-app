
-- Atualizar tabela organizations com campos completos
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Criar tabela para controlar quais páginas cada organização pode acessar
CREATE TABLE IF NOT EXISTS public.organization_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, page_key)
);

-- Habilitar RLS na tabela organization_pages
ALTER TABLE public.organization_pages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para organization_pages
CREATE POLICY "Users can view organization pages" 
  ON public.organization_pages 
  FOR SELECT 
  USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can manage organization pages" 
  ON public.organization_pages 
  FOR ALL 
  USING (organization_id IN (SELECT get_user_organizations()));

-- Criar tabela para usuários de organizações com senha própria
CREATE TABLE IF NOT EXISTS public.organization_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela organization_users
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para organization_users
CREATE POLICY "Users can view organization users" 
  ON public.organization_users 
  FOR SELECT 
  USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can manage organization users" 
  ON public.organization_users 
  FOR ALL 
  USING (organization_id IN (SELECT get_user_organizations()));

-- Inserir páginas padrão para organizações existentes
INSERT INTO public.organization_pages (organization_id, page_key, is_enabled)
SELECT 
  o.id,
  page_key,
  true
FROM public.organizations o
CROSS JOIN (
  VALUES 
    ('dashboard'),
    ('products'),
    ('customers'),
    ('orders'),
    ('pos'),
    ('reports'),
    ('settings')
) AS pages(page_key)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_pages op 
  WHERE op.organization_id = o.id AND op.page_key = pages.page_key
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organization_pages_updated_at 
  BEFORE UPDATE ON public.organization_pages 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_organization_users_updated_at 
  BEFORE UPDATE ON public.organization_users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
