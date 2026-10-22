-- Applied to Supabase project Cinclopedia as migration 20261020214624 (enable_rls_ref_rings_rivers).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table ref.ring_combinations enable row level security;
alter table ref.rivers_geom       enable row level security;
