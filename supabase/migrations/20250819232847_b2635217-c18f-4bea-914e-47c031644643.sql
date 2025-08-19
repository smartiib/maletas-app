
-- Primeiro, vamos buscar o ID da organização "Rie Joias"
-- Depois atualizar todas as maletas que não têm organization_id definido

-- Atualizar maletas sem organization_id para a organização "Rie Joias"
UPDATE maletas 
SET organization_id = (
  SELECT id FROM organizations 
  WHERE name ILIKE '%rie joias%' OR slug ILIKE '%rie-joias%'
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Atualizar maleta_items sem organization_id para a mesma organização
UPDATE maleta_items 
SET organization_id = (
  SELECT id FROM organizations 
  WHERE name ILIKE '%rie joias%' OR slug ILIKE '%rie-joias%'
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Atualizar maleta_returns sem organization_id para a mesma organização  
UPDATE maleta_returns 
SET organization_id = (
  SELECT id FROM organizations 
  WHERE name ILIKE '%rie joias%' OR slug ILIKE '%rie-joias%'
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Verificar quantos registros foram atualizados
SELECT 
  'maletas' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as com_organizacao
FROM maletas
UNION ALL
SELECT 
  'maleta_items' as tabela,
  COUNT(*) as total_registros, 
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as com_organizacao
FROM maleta_items
UNION ALL
SELECT 
  'maleta_returns' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as com_organizacao  
FROM maleta_returns;
