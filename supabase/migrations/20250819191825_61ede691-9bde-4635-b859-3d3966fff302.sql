
-- 1) Adiciona organization_id nas tabelas que estão faltando e cria índices

alter table if exists public.representatives
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists representatives_organization_id_idx
  on public.representatives (organization_id);

alter table if exists public.maletas
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists maletas_organization_id_idx
  on public.maletas (organization_id);

-- 2) (Opcional) Se desejar, podemos fazer um backfill temporário para apontar
-- todos os registros existentes para uma organização específica, para que
-- apareçam imediatamente nas telas.
-- ATENÇÃO: substitua '00000000-0000-0000-0000-000000000000' pelo ID da sua organização (por ex.: db32d11b-13ca-47b4-a215-87fd259eca88).

-- update public.representatives
--   set organization_id = '00000000-0000-0000-0000-000000000000'
-- where organization_id is null;

-- update public.maletas
--   set organization_id = '00000000-0000-0000-0000-000000000000'
-- where organization_id is null;
