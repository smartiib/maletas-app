
import { useState, useEffect, createContext, useContext } from 'react';
import { authService, WordPressUser, LoginCredentials } from '@/services/auth';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: WordPressUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isRepresentante: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<WordPressUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getUser();
      if (storedUser && authService.getToken()) {
        const isValid = await authService.validateToken();
        if (isValid) {
          setUser(storedUser);
        } else {
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const authResponse = await authService.login(credentials);
      setUser(authResponse.user);
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${authResponse.user.display_name}!`,
      });
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    isRepresentante: authService.isRepresentante(),
  };
};

export { AuthContext };
