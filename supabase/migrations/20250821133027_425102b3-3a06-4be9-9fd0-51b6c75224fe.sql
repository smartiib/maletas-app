
-- Adiciona a coluna "settings" para armazenar credenciais e preferências por organização
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Opcional: garantir que updated_at seja mantido por aplicação/trigger existente, se houver
-- (Nenhuma mudança de RLS necessária; políticas atuais já permitem UPDATE para organizações do usuário)
