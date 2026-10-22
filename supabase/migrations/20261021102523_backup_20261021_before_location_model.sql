-- Applied to Supabase project Cinclopedia as migration 20261021102523 (backup_20261021_before_location_model).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

create schema if not exists backup_20261021;
revoke all on schema backup_20261021 from public, anon, authenticated;
do $$
declare r record;
begin
  for r in select table_schema, table_name from information_schema.tables
           where table_schema in ('public','ref') and table_type='BASE TABLE' and table_name <> 'spatial_ref_sys'
  loop
    execute format('create table backup_20261021.%I as table %I.%I', r.table_schema || '__' || r.table_name, r.table_schema, r.table_name);
    execute format('alter table backup_20261021.%I enable row level security', r.table_schema || '__' || r.table_name);
  end loop;
end $$;
comment on schema backup_20261021 is 'Snapshot of public + ref tables taken 2026-10-21 before the location-model changes (nest/transect). Read-only backup.';
