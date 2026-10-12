-- ============================================================
-- Aqua Track
-- Self-heal missing profile rows for authenticated users
-- ============================================================

create or replace function public.ensure_current_user_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_user auth.users;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = auth.uid();

  if found then
    return v_profile;
  end if;

  select *
  into v_user
  from auth.users
  where id = auth.uid();

  if not found then
    raise exception 'Authenticated user not found';
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    v_user.id,
    coalesce(
      nullif(v_user.raw_user_meta_data ->> 'full_name', ''),
      split_part(v_user.email, '@', 1),
      'Aqua Track User'
    ),
    nullif(v_user.raw_user_meta_data ->> 'phone', ''),
    'STUDENT'
  )
  returning *
  into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.ensure_current_user_profile() from public;
grant execute on function public.ensure_current_user_profile() to authenticated;
