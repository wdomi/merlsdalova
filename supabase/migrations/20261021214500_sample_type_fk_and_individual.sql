-- Applied to Supabase project Cinclopedia as migration 20261021214500 (sample_type_fk_and_individual).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

alter table public.sample
  add constraint fk_sample_type foreign key (type) references ref.sample_types(id);

alter table public.sample
  add column individual_id bigint references public.individual(id);

create index if not exists sample_individual_id_idx on public.sample(individual_id);

insert into ref.sample_types (id, code, remark)
select 10, 'blood', 'blood sample from an individual bird'
where not exists (select 1 from ref.sample_types where code = 'blood');
