-- Create table for product jewelry information
CREATE TABLE public.product_jewelry_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id INTEGER NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Fornecedores
  fornecedor_bruto TEXT,
  codigo_fornecedor_bruto TEXT,
  nome_galvanica TEXT,
  
  -- Banho
  peso_peca NUMERIC(10,3) DEFAULT 0,
  milesimo NUMERIC(10,3) DEFAULT 0,
  valor_milesimo NUMERIC(10,2) DEFAULT 0,
  
  -- Custos
  custo_fixo NUMERIC(10,2) DEFAULT 0,
  custo_bruto NUMERIC(10,2) DEFAULT 0,
  custo_variavel NUMERIC(10,2) DEFAULT 0,
  custo_galvanica NUMERIC(10,2) DEFAULT 0, -- Calculado: peso_peca * valor_milesimo
  custo_final NUMERIC(10,2) DEFAULT 0, -- Calculado: soma de todos os custos
  
  -- Markup
  markup_desejado NUMERIC(5,2) DEFAULT 0,
  preco_venda_sugerido NUMERIC(10,2) DEFAULT 0, -- Calculado: custo_final * markup_desejado / 100
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_jewelry_info ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view jewelry info for their organization" 
ON public.product_jewelry_info 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can insert jewelry info for their organization" 
ON public.product_jewelry_info 
FOR INSERT 
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update jewelry info for their organization" 
ON public.product_jewelry_info 
FOR UPDATE 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can delete jewelry info for their organization" 
ON public.product_jewelry_info 
FOR DELETE 
USING (organization_id IN (SELECT get_user_organizations()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jewelry_info_updated_at
BEFORE UPDATE ON public.product_jewelry_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_product_jewelry_info_product_id ON public.product_jewelry_info(product_id);
CREATE INDEX idx_product_jewelry_info_organization_id ON public.product_jewelry_info(organization_id);