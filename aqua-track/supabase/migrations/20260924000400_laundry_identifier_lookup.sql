-- ============================================================
-- Aqua Track
-- Secure laundry lookup by QR/bag code or student roll number
-- ============================================================

create or replace function public.find_laundry_by_identifier(
  p_identifier text
)
returns table (
  order_id uuid,
  order_number text,
  order_status public.laundry_status,
  bag_id uuid,
  bag_code text,
  qr_token text,
  student_id uuid,
  student_name text,
  roll_number text,
  hostel_id uuid,
  room_number text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'WASHING_STAFF'
      and is_active = true
  ) then
    raise exception 'WASHING_STAFF_ACCESS_REQUIRED';
  end if;

  return query
  select
    lo.id,
    lo.order_number,
    lo.status,
    b.id,
    b.bag_code,
    b.qr_token,
    p.id,
    p.full_name,
    p.roll_number,
    p.hostel_id,
    p.room_number
  from public.laundry_orders lo
  join public.bags b
    on b.id = lo.bag_id
  join public.profiles p
    on p.id = lo.student_id
  where
    lo.status <> 'DELIVERED'
    and b.is_active = true
    and p.is_active = true
    and (
      b.bag_code = trim(p_identifier)
      or b.qr_token = trim(p_identifier)
      or p.roll_number = trim(p_identifier)
    )
  order by lo.created_at desc
  limit 1;
end;
$$;

revoke all
on function public.find_laundry_by_identifier(text)
from public;

grant execute
on function public.find_laundry_by_identifier(text)
to authenticated;