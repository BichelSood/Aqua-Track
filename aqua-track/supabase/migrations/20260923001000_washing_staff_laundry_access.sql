-- Allow active washing staff to view laundry orders
-- that are currently relevant to the washing workflow.

create policy "Washing staff can view laundry orders"
on public.laundry_orders
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'WASHING_STAFF'
      and profiles.is_active = true
  )
  and status in (
    'COLLECTED',
    'RECEIVED_AT_FACILITY',
    'UNDER_WASHING'
  )
);