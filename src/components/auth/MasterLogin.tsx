
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MasterLoginProps {
  onMasterLogin: () => void;
}

const MasterLogin = ({ onMasterLogin }: MasterLoginProps) => {
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular pequeno delay para UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get master password from environment variable
    const envMasterPassword = import.meta.env.VITE_MASTER_PASSWORD;
    
    if (!envMasterPassword) {
      toast({
        title: "Erro de Configuração",
        description: "Senha master não configurada. Contate o administrador do sistema.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (masterPassword === envMasterPassword) {
      localStorage.setItem('master_auth', 'true');
      onMasterLogin();
      toast({
        title: "Acesso Master",
        description: "Login master realizado com sucesso",
      });
    } else {
      toast({
        title: "Erro de Autenticação",
        description: "Senha master incorreta",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Acesso Master
            </CardTitle>
            <p className="text-slate-600 mt-2">
              Configure a plataforma pela primeira vez
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="masterPassword">Senha Master</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="masterPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Digite a senha master"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              disabled={isLoading || !masterPassword}
            >
              {isLoading ? 'Verificando...' : 'Acessar Configurações'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>🔐 Acesso restrito ao administrador</p>
            <p className="text-xs mt-1 text-slate-500">
              Configure VITE_MASTER_PASSWORD no ambiente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterLogin;
