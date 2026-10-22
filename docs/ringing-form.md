# Ringing form (`/ringing.html`)

Form for entering newly ringed birds from the field book, up to three per page.

## How it works

1. Open `/ringing.html` and enter the team code (remembered on that device).
2. Fill one card per bird. A new card copies date, place, observer and capture method from the previous one.
   Gross weight minus bag tare fills the net weight automatically.
3. Two checkboxes per bird, both decided by you:
   - **Beobachtung (Beringung) erfassen** → creates the ringing observation (`ind_observation`, action `ringing`).
   - **Blutprobe erfassen** → creates the blood sample (`sample`, type 100) with the ringing date and place.
4. **Prüfen & speichern** checks every bird first (required fields, existing ring number, existing colour
   combination), shows a summary to confirm, then saves each bird.

After saving, each bird shows a green "✓ Gespeichert" box and is locked; clicking "Prüfen & speichern" again
only says the birds are already saved. "Neue Seite erfassen" starts the next page and keeps date, place and observer.
Entering an already saved bird again is refused (same ring number or colour combination), so nothing is duplicated.

Nothing is saved before you confirm. Each bird is saved in one transaction by the database function
`public.ring_bird`, so a bird is never saved without the observation or sample you ticked.

## Parts

| Part | File |
|---|---|
| Page | `ringing.html` |
| Server endpoint (lookups, check, save) | `api/ringing/index.js` |
| Database function | `supabase/migrations/20261022063059_ring_bird_function.sql` |

## Setup (Vercel environment variables)

| Variable | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Already used by the other endpoints. |
| `RINGING_TEAM_CODE` | Shared team code for the form. Without it the endpoint refuses every request. |

Change the code by updating the variable in Vercel and redeploying; everyone then enters the new code once.

## Database triggers

The old automatic triggers on `individual` (`trg_individual_ringing_observation`, `trg_individual_blood_sample`)
are **disabled** since 2026-10-22: observations and blood samples are only created when ticked in the form.
Birds added directly in DBeaver get neither. To switch a trigger back on:

```sql
alter table public.individual enable trigger trg_individual_ringing_observation;
```
