-- Sistema completo de Maletas de Consignação
-- Tabela de representantes
CREATE TABLE public.representatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  commission_settings JSONB DEFAULT '{
    "use_global": true,
    "custom_rates": [],
    "penalty_rate": 1
  }'::jsonb,
  referrer_id UUID REFERENCES public.representatives(id),
  total_sales DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações globais de comissão
CREATE TABLE public.commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_amount DECIMAL(10,2) NOT NULL,
  max_amount DECIMAL(10,2),
  percentage DECIMAL(5,2) NOT NULL,
  bonus DECIMAL(10,2) DEFAULT 0,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela principal de maletas
CREATE TABLE public.maletas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  representative_id UUID NOT NULL REFERENCES public.representatives(id),
  customer_name TEXT,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'finalized')),
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  extended_date TIMESTAMP WITH TIME ZONE,
  total_value DECIMAL(10,2) DEFAULT 0,
  commission_settings JSONB DEFAULT '{
    "use_global": true,
    "tiers": [],
    "penalty_rate": 1
  }'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens das maletas
CREATE TABLE public.maleta_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  variation_id INTEGER,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'consigned' CHECK (status IN ('consigned', 'sold', 'returned')),
  variation_attributes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de devoluções das maletas
CREATE TABLE public.maleta_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maleta_id UUID NOT NULL REFERENCES public.maletas(id),
  items_sold JSONB NOT NULL DEFAULT '[]'::jsonb,
  items_returned JSONB NOT NULL DEFAULT '[]'::jsonb,
  return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delay_days INTEGER DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  penalty_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações de comissão padrão
INSERT INTO public.commission_tiers (min_amount, max_amount, percentage, bonus, label) VALUES
  (0, 200, 0, 0, 'Varejo'),
  (200, 1500, 20, 50, 'Nível 1'),
  (1500, 3000, 30, 100, 'Nível 2'),
  (3000, NULL, 40, 200, 'Nível 3');

-- Habilitar RLS
ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_returns ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simples (acesso público por enquanto, pode ser refinado depois)
CREATE POLICY "Allow all operations on representatives" ON public.representatives FOR ALL USING (true);
CREATE POLICY "Allow all operations on commission_tiers" ON public.commission_tiers FOR ALL USING (true);
CREATE POLICY "Allow all operations on maletas" ON public.maletas FOR ALL USING (true);
CREATE POLICY "Allow all operations on maleta_items" ON public.maleta_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on maleta_returns" ON public.maleta_returns FOR ALL USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_representatives_updated_at
  BEFORE UPDATE ON public.representatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maletas_updated_at
  BEFORE UPDATE ON public.maletas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maleta_items_updated_at
  BEFORE UPDATE ON public.maleta_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número sequencial de maleta
CREATE OR REPLACE FUNCTION public.generate_maleta_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Buscar o próximo número baseado nos existentes
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(number FROM 4) AS INTEGER)), 0
    ) + 1
    INTO next_number
    FROM public.maletas
    WHERE number ~ '^MAL[0-9]+$';
    
    -- Formatar com zeros à esquerda
    formatted_number := 'MAL' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$;