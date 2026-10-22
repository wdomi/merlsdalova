-- Returns the schema of the public and ref tables as JSON (columns, types, keys, comments).
-- Used to regenerate docs/data-dictionary.md with scripts/build_data_dictionary.py.
select json_agg(t order by t.schema, t.table)::text as dictionary
from (
  select n.nspname as schema, c.relname as "table",
         obj_description(c.oid, 'pg_class') as comment,
         (select json_agg(json_build_object(
                    'column', a.attname,
                    'type', format_type(a.atttypid, a.atttypmod),
                    'nullable', not a.attnotnull,
                    'generated', a.attgenerated <> '',
                    'comment', col_description(c.oid, a.attnum),
                    'references', (select ft.relnamespace::regnamespace || '.' || ft.relname
                                   from pg_constraint fk join pg_class ft on ft.oid = fk.confrelid
                                   where fk.conrelid = c.oid and fk.contype = 'f' and fk.conkey = array[a.attnum]
                                   limit 1),
                    'pk', exists (select 1 from pg_constraint pk where pk.conrelid = c.oid and pk.contype = 'p' and a.attnum = any(pk.conkey))
                  ) order by a.attnum)
          from pg_attribute a
          where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'ref') and c.relkind in ('r', 'v') and c.relname <> 'spatial_ref_sys'
) t;
