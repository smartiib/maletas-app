/**
 * Sistema de Permissões RBAC (Role-Based Access Control)
 */

export type PermissionModule =
  | 'dashboard'
  | 'produtos'
  | 'pedidos'
  | 'pdv'
  | 'clientes'
  | 'maletas'
  | 'financeiro'
  | 'relatorios'
  | 'configuracoes'
  | 'usuarios';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'cancel'
  | 'access'
  | 'create_order'
  | 'discount'
  | 'process_return'
  | 'manage_stock'
  | 'export'
  | 'manage_permissions';

export type Permission = `${PermissionModule}.${PermissionAction}`;

export interface PermissionRecord {
  id: string;
  module: PermissionModule;
  action: PermissionAction;
  name: string;
  description?: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_system: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  organization_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  [key: string]: boolean; // 'dashboard.view': true
}

/**
 * Roles padrão do sistema
 */
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  GERENTE: 'gerente',
  VENDEDOR: 'vendedor',
  ESTOQUISTA: 'estoquista',
} as const;

/**
 * Mapa de permissões por módulo
 */
export const PERMISSIONS_MAP: Record<PermissionModule, PermissionAction[]> = {
  dashboard: ['view'],
  produtos: ['view', 'create', 'edit', 'delete', 'manage_stock'],
  pedidos: ['view', 'create', 'edit', 'delete', 'cancel'],
  pdv: ['access', 'create_order', 'discount'],
  clientes: ['view', 'create', 'edit', 'delete'],
  maletas: ['view', 'create', 'edit', 'delete', 'process_return'],
  financeiro: ['view', 'create', 'edit', 'delete'],
  relatorios: ['view', 'export'],
  configuracoes: ['view', 'edit'],
  usuarios: ['view', 'create', 'edit', 'delete', 'manage_permissions'],
};

/**
 * Labels amigáveis para módulos
 */
export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  produtos: 'Produtos',
  pedidos: 'Pedidos',
  pdv: 'PDV',
  clientes: 'Clientes',
  maletas: 'Maletas',
  financeiro: 'Financeiro',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  usuarios: 'Usuários',
};

/**
 * Labels amigáveis para ações
 */
export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Deletar',
  cancel: 'Cancelar',
  access: 'Acessar',
  create_order: 'Criar Pedido',
  discount: 'Aplicar Desconto',
  process_return: 'Processar Devolução',
  manage_stock: 'Gerenciar Estoque',
  export: 'Exportar',
  manage_permissions: 'Gerenciar Permissões',
};
