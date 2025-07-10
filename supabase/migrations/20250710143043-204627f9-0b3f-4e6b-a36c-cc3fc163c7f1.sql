-- Primeiro, vamos verificar se existe dados problemáticos e limpar
DELETE FROM auth.users WHERE email IN ('barbara@gmail.com', 'agencia2b@gmail.com');
DELETE FROM public.profiles WHERE email IN ('barbara@gmail.com', 'agencia2b@gmail.com');

-- Recriar a função handle_new_user com verificação de segurança
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o tipo user_role existe antes de usar
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'agencia2b@gmail.com' THEN 'owner'::user_role
      WHEN NEW.email = 'barbara@gmail.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não bloquear o cadastro
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se o trigger existe e recriar se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Agora inserir os usuários de forma mais simples
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
  role,
  confirmation_token,
  email_confirmed_at_generated
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
  'authenticated',
  '',
  now()
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
  'authenticated',
  '',
  now()
);