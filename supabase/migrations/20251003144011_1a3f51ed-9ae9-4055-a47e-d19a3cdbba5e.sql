-- Allow same email to be used across different organizations
-- Drop the global email unique constraint
ALTER TABLE public.organization_users DROP CONSTRAINT IF EXISTS organization_users_email_key;

-- Add a composite unique constraint on (organization_id, email)
-- This allows the same email in different organizations but not within the same organization
ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_org_email_key UNIQUE (organization_id, email);