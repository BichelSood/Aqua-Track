-- ============================================================
-- Aqua Track Phase 2
-- Facility assignment, centralized apply, notifications
-- ============================================================

-- ------------------------------------------------------------
-- Washing staff are assigned to a facility.
-- ------------------------------------------------------------

alter table public.profiles
add column if not exists facility_id uuid
references public.facilities(id)
on delete restrict;

create index if not exists profiles_facility_id_idx
  on public.profiles(facility_id);

update public.profiles
set facility_id = (
  select id
  from public.facilities
  where code = 'TEST-FACILITY'
    and is_active = true
  limit 1
)
where role = 'WASHING_STAFF'
  and facility_id is null;

-- Users cannot change their own role or facility assignment.
drop policy if exists "Users can update their own profile"
on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
  and role = public.get_user_role()
  and facility_id is not distinct from (
    select p.facility_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

-- ------------------------------------------------------------
-- Role helpers for RLS (avoid recursive profile checks).
-- ------------------------------------------------------------

create or replace function public.is_delivery_boy()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'DELIVERY_BOY'
      and is_active = true
  );
$$;

create or replace function public.is_washing_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'WASHING_STAFF'
      and is_active = true
  );
$$;

create or replace function public.current_facility_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select facility_id
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

revoke all on function public.is_delivery_boy() from public, anon;
revoke all on function public.is_washing_staff() from public, anon;
revoke all on function public.current_facility_id() from public, anon;
grant execute on function public.is_delivery_boy() to authenticated;
grant execute on function public.is_washing_staff() to authenticated;
grant execute on function public.current_facility_id() to authenticated;

-- ------------------------------------------------------------
-- Student notifications for lifecycle events.
-- ------------------------------------------------------------

create or replace function public.emit_laundry_status_notification(
  p_student_id uuid,
  p_order_id uuid,
  p_to_status public.laundry_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type public.notification_type;
  v_title text;
  v_message text;
begin
  case p_to_status
    when 'COLLECTED' then
      v_type := 'LAUNDRY_COLLECTED';
      v_title := 'Laundry collected';
      v_message := 'Your laundry has been collected.';
    when 'RECEIVED_AT_FACILITY' then
      v_type := 'RECEIVED_AT_FACILITY';
      v_title := 'Arrived at facility';
      v_message := 'Your laundry has reached the washing facility.';
    when 'UNDER_WASHING' then
      v_type := 'WASHING_STARTED';
      v_title := 'Washing started';
      v_message := 'Your laundry is now being washed.';
    when 'READY_FOR_DELIVERY' then
      v_type := 'LAUNDRY_READY';
      v_title := 'Ready for delivery';
      v_message := 'Your laundry is ready for delivery.';
    when 'OUT_FOR_DELIVERY' then
      v_type := 'OUT_FOR_DELIVERY';
      v_title := 'Out for delivery';
      v_message := 'Your laundry is out for delivery today.';
    when 'DELIVERED' then
      v_type := 'LAUNDRY_DELIVERED';
      v_title := 'Laundry delivered';
      v_message := 'Your laundry has been delivered.';
    else
      return;
  end case;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    laundry_order_id
  )
  values (
    p_student_id,
    v_type,
    v_title,
    v_message,
    p_order_id
  );
end;
$$;

revoke all on function public.emit_laundry_status_notification(uuid, uuid, public.laundry_status)
from public, anon, authenticated;

-- ------------------------------------------------------------
-- Apply a status change: order, history, notification, batches.
-- Callers must authorize and validate the transition.
-- ------------------------------------------------------------

create or replace function public.apply_laundry_status_change(
  p_order_id uuid,
  p_to_status public.laundry_status,
  p_changed_by uuid,
  p_reason text default null
)
returns public.laundry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.laundry_orders;
  v_from_status public.laundry_status;
