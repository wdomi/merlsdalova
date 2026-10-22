# Data dictionary

Generated from the live Cinclopedia database with `scripts/data_dictionary.sql`
and `scripts/build_data_dictionary.py`. Do not edit by hand; regenerate after a migration.
Field-book conventions are in [field-book.md](field-book.md).

Legend: **PK** primary key, **→** foreign key, *gen* generated column, *null* nullable.


## Schema `public`


### `public.breeding_attempt`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `year` | integer |  |  |
| `brood` | smallint | *null* |  |
| `nest_id` | bigint | → `public.site` |  |
| `male_id` | bigint | → `public.individual` *null* |  |
| `female_id` | bigint | → `public.individual` *null* |  |
| `clutch_size` | smallint | *null* |  |
| `hatched` | boolean | *null* |  |
| `fledglings_number` | smallint | *null* |  |
| `remark` | text | *null* |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `started_on` | date | *null* |  |
| `concluded_on` | date | *null* |  |
| `failure` | boolean | *null* |  |
| `failure_reason` | text | *null* |  |
| `failure_reason_certainty` | integer | → `ref.certainty` *null* |  |
| `incubation_started` | boolean | *null* |  |
| `hatchlings_number` | smallint | *null* |  |
| `fledged` | boolean | *null* |  |
| `clutch_certainty` | integer | → `ref.certainty` *null* |  |
| `hatch_certainty` | integer | → `ref.certainty` *null* |  |
| `fledge_certainty` | integer | → `ref.certainty` *null* |  |
| `failure_remark` | text | *null* |  |
| `display_name` | character varying | *null* |  |
| `eggs_unhatched_nr` | integer | *null* |  |

### `public.ind_observation`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `individual_id` | bigint | → `public.individual` *null* |  |
| `date` | date |  |  |
| `transect_id` | bigint | → `ref.transects` *null* | Transect of the observation when not at a nest. Auto-computed from coordinates if left empty. |
| `nest_id` | bigint | → `public.site` *null* |  |
| `latitude` | double precision | *null* |  |
| `longitude` | double precision | *null* |  |
| `behavior` | character varying(100) | *null* |  |
| `remark` | text | *null* |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `action` | text | *null* |  |
| `deleted` | boolean | *null* |  |
| `time` | time without time zone | *null* |  |
| `observer` | bigint | → `ref.persons` *null* |  |
| `capture_method` | bigint | → `ref.capture_methods` *null* |  |
| `measure_weight_g` | numeric | *null* |  |
| `measure_beak_mm` | numeric | *null* |  |
| `measure_tarsus_mm` | numeric | *null* |  |
| `measure_wing_mm` | numeric | *null* |  |
| `measure_feather_mm` | numeric | *null* |  |
| `lv95_x` | double precision | *gen* *null* |  |
| `lv95_y` | double precision | *gen* *null* |  |
| `geom_wgs84` | geometry(Point,4326) | *gen* *null* |  |
| `geom_lv95` | geometry(Point,2056) | *gen* *null* |  |
| `ageclass_id` | bigint | → `ref.age_categories` *null* | Age class seen at this observation (ref.age_categories) |
| `eyecolor_id` | bigint | → `ref.eye_color_categories` *null* | Eye colour seen at this observation (ref.eye_color_categories) |

