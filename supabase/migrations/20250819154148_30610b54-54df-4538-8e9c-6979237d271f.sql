-- Fix security vulnerability in wc_customers table
-- Remove the policy that allows reading customers with NULL organization_id

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Select customers by org or null" ON public.wc_customers;

-- Create a new restrictive SELECT policy that only allows access to customers 
-- within the user's organizations (no NULL organization_id access)
CREATE POLICY "Select customers by organization only" 
  ON public.wc_customers 
  FOR SELECT 
  USING (
    organization_id IN ( SELECT get_user_organizations() AS get_user_organizations)
  );

-- Also ensure DELETE operations are properly restricted
CREATE POLICY "Delete customers by organization" 
  ON public.wc_customers 
  FOR DELETE 
  USING (
    organization_id IN ( SELECT get_user_organizations() AS get_user_organizations)
  );