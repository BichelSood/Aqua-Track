-- ============================================================
-- Aqua Track
-- Admin pickup session creation
-- ============================================================

create or replace function public.create_pickup_session(
  p_hostel_id uuid,
  p_delivery_boy_id uuid,
  p_scheduled_date date,
  p_start_time time,
  p_end_time time
)
returns public.pickup_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.pickup_sessions;
begin
  -- The caller must be authenticated.
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  -- Only active admins may create pickup sessions.
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and is_active = true
  ) then
    raise exception 'ADMIN_ACCESS_REQUIRED';
  end if;

  -- Validate hostel.
  if not exists (
    select 1
    from public.hostels
    where id = p_hostel_id
      and is_active = true
  ) then
    raise exception 'INVALID_HOSTEL';
  end if;

  -- Validate delivery staff.
  if not exists (
    select 1
    from public.profiles
    where id = p_delivery_boy_id
      and role = 'DELIVERY_BOY'
      and is_active = true
  ) then
    raise exception 'INVALID_DELIVERY_BOY';
  end if;

  -- Validate pickup time range.
  if p_end_time <= p_start_time then
    raise exception 'INVALID_TIME_RANGE';
  end if;

  insert into public.pickup_sessions (
    hostel_id,
    delivery_boy_id,
    scheduled_date,
    start_time,
    end_time,
    status
  )
  values (
    p_hostel_id,
    p_delivery_boy_id,
    p_scheduled_date,
    p_start_time,
    p_end_time,
    'SCHEDULED'
  )
  returning * into v_session;

  return v_session;
end;
$$;

revoke all on function public.create_pickup_session(
  uuid,
  uuid,
  date,
  time,
  time
) from public;

grant execute on function public.create_pickup_session(
  uuid,
  uuid,
  date,
  time,
  time
) to authenticated;