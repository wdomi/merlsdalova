-- Applied to Supabase project Cinclopedia as migration 20261021161458 (advisor_fixes_search_path_and_rls_auto_enable).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter function public.update_updated_timestamp() set search_path = public, ref;
alter function public.calculate_teq_values() set search_path = public, ref;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