### `public.individual`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `ring_number` | character varying | *null* |  |
| `ring_R_t` | bigint | → `ref.rings` *null* |  |
| `ring_R_b` | bigint | → `ref.rings` *null* |  |
| `ring_L_t` | bigint | → `ref.rings` *null* |  |
| `ring_L_b` | bigint | → `ref.rings` *null* |  |
| `sex_id` | bigint | → `ref.sex_categories` *null* |  |
| `age_at_ringing` | text | *null* |  |
| `father_id` | bigint | → `public.individual` *null* |  |
| `mother_id` | bigint | → `public.individual` *null* |  |
| `transect_id_ringing` | bigint | → `ref.transects` *null* | Transect where ringed when not at a nest. Auto-computed from coordinates if left empty. |
| `observer_id` | bigint | → `ref.persons` *null* |  |
| `beak_mm` | numeric | *null* |  |
| `tarsus_mm` | numeric | *null* |  |
| `wing_mm` | numeric | *null* |  |
| `feather_mm` | numeric | *null* |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `remark` | character varying | *null* |  |
| `name` | text | *null* |  |
| `breeding_attempt_id_birth` | bigint | → `public.breeding_attempt` *null* |  |
| `weight_gr` | numeric | *null* |  |
| `ringed_date` | date | *null* |  |
| `ringed_time` | time without time zone | *null* |  |
| `display_name` | text | *null* |  |
| `age_at_ringing_id` | bigint | → `ref.age_categories` *null* |  |
| `eye_colour` | text | *null* |  |
| `eye_colour_id` | bigint | → `ref.eye_color_categories` *null* |  |
| `capture_method` | bigint | → `ref.capture_methods` *null* |  |
| `nest_ringing` | bigint | → `public.site` *null* | Nest (site) where the bird was ringed. Fill this OR transect_id_ringing, not both. |
| `death_report` | date | *null* |  |
| `death_remark` | character varying | *null* |  |
| `death_observer` | character varying | *null* |  |
| `temp` | character varying | *null* |  |
| `latitude` | double precision | *null* |  |
| `longitude` | double precision | *null* |  |
| `rings_key` | text | *gen* *null* |  |
| `ringed_as` | text | *null* | Stage when ringed at a nest: nestling (at its birth nest) or adult (parent at the nest). Replaces nest_id_birth_ringing / nest_id_adult_ringing. |
| `geom_wgs84` | geometry(Point,4326) | *gen* *null* |  |
| `geom_lv95` | geometry(Point,2056) | *gen* *null* |  |
| `blood_sample` | boolean |  |  |

### `public.nest_observation`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `date` | date |  |  |
| `eggs_collected` | smallint | *null* |  |
| `remark` | text | *null* |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `breeding_attempt_id` | bigint | → `public.breeding_attempt` *null* |  |
| `observer` | bigint | → `ref.persons` *null* |  |
| `observers_additional` | text | *null* |  |
| `wet_inside_bool` | boolean | *null* |  |
| `clutch` | bigint | → `ref.outcomes` *null* |  |
| `nr_observed_eggs` | integer | *null* |  |
| `eggs_incubated` | boolean | *null* |  |
| `hatched` | bigint | → `ref.outcomes` *null* |  |
| `hatched_nr` | integer | *null* |  |
| `fledged` | bigint | → `ref.outcomes` *null* |  |
| `fledged_nr` | integer | *null* |  |
| `architecture` | bigint | → `ref.nest_architectures` *null* |  |
| `activity` | bigint | → `ref.nest_activities` *null* |  |
| `detail` | bigint | → `ref.nest_details` *null* |  |

