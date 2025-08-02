-- Criar o usuário admin padrão se não existir
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at, 
    raw_user_meta_data
) 
SELECT 
    gen_random_uuid(),
    'douglas@agencia2b.com.br',
    crypt('#Dgskua1712', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Douglas"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'douglas@agencia2b.com.br'
);

-- Criar perfil para o usuário admin se não existir
INSERT INTO public.profiles (user_id, email, name, role)
SELECT 
    u.id,
    u.email,
    'Douglas',
    'owner'::user_role
FROM auth.users u
WHERE u.email = 'douglas@agencia2b.com.br'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);