-- Criar usuários com senhas pré-definidas
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