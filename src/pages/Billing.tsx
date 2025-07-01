import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, CreditCard, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Billing = () => {
  const { currentOrganization } = useSupabaseAuth();
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      fetchSubscriptionData();
    }
  }, [currentOrganization]);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch current subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('organization_id', currentOrganization.id)
        .single();

      setCurrentSubscription(subscription);

      // Fetch all available plans
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      setAvailablePlans(plans || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      // This would integrate with Asaas API
      toast({
        title: "Upgrade solicitado",
        description: "Em breve você receberá instruções de pagamento por email.",
      });
    } catch (error) {
      toast({
        title: "Erro no upgrade",
        description: "Tente novamente ou entre em contato com o suporte.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'trialing': { label: 'Trial', variant: 'secondary' as const },
      'active': { label: 'Ativo', variant: 'default' as const },
      'past_due': { label: 'Vencido', variant: 'destructive' as const },
      'canceled': { label: 'Cancelado', variant: 'outline' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-48 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assinatura & Planos</h1>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Plano Atual: {currentSubscription.subscription_plans?.name}
                </CardTitle>
                <CardDescription>
                  {getStatusBadge(currentSubscription.status)}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  R$ {currentSubscription.subscription_plans?.price_monthly?.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Próximo pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(currentSubscription.current_period_end)}
                  </p>
                </div>
              </div>
              
              {currentSubscription.trial_ends_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Trial termina em</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentSubscription.trial_ends_at)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Recursos inclusos</p>
                  <p className="text-sm text-muted-foreground">
                    {currentSubscription.subscription_plans?.max_stores === -1 
                      ? 'Lojas ilimitadas' 
                      : `${currentSubscription.subscription_plans?.max_stores} loja(s)`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recursos do seu plano:</h4>
              <div className="flex flex-wrap gap-2">
                {currentSubscription.subscription_plans?.features?.map((feature: string, index: number) => (
                  <Badge key={index} variant="outline">{feature}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availablePlans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const isUpgrade = plan.price_monthly > (currentSubscription?.subscription_plans?.price_monthly || 0);
            
            return (
              <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
                {isCurrentPlan && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Plano Atual</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    R$ {plan.price_monthly?.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Lojas:</span>
                      <span className="font-medium">
                        {plan.max_stores === -1 ? 'Ilimitadas' : plan.max_stores}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Produtos:</span>
                      <span className="font-medium">
                        {plan.max_products === -1 ? 'Ilimitados' : plan.max_products}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Usuários:</span>
                      <span className="font-medium">
                        {plan.max_users === -1 ? 'Ilimitados' : plan.max_users}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.features?.slice(0, 3).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentPlan ? 'Plano Atual' : isUpgrade ? 'Fazer Upgrade' : 'Selecionar Plano'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Seus últimos pagamentos e faturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum histórico de pagamento ainda</p>
            <p className="text-sm">Os pagamentos aparecerão aqui após a primeira cobrança</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;