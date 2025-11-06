-- Ensure a server-side super admin checker based on profiles.role
create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = uid
      and p.role in ('owner','admin')
  );
$$;

-- Allow super admins to view all organizations regardless of membership
drop policy if exists "Super admins can view all organizations" on public.organizations;

create policy "Super admins can view all organizations"
on public.organizations
for select
using (public.is_super_admin(auth.uid()));