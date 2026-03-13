-- =====================================================
-- Sistema RBAC (Role-Based Access Control) Granular
-- =====================================================

-- 1. Tabela de Roles (Grupos/Funções)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- Roles do sistema não podem ser deletadas
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, organization_id)
);

-- 2. Tabela de Permissões
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(100) NOT NULL, -- dashboard, produtos, pedidos, etc
  action VARCHAR(100) NOT NULL, -- view, create, edit, delete, etc
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Permissões por Role (Padrão do grupo)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 4. Tabela de Permissões Personalizadas por Usuário
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true, -- true = adicionar permissão, false = remover permissão
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, permission_id)
);

-- 5. Adicionar role_id na tabela user_organizations
ALTER TABLE public.user_organizations 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- =====================================================
-- Inserir Permissões Padrão do Sistema
-- =====================================================

INSERT INTO public.permissions (module, action, name, description) VALUES
-- Dashboard
('dashboard', 'view', 'Visualizar Dashboard', 'Ver métricas e resumo geral'),

-- Produtos
('produtos', 'view', 'Visualizar Produtos', 'Ver lista de produtos'),
('produtos', 'create', 'Criar Produtos', 'Adicionar novos produtos'),
('produtos', 'edit', 'Editar Produtos', 'Modificar produtos existentes'),
('produtos', 'delete', 'Deletar Produtos', 'Remover produtos'),
('produtos', 'manage_stock', 'Gerenciar Estoque', 'Ajustar quantidades de estoque'),

-- Pedidos
('pedidos', 'view', 'Visualizar Pedidos', 'Ver lista de pedidos'),
('pedidos', 'create', 'Criar Pedidos', 'Criar novos pedidos'),
('pedidos', 'edit', 'Editar Pedidos', 'Modificar pedidos existentes'),
('pedidos', 'delete', 'Deletar Pedidos', 'Remover pedidos'),
('pedidos', 'cancel', 'Cancelar Pedidos', 'Cancelar pedidos'),

-- PDV
('pdv', 'access', 'Acessar PDV', 'Acessar ponto de venda'),
('pdv', 'create_order', 'Criar Venda no PDV', 'Realizar vendas no PDV'),
('pdv', 'discount', 'Aplicar Descontos', 'Dar descontos em vendas'),

-- Clientes
('clientes', 'view', 'Visualizar Clientes', 'Ver lista de clientes'),
('clientes', 'create', 'Criar Clientes', 'Adicionar novos clientes'),
('clientes', 'edit', 'Editar Clientes', 'Modificar clientes existentes'),
('clientes', 'delete', 'Deletar Clientes', 'Remover clientes'),

-- Maletas
('maletas', 'view', 'Visualizar Maletas', 'Ver maletas de consignação'),
('maletas', 'create', 'Criar Maletas', 'Criar novas maletas'),
('maletas', 'edit', 'Editar Maletas', 'Modificar maletas existentes'),
('maletas', 'delete', 'Deletar Maletas', 'Remover maletas'),
('maletas', 'process_return', 'Processar Devolução', 'Processar devolução de maletas'),

-- Financeiro
('financeiro', 'view', 'Visualizar Financeiro', 'Ver transações financeiras'),
('financeiro', 'create', 'Criar Transações', 'Adicionar receitas/despesas'),
('financeiro', 'edit', 'Editar Transações', 'Modificar transações'),
('financeiro', 'delete', 'Deletar Transações', 'Remover transações'),

-- Relatórios
('relatorios', 'view', 'Visualizar Relatórios', 'Ver relatórios e análises'),
('relatorios', 'export', 'Exportar Relatórios', 'Exportar dados'),

-- Configurações
('configuracoes', 'view', 'Visualizar Configurações', 'Ver configurações do sistema'),
('configuracoes', 'edit', 'Editar Configurações', 'Modificar configurações'),

-- Usuários
('usuarios', 'view', 'Visualizar Usuários', 'Ver lista de usuários'),
('usuarios', 'create', 'Criar Usuários', 'Adicionar novos usuários'),
('usuarios', 'edit', 'Editar Usuários', 'Modificar usuários existentes'),
('usuarios', 'delete', 'Deletar Usuários', 'Remover usuários'),
('usuarios', 'manage_permissions', 'Gerenciar Permissões', 'Configurar permissões de usuários')

