-- Phase 8: Postgres changes for live UI. RLS still applies to Realtime.

do $$
declare
  t text;
begin
  foreach t in array array[
    'laundry_orders',
    'notifications',
    'pickup_sessions',
    'delivery_batches',
    'washing_batches',
    'messages',
    'complaints'
  ]
  loop
    execute format('alter table public.%I replica identity full', t);

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end $$;
