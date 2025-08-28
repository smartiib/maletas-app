
-- Criar tabela para rastrear status de sincronização por organização
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'products',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_discover_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'idle',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, sync_type)
);

-- RLS policies para sync_status
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sync_status for their org" 
  ON sync_status 
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations()));

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER sync_status_updated_at
  BEFORE UPDATE ON sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
