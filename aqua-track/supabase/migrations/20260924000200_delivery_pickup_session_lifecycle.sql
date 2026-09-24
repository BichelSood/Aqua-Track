-- ============================================================
-- Aqua Track
-- Delivery pickup session lifecycle
-- ============================================================

create or replace function public.start_pickup_session(
  p_pickup_session_id uuid
)
returns public.pickup_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.pickup_sessions;
begin
  -- Caller must be authenticated.
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  -- Lock the session while changing its state.
  select *
  into v_session
  from public.pickup_sessions
  where id = p_pickup_session_id
  for update;

  if not found then
    raise exception 'PICKUP_SESSION_NOT_FOUND';
  end if;

  -- Only the assigned active delivery boy may start the session.
  if v_session.delivery_boy_id <> auth.uid() then
    raise exception 'PICKUP_SESSION_NOT_ASSIGNED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'DELIVERY_BOY'
      and is_active = true
  ) then
    raise exception 'DELIVERY_BOY_NOT_ACTIVE';
  end if;

  -- Only ANNOUNCED sessions can become ACTIVE.
  if v_session.status <> 'ANNOUNCED' then
    raise exception 'INVALID_PICKUP_SESSION_STATUS';
  end if;

  update public.pickup_sessions
  set
    status = 'ACTIVE',
    started_at = now(),
    updated_at = now()
  where id = p_pickup_session_id
  returning *
  into v_session;

  return v_session;
end;
$$;


create or replace function public.complete_pickup_session(
  p_pickup_session_id uuid
)
returns public.pickup_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.pickup_sessions;
begin
  -- Caller must be authenticated.
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  -- Lock the session while changing its state.
  select *
  into v_session
  from public.pickup_sessions
  where id = p_pickup_session_id
  for update;

  if not found then
    raise exception 'PICKUP_SESSION_NOT_FOUND';
  end if;

  -- Only the assigned active delivery boy may complete the session.
  if v_session.delivery_boy_id <> auth.uid() then
    raise exception 'PICKUP_SESSION_NOT_ASSIGNED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'DELIVERY_BOY'
      and is_active = true
  ) then
    raise exception 'DELIVERY_BOY_NOT_ACTIVE';
  end if;

  -- Only ACTIVE sessions can be completed.
  if v_session.status <> 'ACTIVE' then
    raise exception 'INVALID_PICKUP_SESSION_STATUS';
  end if;

  update public.pickup_sessions
  set
    status = 'COMPLETED',
    completed_at = now(),
    updated_at = now()
  where id = p_pickup_session_id
  returning *
  into v_session;

  return v_session;
end;
$$;


revoke all on function public.start_pickup_session(uuid)
from public;

revoke all on function public.start_pickup_session(uuid)
from anon;

grant execute on function public.start_pickup_session(uuid)
to authenticated;


revoke all on function public.complete_pickup_session(uuid)
from public;

revoke all on function public.complete_pickup_session(uuid)
from anon;

grant execute on function public.complete_pickup_session(uuid)
to authenticated;