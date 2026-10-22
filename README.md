# Dipper-Finder / Cinclopedia

Web app (Vercel) and Supabase database for the white-throated dipper (*Cinclus cinclus*) project.

## Repository layout

| Path | What |
|---|---|
| `index.html`, `app.js`, `sw.js` | Dipper-Finder app (bird list, map, reporting observations) |
| `ringing.html` | Form for entering newly ringed birds |
| `api/` | Vercel serverless endpoints (talk to Supabase with the service-role key) |
| `supabase/migrations/` | Every schema change applied to the database, one file each, named `<version>_<name>.sql` |
| `scripts/` | Helper SQL/Python (e.g. regenerate the data dictionary) |
| `docs/data-dictionary.md` | All tables and columns (generated) |
| `docs/field-book.md` | How a field-book page maps to the database |
| `docs/ringing-form.md` | Ringing form: usage and setup |
| `CHANGELOG.md` | Every change, including one-off data changes |
| `archived/` | Old versions of the app, kept for reference |

## Making a change (one small package each)

1. **One change per branch and pull request**: e.g. "add column X", "new form field Y".
2. **Database change** → one new file in `supabase/migrations/`, applied to Supabase under the same name.
   Never edit an applied migration; fix things with a new one.
3. **Data change** (import, backfill, correction) → run it, then note what, how many rows and which ids in `CHANGELOG.md`.
4. **Docs** → add a `CHANGELOG.md` entry; if columns changed, regenerate `docs/data-dictionary.md`:
   run `scripts/data_dictionary.sql`, save the result as JSON, then
   `python3 scripts/build_data_dictionary.py dictionary.json > docs/data-dictionary.md`.
5. Merge when the change works. The repo then always matches the live database.
