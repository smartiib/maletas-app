-- Add is_active column to organizations table
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS organizations_is_active_idx 
  ON public.organizations (is_active);