### `public.pcb`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `sample_id` | bigint | → `public.sample` |  |
| `created` | timestamp with time zone | *null* |  |
| `updated` | timestamp with time zone |  |  |
| `name` | character varying | *null* |  |
| `empa_id` | character varying | *null* |  |
| `fresh_weight_gr` | double precision | *null* |  |
| `extracted_fat_gr` | double precision | *null* |  |
| `fat_to_sample_ratio` | double precision | *null* |  |
| `remark` | text | *null* |  |
| `sum_6_ipcb_fat` | double precision | *null* |  |
| `sum_6_ipcb_pcb118_fat` | double precision | *null* |  |
| `ipcb28_ng_g_fat` | double precision | *null* |  |
| `ipcb52_ng_g_fat` | double precision | *null* |  |
| `ipcb101_ng_g_fat` | double precision | *null* |  |
| `ipcb138_ng_g_fat` | double precision | *null* |  |
| `ipcb153_ng_g_fat` | double precision | *null* |  |
| `ipcb180_ng_g_fat` | double precision | *null* |  |
| `dlpcb77_ng_g_fat` | double precision | *null* |  |
| `dlpcb81_ng_g_fat` | double precision | *null* |  |
| `dlpcb105_ng_g_fat` | double precision | *null* |  |
| `dlpcb114_ng_g_fat` | double precision | *null* |  |
| `dlpcb118_ng_g_fat` | double precision | *null* |  |
| `dlpcb123_ng_g_fat` | double precision | *null* |  |
| `dlpcb126_ng_g_fat` | double precision | *null* |  |
| `dlpcb156_ng_g_fat` | double precision | *null* |  |
| `dlpcb157_ng_g_fat` | double precision | *null* |  |
| `dlpcb167_ng_g_fat` | double precision | *null* |  |
| `dlpcb169_ng_g_fat` | double precision | *null* |  |
| `dlpcb189_ng_g_fat` | double precision | *null* |  |
| `ipcb28_pg_g_fresh` | double precision | *null* |  |
| `ipcb52_pg_g_fresh` | double precision | *null* |  |
| `ipcb101_pg_g_fresh` | double precision | *null* |  |
| `ipcb138_pg_g_fresh` | double precision | *null* |  |
| `ipcb153_pg_g_fresh` | double precision | *null* |  |
| `ipcb180_pg_g_fresh` | double precision | *null* |  |
| `dlpcb77_pg_g_fresh` | double precision | *null* |  |
| `dlpcb81_pg_g_fresh` | double precision | *null* |  |
| `dlpcb105_pg_g_fresh` | double precision | *null* |  |
| `dlpcb114_pg_g_fresh` | double precision | *null* |  |
| `dlpcb118_pg_g_fresh` | double precision | *null* |  |
| `dlpcb123_pg_g_fresh` | double precision | *null* |  |
| `dlpcb126_pg_g_fresh` | double precision | *null* |  |
| `dlpcb156_pg_g_fresh` | double precision | *null* |  |
| `dlpcb157_pg_g_fresh` | double precision | *null* |  |
| `dlpcb167_pg_g_fresh` | double precision | *null* |  |
| `dlpcb169_pg_g_fresh` | double precision | *null* |  |
| `dlpcb189_pg_g_fresh` | double precision | *null* |  |
| `date_pcb_analysis_empa` | date | *null* |  |
| `factor_over_chicken_egg_40` | double precision | *null* |  |
| `sum_6_ipcb_fresh` | real | *null* |  |
| `sum_6_ipcb_pcb118_fresh` | real | *null* |  |
| `methode_type_empa` | character varying | *null* |  |
| `teq_fresh_weight_pg_g` | numeric(10,6) | *null* |  |
| `teq_fat_weight_ng_g` | numeric(10,6) | *null* |  |

### `public.sample`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `type` | bigint | → `ref.sample_types` *null* |  |
| `site_id` | bigint | *null* |  |
| `transect_id` | bigint | *null* |  |
| `latitude` | double precision | *null* |  |
| `longitude` | double precision | *null* |  |
| `date_collected` | date | *null* |  |
| `storage_place` | character varying | *null* |  |
| `lab_id` | character varying | *null* |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `nest_observation_id` | bigint | → `public.nest_observation` *null* |  |
| `name` | text | *null* |  |
| `weight_gr` | double precision | *null* |  |
| `length_mm` | double precision | *null* |  |
| `width_mm` | double precision | *null* |  |
| `candling` | text | *null* |  |
| `candling_img` | bytea | *null* |  |
| `collected_by` | bigint | *null* |  |
| `contact` | text | *null* |  |
| `remark` | text | *null* |  |
| `display_name` | text | *null* |  |
| `species` | bigint | → `ref.species` *null* |  |
| `river` | character varying | *null* |  |
| `shortname` | character varying | *null* |  |
| `column24` | character varying(50) | *null* |  |
| `column25` | character varying(50) | *null* |  |
| `geom` | geometry(Point,4326) | *gen* *null* |  |
| `lv95_x` | double precision | *gen* *null* |  |
| `lv95_y` | double precision | *gen* *null* |  |
| `individual_id` | bigint | → `public.individual` *null* |  |

