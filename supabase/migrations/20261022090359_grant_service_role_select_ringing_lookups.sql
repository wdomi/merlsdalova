-- Applied to Supabase project Cinclopedia as migration 20261022090359 (grant_service_role_select_ringing_lookups).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

grant select on ref.rings, ref.persons, ref.age_categories, ref.sex_categories, ref.sample_types to service_role;
