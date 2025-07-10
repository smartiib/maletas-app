-- Limpar dados existentes
DELETE FROM auth.users WHERE email IN ('barbara@gmail.com', 'agencia2b@gmail.com');
DELETE FROM public.profiles WHERE email IN ('barbara@gmail.com', 'agencia2b@gmail.com');

-- Inserir usuários de forma mais básica
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
  '{"provider":"email","providers":["email"]}',
  '{"name":"Barbara Admin"}',
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
  '{"provider":"email","providers":["email"]}',
  '{"name":"Agencia Owner"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Verificar se os perfis foram criados automaticamente pelo trigger
-- Se não foram, vamos criá-los manualmente
INSERT INTO public.profiles (user_id, email, name, role)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'name',
  CASE 
    WHEN u.email = 'agencia2b@gmail.com' THEN 'owner'::user_role
    WHEN u.email = 'barbara@gmail.com' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END
FROM auth.users u
WHERE u.email IN ('barbara@gmail.com', 'agencia2b@gmail.com')
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);