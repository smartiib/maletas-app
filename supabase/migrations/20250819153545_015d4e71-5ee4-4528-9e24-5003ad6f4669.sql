
-- Criar tabela organization_users
CREATE TABLE public.organization_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Criar tabela organization_pages
CREATE TABLE public.organization_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, page_key)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_pages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para organization_users
CREATE POLICY "Users can view organization_users if they belong to the organization" 
  ON public.organization_users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organization_users.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organization_users if they belong to the organization" 
  ON public.organization_users 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organization_users.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization_users if they belong to the organization" 
  ON public.organization_users 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organization_users.organization_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas RLS para organization_pages
CREATE POLICY "Users can view organization_pages if they belong to the organization" 
  ON public.organization_pages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organization_pages.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization_pages if they belong to the organization" 
  ON public.organization_pages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organization_pages.organization_id 
      AND user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organization_users_updated_at
  BEFORE UPDATE ON public.organization_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_pages_updated_at
  BEFORE UPDATE ON public.organization_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
