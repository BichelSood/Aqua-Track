-- ============================================================
-- Aqua Track
-- Central laundry status transition rules
-- ============================================================

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
  v_allowed boolean := false;
begin
  -- Load the order.
  select *
  into v_order
  from public.laundry_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'LAUNDRY_ORDER_NOT_FOUND';
  end if;

  v_from_status := v_order.status;

  -- A status transition must be performed by an authenticated user.
  if p_changed_by is null then
    raise exception 'ACTOR_REQUIRED';
  end if;

  -- The actor must have an active profile.
  if not exists (
    select 1
    from public.profiles
    where id = p_changed_by
      and is_active = true
  ) then
    raise exception 'ACTOR_NOT_ACTIVE';
  end if;

  -- ----------------------------------------------------------
  -- Allowed state transitions
  -- ----------------------------------------------------------

  case v_from_status

    when 'COLLECTED' then
      if p_to_status = 'RECEIVED_AT_FACILITY' then
        v_allowed := true;
      end if;

    when 'RECEIVED_AT_FACILITY' then
      if p_to_status = 'UNDER_WASHING' then
        v_allowed := true;
      end if;

    when 'UNDER_WASHING' then
      if p_to_status = 'READY_FOR_DELIVERY' then
        v_allowed := true;
      end if;

    when 'READY_FOR_DELIVERY' then
      if p_to_status = 'OUT_FOR_DELIVERY' then
        v_allowed := true;
      end if;

    when 'OUT_FOR_DELIVERY' then
      if p_to_status in (
        'DELIVERY_ATTEMPTED',
        'DELIVERED'
      ) then
        v_allowed := true;
      end if;

    when 'DELIVERY_ATTEMPTED' then
      if p_to_status = 'OUT_FOR_DELIVERY' then
        v_allowed := true;
      end if;

    when 'DELIVERED' then
      v_allowed := false;

  end case;

  if not v_allowed then
    raise exception
      'INVALID_STATUS_TRANSITION: % -> %',
      v_from_status,
      p_to_status;
  end if;

  -- ----------------------------------------------------------
  -- Update order
  -- ----------------------------------------------------------

  update public.laundry_orders
  set
    status = p_to_status,
    completed_at = case
      when p_to_status = 'DELIVERED' then now()
      else completed_at
    end,
    updated_at = now()
  where id = p_order_id
  returning *
  into v_order;

  -- ----------------------------------------------------------
  -- Record status history
  -- ----------------------------------------------------------

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

  return v_order;
end;
$$;