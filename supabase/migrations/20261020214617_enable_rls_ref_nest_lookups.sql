-- Applied to Supabase project Cinclopedia as migration 20261020214617 (enable_rls_ref_nest_lookups).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table ref.nest_activities    enable row level security;
alter table ref.nest_architectures enable row level security;
alter table ref.nest_details       enable row level security;
alter table ref.outcomes           enable row level security;
