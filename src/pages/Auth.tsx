import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2, Store, BarChart3, Users, Shield } from 'lucide-react';

const Auth = () => {
  const { signIn, signUp, isLoading } = useSupabaseAuth();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    email: '', 
    password: '', 
    organizationName: '' 
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(loginData.email, loginData.password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(signupData.email, signupData.password, signupData.organizationName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Gerencie seu
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> WooCommerce </span>
            com Inteligência
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Dashboard completo para monitorar vendas, produtos e clientes. 
            Comece seu trial gratuito de 14 dias.
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            <div className="flex flex-col items-center p-4">
              <Store className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-slate-900">Multi-lojas</h3>
              <p className="text-sm text-slate-600">Gerencie várias lojas</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-slate-900">Relatórios</h3>
              <p className="text-sm text-slate-600">Analytics detalhados</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-slate-900">Equipe</h3>
              <p className="text-sm text-slate-600">Colaboração em time</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Shield className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-slate-900">Seguro</h3>
              <p className="text-sm text-slate-600">Dados protegidos</p>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              <TabsTrigger value="login">Entrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Começar Trial Gratuito</CardTitle>
                  <CardDescription>
                    14 dias grátis, sem necessidade de cartão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Nome da Empresa</Label>
                      <Input
                        id="orgName"
                        type="text"
                        placeholder="Minha Loja"
                        value={signupData.organizationName}
                        onChange={(e) => setSignupData(prev => ({
                          ...prev,
                          organizationName: e.target.value
                        }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={signupData.password}
                        onChange={(e) => setSignupData(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        'Começar Trial Gratuito'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Entrar na sua conta</CardTitle>
                  <CardDescription>
                    Acesse seu dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginEmail">Email</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loginPassword">Senha</Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Pricing Preview */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Planos que crescem com você</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Básico</CardTitle>
                <div className="text-2xl font-bold">R$ 29<span className="text-sm font-normal">/mês</span></div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-slate-600">
                  <li>• 1 loja WooCommerce</li>
                  <li>• Até 100 produtos</li>
                  <li>• 2 usuários</li>
                  <li>• Relatórios básicos</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="text-2xl font-bold text-blue-600">R$ 79<span className="text-sm font-normal">/mês</span></div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-slate-600">
                  <li>• 3 lojas WooCommerce</li>
                  <li>• Até 1.000 produtos</li>
                  <li>• 5 usuários</li>
                  <li>• Relatórios avançados</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-2xl font-bold">R$ 149<span className="text-sm font-normal">/mês</span></div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-slate-600">
                  <li>• Lojas ilimitadas</li>
                  <li>• Produtos ilimitados</li>
                  <li>• Usuários ilimitados</li>
                  <li>• Suporte prioritário</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;