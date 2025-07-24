-- Criar tabela para transações financeiras gerais
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  reference_id UUID, -- Referência a pedidos ou outras entidades
  reference_type TEXT, -- 'order', 'expense', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para planos de pagamento
CREATE TABLE public.payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id INTEGER NOT NULL, -- Referência ao pedido do WooCommerce
  order_number TEXT, -- Número do pedido para referência
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  installments_count INTEGER NOT NULL CHECK (installments_count > 0),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('installment', 'future')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  interest_rate NUMERIC DEFAULT 0 CHECK (interest_rate >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para parcelas individuais
CREATE TABLE public.payment_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT,
  late_fee NUMERIC DEFAULT 0 CHECK (late_fee >= 0),
  discount NUMERIC DEFAULT 0 CHECK (discount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(payment_plan_id, installment_number)
);

-- Habilitar RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir tudo por enquanto - pode ser refinado depois)
CREATE POLICY "Allow all operations on financial_transactions" 
ON public.financial_transactions FOR ALL USING (true);

CREATE POLICY "Allow all operations on payment_plans" 
ON public.payment_plans FOR ALL USING (true);

CREATE POLICY "Allow all operations on payment_installments" 
ON public.payment_installments FOR ALL USING (true);

-- Índices para performance
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(date);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX idx_financial_transactions_reference ON public.financial_transactions(reference_id, reference_type);

CREATE INDEX idx_payment_plans_order_id ON public.payment_plans(order_id);
CREATE INDEX idx_payment_plans_status ON public.payment_plans(status);
CREATE INDEX idx_payment_plans_customer_email ON public.payment_plans(customer_email);

CREATE INDEX idx_payment_installments_plan_id ON public.payment_installments(payment_plan_id);
CREATE INDEX idx_payment_installments_due_date ON public.payment_installments(due_date);
CREATE INDEX idx_payment_installments_status ON public.payment_installments(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON public.payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_installments_updated_at
  BEFORE UPDATE ON public.payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();