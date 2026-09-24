-- ============================================================
-- Aqua Track Phase 2
-- Washing batch receive, delivery batches, scanners, override
-- ============================================================

-- ------------------------------------------------------------
-- Identifier -> bag resolver
-- ------------------------------------------------------------

create or replace function public.resolve_bag_from_identifier(
  p_identifier text
)
returns table (
  bag_id uuid,
  bag_code text,
  qr_token text,
  owner_id uuid,
  student_name text,
  roll_number text,
  hostel_id uuid,
  room_number text,
  is_active boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_identifier text;
begin
  v_identifier := trim(p_identifier);

  if v_identifier is null or v_identifier = '' then
    raise exception 'IDENTIFIER_REQUIRED';
  end if;

  return query
  select
    b.id,
    b.bag_code,
    b.qr_token,
    b.owner_id,
    p.full_name,
    p.roll_number,
    p.hostel_id,
    p.room_number,
    b.is_active
  from public.bags b
  join public.profiles p
    on p.id = b.owner_id
  where
    b.bag_code = v_identifier
    or b.qr_token = v_identifier
    or p.roll_number = v_identifier
  order by b.created_at desc
  limit 1;
end;
$$;

revoke all on function public.resolve_bag_from_identifier(text)
from public, anon, authenticated;

-- ------------------------------------------------------------
-- Receive an entire washing batch.
-- Completing pickup does not receive the batch.
-- ------------------------------------------------------------

create or replace function public.receive_washing_batch(
  p_washing_batch_id uuid
)
returns public.washing_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.washing_batches;
  v_facility_id uuid;
  v_order record;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select facility_id
  into v_facility_id
  from public.profiles
  where id = auth.uid()
    and role = 'WASHING_STAFF'
    and is_active = true;

  if v_facility_id is null then
    raise exception 'WASHING_FACILITY_NOT_ASSIGNED';
  end if;

  select *
  into v_batch
  from public.washing_batches
  where id = p_washing_batch_id
  for update;

  if not found then
    raise exception 'WASHING_BATCH_NOT_FOUND';
  end if;

  if v_batch.facility_id <> v_facility_id then
    raise exception 'BATCH_MISMATCH';
  end if;

  if v_batch.status <> 'CREATED' then
    raise exception 'INVALID_BATCH_STATUS';
  end if;

  update public.washing_batches
  set
    status = 'RECEIVED',
    received_at = now(),
    updated_at = now()
  where id = p_washing_batch_id
  returning *
  into v_batch;

  for v_order in
    select id
    from public.laundry_orders
    where washing_batch_id = p_washing_batch_id
    order by created_at
    for update
  loop
    perform public.transition_laundry_status(
      v_order.id,
      'RECEIVED_AT_FACILITY',
      auth.uid(),
      'Washing batch received at facility.'
    );
  end loop;

  select *
  into v_batch
  from public.washing_batches
  where id = p_washing_batch_id;

  return v_batch;
end;
$$;

revoke all on function public.receive_washing_batch(uuid) from public, anon;
grant execute on function public.receive_washing_batch(uuid) to authenticated;

-- ------------------------------------------------------------
-- Delivery batch lifecycle
-- ------------------------------------------------------------

create or replace function public.create_delivery_batch(
  p_hostel_id uuid,
  p_order_ids uuid[]
)
returns public.delivery_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.delivery_batches;
  v_order_id uuid;
  v_order public.laundry_orders;
  v_student_hostel uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.is_delivery_boy() then
    raise exception 'DELIVERY_BOY_NOT_ACTIVE';
  end if;

  if p_order_ids is null or array_length(p_order_ids, 1) is null then
    raise exception 'EMPTY_BATCH';
  end if;

  if not exists (
    select 1
    from public.hostels
    where id = p_hostel_id
      and is_active = true
  ) then
    raise exception 'INVALID_HOSTEL';
  end if;

  if not exists (
    select 1
    from public.pickup_sessions
    where delivery_boy_id = auth.uid()
      and hostel_id = p_hostel_id
      and status <> 'CANCELLED'
  ) then
    raise exception 'ORDER_NOT_ASSIGNED';
  end if;

  insert into public.delivery_batches (
    batch_number,
    hostel_id,
    delivery_boy_id,
    status
  )
  values (
    'DB-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
    p_hostel_id,
    auth.uid(),
    'CREATED'
  )
  returning *
  into v_batch;

  foreach v_order_id in array p_order_ids
  loop
    select *
    into v_order
    from public.laundry_orders
    where id = v_order_id
    for update;

    if not found then
      raise exception 'LAUNDRY_ORDER_NOT_FOUND';
    end if;

    if v_order.status <> 'READY_FOR_DELIVERY' then
      raise exception 'ORDER_NOT_ELIGIBLE';
    end if;

    if v_order.delivery_batch_id is not null then
      raise exception 'ORDER_NOT_ELIGIBLE';
    end if;

    select hostel_id
    into v_student_hostel
    from public.profiles
    where id = v_order.student_id;

    if v_student_hostel is distinct from p_hostel_id then
      raise exception 'WRONG_HOSTEL';
    end if;

    update public.laundry_orders
    set
      delivery_batch_id = v_batch.id,
      updated_at = now()
    where id = v_order.id;

    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'EMPTY_BATCH';
  end if;

  return v_batch;
end;
$$;

create or replace function public.mark_delivery_batch_ready(
  p_delivery_batch_id uuid
)
returns public.delivery_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.delivery_batches;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select *
  into v_batch
  from public.delivery_batches
  where id = p_delivery_batch_id
  for update;

  if not found then
    raise exception 'DELIVERY_BATCH_NOT_FOUND';
  end if;

  if v_batch.delivery_boy_id <> auth.uid() or not public.is_delivery_boy() then
    raise exception 'DELIVERY_BATCH_NOT_ASSIGNED';
  end if;

  if v_batch.status <> 'CREATED' then
    raise exception 'INVALID_BATCH_STATUS';
  end if;

  if not exists (
    select 1
    from public.laundry_orders
    where delivery_batch_id = p_delivery_batch_id
  ) then
    raise exception 'EMPTY_BATCH';
  end if;

  if exists (
    select 1
    from public.laundry_orders
    where delivery_batch_id = p_delivery_batch_id
      and status <> 'READY_FOR_DELIVERY'
  ) then
    raise exception 'ORDER_NOT_ELIGIBLE';
  end if;

  update public.delivery_batches
  set
    status = 'READY',
    updated_at = now()
  where id = p_delivery_batch_id
  returning *
  into v_batch;

  return v_batch;
end;
$$;

create or replace function public.start_delivery_batch(
  p_delivery_batch_id uuid
)
returns public.delivery_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.delivery_batches;
  v_order record;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select *
  into v_batch
  from public.delivery_batches
  where id = p_delivery_batch_id
  for update;

  if not found then
    raise exception 'DELIVERY_BATCH_NOT_FOUND';
  end if;

  if v_batch.delivery_boy_id <> auth.uid() or not public.is_delivery_boy() then
    raise exception 'DELIVERY_BATCH_NOT_ASSIGNED';
  end if;

  if v_batch.status <> 'READY' then
    raise exception 'INVALID_BATCH_STATUS';
  end if;

  if exists (
    select 1
    from public.laundry_orders
    where delivery_batch_id = p_delivery_batch_id
      and status <> 'READY_FOR_DELIVERY'
  ) then
    raise exception 'ORDER_NOT_ELIGIBLE';
  end if;

  update public.delivery_batches
  set
    status = 'OUT_FOR_DELIVERY',
    started_at = now(),
    updated_at = now()
  where id = p_delivery_batch_id
  returning *
  into v_batch;

  for v_order in
    select id
    from public.laundry_orders
    where delivery_batch_id = p_delivery_batch_id
    order by created_at
    for update
  loop
    perform public.transition_laundry_status(
      v_order.id,
      'OUT_FOR_DELIVERY',
      auth.uid(),
      'Delivery batch started.'
    );
  end loop;

  select *
  into v_batch
  from public.delivery_batches
  where id = p_delivery_batch_id;

  return v_batch;
end;
$$;

revoke all on function public.create_delivery_batch(uuid, uuid[]) from public, anon;
revoke all on function public.mark_delivery_batch_ready(uuid) from public, anon;
revoke all on function public.start_delivery_batch(uuid) from public, anon;
grant execute on function public.create_delivery_batch(uuid, uuid[]) to authenticated;
grant execute on function public.mark_delivery_batch_ready(uuid) to authenticated;
grant execute on function public.start_delivery_batch(uuid) to authenticated;

-- ------------------------------------------------------------
-- Universal hostel scanner (identity in, backend chooses action)
-- ------------------------------------------------------------

create or replace function public.resolve_universal_scan(
  p_identifier text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bag record;
  v_order public.laundry_orders;
  v_pickup public.pickup_sessions;
  v_batch public.delivery_batches;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.is_delivery_boy() then
    raise exception 'DELIVERY_BOY_NOT_ACTIVE';
  end if;

  select *
  into v_bag
  from public.resolve_bag_from_identifier(p_identifier);

  if not found then
    return jsonb_build_object(
      'success', false,
      'operation', 'ERROR',
      'code', 'INVALID_QR',
      'message', 'No bag was found for that identifier.'
    );
  end if;

  if not v_bag.is_active then
    return jsonb_build_object(
      'success', false,
      'operation', 'ERROR',
      'code', 'BAG_NOT_ACTIVE',
      'message', 'This bag is not active.'
    );
  end if;

  select *
  into v_order
  from public.laundry_orders
  where bag_id = v_bag.bag_id
    and status <> 'DELIVERED'
  order by created_at desc
  limit 1;

  select *
  into v_pickup
  from public.pickup_sessions
  where delivery_boy_id = auth.uid()
    and hostel_id = v_bag.hostel_id
    and status = 'ACTIVE'
  order by started_at desc nulls last
  limit 1;

  select db.*
  into v_batch
  from public.delivery_batches db
  where db.delivery_boy_id = auth.uid()
    and db.hostel_id = v_bag.hostel_id
    and db.status = 'OUT_FOR_DELIVERY'
  order by db.started_at desc nulls last
  limit 1;

  if v_order.id is null then
    if v_pickup.id is null then
      return jsonb_build_object(
        'success', false,
        'operation', 'ERROR',
        'code', 'SESSION_NOT_ACTIVE',
        'message', 'Pickup is not active right now.',
        'bag_code', v_bag.bag_code,
        'student_name', v_bag.student_name
      );
    end if;

    if v_bag.hostel_id is distinct from v_pickup.hostel_id then
      return jsonb_build_object(
        'success', false,
        'operation', 'ERROR',
        'code', 'WRONG_HOSTEL',
        'message', 'This bag belongs to a different pickup location.',
        'bag_code', v_bag.bag_code
      );
    end if;

    return jsonb_build_object(
      'success', true,
      'operation', 'COLLECT',
      'code', null,
      'message', 'Ready to collect this bag.',
      'bag_code', v_bag.bag_code,
      'student_name', v_bag.student_name,
      'pickup_session_id', v_pickup.id
    );
  end if;

  if v_order.status = 'OUT_FOR_DELIVERY' then
    if v_batch.id is null or v_order.delivery_batch_id is distinct from v_batch.id then
      return jsonb_build_object(
        'success', false,
        'operation', 'ERROR',
        'code', 'BATCH_MISMATCH',
        'message', 'This laundry does not belong to the current delivery batch.',
        'bag_code', v_bag.bag_code,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'order_status', v_order.status
      );
    end if;

    return jsonb_build_object(
      'success', true,
      'operation', 'DELIVER',
      'code', null,
      'message', 'Ready to confirm delivery.',
      'bag_code', v_bag.bag_code,
      'student_name', v_bag.student_name,
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'order_status', v_order.status,
      'delivery_batch_id', v_batch.id
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'operation', 'INFO',
    'code', null,
    'message', 'This bag already has an active laundry order.',
    'bag_code', v_bag.bag_code,
    'student_name', v_bag.student_name,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.status
  );
end;
$$;

create or replace function public.confirm_universal_scan(
  p_identifier text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resolved jsonb;
  v_operation text;
  v_order public.laundry_orders;
begin
  v_resolved := public.resolve_universal_scan(p_identifier);
  v_operation := v_resolved ->> 'operation';

  if coalesce((v_resolved ->> 'success')::boolean, false) is not true
     or v_operation = 'ERROR'
  then
    raise exception '%', coalesce(v_resolved ->> 'code', 'NOT_FOUND');
  end if;

  if v_operation = 'COLLECT' then
    select *
    into v_order
    from public.collect_bag_by_identifier(
      trim(p_identifier),
      (v_resolved ->> 'pickup_session_id')::uuid
    );

    return jsonb_build_object(
      'success', true,
      'operation', 'COLLECT',
      'message', 'Bag collected successfully.',
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'order_status', v_order.status
    );
  end if;

  if v_operation = 'DELIVER' then
    select *
    into v_order
    from public.transition_laundry_status(
      (v_resolved ->> 'order_id')::uuid,
      'DELIVERED',
      auth.uid(),
      'Delivery confirmed at hostel scanner.'
    );

    return jsonb_build_object(
      'success', true,
      'operation', 'DELIVER',
      'message', 'Delivery confirmed.',
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'order_status', v_order.status
    );
  end if;

  return v_resolved;
end;
$$;

create or replace function public.record_delivery_attempt(
  p_identifier text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resolved jsonb;
  v_order public.laundry_orders;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'DELIVERY_ATTEMPT_REASON_REQUIRED';
  end if;

  v_resolved := public.resolve_universal_scan(p_identifier);

  if v_resolved ->> 'operation' <> 'DELIVER' then
    raise exception '%', coalesce(v_resolved ->> 'code', 'INVALID_STATUS_TRANSITION');
  end if;

  select *
  into v_order
  from public.transition_laundry_status(
    (v_resolved ->> 'order_id')::uuid,
    'DELIVERY_ATTEMPTED',
    auth.uid(),
    trim(p_reason)
  );

  return jsonb_build_object(
    'success', true,
    'operation', 'DELIVERY_ATTEMPTED',
    'message', 'Failed delivery attempt recorded.',
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.status
  );
end;
$$;

revoke all on function public.resolve_universal_scan(text) from public, anon;
revoke all on function public.confirm_universal_scan(text) from public, anon;
revoke all on function public.record_delivery_attempt(text, text) from public, anon;
grant execute on function public.resolve_universal_scan(text) to authenticated;
grant execute on function public.confirm_universal_scan(text) to authenticated;
grant execute on function public.record_delivery_attempt(text, text) to authenticated;

-- ------------------------------------------------------------
-- Washing scanner: start / complete washing for one bag
-- ------------------------------------------------------------

create or replace function public.resolve_washing_scan(
  p_identifier text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bag record;
  v_order public.laundry_orders;
  v_facility_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.is_washing_staff() then
    raise exception 'WASHING_STAFF_ACCESS_REQUIRED';
  end if;

  v_facility_id := public.current_facility_id();

  if v_facility_id is null then
    raise exception 'WASHING_FACILITY_NOT_ASSIGNED';
  end if;

  select *
  into v_bag
  from public.resolve_bag_from_identifier(p_identifier);

  if not found then
    return jsonb_build_object(
      'success', false,
      'operation', 'ERROR',
      'code', 'INVALID_QR',
      'message', 'No bag was found for that identifier.'
    );
  end if;

  select *
  into v_order
  from public.laundry_orders
  where bag_id = v_bag.bag_id
    and status <> 'DELIVERED'
  order by created_at desc
  limit 1;

  if v_order.id is null then
    return jsonb_build_object(
      'success', false,
      'operation', 'ERROR',
      'code', 'NOT_FOUND',
      'message', 'No active laundry order found for this identifier.'
    );
  end if;

  if v_order.washing_batch_id is null
     or not exists (
       select 1
       from public.washing_batches wb
       where wb.id = v_order.washing_batch_id
         and wb.facility_id = v_facility_id
     )
  then
    return jsonb_build_object(
      'success', false,
      'operation', 'ERROR',
      'code', 'BATCH_MISMATCH',
      'message', 'This laundry does not belong to your facility batch.'
    );
  end if;

  if v_order.status = 'COLLECTED' then
    return jsonb_build_object(
      'success', false,
      'operation', 'ERROR',
      'code', 'BATCH_NOT_RECEIVED',
      'message', 'Receive the washing batch before processing individual bags.',
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'order_status', v_order.status,
      'bag_code', v_bag.bag_code
    );
  end if;

  if v_order.status = 'RECEIVED_AT_FACILITY' then
    return jsonb_build_object(
      'success', true,
      'operation', 'START_WASHING',
      'message', 'Start washing this bag.',
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'order_status', v_order.status,
      'bag_code', v_bag.bag_code,
      'student_name', v_bag.student_name
    );
  end if;

  if v_order.status = 'UNDER_WASHING' then
    return jsonb_build_object(
      'success', true,
      'operation', 'COMPLETE_WASHING',
      'message', 'Mark this bag as washed.',
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'order_status', v_order.status,
      'bag_code', v_bag.bag_code,
      'student_name', v_bag.student_name
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'operation', 'INFO',
    'message', 'This bag is not waiting for washing.',
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.status,
    'bag_code', v_bag.bag_code
  );
end;
$$;

create or replace function public.confirm_washing_scan(
  p_identifier text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resolved jsonb;
  v_operation text;
  v_target public.laundry_status;
  v_order public.laundry_orders;
begin
  v_resolved := public.resolve_washing_scan(p_identifier);
  v_operation := v_resolved ->> 'operation';

  if coalesce((v_resolved ->> 'success')::boolean, false) is not true
     or v_operation in ('ERROR', 'INFO')
  then
    raise exception '%', coalesce(v_resolved ->> 'code', 'INVALID_STATUS_TRANSITION');
  end if;

  if v_operation = 'START_WASHING' then
    v_target := 'UNDER_WASHING';
  elsif v_operation = 'COMPLETE_WASHING' then
    v_target := 'READY_FOR_DELIVERY';
  else
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  select *
  into v_order
  from public.transition_laundry_status(
    (v_resolved ->> 'order_id')::uuid,
    v_target,
    auth.uid(),
    'Washing scan confirmed.'
  );

  return jsonb_build_object(
    'success', true,
    'operation', v_operation,
    'message', 'Laundry status updated.',
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.status
  );
end;
$$;

revoke all on function public.resolve_washing_scan(text) from public, anon;
revoke all on function public.confirm_washing_scan(text) from public, anon;
grant execute on function public.resolve_washing_scan(text) to authenticated;
grant execute on function public.confirm_washing_scan(text) to authenticated;

-- ------------------------------------------------------------
-- Admin status override (any status, reason + audit required)
-- ------------------------------------------------------------

create or replace function public.admin_override_laundry_status(
  p_order_id uuid,
  p_to_status public.laundry_status,
  p_reason text
)
returns public.laundry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.laundry_orders;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.is_admin() then
    raise exception 'ADMIN_ACCESS_REQUIRED';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'ADMIN_REASON_REQUIRED';
  end if;

  select *
  into v_order
  from public.laundry_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'LAUNDRY_ORDER_NOT_FOUND';
  end if;

  v_order := public.apply_laundry_status_change(
    p_order_id,
    p_to_status,
    auth.uid(),
    trim(p_reason)
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    'ADMIN_OVERRIDE_STATUS',
    'laundry_orders',
    p_order_id,
    jsonb_build_object(
      'to_status', p_to_status,
      'reason', trim(p_reason)
    )
  );

  return v_order;
end;
$$;

revoke all on function public.admin_override_laundry_status(uuid, public.laundry_status, text)
from public, anon;
grant execute on function public.admin_override_laundry_status(uuid, public.laundry_status, text)
to authenticated;
