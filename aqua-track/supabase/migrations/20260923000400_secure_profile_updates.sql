-- ============================================================
-- Aqua Track
-- Secure profile updates
-- Users must never be able to change their own role.
-- ============================================================

drop policy if exists "Users can update their own profile"
on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
  and role = public.get_user_role()
);