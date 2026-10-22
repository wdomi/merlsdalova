# Changelog

Every change to the app or the database, newest first. Schema changes link to their file in
`supabase/migrations/`; one-off data changes (imports, backfills, corrections) are described here,
because they are not migrations.

## 2026-10-22

- **Ringing form:** prominent green result after saving, "already saved" message instead of saving twice,
  and a "Neue Seite erfassen" button.
- **Schema:** the server (service_role) may read the lookup tables the ringing form needs
  (`ref.rings`, `persons`, `age_categories`, `sex_categories`, `sample_types`).
  [migration](supabase/migrations/20261022090359_grant_service_role_select_ringing_lookups.sql)
- **Ringing form:** the team code check ignores spaces or line breaks around the code.
- **Ringing form** `ringing.html` + `api/ringing` for entering newly ringed birds (up to three per page),
  protected by the shared team code `RINGING_TEAM_CODE`. See [docs/ringing-form.md](docs/ringing-form.md).
- **Schema:** `public.ring_bird(jsonb)` saves a bird plus its optional ringing observation and blood sample
  in one transaction; callable by the server only.
  [migration](supabase/migrations/20261022063059_ring_bird_function.sql)
- **Schema:** disabled the triggers `trg_individual_ringing_observation` and `trg_individual_blood_sample`;
  the form decides now. [migration](supabase/migrations/20261022062942_disable_individual_auto_triggers.sql)
- **Schema:** `individual.blood_sample` tick box and trigger creating the blood sample.
  [migration](supabase/migrations/20261022060716_individual_blood_sample_flag.sql)
- **Data:** ticked `individual.blood_sample` for the 61 birds that have a blood sample.
- **Docs:** exported all applied migrations to `supabase/migrations/`, added data dictionary,
  field-book conventions and this changelog.

## 2026-10-21

- **Data:** added one blood sample (`sample`, type 100, ids 26068–26128) for each of the 61 ringed birds,
  using the ringing date, place and ringer. Birds without coordinates use the transect midpoint
  (noted in `remark`); S228.040 has no collection date (placeholder ringing date 2000-01-01).
- **Schema:** `sample.type` → `ref.sample_types`, new `sample.individual_id` → `individual`.
  [migration](supabase/migrations/20261021214500_sample_type_fk_and_individual.sql)
- **Schema:** `ind_observation.ageclass_id`, `ind_observation.eyecolor_id`.
  [migration](supabase/migrations/20261021203348_ind_observation_ageclass_eyecolor.sql)
- **Data:** backfilled the ringing observation (action `ringing`) for 56 birds that had none on their
  ringing date (`ind_observation` ids 1748–1803).
- **Data (field book 17.10 / 20.10):** S228.069 sex set to M (uncertain, see remark);
  S228.070 age set to adult.
- **Schema:** trigger creating the ringing observation for new birds.
  [migration](supabase/migrations/20261021171732_individual_ringing_observation_trigger.sql)
- Earlier migrations of 2026-10-20/21 (RLS, location model, constraints, `ringed_as`): see `supabase/migrations/`.
