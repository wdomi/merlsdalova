-- Tick individual.blood_sample to create the bird's blood sample in sample.
-- Date, place and collector come from the ringing data; coordinates fall back
-- to the transect midpoint. Created samples are marked "auto - bitte prüfen".

alter table public.individual
  add column blood_sample boolean not null default false;

create or replace function public.individual_create_blood_sample()
returns trigger
language plpgsql
set search_path to 'public', 'ref', 'extensions'
as $$
declare
  v_lat double precision := new.latitude;
  v_lon double precision := new.longitude;
begin
  if not new.blood_sample then
    return new;
  end if;
  if exists (select 1 from public.sample s
             where s.individual_id = new.id and s.type = 100) then
    return new;
  end if;

  if v_lat is null and new.transect_id_ringing is not null then
    select t.mid_lat, t.mid_lon into v_lat, v_lon
    from ref.transects t where t.id = new.transect_id_ringing;
  end if;

  insert into public.sample
    (type, species, individual_id, date_collected, site_id, transect_id,
     latitude, longitude, collected_by, name, display_name, remark)
  values
    (100, 1, new.id, new.ringed_date, new.nest_ringing, new.transect_id_ringing,
     v_lat, v_lon, new.observer_id,
     'blood_' || new.ring_number,
     new.ring_number || ' - ' || coalesce(new.name, '') || ' - blood',
     'auto - bitte prüfen'
       || case when new.latitude is null and v_lat is not null then ' (Koordinaten = Transektmitte)' else '' end);

  return new;
end $$;

create trigger trg_individual_blood_sample
  after insert or update of blood_sample on public.individual
  for each row execute function public.individual_create_blood_sample();

-- Tick the box for birds that already have a blood sample
update public.individual i set blood_sample = true
where exists (select 1 from public.sample s where s.individual_id = i.id and s.type = 100);
