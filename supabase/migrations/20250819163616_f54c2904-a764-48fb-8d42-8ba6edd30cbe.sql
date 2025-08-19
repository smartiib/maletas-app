
-- 1) Adicionar coluna organization_id e FK
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.maletas
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.maleta_returns
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.maleta_items
  ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Caso a tabela representatives exista (é usada no front):
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='representatives'
  ) THEN
    EXECUTE 'ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS organization_id uuid';
  END IF;
END $$;

-- FKs para organizations (SET NULL para não quebrar registros antigos)
ALTER TABLE public.suppliers
  ADD CONSTRAINT IF NOT EXISTS suppliers_org_fk
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.maletas
  ADD CONSTRAINT IF NOT EXISTS maletas_org_fk
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.maleta_returns
  ADD CONSTRAINT IF NOT EXISTS maleta_returns_org_fk
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.maleta_items
  ADD CONSTRAINT IF NOT EXISTS maleta_items_org_fk
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='representatives'
  ) THEN
    EXECUTE 'ALTER TABLE public.representatives
             ADD CONSTRAINT IF NOT EXISTS representatives_org_fk
             FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL';
  END IF;
END $$;

-- 2) Índices
CREATE INDEX IF NOT EXISTS suppliers_org_idx ON public.suppliers(organization_id);
CREATE INDEX IF NOT EXISTS maletas_org_idx ON public.maletas(organization_id);
CREATE INDEX IF NOT EXISTS maleta_returns_org_idx ON public.maleta_returns(organization_id);
CREATE INDEX IF NOT EXISTS maleta_items_org_idx ON public.maleta_items(organization_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='representatives'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS representatives_org_idx ON public.representatives(organization_id)';
  END IF;
END $$;

-- 3) Garantir RLS habilitado
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='representatives'
  ) THEN
    EXECUTE 'ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 4) Remover políticas permissivas atuais
DROP POLICY IF EXISTS "Allow all operations on suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all operations on maletas" ON public.maletas;
DROP POLICY IF EXISTS "Allow all operations on maleta_returns" ON public.maleta_returns;
DROP POLICY IF EXISTS "Allow all operations on maleta_items" ON public.maleta_items;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='representatives'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on representatives" ON public.representatives';
  END IF;
END $$;

-- 5) Políticas por organização (SELECT/INSERT/UPDATE/DELETE)
-- suppliers
CREATE POLICY "Select suppliers by org"
ON public.suppliers
FOR SELECT
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Insert suppliers by org"
ON public.suppliers
FOR INSERT
WITH CHECK (user_belongs_to_organization(organization_id));

CREATE POLICY "Update suppliers by org"
ON public.suppliers
FOR UPDATE
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Delete suppliers by org"
ON public.suppliers
FOR DELETE
USING (user_belongs_to_organization(organization_id));

-- maletas
CREATE POLICY "Select maletas by org"
ON public.maletas
FOR SELECT
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Insert maletas by org"
ON public.maletas
FOR INSERT
WITH CHECK (user_belongs_to_organization(organization_id));

CREATE POLICY "Update maletas by org"
ON public.maletas
FOR UPDATE
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Delete maletas by org"
ON public.maletas
FOR DELETE
USING (user_belongs_to_organization(organization_id));

-- maleta_returns
CREATE POLICY "Select maleta_returns by org"
ON public.maleta_returns
FOR SELECT
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Insert maleta_returns by org"
ON public.maleta_returns
FOR INSERT
WITH CHECK (user_belongs_to_organization(organization_id));

CREATE POLICY "Update maleta_returns by org"
ON public.maleta_returns
FOR UPDATE
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Delete maleta_returns by org"
ON public.maleta_returns
FOR DELETE
USING (user_belongs_to_organization(organization_id));

-- maleta_items
CREATE POLICY "Select maleta_items by org"
ON public.maleta_items
FOR SELECT
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Insert maleta_items by org"
ON public.maleta_items
FOR INSERT
WITH CHECK (user_belongs_to_organization(organization_id));

CREATE POLICY "Update maleta_items by org"
ON public.maleta_items
FOR UPDATE
USING (user_belongs_to_organization(organization_id));

CREATE POLICY "Delete maleta_items by org"
ON public.maleta_items
FOR DELETE
USING (user_belongs_to_organization(organization_id));

-- representatives (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='representatives'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Select representatives by org"
      ON public.representatives
      FOR SELECT
      USING (user_belongs_to_organization(organization_id));

      CREATE POLICY "Insert representatives by org"
      ON public.representatives
      FOR INSERT
      WITH CHECK (user_belongs_to_organization(organization_id));

      CREATE POLICY "Update representatives by org"
      ON public.representatives
      FOR UPDATE
      USING (user_belongs_to_organization(organization_id));

      CREATE POLICY "Delete representatives by org"
      ON public.representatives
      FOR DELETE
      USING (user_belongs_to_organization(organization_id));
    $pol$;
  END IF;
END $$;
