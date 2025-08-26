
-- Add organization_id to maleta_items if not exists
ALTER TABLE IF EXISTS public.maleta_items
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS maleta_items_organization_id_idx
  ON public.maleta_items (organization_id);

-- Add organization_id to maleta_returns if not exists  
ALTER TABLE IF EXISTS public.maleta_returns
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS maleta_returns_organization_id_idx
  ON public.maleta_returns (organization_id);

-- Update maleta_items to use organization_id from maletas table
UPDATE public.maleta_items 
SET organization_id = m.organization_id
FROM public.maletas m
WHERE maleta_items.maleta_id = m.id
AND maleta_items.organization_id IS NULL;

-- Update maleta_returns to use organization_id from maletas table
UPDATE public.maleta_returns 
SET organization_id = m.organization_id
FROM public.maletas m
WHERE maleta_returns.maleta_id = m.id
AND maleta_returns.organization_id IS NULL;
