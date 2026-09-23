-- ============================================================
-- Aqua Track
-- Auth → Profile synchronization
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      'Aqua Track User'
    ),
    new.raw_user_meta_data ->> 'phone',
    'STUDENT'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();