-- Adicionar organization_id às tabelas maleta_items e maleta_returns
ALTER TABLE IF EXISTS public.maleta_items
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.maleta_returns
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS maleta_items_organization_id_idx
  ON public.maleta_items (organization_id);

CREATE INDEX IF NOT EXISTS maleta_returns_organization_id_idx
  ON public.maleta_returns (organization_id);

-- Atualizar dados existentes com organization_id baseado na maleta
UPDATE public.maleta_items 
SET organization_id = m.organization_id
FROM public.maletas m
WHERE maleta_items.maleta_id = m.id
AND maleta_items.organization_id IS NULL;

UPDATE public.maleta_returns 
SET organization_id = m.organization_id
FROM public.maletas m
WHERE maleta_returns.maleta_id = m.id
AND maleta_returns.organization_id IS NULL;

-- Políticas RLS para maleta_items
DROP POLICY IF EXISTS "Users can view organization maleta items" ON public.maleta_items;
DROP POLICY IF EXISTS "Users can create organization maleta items" ON public.maleta_items;
DROP POLICY IF EXISTS "Users can update organization maleta items" ON public.maleta_items;

CREATE POLICY "Users can view organization maleta items" 
ON public.maleta_items 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create organization maleta items" 
ON public.maleta_items 
FOR INSERT 
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update organization maleta items" 
ON public.maleta_items 
FOR UPDATE 
USING (organization_id IN (SELECT get_user_organizations()));

-- Políticas RLS para maleta_returns
DROP POLICY IF EXISTS "Users can view organization maleta returns" ON public.maleta_returns;
DROP POLICY IF EXISTS "Users can create organization maleta returns" ON public.maleta_returns;
DROP POLICY IF EXISTS "Users can update organization maleta returns" ON public.maleta_returns;

CREATE POLICY "Users can view organization maleta returns" 
ON public.maleta_returns 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create organization maleta returns" 
ON public.maleta_returns 
FOR INSERT 
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update organization maleta returns" 
ON public.maleta_returns 
FOR UPDATE 
USING (organization_id IN (SELECT get_user_organizations()));