-- sample.type must be a known ref.sample_types id
alter table public.sample
  add constraint fk_sample_type foreign key (type) references ref.sample_types(id);

-- Link a sample (e.g. blood) to the bird it was taken from
alter table public.sample
  add column individual_id bigint references public.individual(id);

create index if not exists sample_individual_id_idx on public.sample(individual_id);
