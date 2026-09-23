-- Allow delivery staff to view only laundry orders
-- belonging to pickup sessions assigned to them.

create policy "Delivery staff can view assigned laundry orders"
on public.laundry_orders
for select
to authenticated
using (
  status in (
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERY_ATTEMPTED'
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'DELIVERY_BOY'
      and profiles.is_active = true
  )
  and exists (
    select 1
    from public.pickup_sessions
    where pickup_sessions.id = laundry_orders.pickup_session_id
      and pickup_sessions.delivery_boy_id = auth.uid()
  )
);