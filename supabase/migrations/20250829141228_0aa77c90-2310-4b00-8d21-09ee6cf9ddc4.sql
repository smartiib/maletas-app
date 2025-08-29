
-- Expandir a tabela pdf_templates para incluir mais tipos e configurações
ALTER TABLE pdf_templates ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE pdf_templates ADD COLUMN IF NOT EXISTS printer_type text DEFAULT 'pdf';
ALTER TABLE pdf_templates ADD COLUMN IF NOT EXISTS paper_size text DEFAULT 'A4';
ALTER TABLE pdf_templates ADD COLUMN IF NOT EXISTS orientation text DEFAULT 'portrait';
ALTER TABLE pdf_templates ADD COLUMN IF NOT EXISTS margins jsonb DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}'::jsonb;

-- Criar tabela para fila de impressão
CREATE TABLE IF NOT EXISTS print_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  user_id uuid,
  template_id uuid REFERENCES pdf_templates(id),
  template_type text NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  printer_config jsonb DEFAULT '{}'::jsonb,
  quantity integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 0,
  error_message text,
  processing_started_at timestamp with time zone,
  processing_completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela para configurações de impressora
CREATE TABLE IF NOT EXISTS printer_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  name text NOT NULL,
  printer_type text NOT NULL DEFAULT 'pdf',
  connection_type text NOT NULL DEFAULT 'network',
  connection_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS policies para print_queue
ALTER TABLE print_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage print queue for their organization" 
  ON print_queue 
  FOR ALL 
  USING (organization_id IN (SELECT get_user_organizations()));

-- RLS policies para printer_configurations  
ALTER TABLE printer_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage printer configs for their organization" 
  ON printer_configurations 
  FOR ALL 
  USING (organization_id IN (SELECT get_user_organizations()));

-- Atualizar RLS da tabela pdf_templates para incluir organization_id
DROP POLICY IF EXISTS "Allow all operations on pdf_templates" ON pdf_templates;

CREATE POLICY "Users can manage templates for their organization" 
  ON pdf_templates 
  FOR ALL 
  USING (organization_id IS NULL OR organization_id IN (SELECT get_user_organizations()));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON print_queue(status);
CREATE INDEX IF NOT EXISTS idx_print_queue_organization ON print_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_print_queue_created_at ON print_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_printer_configurations_org ON printer_configurations(organization_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_print_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_print_queue_updated_at
    BEFORE UPDATE ON print_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_print_queue_updated_at();

CREATE TRIGGER update_printer_configurations_updated_at
    BEFORE UPDATE ON printer_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
