
-- Tabela para controle de ajustes de estoque (perdas, quebras, trocas)
CREATE TABLE public.stock_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id INTEGER NOT NULL,
  variation_id INTEGER,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('perda', 'quebra', 'troca', 'devolucao', 'correcao')),
  quantity_before INTEGER NOT NULL DEFAULT 0,
  quantity_after INTEGER NOT NULL DEFAULT 0,
  quantity_adjusted INTEGER NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stock_adjustments
CREATE POLICY "Users can view organization stock adjustments"
  ON public.stock_adjustments
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create organization stock adjustments"
  ON public.stock_adjustments
  FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update organization stock adjustments"
  ON public.stock_adjustments
  FOR UPDATE
  USING (organization_id IN (SELECT get_user_organizations()));

-- Tabela para contas a pagar
CREATE TABLE public.accounts_payable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  category TEXT,
  payment_method TEXT,
  notes TEXT,
  organization_id UUID,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para accounts_payable
CREATE POLICY "Users can view organization accounts payable"
  ON public.accounts_payable
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create organization accounts payable"
  ON public.accounts_payable
  FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update organization accounts payable"
  ON public.accounts_payable
  FOR UPDATE
  USING (organization_id IN (SELECT get_user_organizations()));

-- Tabela para categorias de despesas
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para expense_categories
CREATE POLICY "Users can manage organization expense categories"
  ON public.expense_categories
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations()));

-- Inserir categorias padrão
INSERT INTO public.expense_categories (name, description, color) VALUES
('Fornecedores', 'Pagamentos a fornecedores', '#3b82f6'),
('Aluguel', 'Aluguel e taxas imobiliárias', '#ef4444'),
('Energia', 'Conta de luz', '#f59e0b'),
('Água', 'Conta de água', '#06b6d4'),
('Internet', 'Serviços de internet e telefone', '#8b5cf6'),
('Marketing', 'Publicidade e propaganda', '#ec4899'),
('Manutenção', 'Reparos e manutenção', '#84cc16'),
('Impostos', 'Taxas e impostos', '#f97316'),
('Outros', 'Outras despesas', '#6b7280');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stock_adjustments_updated_at
    BEFORE UPDATE ON public.stock_adjustments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at
    BEFORE UPDATE ON public.accounts_payable
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
