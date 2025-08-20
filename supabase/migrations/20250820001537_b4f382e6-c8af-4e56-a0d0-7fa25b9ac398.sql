
-- 1) Verifique se estamos encontrando a organização correta
SELECT id, name, slug 
FROM organizations 
WHERE name ILIKE '%rie joias%' OR slug ILIKE '%rie%';

-- 2) Migrar todas as maletas globais (organization_id IS NULL) para a organização "Rie Joias"
WITH org AS (
  SELECT id 
  FROM organizations 
  WHERE name ILIKE '%rie joias%' OR slug ILIKE '%rie%'
  ORDER BY created_at ASC
  LIMIT 1
)
UPDATE maletas m
SET organization_id = (SELECT id FROM org)
WHERE m.organization_id IS NULL;

-- 3) Conferência: totas globais restantes e total já vinculadas à Rie Joias
WITH org AS (
  SELECT id 
  FROM organizations 
  WHERE name ILIKE '%rie joias%' OR slug ILIKE '%rie%'
  ORDER BY created_at ASC
  LIMIT 1
)
SELECT 
  (SELECT COUNT(*) FROM maletas WHERE organization_id IS NULL) AS globais_restantes,
  (SELECT COUNT(*) FROM maletas WHERE organization_id = (SELECT id FROM org)) AS vinculadas_rie_joias;
