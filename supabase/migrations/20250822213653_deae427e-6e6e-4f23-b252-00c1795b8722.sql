
-- Criação da tabela para itens de changelog e roadmap
CREATE TABLE changelog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('feature', 'improvement', 'bugfix', 'breaking')),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  category text DEFAULT 'general',
  version text,
  release_date date,
  priority integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_changelog_status ON changelog_items(status);
CREATE INDEX idx_changelog_type ON changelog_items(type);
CREATE INDEX idx_changelog_release_date ON changelog_items(release_date);

-- RLS policies
ALTER TABLE changelog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on changelog_items" ON changelog_items
  FOR ALL USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_changelog_items_updated_at 
    BEFORE UPDATE ON changelog_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
