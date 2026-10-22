"""Build docs/data-dictionary.md from the JSON returned by scripts/data_dictionary.sql.

Usage: python3 scripts/build_data_dictionary.py dictionary.json > docs/data-dictionary.md
The input is the value of the "dictionary" column (a JSON array).
"""
import json
import sys

HEADER = """# Data dictionary

Generated from the live Cinclopedia database with `scripts/data_dictionary.sql`
and `scripts/build_data_dictionary.py`. Do not edit by hand; regenerate after a migration.
Field-book conventions are in [field-book.md](field-book.md).

Legend: **PK** primary key, **→** foreign key, *gen* generated column, *null* nullable.
"""


def cell(text):
    return (text or "").replace("|", "\\|").replace("\n", " ")


def main(path):
    tables = json.load(open(path))
    out = [HEADER]
    for schema in ("public", "ref"):
        out.append(f"\n## Schema `{schema}`\n")
        for t in (t for t in tables if t["schema"] == schema):
            out.append(f"\n### `{schema}.{t['table']}`\n")
            if t.get("comment"):
                out.append(f"{t['comment']}\n")
            out.append("| Column | Type | Notes | Comment |")
            out.append("|---|---|---|---|")
            for c in t["columns"] or []:
                notes = []
                if c["pk"]:
                    notes.append("**PK**")
                if c["references"]:
                    notes.append(f"→ `{c['references']}`")
                if c["generated"]:
                    notes.append("*gen*")
                if c["nullable"] and not c["pk"]:
                    notes.append("*null*")
                out.append(f"| `{c['column']}` | {cell(c['type'])} | {' '.join(notes)} | {cell(c['comment'])} |")
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1])
