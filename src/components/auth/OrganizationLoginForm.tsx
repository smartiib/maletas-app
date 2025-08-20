
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Building2 } from 'lucide-react';
import { useOrganizationAuth } from '@/hooks/useOrganizationAuth';

interface OrganizationLoginFormProps {
  onSuccess: (user: any) => void;
  onBackToSupabaseAuth: () => void;
}

const OrganizationLoginForm: React.FC<OrganizationLoginFormProps> = ({ 
  onSuccess, 
  onBackToSupabaseAuth 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginOrganizationUser, loading } = useOrganizationAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const user = await loginOrganizationUser({ email, password });
      
      if (user) {
        // Salvar dados do usuário organizacional no localStorage
        localStorage.setItem('organization_user', JSON.stringify(user));
        localStorage.setItem('organization_user_authenticated', 'true');
        onSuccess(user);
      } else {
        setError('Credenciais inválidas. Verifique seu email e senha.');
      }
    } catch (error) {
      console.error('Erro no login organizacional:', error);
      setError('Erro interno. Tente novamente mais tarde.');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
        <CardTitle>Login Organizacional</CardTitle>
        <CardDescription>
          Entre com suas credenciais de usuário da organização
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="org-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="org-password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-center">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onBackToSupabaseAuth}
              disabled={loading}
            >
              Voltar para Login Supabase
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrganizationLoginForm;
