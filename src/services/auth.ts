
import { toast } from '@/hooks/use-toast';

export interface WordPressUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  roles: string[];
  capabilities: Record<string, boolean>;
  avatar_urls: Record<string, string>;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
  user: WordPressUser;
}

export interface Permission {
  key: string;
  label: string;
  description: string;
}

export const PERMISSIONS: Permission[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Acessar dashboard principal' },
  { key: 'products', label: 'Produtos', description: 'Gerenciar produtos' },
  { key: 'orders', label: 'Pedidos', description: 'Gerenciar pedidos' },
  { key: 'customers', label: 'Clientes', description: 'Gerenciar clientes' },
  { key: 'pos', label: 'POS', description: 'Acessar sistema POS' },
  { key: 'maletas', label: 'Maletas', description: 'Gerenciar maletas' },
  { key: 'reports', label: 'Relatórios', description: 'Visualizar relatórios' },
  { key: 'logs', label: 'Logs', description: 'Visualizar logs do sistema' },
  { key: 'settings', label: 'Configurações', description: 'Acessar configurações' },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrator: ['dashboard', 'products', 'orders', 'customers', 'pos', 'maletas', 'reports', 'logs', 'settings'],
  shop_manager: ['dashboard', 'products', 'orders', 'customers', 'pos', 'reports'],
  representante: ['dashboard', 'maletas', 'customers'],
  customer: ['dashboard'],
};

class AuthService {
  private baseUrl: string = '';
  private token: string | null = null;
  private user: WordPressUser | null = null;

  constructor() {
    this.loadFromStorage();
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  private loadFromStorage() {
    this.token = localStorage.getItem('wp_token');
    const userStr = localStorage.getItem('wp_user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearStorage();
      }
    }
  }

  private clearStorage() {
    localStorage.removeItem('wp_token');
    localStorage.removeItem('wp_user');
    this.token = null;
    this.user = null;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!this.baseUrl) {
      throw new Error('URL do WordPress não configurada');
    }

    try {
      const response = await fetch(`${this.baseUrl}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro de autenticação');
      }

      const authData: AuthResponse = await response.json();
      
      // Buscar dados completos do usuário
      const userResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        authData.user = userData;
      }

      this.token = authData.token;
      this.user = authData.user;

      localStorage.setItem('wp_token', this.token);
      localStorage.setItem('wp_user', JSON.stringify(this.user));

      return authData;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro de conexão');
    }
  }

  async validateToken(): Promise<boolean> {
    if (!this.token || !this.baseUrl) return false;

    try {
      const response = await fetch(`${this.baseUrl}/wp-json/jwt-auth/v1/token/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.clearStorage();
        return false;
      }

      return true;
    } catch (error) {
      this.clearStorage();
      return false;
    }
  }

  async getUsers(role?: string): Promise<WordPressUser[]> {
    if (!this.token || !this.baseUrl) {
      throw new Error('Não autenticado');
    }

    try {
      const params = new URLSearchParams({
        per_page: '100',
        ...(role && { roles: role }),
      });

      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar usuários');
    }
  }

  getRepresentantes(): Promise<WordPressUser[]> {
    return this.getUsers('representante');
  }

  logout() {
    this.clearStorage();
    toast({
      title: "Logout",
      description: "Sessão encerrada com sucesso",
    });
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getUser(): WordPressUser | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  hasPermission(permission: string): boolean {
    if (!this.user) return false;
    
    // Admin tem todas as permissões
    if (this.user.roles.includes('administrator')) return true;
    
    // Verificar permissões por role
    for (const role of this.user.roles) {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      if (rolePermissions.includes(permission)) return true;
    }
    
    return false;
  }

  getUserRoles(): string[] {
    return this.user?.roles || [];
  }

  isRepresentante(): boolean {
    return this.user?.roles.includes('representante') || false;
  }
}

export const authService = new AuthService();