### `public.site`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `transect_id` | bigint | → `ref.transects` *null* |  |
| `name` | character varying | *null* |  |
| `latitude` | double precision | *null* |  |
| `longitude` | double precision | *null* |  |
| `river_side_downwards` | text | *null* |  |
| `remark` | text | *null* |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `position` | smallint | *null* |  |
| `distance_from_spring_m` | integer | *null* |  |
| `distance_from_pdg_m` | integer |  | If not on river Spöl set as zero |
| `aspect` | character varying | *null* |  |
| `height_m` | numeric | *null* |  |
| `ladder` | text | *null* |  |
| `date_first` | date | *null* |  |
| `photo_url` | text | *null* |  |
| `type` | bigint | → `ref.site_types` *null* |  |
| `site_code` | text | *null* |  |
| `display_name` | text | *null* |  |
| `calc_dist_from_spring` | double precision | *null* |  |
| `lv95_x` | double precision | *gen* *null* |  |
| `lv95_y` | double precision | *gen* *null* |  |
| `geom_wgs84` | geometry(Point,4326) | *gen* *null* |  |
| `geom_lv95` | geometry(Point,2056) | *gen* *null* |  |

### `public.temp`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `created_at` | timestamp with time zone |  |  |

### `public.v_bird_obs`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `date` | date | *null* |  |
| `sighted_maybe` | text | *null* |  |
| `capture_method` | bigint | *null* |  |
| `code` | text | *null* |  |
| `remark` | text | *null* |  |
| `location_obs` | text | *null* |  |
| `individual_id` | bigint | *null* |  |
| `name` | text | *null* |  |

### `public.v_breeding_attempt_display`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | *null* |  |
| `year` | integer | *null* |  |
| `brood` | smallint | *null* |  |
| `nest_id` | bigint | *null* |  |
| `male_id` | bigint | *null* |  |
| `female_id` | bigint | *null* |  |
| `clutch_size` | smallint | *null* |  |
| `hatched` | boolean | *null* |  |
| `fledglings_number` | smallint | *null* |  |
| `remark` | text | *null* |  |
| `created` | timestamp with time zone | *null* |  |
| `updated` | timestamp with time zone | *null* |  |
| `started_on` | date | *null* |  |
| `concluded_on` | date | *null* |  |
| `failure` | boolean | *null* |  |
| `failure_reason` | text | *null* |  |
| `failure_reason_certainty` | integer | *null* |  |
| `incubation_started` | boolean | *null* |  |
| `hatchlings_number` | smallint | *null* |  |
| `fledged` | boolean | *null* |  |
| `clutch_certainty` | integer | *null* |  |
| `hatch_certainty` | integer | *null* |  |
| `fledge_certainty` | integer | *null* |  |
| `failure_remark` | text | *null* |  |
| `display` | text | *null* |  |

### `public.v_dipper_samples_overview`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `sample_id` | bigint | *null* |  |
| `sample_type` | character varying | *null* |  |
| `transect` | character varying | *null* |  |
| `collection_year` | numeric | *null* |  |
| `site_name` | character varying | *null* |  |
| `site_code` | text | *null* |  |
| `sample_display` | text | *null* |  |
| `date_collected` | date | *null* |  |
| `weight_gr` | double precision | *null* |  |
| `length_mm` | double precision | *null* |  |
| `width_mm` | double precision | *null* |  |

### `public.v_individual_location`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `individual_id` | bigint | *null* |  |
| `name` | text | *null* |  |
| `ring_number` | character varying | *null* |  |
| `ringed_date` | date | *null* |  |
| `nest_id` | bigint | *null* |  |
| `nest_code` | text | *null* |  |
| `transect_id` | bigint | *null* |  |
| `transect_code` | character varying | *null* |  |
| `river_code` | text | *null* |  |
| `river` | character varying | *null* |  |
| `location_source` | text | *null* |  |
| `latitude` | double precision | *null* |  |
| `longitude` | double precision | *null* |  |
| `dist_to_transect_m` | numeric | *null* |  |
| `nest_display_name` | text | *null* |  |
| `transect_display_name` | text | *null* |  |
| `distance_from_pdg_m` | integer | *null* |  |
| `ringed_as` | text | *null* |  |
| `capture_method` | text | *null* |  |
| `transect_name` | character varying | *null* |  |

### `public.v_nests`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `type` | bigint | *null* |  |
| `river` | character varying | *null* |  |
| `transect_code` | character varying | *null* |  |
| `transect` | character varying | *null* |  |
| `nest` | text | *null* |  |
| `order` | smallint | *null* |  |
| `distance_punt_dal_gall_m` | integer | *null* |  |
| `ladder` | text | *null* |  |
| `location` | text | *null* |  |

