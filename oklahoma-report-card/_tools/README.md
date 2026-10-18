# Report-card tools

Not served (Jekyll skips `_` folders). Pipeline: `build_entities.py` (registries → `data/entities.json`)
→ `scan.py` (deterministic checks with Playwright's own Chromium → `data/results.jsonl`) → `render.py`
(static pages + CSV/JSON). `scoring.py` is the single place the weights and thresholds live; `render.py`
re-scores from raw fields, so a scoring change never needs a re-crawl. `redo.py` drops rows for a re-check;
`peek.py` screenshots the top and bottom sites for the "are we being retarded?" pass.

Inputs that stay out of the repo: Quorum's `leads.jsonl` (named public employees; read-only copy from the VPS)
and the NCES CCD 2022-23 LEA directory CSV (Quorum's cache at `/docker/quorum/data/cache/`). The Wikidata
query results (`data/wikidata_*.json`) are produced by the SPARQL queries recorded in `build_entities.py`'s
docstring and can be re-fetched.

`vendor/accesslint-core-0.21.0.iife.js` is the MIT-licensed accesslint core engine (licence beside it),
injected into each page to run the accessibility check.
