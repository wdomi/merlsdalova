-- Applied to Supabase project Cinclopedia as migration 20261022062942 (disable_individual_auto_triggers).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table public.individual disable trigger trg_individual_ringing_observation;
alter table public.individual disable trigger trg_individual_blood_sample;