### `public.v_observation_location`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `observation_id` | bigint | *null* |  |
| `individual_id` | bigint | *null* |  |
| `date` | date | *null* |  |
| `nest_id` | bigint | *null* |  |
| `nest_code` | text | *null* |  |
| `transect_id` | bigint | *null* |  |
| `transect_code` | character varying | *null* |  |
| `river_code` | text | *null* |  |
| `river` | character varying | *null* |  |
| `location_source` | text | *null* |  |
| `latitude` | double precision | *null* |  |
| `longitude` | double precision | *null* |  |
| `dist_to_transect_m` | numeric | *null* |  |
| `nest_display_name` | text | *null* |  |
| `transect_display_name` | text | *null* |  |

### `public.v_overview_nest_observations`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `nest_obs_id` | bigint | *null* |  |
| `river` | text | *null* |  |
| `transect` | integer | *null* |  |
| `river_section` | text | *null* |  |
| `breeding_attempt` | text | *null* |  |
| `obs_date` | date | *null* |  |
| `nest_architecture` | character varying | *null* |  |
| `nest_status` | character varying | *null* |  |
| `detail` | character varying | *null* |  |
| `wet` | boolean | *null* |  |
| `clutch` | character varying | *null* |  |
| `nr_observed_eggs` | integer | *null* |  |
| `eggs_incubated` | boolean | *null* |  |
| `eggs_collected` | smallint | *null* |  |
| `sample_id` | bigint | *null* |  |
| `sample_name` | text | *null* |  |
| `hatched` | character varying | *null* |  |
| `fledged` | character varying | *null* |  |

### `public.v_pcb`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | *null* |  |
| `date_pcb_analysis_empa` | date | *null* |  |
| `sample_type` | character varying | *null* |  |
| `species` | character varying | *null* |  |
| `sample_id` | bigint | *null* |  |
| `name` | character varying | *null* |  |
| `empa_id` | character varying | *null* |  |
| `fresh_weight_gr` | double precision | *null* |  |
| `extracted_fat_gr` | double precision | *null* |  |
| `fat_to_sample_ratio` | double precision | *null* |  |
| `ipcb28_ng_g_fat` | double precision | *null* |  |
| `ipcb52_ng_g_fat` | double precision | *null* |  |
| `ipcb101_ng_g_fat` | double precision | *null* |  |
| `ipcb138_ng_g_fat` | double precision | *null* |  |
| `ipcb153_ng_g_fat` | double precision | *null* |  |
| `ipcb180_ng_g_fat` | double precision | *null* |  |
| `dlpcb77_ng_g_fat` | double precision | *null* |  |
| `dlpcb81_ng_g_fat` | double precision | *null* |  |
| `dlpcb105_ng_g_fat` | double precision | *null* |  |
| `dlpcb114_ng_g_fat` | double precision | *null* |  |
| `dlpcb118_ng_g_fat` | double precision | *null* |  |
| `dlpcb123_ng_g_fat` | double precision | *null* |  |
| `dlpcb126_ng_g_fat` | double precision | *null* |  |
| `dlpcb156_ng_g_fat` | double precision | *null* |  |
| `dlpcb157_ng_g_fat` | double precision | *null* |  |
| `dlpcb167_ng_g_fat` | double precision | *null* |  |
| `dlpcb169_ng_g_fat` | double precision | *null* |  |
| `dlpcb189_ng_g_fat` | double precision | *null* |  |
| `ipcb28_pg_g_fresh` | double precision | *null* |  |
| `ipcb52_pg_g_fresh` | double precision | *null* |  |
| `ipcb101_pg_g_fresh` | double precision | *null* |  |
| `ipcb138_pg_g_fresh` | double precision | *null* |  |
| `ipcb153_pg_g_fresh` | double precision | *null* |  |
| `ipcb180_pg_g_fresh` | double precision | *null* |  |
| `dlpcb77_pg_g_fresh` | double precision | *null* |  |
| `dlpcb81_pg_g_fresh` | double precision | *null* |  |
| `dlpcb105_pg_g_fresh` | double precision | *null* |  |
| `dlpcb114_pg_g_fresh` | double precision | *null* |  |
| `dlpcb118_pg_g_fresh` | double precision | *null* |  |
| `dlpcb123_pg_g_fresh` | double precision | *null* |  |
| `dlpcb126_pg_g_fresh` | double precision | *null* |  |
| `dlpcb156_pg_g_fresh` | double precision | *null* |  |
| `dlpcb157_pg_g_fresh` | double precision | *null* |  |
| `dlpcb167_pg_g_fresh` | double precision | *null* |  |
| `dlpcb169_pg_g_fresh` | double precision | *null* |  |
| `dlpcb189_pg_g_fresh` | double precision | *null* |  |
| `sum_6_ipcb_fat` | double precision | *null* |  |
| `sum_6_ipcb_pcb118_fat` | double precision | *null* |  |
| `factor_over_chicken_egg_40` | double precision | *null* |  |
| `remark` | text | *null* |  |
| `created` | timestamp with time zone | *null* |  |
| `updated` | timestamp with time zone | *null* |  |

