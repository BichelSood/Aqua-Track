-- ============================================================
-- Aqua Track
-- Admin read access
-- ============================================================

-- Helper used by RLS policies.
-- SECURITY DEFINER prevents the profiles policy from recursively
-- checking itself when determining whether the current user is admin.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- ============================================================
-- Profiles
-- ============================================================

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- Bags
-- ============================================================

create policy "Admins can view all bags"
on public.bags
for select
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- Pickup sessions
-- ============================================================

create policy "Admins can view all pickup sessions"
on public.pickup_sessions
for select
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- Laundry orders
-- ============================================================

create policy "Admins can view all laundry orders"
on public.laundry_orders
for select
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- Status history
-- ============================================================

create policy "Admins can view all status history"
on public.status_history
for select
to authenticated
using (
  public.is_admin()
);