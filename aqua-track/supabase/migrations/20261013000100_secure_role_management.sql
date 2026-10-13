-- ============================================================
-- Aqua Track
-- Secure public signup roles and main-admin role management
-- ============================================================

alter table public.profiles
add column if not exists is_main_admin boolean not null default false;

alter table public.profiles
drop constraint if exists profiles_main_admin_requires_active_admin;

alter table public.profiles
add constraint profiles_main_admin_requires_active_admin
check (
  is_main_admin = false
  or (
    role = 'ADMIN'
    and is_active = true
  )
);

create or replace function public.prevent_last_main_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_main_admin = true
    and (
      new.is_main_admin = false
      or new.role <> 'ADMIN'
      or new.is_active = false
    )
    and not exists (
      select 1
      from public.profiles
      where id <> old.id
        and is_main_admin = true
        and role = 'ADMIN'
        and is_active = true
    )
  then
    raise exception 'LAST_MAIN_ADMIN_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_last_main_admin_removal
on public.profiles;

create trigger profiles_prevent_last_main_admin_removal
before update on public.profiles
for each row
execute function public.prevent_last_main_admin_removal();

-- Public signup must always create a STUDENT profile. User metadata is
-- allowed to provide display fields only; role-like metadata is ignored.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      'Aqua Track User'
    ),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'STUDENT'
  )
  on conflict (id) do update
  set
    full_name = coalesce(
      nullif(excluded.full_name, ''),
      public.profiles.full_name
    ),
    phone = coalesce(excluded.phone, public.profiles.phone),
    updated_at = now();

  return new;
end;
$$;

create or replace function public.is_main_admin()
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
      and is_main_admin = true
  );
$$;

revoke all on function public.is_main_admin() from public;
grant execute on function public.is_main_admin() to authenticated;

-- Remove broad admin profile updates. User management goes through the
-- validated RPC below so role changes cannot be forged with direct REST calls.
drop policy if exists "Admins can update profiles"
on public.profiles;

create or replace function public.admin_update_user_profile(
  p_user_id uuid,
  p_full_name text,
  p_role public.user_role,
  p_is_active boolean,
  p_hostel_id uuid default null,
  p_facility_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.profiles;
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.is_main_admin() then
    raise exception 'MAIN_ADMIN_ACCESS_REQUIRED';
  end if;

  if p_role = 'ADMIN' then
    raise exception 'ADMIN_ROLE_MANAGED_EXTERNALLY';
  end if;

  select *
  into v_target
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if p_user_id = v_actor_id and (
    v_target.role <> p_role
    or v_target.is_active <> p_is_active
  ) then
    raise exception 'CANNOT_UPDATE_SELF_ROLE';
  end if;

  if v_target.role = 'ADMIN' or v_target.is_main_admin then
    raise exception 'ADMIN_ROLE_MANAGED_EXTERNALLY';
  end if;

  if length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'VALIDATION_ERROR';
  end if;

  update public.profiles
  set
    full_name = trim(p_full_name),
    role = p_role,
    is_active = p_is_active,
    hostel_id = p_hostel_id,
    facility_id = p_facility_id,
    updated_at = now()
  where id = p_user_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_actor_id,
    'MAIN_ADMIN_UPDATED_USER',
    'profiles',
    p_user_id,
    jsonb_build_object(
      'previous_role', v_target.role,
      'new_role', p_role,
      'previous_is_active', v_target.is_active,
      'new_is_active', p_is_active
    )
  );

  return p_user_id;
end;
$$;

revoke all on function public.admin_update_user_profile(
  uuid,
  text,
  public.user_role,
  boolean,
  uuid,
  uuid
) from public, anon;

grant execute on function public.admin_update_user_profile(
  uuid,
  text,
  public.user_role,
  boolean,
  uuid,
  uuid
) to authenticated;
