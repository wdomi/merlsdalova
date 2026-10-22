# Notes for Claude

- Database: Supabase project **Cinclopedia** (`trnqybgttenjqkdkncij`). `cinclopedia-test` is a separate copy, not in sync.
- Follow "Making a change" in `README.md`: one small change per branch/PR; every schema change is a new file in
  `supabase/migrations/` with the same name as the applied Supabase migration; every data change gets a
  `CHANGELOG.md` entry with row counts and ids; regenerate `docs/data-dictionary.md` after schema changes.
- Reading field-book photos: follow `docs/field-book.md` (ring order L top, L bottom, R top, R bottom;
  German or English colour names; weight = gross − bag; measurements tarsus, beak, wing, feather unless stated;
  ✓ = blood sample; Adult / 2y+ / ≥2 = adult; up to three birds per page). Show the extracted data and ask
  before writing anything.
- New birds are saved with `public.ring_bird(jsonb)` (see `docs/ringing-form.md`); the automatic triggers on
  `individual` are disabled on purpose.
- Tables have RLS on and the app uses the service-role key server-side; never expose it to the browser.
