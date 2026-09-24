-- ============================================================
-- Aqua Track
-- Add student roll number for laundry identification
-- ============================================================

alter table public.profiles
add column if not exists roll_number text;

create unique index if not exists profiles_roll_number_unique_idx
on public.profiles (roll_number)
where roll_number is not null;

create index if not exists profiles_roll_number_idx
on public.profiles (roll_number)
where roll_number is not null;