begin
  select *
  into v_order
  from public.laundry_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'LAUNDRY_ORDER_NOT_FOUND';
  end if;

  v_from_status := v_order.status;

  if v_from_status = p_to_status then
    raise exception 'INVALID_STATUS_TRANSITION: % -> %', v_from_status, p_to_status;
  end if;

  update public.laundry_orders
  set
    status = p_to_status,
    completed_at = case
      when p_to_status = 'DELIVERED' then now()
      when v_from_status = 'DELIVERED' and p_to_status <> 'DELIVERED' then null
      else completed_at
    end,
    updated_at = now()
  where id = p_order_id
  returning *
  into v_order;

  insert into public.status_history (
    laundry_order_id,
    from_status,
    to_status,
    changed_by,
    reason
  )
  values (
    p_order_id,
    v_from_status,
    p_to_status,
    p_changed_by,
    p_reason
  );

  perform public.emit_laundry_status_notification(
    v_order.student_id,
    v_order.id,
    p_to_status
  );

  if v_order.washing_batch_id is not null then
    if p_to_status = 'UNDER_WASHING' then
      update public.washing_batches
      set
        status = 'PROCESSING',
        started_at = coalesce(started_at, now()),
        updated_at = now()
      where id = v_order.washing_batch_id
        and status in ('RECEIVED', 'PROCESSING');
    end if;

    if not exists (
      select 1
      from public.laundry_orders
      where washing_batch_id = v_order.washing_batch_id
        and status in ('COLLECTED', 'RECEIVED_AT_FACILITY', 'UNDER_WASHING')
    ) then
      update public.washing_batches
      set
        status = 'COMPLETED',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
      where id = v_order.washing_batch_id
        and status in ('RECEIVED', 'PROCESSING');
    end if;
  end if;

  if v_order.delivery_batch_id is not null
     and p_to_status = 'DELIVERED'
     and not exists (
       select 1
       from public.laundry_orders
       where delivery_batch_id = v_order.delivery_batch_id
         and status <> 'DELIVERED'
     )
  then
    update public.delivery_batches
    set
      status = 'COMPLETED',
      completed_at = now(),
      updated_at = now()
    where id = v_order.delivery_batch_id
      and status = 'OUT_FOR_DELIVERY';
  end if;

  return v_order;
end;
$$;

revoke all on function public.apply_laundry_status_change(uuid, public.laundry_status, uuid, text)
from public, anon, authenticated;

-- ------------------------------------------------------------
-- Central transition: role matrix + operational context.
-- ------------------------------------------------------------

create or replace function public.transition_laundry_status(
  p_order_id uuid,
  p_to_status public.laundry_status,
  p_changed_by uuid,
  p_reason text default null
)
returns public.laundry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.laundry_orders;
  v_from_status public.laundry_status;
  v_actor_role public.user_role;
  v_facility_id uuid;
  v_allowed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if auth.uid() <> p_changed_by then
    raise exception 'ACTOR_MISMATCH';
  end if;

  select role, facility_id
  into v_actor_role, v_facility_id
  from public.profiles
  where id = auth.uid()
    and is_active = true;

  if v_actor_role is null then
    raise exception 'ACTOR_NOT_ACTIVE';
  end if;

  select *
  into v_order
  from public.laundry_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'LAUNDRY_ORDER_NOT_FOUND';
  end if;

  v_from_status := v_order.status;

  if v_actor_role = 'WASHING_STAFF' then
    if v_facility_id is null then
      raise exception 'WASHING_FACILITY_NOT_ASSIGNED';
    end if;

    if v_order.washing_batch_id is null
       or not exists (
         select 1
         from public.washing_batches wb
         where wb.id = v_order.washing_batch_id
           and wb.facility_id = v_facility_id
       )
    then
      raise exception 'BATCH_MISMATCH';
    end if;

    case v_from_status
      when 'COLLECTED' then
        if p_to_status = 'RECEIVED_AT_FACILITY'
           and exists (
             select 1
             from public.washing_batches wb
             where wb.id = v_order.washing_batch_id
               and wb.status = 'RECEIVED'
               and wb.facility_id = v_facility_id
           )
        then
          v_allowed := true;
        end if;

      when 'RECEIVED_AT_FACILITY' then
        if p_to_status = 'UNDER_WASHING'
           and exists (
             select 1
             from public.washing_batches wb
             where wb.id = v_order.washing_batch_id
               and wb.status in ('RECEIVED', 'PROCESSING')
               and wb.facility_id = v_facility_id
           )
        then
          v_allowed := true;
        end if;

      when 'UNDER_WASHING' then
        if p_to_status = 'READY_FOR_DELIVERY'
           and exists (
             select 1
             from public.washing_batches wb
             where wb.id = v_order.washing_batch_id
               and wb.status in ('RECEIVED', 'PROCESSING')
               and wb.facility_id = v_facility_id
           )
        then
          v_allowed := true;
        end if;

      else
        v_allowed := false;
    end case;

  elsif v_actor_role = 'DELIVERY_BOY' then
    case v_from_status
      when 'READY_FOR_DELIVERY' then
        if p_to_status = 'OUT_FOR_DELIVERY'
           and v_order.delivery_batch_id is not null
           and exists (
             select 1
             from public.delivery_batches db
             where db.id = v_order.delivery_batch_id
               and db.delivery_boy_id = auth.uid()
               and db.status = 'OUT_FOR_DELIVERY'
           )
        then
          v_allowed := true;
        end if;

      when 'OUT_FOR_DELIVERY' then
        if p_to_status in ('DELIVERY_ATTEMPTED', 'DELIVERED')
           and v_order.delivery_batch_id is not null
           and exists (
             select 1
             from public.delivery_batches db
             where db.id = v_order.delivery_batch_id
               and db.delivery_boy_id = auth.uid()
               and db.status = 'OUT_FOR_DELIVERY'
           )
        then
          v_allowed := true;
        end if;

      when 'DELIVERY_ATTEMPTED' then
        if p_to_status = 'OUT_FOR_DELIVERY'
           and v_order.delivery_batch_id is not null
           and exists (
             select 1
             from public.delivery_batches db
             where db.id = v_order.delivery_batch_id
               and db.delivery_boy_id = auth.uid()
               and db.status = 'OUT_FOR_DELIVERY'
           )
        then
          v_allowed := true;
        end if;

      else
        v_allowed := false;
    end case;

  elsif v_actor_role = 'ADMIN' then
    if p_reason is null or length(trim(p_reason)) = 0 then
      raise exception 'ADMIN_REASON_REQUIRED';
    end if;

    -- Admins may still use the normal matrix through this function.
    -- Arbitrary corrections use admin_override_laundry_status.
    case v_from_status
      when 'COLLECTED' then
        v_allowed := p_to_status = 'RECEIVED_AT_FACILITY';
      when 'RECEIVED_AT_FACILITY' then
        v_allowed := p_to_status = 'UNDER_WASHING';
      when 'UNDER_WASHING' then
        v_allowed := p_to_status = 'READY_FOR_DELIVERY';
      when 'READY_FOR_DELIVERY' then
        v_allowed := p_to_status = 'OUT_FOR_DELIVERY';
      when 'OUT_FOR_DELIVERY' then
        v_allowed := p_to_status in ('DELIVERY_ATTEMPTED', 'DELIVERED');
      when 'DELIVERY_ATTEMPTED' then
        v_allowed := p_to_status = 'OUT_FOR_DELIVERY';
      else
        v_allowed := false;
    end case;

  else
    raise exception 'ROLE_NOT_ALLOWED';
  end if;

  if not v_allowed then
    raise exception
      'INVALID_STATUS_TRANSITION: % -> %',
      v_from_status,
      p_to_status;
  end if;

  if v_actor_role = 'DELIVERY_BOY'
     and p_to_status = 'DELIVERY_ATTEMPTED'
     and (p_reason is null or length(trim(p_reason)) = 0)
  then
    raise exception 'DELIVERY_ATTEMPT_REASON_REQUIRED';
  end if;

  return public.apply_laundry_status_change(
    p_order_id,
    p_to_status,
    p_changed_by,
    p_reason
  );
