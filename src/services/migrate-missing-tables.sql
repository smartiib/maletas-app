
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