ON CONFLICT DO NOTHING;

-- =====================================================
-- Criar Roles Padrão do Sistema
-- =====================================================

-- Inserir roles padrão (sem organization_id = roles globais do sistema)
INSERT INTO public.roles (name, slug, description, is_system) VALUES
('Administrador', 'admin', 'Acesso total ao sistema', true),
('Gerente', 'gerente', 'Acesso a gestão e relatórios', true),
('Vendedor', 'vendedor', 'Acesso a vendas e atendimento', true),
('Estoquista', 'estoquista', 'Acesso a gestão de estoque', true)
ON CONFLICT (slug, organization_id) DO NOTHING;

-- =====================================================
-- Configurar Permissões para Role "Vendedor"
-- =====================================================

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'vendedor'
AND p.module || '.' || p.action IN (
  'dashboard.view',
  'produtos.view',
  'pedidos.view',
  'pedidos.create',
  'pdv.access',
  'pdv.create_order',
  'clientes.view',
  'clientes.create'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Configurar Permissões para Role "Gerente"
-- =====================================================

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'gerente'
AND p.module || '.' || p.action IN (
  'dashboard.view',
  'produtos.view',
  'produtos.edit',
  'produtos.manage_stock',
  'pedidos.view',
  'pedidos.create',
  'pedidos.edit',
  'pedidos.cancel',
  'pdv.access',
  'pdv.create_order',
  'pdv.discount',
  'clientes.view',
  'clientes.create',
  'clientes.edit',
  'maletas.view',
  'maletas.create',
  'maletas.edit',
  'maletas.process_return',
  'relatorios.view',
  'relatorios.export'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Configurar Permissões para Role "Estoquista"
-- =====================================================

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'estoquista'
AND p.module || '.' || p.action IN (
  'dashboard.view',
  'produtos.view',
  'produtos.edit',
  'produtos.manage_stock'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Configurar Permissões para Role "Administrador"
-- =====================================================

-- Admin tem TODAS as permissões
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para roles
CREATE POLICY "Users can view roles in their organization"
  ON public.roles FOR SELECT
  USING (
    organization_id IS NULL OR -- Roles do sistema são visíveis para todos
    organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can manage roles"
  ON public.roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      JOIN public.role_permissions rp ON uo.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE uo.user_id = auth.uid()
      AND p.module = 'usuarios'
      AND p.action = 'manage_permissions'
    )
  );

-- Políticas para permissions (todos podem ver)
CREATE POLICY "Anyone can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para role_permissions (todos podem ver)
CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para user_permissions
CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      JOIN public.role_permissions rp ON uo.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE uo.user_id = auth.uid()
      AND p.module = 'usuarios'
      AND p.action = 'manage_permissions'
    )
  );

CREATE POLICY "Only admins can manage user permissions"
  ON public.user_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      JOIN public.role_permissions rp ON uo.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE uo.user_id = auth.uid()
      AND p.module = 'usuarios'
      AND p.action = 'manage_permissions'
    )
  );

-- =====================================================
-- Índices para Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_organization_id ON public.user_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role_id ON public.user_organizations(role_id);

-- =====================================================
-- Função para obter permissões de um usuário
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  module VARCHAR,
  action VARCHAR,
  granted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH role_perms AS (
    -- Permissões do role do usuário
    SELECT DISTINCT
      p.module,
      p.action,
      true as granted
    FROM user_organizations uo
    JOIN role_permissions rp ON uo.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE uo.user_id = p_user_id
    AND uo.organization_id = p_organization_id
  ),
  custom_perms AS (
    -- Permissões personalizadas do usuário
    SELECT
      p.module,
      p.action,
      up.granted
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
    AND up.organization_id = p_organization_id
  )
  -- Combinar: permissões personalizadas sobrescrevem as do role
  SELECT 
    COALESCE(cp.module, rp.module) as module,
    COALESCE(cp.action, rp.action) as action,
    COALESCE(cp.granted, rp.granted) as granted
  FROM role_perms rp
  FULL OUTER JOIN custom_perms cp 
    ON rp.module = cp.module AND rp.action = cp.action
  WHERE COALESCE(cp.granted, rp.granted) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