### `public.v_summary_pcb_samples_sites`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `sample_id` | bigint | *null* |  |
| `year` | integer | *null* |  |
| `river` | character varying | *null* |  |
| `species` | text | *null* |  |
| `sample_type` | character varying | *null* |  |
| `date_collected` | date | *null* |  |
| `shortname` | character varying | *null* |  |
| `display_name` | text | *null* |  |
| `egg_weight_gr` | double precision | *null* |  |
| `egg_length_mm` | double precision | *null* |  |
| `egg_width_mm` | double precision | *null* |  |
| `date_pcb_analysis_empa` | date | *null* |  |
| `sum_6_ipcb_fat` | double precision | *null* |  |
| `factor_over_chicken_egg_40` | double precision | *null* |  |
| `teq_fat_weight_ng_g` | numeric(10,6) | *null* |  |
| `teq_fresh_weight_pg_g` | numeric(10,6) | *null* |  |
| `location_id` | bigint | *null* |  |
| `location_type_code` | bigint | *null* |  |
| `location_type` | character varying | *null* |  |
| `location_name` | character varying | *null* |  |
| `location_code` | text | *null* |  |
| `distance_from_pdg_m` | integer | *null* |  |
| `geom_wgs84` | geometry(Point,4326) | *null* |  |
| `ipcb28_ng_g_fat` | double precision | *null* |  |
| `ipcb52_ng_g_fat` | double precision | *null* |  |
| `ipcb101_ng_g_fat` | double precision | *null* |  |
| `ipcb138_ng_g_fat` | double precision | *null* |  |
| `ipcb153_ng_g_fat` | double precision | *null* |  |
| `ipcb180_ng_g_fat` | double precision | *null* |  |
| `dlpcb77_ng_g_fat` | double precision | *null* |  |
| `dlpcb81_ng_g_fat` | double precision | *null* |  |
| `dlpcb105_ng_g_fat` | double precision | *null* |  |
| `dlpcb114_ng_g_fat` | double precision | *null* |  |
| `dlpcb118_ng_g_fat` | double precision | *null* |  |
| `dlpcb123_ng_g_fat` | double precision | *null* |  |
| `dlpcb126_ng_g_fat` | double precision | *null* |  |
| `dlpcb156_ng_g_fat` | double precision | *null* |  |
| `dlpcb157_ng_g_fat` | double precision | *null* |  |
| `dlpcb167_ng_g_fat` | double precision | *null* |  |
| `dlpcb169_ng_g_fat` | double precision | *null* |  |
| `dlpcb189_ng_g_fat` | double precision | *null* |  |

## Schema `ref`


### `ref.age_categories`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |
| `name` | character varying | *null* |  |
| `timing` | text | *null* |  |

### `ref.capture_methods`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | text | *null* |  |
| `remark` | text | *null* |  |

### `ref.certainty`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying(25) |  |  |
| `remark` | text | *null* |  |

### `ref.eye_color_categories`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying | *null* |  |
| `remark` | text | *null* |  |

### `ref.failure_causes`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying(25) | *null* |  |
| `remark` | text | *null* |  |

### `ref.free_ring_combinations`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | *null* |  |
| `rings_key` | text | *null* |  |
| `lt_lb_rt_rb` | text | *null* |  |
| `used` | boolean | *null* |  |

