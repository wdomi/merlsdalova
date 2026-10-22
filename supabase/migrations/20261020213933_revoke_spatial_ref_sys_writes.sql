-- Applied to Supabase project Cinclopedia as migration 20261020213933 (revoke_spatial_ref_sys_writes).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

revoke insert, update, delete, truncate on table public.spatial_ref_sys from anon, authenticated;
