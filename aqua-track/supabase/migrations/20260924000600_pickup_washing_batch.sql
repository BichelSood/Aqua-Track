-- ============================================================
-- Aqua Track
-- Pickup session -> washing batch integration
-- ============================================================

-- ------------------------------------------------------------
-- 1. Link each washing batch to the pickup session that created it
-- ------------------------------------------------------------

alter table public.washing_batches
add column if not exists pickup_session_id uuid
references public.pickup_sessions(id)
on delete restrict;

create unique index if not exists washing_batches_pickup_session_unique_idx
on public.washing_batches (pickup_session_id)
where pickup_session_id is not null;


-- ------------------------------------------------------------
-- 2. Create the single development washing facility
-- ------------------------------------------------------------

insert into public.facilities (
  name,
  code,
  address,
  is_active
)
values (
  'Aqua Track Test Laundry Facility',
  'TEST-FACILITY',
  'Development Environment',
  true
)
on conflict (code) do update
set
  is_active = true,
  updated_at = now();


-- ------------------------------------------------------------
-- 3. Automatically attach a collected order to its
--    pickup session's washing batch.
--
-- The client never chooses the washing batch.
-- ------------------------------------------------------------

create or replace function public.attach_order_to_washing_batch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
begin

  -- Only attach orders that do not already have a batch.
  if new.washing_batch_id is not null then
    return new;
  end if;

  select wb.id
  into v_batch_id
  from public.washing_batches wb
  where wb.pickup_session_id = new.pickup_session_id
    and wb.status = 'CREATED'
  limit 1;

  if v_batch_id is null then
    raise exception 'WASHING_BATCH_NOT_FOUND_FOR_PICKUP_SESSION';
  end if;

  new.washing_batch_id := v_batch_id;

  return new;
end;
$$;


drop trigger if exists laundry_orders_attach_washing_batch
on public.laundry_orders;

create trigger laundry_orders_attach_washing_batch
before insert on public.laundry_orders
for each row
execute function public.attach_order_to_washing_batch();


-- ------------------------------------------------------------
-- 4. Rebuild start_pickup_session so starting a pickup also
--    creates its washing batch.
-- ------------------------------------------------------------

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
  v_facility_id uuid;
  v_batch_id uuid;
  v_batch_number text;
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

  -- There is currently one washing facility.
  select id
  into v_facility_id
  from public.facilities
  where code = 'TEST-FACILITY'
    and is_active = true
  limit 1;

  if v_facility_id is null then
    raise exception 'WASHING_FACILITY_NOT_CONFIGURED';
  end if;

  -- Create one washing batch for this pickup session.
  v_batch_number :=
    'WB-' ||
    to_char(now(), 'YYYYMMDDHH24MISS') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.washing_batches (
    batch_number,
    pickup_session_id,
    facility_id,
    created_by,
    status
  )
  values (
    v_batch_number,
    p_pickup_session_id,
    v_facility_id,
    auth.uid(),
    'CREATED'
  )
  returning id
  into v_batch_id;

  -- Activate the pickup session.
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


-- ------------------------------------------------------------
-- 5. Permissions
-- ------------------------------------------------------------

revoke all on function public.attach_order_to_washing_batch()
from public;

revoke all on function public.attach_order_to_washing_batch()
from anon;

grant execute on function public.attach_order_to_washing_batch()
to authenticated;


revoke all on function public.start_pickup_session(uuid)
from public;

revoke all on function public.start_pickup_session(uuid)
from anon;

grant execute on function public.start_pickup_session(uuid)
to authenticated;