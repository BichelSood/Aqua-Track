-- Admin write access for Phase 7 management screens.
-- Status corrections stay on admin_override_laundry_status (reason + audit).

create or replace function public.write_admin_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ACCESS_REQUIRED';
  end if;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.write_admin_audit(text, text, uuid, jsonb) from public, anon;
grant execute on function public.write_admin_audit(text, text, uuid, jsonb) to authenticated;

drop policy if exists "Admins can update profiles"
on public.profiles;

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view all hostels"
on public.hostels;

create policy "Admins can view all hostels"
on public.hostels
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert hostels"
on public.hostels;

create policy "Admins can insert hostels"
on public.hostels
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update hostels"
on public.hostels;

create policy "Admins can update hostels"
on public.hostels
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can insert facilities"
on public.facilities;

create policy "Admins can insert facilities"
on public.facilities
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update facilities"
on public.facilities;

create policy "Admins can update facilities"
on public.facilities
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can insert bags"
on public.bags;

create policy "Admins can insert bags"
on public.bags
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update bags"
on public.bags;

create policy "Admins can update bags"
on public.bags
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can update complaints"
on public.complaints;

create policy "Admins can update complaints"
on public.complaints
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
