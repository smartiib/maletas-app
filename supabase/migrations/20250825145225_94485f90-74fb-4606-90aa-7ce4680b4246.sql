
-- Criar tabela para armazenar status de revisão dos produtos
CREATE TABLE public.product_review_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id integer NOT NULL,
  organization_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'em-revisao', 'nao-alterar')),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, organization_id)
);

-- Habilitar RLS
ALTER TABLE public.product_review_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir operações apenas para usuários da organização
CREATE POLICY "Users can view product review status for their organization"
  ON public.product_review_status
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can insert product review status for their organization"
  ON public.product_review_status
  FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update product review status for their organization"
  ON public.product_review_status
  FOR UPDATE
  USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can delete product review status for their organization"
  ON public.product_review_status
  FOR DELETE
  USING (organization_id IN (SELECT get_user_organizations()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_review_status_updated_at
  BEFORE UPDATE ON public.product_review_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
