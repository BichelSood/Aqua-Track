-- ============================================================
-- Aqua Track
-- Initial database schema
-- ============================================================

-- -------------------------
-- ENUMS
-- -------------------------

create type public.user_role as enum (
  'STUDENT',
  'DELIVERY_BOY',
  'WASHING_STAFF',
  'ADMIN'
);

create type public.laundry_status as enum (
  'COLLECTED',
  'RECEIVED_AT_FACILITY',
  'UNDER_WASHING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERY_ATTEMPTED',
  'DELIVERED'
);

create type public.pickup_session_status as enum (
  'SCHEDULED',
  'ANNOUNCED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
);

create type public.washing_batch_status as enum (
  'CREATED',
  'RECEIVED',
  'PROCESSING',
  'COMPLETED'
);

create type public.delivery_batch_status as enum (
  'CREATED',
  'READY',
  'OUT_FOR_DELIVERY',
  'COMPLETED'
);

create type public.complaint_type as enum (
  'MISSING_ITEM',
  'DAMAGED_ITEM',
  'WRONG_LAUNDRY',
  'DELIVERY_PROBLEM',
  'OTHER'
);

create type public.complaint_status as enum (
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'CLOSED'
);

create type public.notification_type as enum (
  'PICKUP_AVAILABLE',
  'LAUNDRY_COLLECTED',
  'RECEIVED_AT_FACILITY',
  'WASHING_STARTED',
  'LAUNDRY_READY',
  'OUT_FOR_DELIVERY',
  'LAUNDRY_DELIVERED',
  'COMPLAINT_UPDATE',
  'SYSTEM'
);

-- -------------------------
-- HOSTELS
-- -------------------------

create table public.hostels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- FACILITIES
-- -------------------------

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- PROFILES
-- -------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  phone text,
  role public.user_role not null default 'STUDENT',
  hostel_id uuid references public.hostels(id) on delete restrict,
  room_number text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- BAGS
-- -------------------------

create table public.bags (
  id uuid primary key default gen_random_uuid(),
  bag_code text not null unique,
  qr_token text not null unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- PICKUP SESSIONS
-- -------------------------

create table public.pickup_sessions (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete restrict,
  delivery_boy_id uuid not null references public.profiles(id) on delete restrict,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  status public.pickup_session_status not null default 'SCHEDULED',
  announced_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- WASHING BATCHES
-- -------------------------

create table public.washing_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null unique,
  facility_id uuid not null references public.facilities(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status public.washing_batch_status not null default 'CREATED',
  received_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- DELIVERY BATCHES
-- -------------------------

create table public.delivery_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null unique,
  hostel_id uuid not null references public.hostels(id) on delete restrict,
  delivery_boy_id uuid not null references public.profiles(id) on delete restrict,
  status public.delivery_batch_status not null default 'CREATED',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- LAUNDRY ORDERS
-- -------------------------

create table public.laundry_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  bag_id uuid not null references public.bags(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  pickup_session_id uuid not null references public.pickup_sessions(id) on delete restrict,
  washing_batch_id uuid references public.washing_batches(id) on delete restrict,
  delivery_batch_id uuid references public.delivery_batches(id) on delete restrict,
  status public.laundry_status not null default 'COLLECTED',
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A bag cannot have two active laundry orders at the same time.
create unique index laundry_orders_one_active_per_bag
on public.laundry_orders (bag_id)
where status <> 'DELIVERED';

-- -------------------------
-- STATUS HISTORY
-- -------------------------

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  laundry_order_id uuid not null references public.laundry_orders(id) on delete restrict,
  from_status public.laundry_status,
  to_status public.laundry_status not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  reason text,
  created_at timestamptz not null default now()
);

-- -------------------------
-- NOTIFICATIONS
-- -------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  type public.notification_type not null,
  title text not null,
  message text not null,
  laundry_order_id uuid references public.laundry_orders(id) on delete restrict,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- -------------------------
-- COMPLAINTS
-- -------------------------

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_number text not null unique,
  laundry_order_id uuid not null references public.laundry_orders(id) on delete restrict,
  reported_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete restrict,
  type public.complaint_type not null,
  description text not null,
  status public.complaint_status not null default 'OPEN',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- MESSAGES
-- -------------------------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete restrict,
  receiver_id uuid not null references public.profiles(id) on delete restrict,
  laundry_order_id uuid references public.laundry_orders(id) on delete restrict,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- -------------------------
-- AUDIT LOGS
-- -------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- -------------------------
-- INDEXES
-- -------------------------

create index profiles_role_idx
  on public.profiles(role);

create index profiles_hostel_id_idx
  on public.profiles(hostel_id);

create index profiles_active_idx
  on public.profiles(is_active);

create index bags_owner_id_idx
  on public.bags(owner_id);

create index bags_active_idx
  on public.bags(is_active);

create index pickup_sessions_hostel_id_idx
  on public.pickup_sessions(hostel_id);

create index pickup_sessions_delivery_boy_id_idx
  on public.pickup_sessions(delivery_boy_id);

create index pickup_sessions_scheduled_date_idx
  on public.pickup_sessions(scheduled_date);

create index laundry_orders_student_id_idx
  on public.laundry_orders(student_id);

create index laundry_orders_status_idx
  on public.laundry_orders(status);

create index laundry_orders_pickup_session_id_idx
  on public.laundry_orders(pickup_session_id);

create index laundry_orders_washing_batch_id_idx
  on public.laundry_orders(washing_batch_id);

create index laundry_orders_delivery_batch_id_idx
  on public.laundry_orders(delivery_batch_id);

create index laundry_orders_created_at_idx
  on public.laundry_orders(created_at);

create index status_history_order_id_created_at_idx
  on public.status_history(laundry_order_id, created_at);

create index notifications_user_read_created_idx
  on public.notifications(user_id, is_read, created_at);

create index complaints_status_idx
  on public.complaints(status);

create index complaints_reported_by_idx
  on public.complaints(reported_by);

create index complaints_order_id_idx
  on public.complaints(laundry_order_id);

create index complaints_created_at_idx
  on public.complaints(created_at);

-- -------------------------
-- UPDATED_AT TRIGGER
-- -------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hostels_set_updated_at
before update on public.hostels
for each row execute function public.set_updated_at();

create trigger facilities_set_updated_at
before update on public.facilities
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger bags_set_updated_at
before update on public.bags
for each row execute function public.set_updated_at();

create trigger pickup_sessions_set_updated_at
before update on public.pickup_sessions
for each row execute function public.set_updated_at();

create trigger washing_batches_set_updated_at
before update on public.washing_batches
for each row execute function public.set_updated_at();

create trigger delivery_batches_set_updated_at
before update on public.delivery_batches
for each row execute function public.set_updated_at();

create trigger laundry_orders_set_updated_at
before update on public.laundry_orders
for each row execute function public.set_updated_at();

create trigger complaints_set_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();