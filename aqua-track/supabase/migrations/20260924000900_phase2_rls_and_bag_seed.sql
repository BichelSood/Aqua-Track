-- ============================================================
-- Aqua Track Phase 2
-- Operational RLS + non-PII bag identities for existing students
-- ============================================================

-- Delivery staff can see assigned pickup sessions.
drop policy if exists "Delivery staff can view assigned pickup sessions"
on public.pickup_sessions;

create policy "Delivery staff can view assigned pickup sessions"
on public.pickup_sessions
for select
to authenticated
using (
  public.is_delivery_boy()
  and delivery_boy_id = auth.uid()
);

-- Delivery staff can see bags involved in their operations.
drop policy if exists "Delivery staff can view operational bags"
on public.bags;

create policy "Delivery staff can view operational bags"
on public.bags
for select
to authenticated
using (
  public.is_delivery_boy()
  and (
    owner_id in (
      select student_id
      from public.laundry_orders
      where pickup_session_id in (
        select id
        from public.pickup_sessions
        where delivery_boy_id = auth.uid()
      )
      or delivery_batch_id in (
        select id
        from public.delivery_batches
        where delivery_boy_id = auth.uid()
      )
    )
    or owner_id in (
      select p.id
      from public.profiles p
      where p.role = 'STUDENT'
        and p.hostel_id in (
          select hostel_id
          from public.pickup_sessions
          where delivery_boy_id = auth.uid()
        )
    )
  )
);

-- Washing staff can see bags in their facility batches.
drop policy if exists "Washing staff can view facility bags"
on public.bags;

create policy "Washing staff can view facility bags"
on public.bags
for select
to authenticated
using (
  public.is_washing_staff()
  and id in (
    select bag_id
    from public.laundry_orders
    where washing_batch_id in (
      select id
      from public.washing_batches
      where facility_id = public.current_facility_id()
    )
  )
);

-- Replace broad washing-order access with facility-scoped access.
drop policy if exists "Washing staff can view laundry orders"
on public.laundry_orders;

create policy "Washing staff can view facility laundry orders"
on public.laundry_orders
for select
to authenticated
using (
  public.is_washing_staff()
  and washing_batch_id in (
    select id
    from public.washing_batches
    where facility_id = public.current_facility_id()
  )
);

-- Replace pickup-only delivery access with pickup + batch + ready-at-hostel.
drop policy if exists "Delivery staff can view assigned laundry orders"
on public.laundry_orders;

create policy "Delivery staff can view assigned laundry orders"
on public.laundry_orders
for select
to authenticated
using (
  public.is_delivery_boy()
  and (
    pickup_session_id in (
      select id
      from public.pickup_sessions
      where delivery_boy_id = auth.uid()
    )
    or delivery_batch_id in (
      select id
      from public.delivery_batches
      where delivery_boy_id = auth.uid()
    )
    or (
      status = 'READY_FOR_DELIVERY'
      and student_id in (
        select p.id
        from public.profiles p
        where p.hostel_id in (
          select hostel_id
          from public.pickup_sessions
          where delivery_boy_id = auth.uid()
        )
      )
    )
  )
);

-- Staff can view student names they are serving.
drop policy if exists "Staff can view related student profiles"
on public.profiles;

create policy "Staff can view related student profiles"
on public.profiles
for select
to authenticated
using (
  role = 'STUDENT'
  and (
    (
      public.is_delivery_boy()
      and hostel_id in (
        select hostel_id
        from public.pickup_sessions
        where delivery_boy_id = auth.uid()
      )
    )
    or (
      public.is_washing_staff()
      and id in (
        select student_id
        from public.laundry_orders
        where washing_batch_id in (
          select id
          from public.washing_batches
          where facility_id = public.current_facility_id()
        )
      )
    )
  )
);

-- Washing batches
drop policy if exists "Washing staff can view facility washing batches"
on public.washing_batches;

create policy "Washing staff can view facility washing batches"
on public.washing_batches
for select
to authenticated
using (
  public.is_washing_staff()
  and facility_id = public.current_facility_id()
);

drop policy if exists "Delivery staff can view washing batches for assigned pickups"
on public.washing_batches;

create policy "Delivery staff can view washing batches for assigned pickups"
on public.washing_batches
for select
to authenticated
using (
  public.is_delivery_boy()
  and pickup_session_id in (
    select id
    from public.pickup_sessions
    where delivery_boy_id = auth.uid()
  )
);

drop policy if exists "Admins can view all washing batches"
on public.washing_batches;

create policy "Admins can view all washing batches"
on public.washing_batches
for select
to authenticated
using (public.is_admin());

-- Delivery batches
drop policy if exists "Delivery staff can view assigned delivery batches"
on public.delivery_batches;

create policy "Delivery staff can view assigned delivery batches"
on public.delivery_batches
for select
to authenticated
using (
  public.is_delivery_boy()
  and delivery_boy_id = auth.uid()
);

drop policy if exists "Admins can view all delivery batches"
on public.delivery_batches;

create policy "Admins can view all delivery batches"
on public.delivery_batches
for select
to authenticated
using (public.is_admin());

-- Status history for operational orders
drop policy if exists "Delivery staff can view related status history"
on public.status_history;

create policy "Delivery staff can view related status history"
on public.status_history
for select
to authenticated
using (
  public.is_delivery_boy()
  and laundry_order_id in (
    select id
    from public.laundry_orders
    where pickup_session_id in (
      select id from public.pickup_sessions where delivery_boy_id = auth.uid()
    )
    or delivery_batch_id in (
      select id from public.delivery_batches where delivery_boy_id = auth.uid()
    )
  )
);

drop policy if exists "Washing staff can view related status history"
on public.status_history;

create policy "Washing staff can view related status history"
on public.status_history
for select
to authenticated
using (
  public.is_washing_staff()
  and laundry_order_id in (
    select id
    from public.laundry_orders
    where washing_batch_id in (
      select id
      from public.washing_batches
      where facility_id = public.current_facility_id()
    )
  )
);

-- Admin operational reads
drop policy if exists "Admins can view all complaints"
on public.complaints;

create policy "Admins can view all complaints"
on public.complaints
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view audit logs"
on public.audit_logs;

create policy "Admins can view audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all notifications"
on public.notifications;

create policy "Admins can view all notifications"
on public.notifications
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all facilities"
on public.facilities;

create policy "Admins can view all facilities"
on public.facilities
for select
to authenticated
using (public.is_admin());

create index if not exists washing_batches_facility_id_idx
  on public.washing_batches(facility_id);

create index if not exists washing_batches_status_idx
  on public.washing_batches(status);

create index if not exists delivery_batches_delivery_boy_id_idx
  on public.delivery_batches(delivery_boy_id);

create index if not exists delivery_batches_hostel_id_idx
  on public.delivery_batches(hostel_id);

create index if not exists delivery_batches_status_idx
  on public.delivery_batches(status);

-- Permanent QR identity only. Never encode student PII in qr_token.
insert into public.bags (
  bag_code,
  qr_token,
  owner_id
)
select
  'BAG-AQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  replace(gen_random_uuid()::text, '-', ''),
  p.id
from public.profiles p
where p.role = 'STUDENT'
  and p.is_active = true
  and not exists (
    select 1
    from public.bags b
    where b.owner_id = p.id
  );
