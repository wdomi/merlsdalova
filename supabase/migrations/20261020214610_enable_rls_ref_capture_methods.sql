-- Applied to Supabase project Cinclopedia as migration 20261020214610 (enable_rls_ref_capture_methods).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table ref.capture_methods enable row level security;