### `ref.nest_activities`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |

### `ref.nest_architectures`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |

### `ref.nest_details`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |

### `ref.outcomes`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |

### `ref.persons`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying | *null* |  |
| `surname` | text | *null* |  |
| `name` | text | *null* |  |
| `function` | character varying | *null* |  |
| `affiliation` | text | *null* |  |
| `phone` | text | *null* |  |
| `email` | text | *null* |  |
| `remark` | text | *null* |  |
| `creation` | timestamp with time zone |  |  |

### `ref.ring_combinations`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `ring_l_t` | bigint |  |  |
| `ring_l_b` | bigint |  |  |
| `ring_r_t` | bigint |  |  |
| `ring_r_b` | bigint |  |  |
| `rings_key` | text | *gen* *null* |  |

### `ref.ring_combinations_status`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | *null* |  |
| `ring_l_t` | bigint | *null* |  |
| `ring_l_b` | bigint | *null* |  |
| `ring_r_t` | bigint | *null* |  |
| `ring_r_b` | bigint | *null* |  |
| `rings_key` | text | *null* |  |
| `color_combi_short` | text | *null* |  |
| `color_combination` | text | *null* |  |
| `individual_id` | bigint | *null* |  |
| `individual_name` | text | *null* |  |
| `used` | boolean | *null* |  |

### `ref.rings`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying | *null* |  |
| `color` | character varying | *null* |  |
| `remark` | text | *null* |  |
| `creation` | timestamp with time zone |  |  |

### `ref.rivers`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `name` | character varying |  |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `code` | text | *null* |  |
| `geom_lv95` | geometry(MultiLineString,2056) | *null* |  |
| `geom_wgs84` | geometry(MultiLineString,4326) | *null* |  |

### `ref.rivers_geom`

River-Transect lines in WGS84 and LV95

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `remark` | text | *null* |  |
| `creation` | timestamp with time zone |  |  |
| `name` | character varying | *null* |  |
| `geom_wgs84` | geometry(LineString,4326) | *null* |  |
| `geom_lv95` | geometry(LineString,2056) | *null* |  |

### `ref.sample_types`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |

### `ref.sex_categories`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |

### `ref.site_types`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying |  |  |
| `remark` | text | *null* |  |

### `ref.species`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `code` | character varying | *null* |  |
| `name_lat` | text | *null* |  |
| `name_de` | text | *null* |  |
| `name_en` | text | *null* |  |

### `ref.tef_values`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `congener_code` | character varying(20) | **PK** |  |
| `tef_value` | numeric(6,5) |  |  |
| `unit_type` | character varying(20) |  |  |
| `who_reference` | character varying(20) |  |  |

### `ref.transects`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | **PK** |  |
| `river_id` | bigint | → `ref.rivers` |  |
| `name` | character varying |  |  |
| `start_lat` | double precision | *null* |  |
| `start_lon` | double precision | *null* |  |
| `end_lat` | double precision | *null* |  |
| `end_lon` | double precision | *null* |  |
| `mid_lat` | double precision | *null* |  |
| `mid_lon` | double precision | *null* |  |
| `created` | timestamp with time zone |  |  |
| `updated` | timestamp with time zone |  |  |
| `transect_code` | character varying | *null* |  |
| `display_name` | text | *null* |  |
| `range` | text | *null* |  |
| `transect_order` | integer | *null* |  |
| `remark` | text | *null* | Free-text note, e.g. meaning of the code prefix |
| `canton` | text | *null* | Swiss canton code (GR, TI, ...) |
| `geom_wgs84` | geometry(LineString,4326) | *null* |  |
| `geom_lv95` | geometry(LineString,2056) | *null* |  |
| `distance_from_pdg_m` | integer | *null* | Distance from Punt dal Gall (m) at the transect midpoint, along the river. Empty if not on the Spöl system. |

### `ref.transects_wgs84_view`

| Column | Type | Notes | Comment |
|---|---|---|---|
| `id` | bigint | *null* |  |
| `river_id` | bigint | *null* |  |
| `name` | character varying | *null* |  |
| `transect_code` | character varying | *null* |  |
| `display_name` | text | *null* |  |
| `geom` | geometry(LineString,4326) | *null* |  |
