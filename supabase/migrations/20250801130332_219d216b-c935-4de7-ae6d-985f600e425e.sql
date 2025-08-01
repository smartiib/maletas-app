-- Create missing enum types
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('owner', 'admin', 'user');
CREATE TYPE IF NOT EXISTS subscription_status AS ENUM ('trialing', 'active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE IF NOT EXISTS subscription_plan_type AS ENUM ('basic', 'pro', 'enterprise');

-- Fix the handle_new_user function with proper security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- Fix other functions with proper search_path
CREATE OR REPLACE FUNCTION public.add_stock_history_entry(
  p_product_id integer,
  p_variation_id integer DEFAULT NULL::integer,
  p_type text DEFAULT 'manual_adjustment'::text,
  p_quantity_change integer DEFAULT 0,
  p_previous_stock integer DEFAULT 0,
  p_new_stock integer DEFAULT 0,
  p_reason text DEFAULT NULL::text,
  p_source text DEFAULT 'internal'::text,
  p_user_id uuid DEFAULT auth.uid(),
  p_user_name text DEFAULT NULL::text,
  p_wc_order_id integer DEFAULT NULL::integer,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry_id UUID;
BEGIN
  INSERT INTO public.stock_history (
    product_id,
    variation_id,
    type,
    quantity_change,
    previous_stock,
    new_stock,
    reason,
    source,
    user_id,
    user_name,
    wc_order_id,
    metadata
  ) VALUES (
    p_product_id,
    p_variation_id,
    p_type,
    p_quantity_change,
    p_previous_stock,
    p_new_stock,
    p_reason,
    p_source,
    p_user_id,
    p_user_name,
    p_wc_order_id,
    p_metadata
  ) RETURNING id INTO entry_id;
  
  RETURN entry_id;
END;
$$;

-- Fix get_user_organizations function
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.user_organizations WHERE user_id = user_uuid;
$$;

-- Fix user_belongs_to_organization function
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_organizations 
    WHERE organization_id = org_id AND user_id = user_uuid
  );
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_maleta_number function
CREATE OR REPLACE FUNCTION public.generate_maleta_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Buscar o próximo número baseado nos existentes
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(number FROM 4) AS INTEGER)), 0
    ) + 1
    INTO next_number
    FROM public.maletas
    WHERE number ~ '^MAL[0-9]+$';
    
    -- Formatar com zeros à esquerda
    formatted_number := 'MAL' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$;