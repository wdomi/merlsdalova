-- Every ringed bird starts with its ringing observation in ind_observation.
-- Copies date, time, place, observer and capture method from individual.
-- Measurements are not copied (they live on individual).

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

drop trigger if exists trg_individual_ringing_observation on public.individual;
create trigger trg_individual_ringing_observation
  after insert on public.individual
  for each row execute function public.individual_create_ringing_observation();

-- Backfill: ringed birds without an observation on their ringing date.
-- Skips the placeholder ringing date 2000-01-01.
insert into public.ind_observation
  (individual_id, date, time, nest_id, transect_id, latitude, longitude,
   observer, capture_method, action, remark, deleted)
select i.id, i.ringed_date, i.ringed_time, i.nest_ringing, i.transect_id_ringing,
       i.latitude, i.longitude, i.observer_id, i.capture_method,
       'ringing', 'Beringung', false
from public.individual i
where i.ringed_date > '2000-01-01'
  and num_nonnulls(i.nest_ringing, i.transect_id_ringing, i.latitude) >= 1
  and not exists (select 1 from public.ind_observation o
                  where o.individual_id = i.id and o.date = i.ringed_date);
