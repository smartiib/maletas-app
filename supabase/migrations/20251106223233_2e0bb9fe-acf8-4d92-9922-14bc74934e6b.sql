-- Update get_user_organizations to support organization users
-- This function now checks both auth.uid() and organization user session

CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If user_uuid is provided (from auth.uid()), return organizations for that user
  IF user_uuid IS NOT NULL THEN
    RETURN QUERY 
    SELECT organization_id 
    FROM public.user_organizations 
    WHERE user_id = user_uuid;
  END IF;
  
  -- If no organizations found and we have an organization context in session
  -- This supports organization users who don't have auth.uid()
  -- Note: This requires setting organization_id in the session
  RETURN QUERY
  SELECT current_setting('request.jwt.claims', true)::json->>'organization_id'::uuid
  WHERE current_setting('request.jwt.claims', true)::json->>'organization_id' IS NOT NULL;
END;
$$;