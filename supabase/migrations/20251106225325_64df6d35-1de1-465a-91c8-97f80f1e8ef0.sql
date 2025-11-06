-- Fix: Drop old SELECT policies and create a single one that combines both conditions
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;

-- Create a combined policy that allows:
-- 1. Users to see organizations they belong to
-- 2. Super admins (owner/admin role) to see all organizations
CREATE POLICY "Users can view organizations"
ON public.organizations
FOR SELECT
USING (
  -- Super admins can see all
  public.is_super_admin(auth.uid())
  OR
  -- Regular users can see their orgs
  id IN (SELECT get_user_organizations())
);

-- Same fix for orders table - the issue is similar
DROP POLICY IF EXISTS "Select orders by org or null" ON public.wc_orders;

CREATE POLICY "Select orders by org or null"
ON public.wc_orders
FOR SELECT
USING (
  -- Allow if organization_id is NULL (for backwards compatibility)
  organization_id IS NULL
  OR
  -- Super admins can see all orders
  public.is_super_admin(auth.uid())
  OR
  -- Users can see orders from their organizations
  (
    auth.uid() IS NOT NULL 
    AND organization_id IN (SELECT get_user_organizations())
  )
);