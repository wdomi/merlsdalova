-- Applied to Supabase project Cinclopedia as migration 20261021203348 (ind_observation_ageclass_eyecolor).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table public.ind_observation
  add column ageclass_id bigint references ref.age_categories(id),
  add column eyecolor_id bigint references ref.eye_color_categories(id);
create index idx_ind_observation_ageclass_id on public.ind_observation (ageclass_id);
create index idx_ind_observation_eyecolor_id on public.ind_observation (eyecolor_id);
comment on column public.ind_observation.ageclass_id is 'Age class seen at this observation (ref.age_categories)';
comment on column public.ind_observation.eyecolor_id is 'Eye colour seen at this observation (ref.eye_color_categories)';
