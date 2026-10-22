-- Applied to Supabase project Cinclopedia as migration 20261021171732 (individual_ringing_observation_trigger).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

create or replace function public.individual_create_ringing_observation()
returns trigger
language plpgsql
set search_path to 'public', 'ref', 'extensions'
as $$
begin
  if new.ringed_date is null then
    return new;
  end if;
  if new.nest_ringing is null and new.transect_id_ringing is null and new.latitude is null then
    return new;
  end if;
  if exists (select 1 from public.ind_observation o
             where o.individual_id = new.id and o.date = new.ringed_date) then
    return new;
  end if;

  insert into public.ind_observation
    (individual_id, date, time, nest_id, transect_id, latitude, longitude,
     observer, capture_method, action, remark, deleted)
  values
    (new.id, new.ringed_date, new.ringed_time, new.nest_ringing, new.transect_id_ringing,
     new.latitude, new.longitude, new.observer_id, new.capture_method,
     'ringing', 'Beringung', false);

  return new;
end $$;

create trigger trg_individual_ringing_observation
  after insert on public.individual
  for each row execute function public.individual_create_ringing_observation();
