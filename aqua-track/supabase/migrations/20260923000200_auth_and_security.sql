-- ============================================================
-- Aqua Track
-- Authentication & Row Level Security
-- ============================================================

-- ------------------------------------------------------------
-- Helper: get the current user's role
-- ------------------------------------------------------------

create or replace function public.get_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- ------------------------------------------------------------
-- Enable Row Level Security
-- ------------------------------------------------------------

alter table public.hostels enable row level security;
alter table public.facilities enable row level security;
alter table public.profiles enable row level security;
alter table public.bags enable row level security;
alter table public.pickup_sessions enable row level security;
alter table public.washing_batches enable row level security;
alter table public.delivery_batches enable row level security;
alter table public.laundry_orders enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.complaints enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

-- ------------------------------------------------------------
-- HOSTELS
-- ------------------------------------------------------------

create policy "Authenticated users can view active hostels"
on public.hostels
for select
to authenticated
using (
  is_active = true
);

-- ------------------------------------------------------------
-- FACILITIES
-- ------------------------------------------------------------

create policy "Authenticated users can view active facilities"
on public.facilities
for select
to authenticated
using (
  is_active = true
);

-- ------------------------------------------------------------
-- BAGS
-- ------------------------------------------------------------

create policy "Students can view their own bags"
on public.bags
for select
to authenticated
using (
  owner_id = auth.uid()
);

-- ------------------------------------------------------------
-- PICKUP SESSIONS
-- ------------------------------------------------------------

create policy "Students can view pickup sessions for their hostel"
on public.pickup_sessions
for select
to authenticated
using (
  hostel_id = (
    select hostel_id
    from public.profiles
    where id = auth.uid()
  )
);

-- ------------------------------------------------------------
-- LAUNDRY ORDERS
-- ------------------------------------------------------------

create policy "Students can view their own laundry orders"
on public.laundry_orders
for select
to authenticated
using (
  student_id = auth.uid()
);

-- ------------------------------------------------------------
-- STATUS HISTORY
-- ------------------------------------------------------------

create policy "Students can view their own laundry history"
on public.status_history
for select
to authenticated
using (
  laundry_order_id in (
    select id
    from public.laundry_orders
    where student_id = auth.uid()
  )
);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------

create policy "Users can view their own notifications"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy "Users can mark their own notifications as read"
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- ------------------------------------------------------------
-- COMPLAINTS
-- ------------------------------------------------------------

create policy "Users can view their own complaints"
on public.complaints
for select
to authenticated
using (
  reported_by = auth.uid()
);

create policy "Users can create complaints"
on public.complaints
for insert
to authenticated
with check (
  reported_by = auth.uid()
);

-- ------------------------------------------------------------
-- MESSAGES
-- ------------------------------------------------------------

create policy "Users can view their own messages"
on public.messages
for select
to authenticated
using (
  sender_id = auth.uid()
  or receiver_id = auth.uid()
);

create policy "Users can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
);

-- ------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------

-- No client-side access.
-- Audit logs are written by trusted server-side operations.

-- ------------------------------------------------------------
-- Important:
-- Operational INSERT/UPDATE/DELETE policies are intentionally
-- not created here.
--
-- Critical workflow operations such as:
--   - scanning bags
--   - changing laundry status
--   - creating batches
--   - marking deliveries
--   - admin corrections
--
-- will go through trusted server-side business logic.
-- ------------------------------------------------------------