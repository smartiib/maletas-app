-- Create a test user directly in auth.users for testing
-- This bypasses email confirmation
DO $$
DECLARE
    test_user_id UUID;
    test_org_id UUID;
    trial_plan_id UUID;
BEGIN
    -- Insert test user directly into auth.users with confirmed email
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'teste@exemplo.com',
        crypt('senha123', gen_salt('bf')),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        '{"organization_name": "Empresa Teste"}',
        false,
        '',
        '',
        '',
        ''
    ) 
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = now(),
        updated_at = now()
    RETURNING id INTO test_user_id;

    -- Create test organization
    INSERT INTO public.organizations (
        id,
        name,
        slug,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Empresa Teste',
        'empresa-teste',
        now(),
        now()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = now()
    RETURNING id INTO test_org_id;

    -- Link user to organization
    INSERT INTO public.user_organizations (
        user_id,
        organization_id,
        role,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        test_org_id,
        'owner',
        now(),
        now()
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    -- Get trial plan
    SELECT id INTO trial_plan_id 
    FROM public.subscription_plans 
    WHERE type = 'trial' 
    LIMIT 1;

    -- Create trial subscription
    IF trial_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (
            organization_id,
            plan_id,
            status,
            trial_ends_at,
            current_period_start,
            current_period_end,
            created_at,
            updated_at
        ) VALUES (
            test_org_id,
            trial_plan_id,
            'trialing',
            now() + interval '14 days',
            now(),
            now() + interval '1 month',
            now(),
            now()
        )
        ON CONFLICT DO NOTHING;

        -- Create organization limits
        INSERT INTO public.organization_limits (
            organization_id,
            current_stores,
            current_products,
            current_users,
            updated_at
        ) VALUES (
            test_org_id,
            0,
            0,
            1,
            now()
        )
        ON CONFLICT (organization_id) DO NOTHING;
    END IF;

END $$;