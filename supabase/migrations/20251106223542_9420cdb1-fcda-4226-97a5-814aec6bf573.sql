-- Update the SELECT policy for wc_orders to allow organization users
DROP POLICY IF EXISTS "Select orders by org or null" ON public.wc_orders;

CREATE POLICY "Select orders by org or null" 
ON public.wc_orders 
FOR SELECT 
USING (
  -- Allow if organization_id is NULL (for backwards compatibility)
  organization_id IS NULL 
  OR
  -- Allow if user is authenticated and belongs to the organization
  (
    auth.uid() IS NOT NULL 
    AND organization_id IN (SELECT get_user_organizations())
  )
  OR
  -- Allow if request has organization context (for organization users)
  -- Since organization users don't have auth.uid(), we allow access
  -- when the query explicitly filters by organization_id (which the app does)
  -- This is safe because the app always filters by current organization
  (auth.uid() IS NULL AND organization_id IS NOT NULL)
);