end;
$$;

-- ------------------------------------------------------------
-- Collection only while the pickup session is ACTIVE.
-- ------------------------------------------------------------

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
  v_pickup_session public.pickup_sessions;
  v_bag public.bags;
  v_student public.profiles;
  v_active_order public.laundry_orders;
  v_order public.laundry_orders;
  v_order_number text;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if auth.uid() <> p_delivery_boy_id then
    raise exception 'ACTOR_MISMATCH';
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

  if v_pickup_session.status <> 'ACTIVE' then
    raise exception 'PICKUP_SESSION_NOT_ACTIVE';
  end if;

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

  v_order_number :=
    'ORD-' ||
    to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');

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

  perform public.emit_laundry_status_notification(
    v_order.student_id,
    v_order.id,
    'COLLECTED'
  );

  return v_order;
end;
$$;

-- ------------------------------------------------------------
-- Pickup announcements notify hostel students.
-- ------------------------------------------------------------

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
  v_hostel_name text;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and is_active = true
  ) then
    raise exception 'ADMIN_ACCESS_REQUIRED';
  end if;

  select *
  into v_session
  from public.pickup_sessions
  where id = p_pickup_session_id
  for update;

  if not found then
    raise exception 'PICKUP_SESSION_NOT_FOUND';
  end if;

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

  select name
  into v_hostel_name
  from public.hostels
  where id = v_session.hostel_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    message
  )
  select
    p.id,
    'PICKUP_AVAILABLE',
    'Laundry pickup is available today',
    format(
      'Laundry pickup is available today at %s from %s to %s.',
      coalesce(v_hostel_name, 'your hostel'),
      to_char(v_session.start_time, 'HH12:MI AM'),
      to_char(v_session.end_time, 'HH12:MI AM')
    )
  from public.profiles p
  where p.hostel_id = v_session.hostel_id
    and p.role = 'STUDENT'
    and p.is_active = true;

  return v_session;
end;
$$;
