-- Applied to Supabase project Cinclopedia as migration 20261022063059 (ring_bird_function).
-- Exported from supabase_migrations.schema_migrations; do not edit, add a new migration instead.

create or replace function public.ring_bird(p jsonb)
returns jsonb
language plpgsql
set search_path to 'public', 'ref', 'extensions'
as $$
declare
  v_ind      public.individual%rowtype;
  v_obs_id   bigint;
  v_sample_id bigint;
  v_place    text;
  v_lat      double precision;
  v_lon      double precision;
begin
  insert into public.individual
    (ring_number, name, "ring_L_t", "ring_L_b", "ring_R_t", "ring_R_b",
     ringed_date, ringed_time, transect_id_ringing, nest_ringing, latitude, longitude,
     observer_id, capture_method, sex_id, age_at_ringing_id, age_at_ringing, ringed_as,
     weight_gr, beak_mm, tarsus_mm, wing_mm, feather_mm, remark, blood_sample)
  values
    (nullif(trim(p->>'ring_number'), ''), nullif(trim(p->>'name'), ''),
     (p->>'ring_L_t')::bigint, (p->>'ring_L_b')::bigint, (p->>'ring_R_t')::bigint, (p->>'ring_R_b')::bigint,
     (p->>'ringed_date')::date, (p->>'ringed_time')::time,
     (p->>'transect_id_ringing')::bigint, (p->>'nest_ringing')::bigint,
     (p->>'latitude')::double precision, (p->>'longitude')::double precision,
     (p->>'observer_id')::bigint, (p->>'capture_method')::bigint, (p->>'sex_id')::bigint,
     (p->>'age_at_ringing_id')::bigint,
     (select a.code from ref.age_categories a where a.id = (p->>'age_at_ringing_id')::bigint),
     nullif(p->>'ringed_as', ''),
     (p->>'weight_gr')::numeric, (p->>'beak_mm')::numeric, (p->>'tarsus_mm')::numeric,
     (p->>'wing_mm')::numeric, (p->>'feather_mm')::numeric,
     nullif(trim(p->>'remark'), ''),
     coalesce((p->>'add_blood_sample')::boolean, false))
  returning * into v_ind;

  select coalesce(s.display_name, s.name) into v_place from public.site s where s.id = v_ind.nest_ringing;
  if v_place is null then
    select t.name into v_place from ref.transects t where t.id = v_ind.transect_id_ringing;
  end if;
  update public.individual
     set display_name = concat_ws(' - ', v_ind.name, v_ind.ring_number, v_place)
   where id = v_ind.id;

  if coalesce((p->>'add_observation')::boolean, false) then
    insert into public.ind_observation
      (individual_id, date, time, nest_id, transect_id, latitude, longitude,
       observer, capture_method, action, remark, deleted)
    values
      (v_ind.id, v_ind.ringed_date, v_ind.ringed_time, v_ind.nest_ringing, v_ind.transect_id_ringing,
       v_ind.latitude, v_ind.longitude, v_ind.observer_id, v_ind.capture_method,
       'ringing', 'Beringung', false)
    returning id into v_obs_id;
  end if;

  if coalesce((p->>'add_blood_sample')::boolean, false) then
    v_lat := v_ind.latitude;
    v_lon := v_ind.longitude;
    if v_lat is null and v_ind.transect_id_ringing is not null then
      select t.mid_lat, t.mid_lon into v_lat, v_lon from ref.transects t where t.id = v_ind.transect_id_ringing;
    end if;
    insert into public.sample
      (type, species, individual_id, date_collected, site_id, transect_id,
       latitude, longitude, collected_by, name, display_name, remark)
    values
      (100, 1, v_ind.id, v_ind.ringed_date, v_ind.nest_ringing, v_ind.transect_id_ringing,
       v_lat, v_lon, v_ind.observer_id,
       'blood_' || v_ind.ring_number,
       concat_ws(' - ', v_ind.ring_number, v_ind.name, 'blood'),
       'Blutprobe bei Beringung'
         || case when v_ind.latitude is null and v_lat is not null then ' (Koordinaten = Transektmitte)' else '' end)
    returning id into v_sample_id;
  end if;

  return jsonb_build_object('individual_id', v_ind.id, 'observation_id', v_obs_id, 'sample_id', v_sample_id);
end $$;

revoke all on function public.ring_bird(jsonb) from public, anon, authenticated;
grant execute on function public.ring_bird(jsonb) to service_role;
