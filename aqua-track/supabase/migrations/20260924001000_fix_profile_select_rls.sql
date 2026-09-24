-- Staff profile SELECT used pickup_sessions / laundry_orders under invoker RLS.
-- Those tables' policies read profiles, which re-entered this policy (42P17).
-- Login then saw no profile and treated the student as inactive.

create or replace function public.can_staff_view_student_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles target
    where target.id = p_profile_id
      and target.role = 'STUDENT'
      and (
        (
          public.is_delivery_boy()
          and target.hostel_id in (
            select hostel_id
            from public.pickup_sessions
            where delivery_boy_id = auth.uid()
          )
        )
        or (
          public.is_washing_staff()
          and target.id in (
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
$$;

revoke all on function public.can_staff_view_student_profile(uuid) from public;
grant execute on function public.can_staff_view_student_profile(uuid) to authenticated;

drop policy if exists "Staff can view related student profiles"
on public.profiles;

create policy "Staff can view related student profiles"
on public.profiles
for select
to authenticated
using (
  public.can_staff_view_student_profile(id)
);
