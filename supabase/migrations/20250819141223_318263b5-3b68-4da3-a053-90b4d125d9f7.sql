
-- 1) Adicionar coluna organization_id nas tabelas de dados da integração
-- Tornamos a coluna opcional inicialmente para compatibilidade (NULL permitido)
-- Depois podemos migrar dados e tornar NOT NULL, se desejar.

alter table public.wc_products
  add column if not exists organization_id uuid references public.organizations(id);

alter table public.wc_product_variations
  add column if not exists organization_id uuid references public.organizations(id);

alter table public.wc_product_categories
  add column if not exists organization_id uuid references public.organizations(id);

alter table public.wc_customers
  add column if not exists organization_id uuid references public.organizations(id);

alter table public.wc_orders
  add column if not exists organization_id uuid references public.organizations(id);

-- sync_logs já existe e costuma ser útil filtrar por organização também
alter table public.sync_logs
  add column if not exists organization_id uuid references public.organizations(id);

-- 2) Habilitar RLS onde ainda não está restrito por organização
-- Observação: muitas dessas tabelas já têm RLS habilitado, mas com policies permissivas (true).
-- Vamos criar policies que permitem:
-- - Visualizar registros da(s) organização(ões) do usuário OU registros antigos sem organization_id (NULL), para compatibilidade
-- - Inserir/atualizar registros apenas quando organization_id pertence à(s) organizações do usuário

-- wc_products
drop policy if exists "Allow all operations on wc_products" on public.wc_products;
alter table public.wc_products enable row level security;

create policy "Select products by org or null"
  on public.wc_products
  for select
  using (
    organization_id is null
    or organization_id in (select get_user_organizations())
  );

create policy "Insert products by org"
  on public.wc_products
  for insert
  with check (
    organization_id in (select get_user_organizations())
  );

create policy "Update products by org"
  on public.wc_products
  for update
  using (
    organization_id in (select get_user_organizations())
  );

-- wc_product_variations
drop policy if exists "Allow all operations on wc_product_variations" on public.wc_product_variations;
alter table public.wc_product_variations enable row level security;

create policy "Select variations by org or null"
  on public.wc_product_variations
  for select
  using (
    organization_id is null
    or organization_id in (select get_user_organizations())
  );

create policy "Insert variations by org"
  on public.wc_product_variations
  for insert
  with check (
    organization_id in (select get_user_organizations())
  );

create policy "Update variations by org"
  on public.wc_product_variations
  for update
  using (
    organization_id in (select get_user_organizations())
  );

-- wc_product_categories
drop policy if exists "Allow all operations on wc_product_categories" on public.wc_product_categories;
alter table public.wc_product_categories enable row level security;

create policy "Select categories by org or null"
  on public.wc_product_categories
  for select
  using (
    organization_id is null
    or organization_id in (select get_user_organizations())
  );

create policy "Insert categories by org"
  on public.wc_product_categories
  for insert
  with check (
    organization_id in (select get_user_organizations())
  );

create policy "Update categories by org"
  on public.wc_product_categories
  for update
  using (
    organization_id in (select get_user_organizations())
  );

-- wc_customers
drop policy if exists "Allow all operations on wc_customers" on public.wc_customers;
alter table public.wc_customers enable row level security;

create policy "Select customers by org or null"
  on public.wc_customers
  for select
  using (
    organization_id is null
    or organization_id in (select get_user_organizations())
  );

create policy "Insert customers by org"
  on public.wc_customers
  for insert
  with check (
    organization_id in (select get_user_organizations())
  );

create policy "Update customers by org"
  on public.wc_customers
  for update
  using (
    organization_id in (select get_user_organizations())
  );

-- wc_orders
drop policy if exists "Allow all operations on wc_orders" on public.wc_orders;
alter table public.wc_orders enable row level security;

create policy "Select orders by org or null"
  on public.wc_orders
  for select
  using (
    organization_id is null
    or organization_id in (select get_user_organizations())
  );

create policy "Insert orders by org"
  on public.wc_orders
  for insert
  with check (
    organization_id in (select get_user_organizations())
  );

create policy "Update orders by org"
  on public.wc_orders
  for update
  using (
    organization_id in (select get_user_organizations())
  );

-- sync_logs (já tem policies por user_id, vamos complementar com organization_id)
-- Primeiro removemos policies existentes para recriar de forma consistente
drop policy if exists "Users can insert their own sync logs" on public.sync_logs;
drop policy if exists "Users can view their own sync logs" on public.sync_logs;
alter table public.sync_logs enable row level security;

-- Visualizar logs da(s) organizações do usuário OU sem organização (compatibilidade)
create policy "Select sync_logs by org or null"
  on public.sync_logs
  for select
  using (
    organization_id is null
    or organization_id in (select get_user_organizations())
  );

-- Inserir logs vinculados ao usuário E à organização do usuário
create policy "Insert sync_logs by org"
  on public.sync_logs
  for insert
  with check (
    (user_id = auth.uid())
    and (
      organization_id is null
      or organization_id in (select get_user_organizations())
    )
  );

-- Atualizar logs (opcional; normalmente logs não são atualizados)
create policy "Update sync_logs by org"
  on public.sync_logs
  for update
  using (
    organization_id is null
    or organization_id in (select get_user_organizations())
  );

-- Observação:
-- Mantivemos acesso de compatibilidade para registros sem organization_id.
-- Após migrar seus dados legados, podemos tornar organization_id NOT NULL e
-- remover a condição "is null" das policies para endurecer o isolamento.

