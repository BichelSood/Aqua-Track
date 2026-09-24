-- ============================================================
-- Aqua Track
-- Collect laundry by QR token, bag code, or student roll number
-- ============================================================

create or replace function public.collect_bag_by_identifier(
  p_identifier text,
  p_pickup_session_id uuid
)
returns public.laundry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identifier text;
  v_bag_code text;
  v_order public.laundry_orders;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  v_identifier := trim(p_identifier);

  if v_identifier = '' then
    raise exception 'IDENTIFIER_REQUIRED';
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

  /*
    Resolve the identifier to the actual bag code.

    Supported:
      1. bag_code
      2. qr_token
      3. student roll_number
  */
  select b.bag_code
  into v_bag_code
  from public.bags b
  join public.profiles p
    on p.id = b.owner_id
  where b.is_active = true
    and p.is_active = true
    and (
      b.bag_code = v_identifier
      or b.qr_token = v_identifier
      or p.roll_number = v_identifier
    )
  order by b.created_at desc
  limit 1;

  if v_bag_code is null then
    raise exception 'BAG_NOT_FOUND';
  end if;

  /*
    Reuse the existing, already-tested collection function.
    That function continues to enforce:
      - delivery-boy identity
      - pickup-session assignment
      - hostel validation
      - active bag
      - duplicate active-order protection
      - order creation
      - initial status history
  */
  select *
  into v_order
  from public.collect_bag(
    v_bag_code,
    p_pickup_session_id,
    auth.uid()
  );

  return v_order;
end;
$$;

revoke all
on function public.collect_bag_by_identifier(text, uuid)
from public;

grant execute
on function public.collect_bag_by_identifier(text, uuid)
to authenticated;