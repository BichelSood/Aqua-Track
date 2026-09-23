-- Lock down the transition RPC.
revoke execute
on function public.transition_laundry_status(
  uuid,
  public.laundry_status,
  uuid,
  text
)
from public;

revoke execute
on function public.transition_laundry_status(
  uuid,
  public.laundry_status,
  uuid,
  text
)
from anon;

grant execute
on function public.transition_laundry_status(
  uuid,
  public.laundry_status,
  uuid,
  text
)
to authenticated;


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
  v_allowed boolean := false;
begin
  -- The RPC must be called by an authenticated user.
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  -- The actor supplied by the client must be the authenticated user.
  if auth.uid() <> p_changed_by then
    raise exception 'ACTOR_MISMATCH';
  end if;

  -- Get the active actor's role.
  select role
  into v_actor_role
  from public.profiles
  where id = auth.uid()
    and is_active = true;

  if v_actor_role is null then
    raise exception 'ACTOR_NOT_ACTIVE';
  end if;

  -- Lock the order while changing its status.
  select *
  into v_order
  from public.laundry_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'LAUNDRY_ORDER_NOT_FOUND';
  end if;

  v_from_status := v_order.status;

  /*
   * Washing staff transitions:
   *
   * COLLECTED
   *     -> RECEIVED_AT_FACILITY
   *
   * RECEIVED_AT_FACILITY
   *     -> UNDER_WASHING
   *
   * UNDER_WASHING
   *     -> READY_FOR_DELIVERY
   */
  if v_actor_role = 'WASHING_STAFF' then

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

      else
        v_allowed := false;
    end case;

  /*
   * Delivery staff transitions:
   *
   * READY_FOR_DELIVERY
   *     -> OUT_FOR_DELIVERY
   *
   * OUT_FOR_DELIVERY
   *     -> DELIVERY_ATTEMPTED
   *     -> DELIVERED
   *
   * DELIVERY_ATTEMPTED
   *     -> OUT_FOR_DELIVERY
   */
  elsif v_actor_role = 'DELIVERY_BOY' then

    case v_from_status
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

      else
        v_allowed := false;
    end case;

  /*
   * Admin can perform valid transitions as an operational override.
   * The reason is mandatory so the action remains auditable.
   */
  elsif v_actor_role = 'ADMIN' then

    if p_reason is null or length(trim(p_reason)) = 0 then
      raise exception 'ADMIN_REASON_REQUIRED';
    end if;

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