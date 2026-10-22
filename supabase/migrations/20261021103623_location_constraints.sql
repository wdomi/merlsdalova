-- Applied to Supabase project Cinclopedia as migration 20261021103623 (location_constraints).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table public.individual
  add constraint individual_one_place_chk check (num_nonnulls(nest_ringing, transect_id_ringing) <= 1),
  add constraint individual_ringed_has_place_chk check (ringed_date is null or num_nonnulls(nest_ringing, transect_id_ringing) = 1),
  add constraint individual_latlon_pair_chk check ((latitude is null) = (longitude is null));
alter table public.ind_observation
  add constraint ind_observation_one_place_chk check (num_nonnulls(nest_id, transect_id) <= 1),
  add constraint ind_observation_has_location_chk check (num_nonnulls(nest_id, transect_id, latitude) >= 1),
  add constraint ind_observation_latlon_pair_chk check ((latitude is null) = (longitude is null));
