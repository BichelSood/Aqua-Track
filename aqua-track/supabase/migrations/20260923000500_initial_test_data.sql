-- ============================================================
-- Aqua Track
-- Initial development data
-- ============================================================

insert into public.hostels (
  name,
  code,
  address
)
values (
  'Aqua Track Test Hostel',
  'TEST-HOSTEL',
  'Development Environment'
)
on conflict (code) do nothing;