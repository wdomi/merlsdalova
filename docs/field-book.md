# Field-book conventions

How a ringing page in the field book maps to the database. This is the reference
for anyone typing data in, and the instructions for Claude when reading a photo of a page.

## Page layout

- One page holds **up to three birds**, usually one. Each bird is a column with its own
  date, time, place and observer. The first column of a page is sometimes a recapture.
- A bird is **new** if the page gives an Alu ring number that is not yet in `individual`.
  Otherwise it is a **recapture** of an existing bird, identified by its colour rings.

## Per bird, top to bottom

| Field book | Database | Notes |
|---|---|---|
| Date (`20.10.26`, `20.10.2026`) | `ringed_date` / `ind_observation.date` | Day first (Swiss format). |
| Time (`16:00`) | `ringed_time` / `ind_observation.time` | |
| Place (`Vordere Schlucht`) | `transect_id_ringing` / `transect_id` | Match to `ref.transects.name`; local place names may need the transect confirmed. |
| Observer(s) (`Iris`, `Iris + Robin`) | `observer_id` / `observer` | `ref.persons`. Only one person fits; take the first. |
| Weight `87 − 19 = 68` | `weight_gr` | Gross minus bag (tare). The result is the bird's net weight. |
| `Alu 228069` | `ring_number` = `S228.069` | Swiss ring series S228. |
| Four colour names | `ring_L_t`, `ring_L_b`, `ring_R_t`, `ring_R_b` | Written in this order: **left top, left bottom, right top, right bottom** (same order as `rings_key`). |
| Four numbers | `tarsus_mm`, `beak_mm`, `wing_mm`, `feather_mm` | **In this order unless the page says otherwise.** |
| `Adult`, `2y+`, `≥2` | `age_at_ringing_id` = 4 (adult) | |
| `♂` / `(♂)` | `sex_id` = 3 (M) | Brackets mean uncertain; note it in `remark`. |
| ✓ at the bottom | blood sample taken | Creates a `sample` row of type 100 (blood). |
| `30 mm` | net mesh size | Goes into `remark`, not a measurement. |

## Colour names

Colour rings may be written in German or English. Ids are from `ref.rings`.

| id | German | English |
|---|---|---|
| 1 | Alu | alu / metal |
| 2 | weiss | white |
| 3 | schwarz | black |
| 4 | gelb | yellow |
| 5 | rot | red |
| 6 | blau | blue |
| 7 | grün | green |
| 8 | rosa | rosa |
| 9 | violett | violet |
| 10 | pink | pink |
| 11 | bronze | bronze |
| 12 | schwarz mit Nummer | black_nr |
| 99 | unbekannt | unknown |

## What gets created

- **New bird:** one `individual` row, plus (if ticked in the form) its ringing observation
  (`ind_observation`, action `ringing`) and its blood sample (`sample`, type 100).
- **Recapture:** one `ind_observation` row with action `catch` for the existing bird.
  Measurements of recaptures are only stored when explicitly asked for.
