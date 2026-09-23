-- ============================================================
-- Aqua Track
-- Secure atomic bag collection RPC
-- ============================================================

revoke execute
on function public.collect_bag(text, uuid, uuid)
from public;

revoke execute
on function public.collect_bag(text, uuid, uuid)
from anon;

grant execute
on function public.collect_bag(text, uuid, uuid)
to authenticated;

create or replace function public.collect_bag(
  p_bag_code text,
  p_pickup_session_id uuid,
  p_delivery_boy_id uuid
)
returns public.laundry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery_boy public.profiles;
  v_pickup_session public.pickup_sessions;
  v_bag public.bags;
  v_student public.profiles;
  v_active_order public.laundry_orders;
  v_order public.laundry_orders;
  v_order_number text;
begin
  -- ----------------------------------------------------------
  -- The authenticated user must be the delivery boy performing
  -- the operation.
  -- ----------------------------------------------------------

  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if auth.uid() <> p_delivery_boy_id then
    raise exception 'ACTOR_MISMATCH';
  end if;

  -- ----------------------------------------------------------
  -- Validate delivery boy
  -- ----------------------------------------------------------

  select *
  into v_delivery_boy
  from public.profiles
  where id = auth.uid()
    and role = 'DELIVERY_BOY'
    and is_active = true;

  if not found then
    raise exception 'DELIVERY_BOY_NOT_ACTIVE';
  end if;

  -- ----------------------------------------------------------
  -- Validate pickup session
  -- ----------------------------------------------------------

  select *
  into v_pickup_session
  from public.pickup_sessions
  where id = p_pickup_session_id
  for update;

  if not found then
    raise exception 'PICKUP_SESSION_NOT_FOUND';
  end if;

  if v_pickup_session.delivery_boy_id <> auth.uid() then
    raise exception 'PICKUP_SESSION_NOT_ASSIGNED';
  end if;

  if v_pickup_session.status not in ('ANNOUNCED', 'ACTIVE') then
    raise exception 'PICKUP_SESSION_NOT_ACTIVE';
  end if;

  -- ----------------------------------------------------------
  -- Find and lock the bag
  -- ----------------------------------------------------------

  select *
  into v_bag
  from public.bags
  where bag_code = p_bag_code
  for update;

  if not found then
    raise exception 'BAG_NOT_FOUND';
  end if;

  if not v_bag.is_active then
    raise exception 'BAG_NOT_ACTIVE';
  end if;

  -- ----------------------------------------------------------
  -- Find and validate student
  -- ----------------------------------------------------------

  select *
  into v_student
  from public.profiles
  where id = v_bag.owner_id;

  if not found then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  if not v_student.is_active then
    raise exception 'STUDENT_NOT_ACTIVE';
  end if;

  if v_student.hostel_id <> v_pickup_session.hostel_id then
    raise exception 'BAG_OWNER_NOT_IN_PICKUP_HOSTEL';
  end if;

  -- ----------------------------------------------------------
  -- Prevent multiple active orders for the same bag
  -- ----------------------------------------------------------

  select *
  into v_active_order
  from public.laundry_orders
  where bag_id = v_bag.id
    and status <> 'DELIVERED'
  limit 1
  for update;

  if found then
    raise exception 'BAG_ALREADY_HAS_ACTIVE_ORDER';
  end if;

  -- ----------------------------------------------------------
  -- Generate order number
  -- ----------------------------------------------------------

  v_order_number :=
    'AT-' ||
    to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');

  -- ----------------------------------------------------------
  -- Create laundry order
  -- ----------------------------------------------------------

  insert into public.laundry_orders (
    order_number,
    bag_id,
    student_id,
    pickup_session_id,
    status
  )
  values (
    v_order_number,
    v_bag.id,
    v_student.id,
    v_pickup_session.id,
    'COLLECTED'
  )
  returning *
  into v_order;

  -- ----------------------------------------------------------
  -- Record initial status
  -- ----------------------------------------------------------

  insert into public.status_history (
    laundry_order_id,
    from_status,
    to_status,
    changed_by,
    reason
  )
  values (
    v_order.id,
    null,
    'COLLECTED',
    auth.uid(),
    'Laundry bag collected during pickup.'
  );

  return v_order;
end;
$$;