
-- Criar tabela para histórico de impressão de etiquetas
CREATE TABLE public.label_print_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  label_type TEXT NOT NULL DEFAULT 'standard',
  format TEXT NOT NULL DEFAULT 'A4',
  printed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para segurança
ALTER TABLE public.label_print_history ENABLE ROW LEVEL SECURITY;

-- Política para visualizar histórico da própria organização
CREATE POLICY "Users can view label history for their organization" 
  ON public.label_print_history 
  FOR SELECT 
  USING (organization_id IN (SELECT get_user_organizations()));

-- Política para inserir histórico na própria organização
CREATE POLICY "Users can insert label history for their organization" 
  ON public.label_print_history 
  FOR INSERT 
  WITH CHECK (organization_id IN (SELECT get_user_organizations()));

-- Política para atualizar histórico da própria organização
CREATE POLICY "Users can update label history for their organization" 
  ON public.label_print_history 
  FOR UPDATE 
  USING (organization_id IN (SELECT get_user_organizations()));

-- Política para deletar histórico da própria organização
CREATE POLICY "Users can delete label history for their organization" 
  ON public.label_print_history 
  FOR DELETE 
  USING (organization_id IN (SELECT get_user_organizations()));

-- Índice para melhorar performance das consultas
CREATE INDEX idx_label_print_history_product_id ON public.label_print_history(product_id);
CREATE INDEX idx_label_print_history_org_id ON public.label_print_history(organization_id);
CREATE INDEX idx_label_print_history_printed_at ON public.label_print_history(printed_at);
