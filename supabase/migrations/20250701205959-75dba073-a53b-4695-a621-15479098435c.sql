-- Criar enum para tipos de planos
CREATE TYPE public.subscription_plan_type AS ENUM ('trial', 'basic', 'professional', 'enterprise');

-- Criar enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

-- Criar enum para tipos de roles de usuário
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'manager', 'user');

-- Tabela de organizações/empresas
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type subscription_plan_type NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_stores INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 100,
  max_users INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  asaas_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 month'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relacionamento usuário-organização
CREATE TABLE public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Tabela de pagamentos
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de limites por organização
CREATE TABLE public.organization_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_products INTEGER NOT NULL DEFAULT 0,
  current_users INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir planos padrão
INSERT INTO public.subscription_plans (name, type, price_monthly, max_stores, max_products, max_users, features) VALUES
('Trial Gratuito', 'trial', 0.00, 1, 50, 1, '["Dashboard básico", "1 integração WooCommerce", "Suporte por email"]'::jsonb),
('Plano Básico', 'basic', 29.00, 1, 100, 2, '["Dashboard completo", "1 integração WooCommerce", "Relatórios básicos", "Suporte prioritário"]'::jsonb),
('Plano Professional', 'professional', 79.00, 3, 1000, 5, '["Dashboard avançado", "3 integrações WooCommerce", "Relatórios avançados", "API access", "Suporte premium"]'::jsonb),
('Plano Enterprise', 'enterprise', 149.00, -1, -1, -1, '["Recursos ilimitados", "Integrações ilimitadas", "Relatórios personalizados", "API completa", "Suporte 24/7", "Manager dedicado"]'::jsonb);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_limits ENABLE ROW LEVEL SECURITY;

-- Função para obter organizações do usuário
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID DEFAULT auth.uid())
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.user_organizations WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Função para verificar se usuário pertence à organização
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_organizations 
    WHERE organization_id = org_id AND user_id = user_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas RLS para organizations
CREATE POLICY "Users can view their organizations" 
ON public.organizations 
FOR SELECT 
USING (id IN (SELECT public.get_user_organizations()));

CREATE POLICY "Users can update their organizations" 
ON public.organizations 
FOR UPDATE 
USING (id IN (SELECT public.get_user_organizations()));

-- Políticas RLS para subscription_plans (público para visualização)
CREATE POLICY "Anyone can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (true);

-- Políticas RLS para subscriptions
CREATE POLICY "Users can view organization subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "Users can update organization subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (public.user_belongs_to_organization(organization_id));

-- Políticas RLS para user_organizations
CREATE POLICY "Users can view their organization memberships" 
ON public.user_organizations 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage memberships" 
ON public.user_organizations 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Políticas RLS para payments
CREATE POLICY "Users can view organization payments" 
ON public.payments 
FOR SELECT 
USING (
  subscription_id IN (
    SELECT id FROM public.subscriptions 
    WHERE public.user_belongs_to_organization(organization_id)
  )
);

-- Políticas RLS para organization_limits
CREATE POLICY "Users can view organization limits" 
ON public.organization_limits 
FOR SELECT 
USING (public.user_belongs_to_organization(organization_id));

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_organizations_updated_at
  BEFORE UPDATE ON public.user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_limits_updated_at
  BEFORE UPDATE ON public.organization_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();