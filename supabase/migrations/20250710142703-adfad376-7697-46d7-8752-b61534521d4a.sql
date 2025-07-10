-- Primeiro, vamos limpar qualquer dados problemáticos
DELETE FROM auth.users WHERE email IN ('barbara@gmail.com', 'agencia2b@gmail.com');

-- Agora vamos recriar o tipo user_role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'manager', 'user');
    END IF;
END $$;

-- Verificar se a tabela profiles existe, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          role user_role NOT NULL DEFAULT 'user',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Agora vamos inserir os usuários novamente
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'barbara@gmail.com',
  crypt('bar#Rie@2025', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Barbara Admin"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'agencia2b@gmail.com', 
  crypt('#Dgskua1712', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Agencia Owner"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
);