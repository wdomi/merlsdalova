-- Applied to Supabase project Cinclopedia as migration 20261021103534 (location_model_functions_triggers_views).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

create or replace function ref.nearest_transect(p_lat double precision, p_lon double precision, max_m double precision default 200)
returns bigint language sql stable set search_path = public, ref as $$
  select t.id
  from ref.transects t
  where p_lat is not null and p_lon is not null
    and st_dwithin(t.geom_lv95, st_transform(st_setsrid(st_makepoint(p_lon, p_lat), 4326), 2056), max_m)
  order by t.geom_lv95 <-> st_transform(st_setsrid(st_makepoint(p_lon, p_lat), 4326), 2056)
  limit 1
$$;

create or replace function public.individual_fill_location() returns trigger language plpgsql set search_path = public, ref as $$
begin
  if new.nest_ringing is not null and new.latitude is null and new.longitude is null then
    select s.latitude, s.longitude into new.latitude, new.longitude from public.site s where s.id = new.nest_ringing;
  end if;
  if new.nest_ringing is null and new.transect_id_ringing is null and new.latitude is not null then
    new.transect_id_ringing := ref.nearest_transect(new.latitude, new.longitude);
  end if;
  return new;
end $$;

create or replace function public.ind_observation_fill_location() returns trigger language plpgsql set search_path = public, ref as $$
begin
  if new.nest_id is not null and new.latitude is null and new.longitude is null then
    select s.latitude, s.longitude into new.latitude, new.longitude from public.site s where s.id = new.nest_id;
  end if;
  if new.nest_id is null and new.transect_id is null and new.latitude is not null then
    new.transect_id := ref.nearest_transect(new.latitude, new.longitude);
  end if;
  return new;
end $$;

create trigger trg_individual_fill_location before insert or update of nest_ringing, transect_id_ringing, latitude, longitude
  on public.individual for each row execute function public.individual_fill_location();
create trigger trg_ind_observation_fill_location before insert or update of nest_id, transect_id, latitude, longitude
  on public.ind_observation for each row execute function public.ind_observation_fill_location();

create or replace view public.v_individual_location with (security_invoker = on) as
select i.id as individual_id, i.name, i.ring_number, i.ringed_date,
  i.nest_ringing as nest_id, s.site_code as nest_code,
  coalesce(s.transect_id, i.transect_id_ringing) as transect_id, t.transect_code,
  r.code as river_code, r.name as river,
  case when i.nest_ringing is not null then 'nest' when i.transect_id_ringing is not null then 'transect'
       when i.latitude is not null then 'coordinates only' else 'none' end as location_source,
  i.latitude, i.longitude,
  round(st_distance(t.geom_lv95, i.geom_lv95)::numeric, 0) as dist_to_transect_m,
  s.display_name as nest_display_name, t.display_name as transect_display_name, s.distance_from_pdg_m
from public.individual i
left join public.site s on s.id = i.nest_ringing
left join ref.transects t on t.id = coalesce(s.transect_id, i.transect_id_ringing)
left join ref.rivers r on r.id = t.river_id;

create or replace view public.v_observation_location with (security_invoker = on) as
select o.id as observation_id, o.individual_id, o.date,
  o.nest_id, s.site_code as nest_code,
  coalesce(s.transect_id, o.transect_id) as transect_id, t.transect_code,
  r.code as river_code, r.name as river,
  case when o.nest_id is not null then 'nest' when o.transect_id is not null then 'transect'
       when o.latitude is not null then 'coordinates only' else 'none' end as location_source,
  o.latitude, o.longitude,
  round(st_distance(t.geom_lv95, o.geom_lv95)::numeric, 0) as dist_to_transect_m,
  s.display_name as nest_display_name, t.display_name as transect_display_name
from public.ind_observation o
left join public.site s on s.id = o.nest_id
left join ref.transects t on t.id = coalesce(s.transect_id, o.transect_id)
left join ref.rivers r on r.id = t.river_id;

revoke all on public.v_individual_location, public.v_observation_location from anon, authenticated;
grant select on public.v_individual_location, public.v_observation_location to service_role;

comment on column public.individual.nest_id_birth_ringing is 'DEPRECATED: use nest_ringing (birth vs adult follows from age_at_ringing_id)';
comment on column public.individual.nest_id_adult_ringing is 'DEPRECATED: use nest_ringing (birth vs adult follows from age_at_ringing_id)';
comment on column public.individual.geom_ringing is 'DEPRECATED: use latitude/longitude (geom_wgs84 is generated from them)';
comment on column public.individual.nest_ringing is 'Nest (site) where the bird was ringed. Fill this OR transect_id_ringing, not both.';
comment on column public.individual.transect_id_ringing is 'Transect where ringed when not at a nest. Auto-computed from coordinates if left empty.';
comment on column public.ind_observation.transect_id is 'Transect of the observation when not at a nest. Auto-computed from coordinates if left empty.';
