-- Applied to Supabase project Cinclopedia as migration 20261021143502 (individual_ringed_as).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table public.individual add column ringed_as text
  check (ringed_as in ('nestling', 'adult', 'unknown'));
comment on column public.individual.ringed_as is 'Stage when ringed at a nest: nestling (at its birth nest) or adult (parent at the nest). Replaces nest_id_birth_ringing / nest_id_adult_ringing.';

update public.individual set ringed_as = case
    when nest_id_birth_ringing is not null then 'nestling'
    when nest_id_adult_ringing is not null then 'adult'
    else 'unknown' end
where nest_ringing is not null;

-- nestlings ringed at the nest were stored with capture_method 1 (obs); correct is 7 (nest)
update public.individual set capture_method = 7
where nest_id_birth_ringing is not null and capture_method = 1;

alter table public.individual add constraint individual_ringed_as_chk
  check (nest_ringing is null or ringed_as is not null);

create or replace view public.v_individual_location with (security_invoker = on) as
select i.id as individual_id, i.name, i.ring_number, i.ringed_date,
  i.nest_ringing as nest_id, s.site_code as nest_code,
  coalesce(s.transect_id, i.transect_id_ringing) as transect_id, t.transect_code,
  r.code as river_code, r.name as river,
  case when i.nest_ringing is not null then 'nest' when i.transect_id_ringing is not null then 'transect'
       when i.latitude is not null then 'coordinates only' else 'none' end as location_source,
  i.latitude, i.longitude,
  round(st_distance(t.geom_lv95, i.geom_lv95)::numeric, 0) as dist_to_transect_m,
  s.display_name as nest_display_name, t.display_name as transect_display_name, s.distance_from_pdg_m,
  i.ringed_as, cm.code as capture_method
from public.individual i
left join public.site s on s.id = i.nest_ringing
left join ref.transects t on t.id = coalesce(s.transect_id, i.transect_id_ringing)
left join ref.rivers r on r.id = t.river_id
left join ref.capture_methods cm on cm.id = i.capture_method;
