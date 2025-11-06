-- Fix get_user_organizations: correct UUID cast and make fallback safe
create or replace function public.get_user_organizations(user_uuid uuid default auth.uid())
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  org_id_text text;
  org_id uuid;
begin
  -- If we have an authenticated user, return orgs from user_organizations
  if user_uuid is not null then
    return query
    select organization_id
    from public.user_organizations
    where user_id = user_uuid;
    return;
  end if;

  -- Fallback: read organization_id from JWT claims (for organization-user flows)
  org_id_text := (current_setting('request.jwt.claims', true)::json ->> 'organization_id');

  if org_id_text is not null and org_id_text <> '' then
    begin
      org_id := org_id_text::uuid;
      return next org_id;
    exception when invalid_text_representation then
      -- Ignore invalid UUIDs silently
      return;
    end;
  end if;

  return;
end;
$$;