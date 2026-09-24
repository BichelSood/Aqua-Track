-- ============================================================
-- Aqua Track
-- Admin pickup session announcement
-- ============================================================

create or replace function public.announce_pickup_session(
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

  -- Only active admins may announce sessions.
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and is_active = true
  ) then
    raise exception 'ADMIN_ACCESS_REQUIRED';
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

  -- Only SCHEDULED sessions can be announced.
  if v_session.status <> 'SCHEDULED' then
    raise exception 'INVALID_PICKUP_SESSION_STATUS';
  end if;

  update public.pickup_sessions
  set
    status = 'ANNOUNCED',
    announced_at = now(),
    updated_at = now()
  where id = p_pickup_session_id
  returning * into v_session;

  return v_session;
end;
$$;

revoke all on function public.announce_pickup_session(uuid)
from public;

grant execute on function public.announce_pickup_session(uuid)
to authenticated;