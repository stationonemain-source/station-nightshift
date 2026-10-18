# STATE — Oklahoma Public-Entity Website Report Card (`/oklahoma-report-card/`)

*The HEAD for this feature (estate doctrine, `kb/systems_map.md` v2). Read this first when
landing here; update it last when you change it. The site-wide HEAD is the repo's root `STATE.md`.*

## What this is

A public, fair, deterministic grading of the official website of every Oklahoma school district,
county, city and town: a ranking page, one page per entity with its breakdown, a methodology page
and the raw data (JSON + CSV). Built 2026-10-17 as a $0-at-runtime asset for the government lane,
which had zero references. Any later outreach to a clerk goes through the RFP lock register and
the send ceilings; **this feature sends nothing and spends nothing.**

**UNLISTED.** Every page carries `<meta name="robots" content="noindex,nofollow">`, nothing on the
site links to it, and it is not in `sitemap.xml`. It goes public only when Circle decides (see
"Before it goes public" below). Until then the URL can be shared by hand.

## Where things live

| Path | What it is |
|---|---|
| `/oklahoma-report-card/` | The ranking: every entity, filter by type, search, sortable columns |
| `/oklahoma-report-card/<district|county|city>/<slug>/` | One page per entity: the eight checks in plain words, points, accessibility rules that failed, broken links, what was tried |
| `/oklahoma-report-card/methodology/` | Who is on the list, how sites were found and confirmed, the eight checks with exact thresholds and weights, the honesty rules, the limits |
| `/oklahoma-report-card/data/` | `results.csv` (one row per entity), `results.json` (everything), `entities.json` (the list with candidate addresses before scanning) |
| `/oklahoma-report-card/rc.css` | The section's stylesheet: the site's tokens (v5 palette, Inter, JetBrains Mono); bump `?v=` on every edit |
| `/oklahoma-report-card/_tools/` | The scanner and renderer (not served: Jekyll skips `_` folders). `build_entities.py` → `scan.py` → `render.py`; `scoring.py` holds the rules; `redo.py` drops rows for a re-check; `peek.py` screenshots top/bottom sites |

The scan inputs that are NOT in the repo: Quorum's `leads.jsonl` (named public employees' contacts,
never committed) and the NCES CCD 2022-23 LEA directory CSV (8 MB; Quorum's cache on the VPS at
`/docker/quorum/data/cache/ccd_lea_directory_2223.csv`). Both are read only; Quorum's lead store is
single-writer and this feature never writes to it.

## Position (2026-10-17)

- Entities on the list: 1,191 — 539 school districts (506 regular + 33 charter, NCES CCD 2022-23), 77 counties, 575 cities and towns (Wikidata).
- Graded: 628 (492 districts, 57 counties, 79 cities and towns). Couldn't be checked: 118 — 47 dead DNS, 12 no name on the
  page, 9 robots.txt refusals, 9 HTTP errors, 8 hijacked domains (gambling/foreign-language spam on a lapsed domain), 7 timeouts,
  6 sign-in walls, 6 without government/school vocabulary, 5 parked, 4 chambers of commerce, 3 placeholders, 1 vendor site, 1 other. No website on record: 445 (mostly small towns with no address in Wikidata or Quorum).
- Grade spread: A 72 · B 287 · C 243 · D 22 · F 4 (median score 80.9).
- Top and bottom 10 were opened by hand before publishing (the "are we being retarded?" pass). It caught, and the gate now
  refuses: hijacked domains (Roger Mills County's rogermills.org is a Vietnamese camping blog; texhoma.us, redbirdok.org,
  thecityofwagoner.org, miamiok.org are gambling spam), chambers of commerce listed as the city's site (Sulphur, Newkirk,
  Broken Bow, Nowata County), placeholders (Duncan = "IIS Windows Server", Tonkawa = a Nexcess splash, Claremore = "Under
  Construction"), parked redirects (Waurika, Blackwell, Asher), a history fan site (Medford), a makers blog (Beaver), and
  Weatherford International graded as Weatherford Public Schools. Each is now "not graded" with the reason on its page.
  The remaining F grades (Buffalo, Howe, Shattuck, Sayre) are genuine 2010-era sites and read as fair.
- The first pass on 10-17 was spoiled by running two scanners at once (memory `playwright-scan-one-scanner-per-pc`); 479
  entities were re-scanned on 10-18 with one scanner at 8 workers, then a quiet TTFB pass and an identity pass over all
  graded sites. Every page shows its own date.

## The rules that matter (each one protects a clerk from a false statement)

- **Couldn't check is never a fail.** A check that did not run is excluded from the score
  (`scoring.rescore`). A site needs 4 of 8 checks to get a grade at all.
- **No grade from one check.** Max weight is 20 of 100, so a perfect site failing one check is still ≥ 80.
- **Identity gate.** A candidate address is accepted only if its home page mentions the entity's name
  (or, for a district, its town) or its own address contains the name. Sign-in redirects, parked pages and
  bare shared hosts are refused. Unconfirmed = not graded, never "F". Same failure class as Quorum's
  Barnsdall report (reviewed Google's landing page as the district's site).
- **Deterministic.** No LLM anywhere in the grading or the wording. Same page, same day, same answer.
- **Polite.** Playwright's own Chromium headless shell (never the everyday Chrome), `robots.txt` via
  protego (never `urllib.robotparser`), ≤ 1 deliberate request/s/host, crawl-delay honoured, 15–20
  links per site, hard timeouts, UA `StationReportCard/1.0 (+methodology URL)`.
- **Scores are recomputed at render time** from raw fields, so a scoring change never needs a re-crawl.
  Change `scoring.py`, re-run `render.py`, and update the methodology page text in `render.py` in the
  same commit (the interface must not claim what the code does not do).

## How to re-run

```
cd oklahoma-report-card/_tools
# inputs: data/ccd_lea_2223.csv, data/leads.jsonl (from the VPS, read-only), data/wikidata_*.json
python -I build_entities.py                       # -> data/entities.json
python -I scan.py --workers 10                    # -> data/results.jsonl (resumable; skips ids already done)
python -I redo.py --where links-timeout           # drop rows to re-check, then scan.py again
python -I render.py --out <repo>/oklahoma-report-card
```
The scan takes ~45 s per site; ~750 real sites at 10 workers is about an hour. Playwright in the Hermes venv
expects a newer browser build than the one on disk, so `scan.py` points at
`%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-1228` explicitly.

## Before it goes public — Circle decides

1. **Link it or keep it unlisted.** Nothing links here; `sitemap.xml` was deliberately left alone.
2. **Corrections channel.** Pages point corrections at `/contact/` (main@ is paying clients only). Decide
   whether a dedicated address is wanted before clerks start writing.
3. **Outreach.** Any email to an entity about its grade goes through the RFP lock register and the send
   ceilings. The data gives a factual opener; it does not give permission to send.
4. **Re-scan cadence.** One day, one page. A monthly re-run (same tools) keeps the date honest.
5. **Wording review.** A clerk will read this about their own site. Everything is factual and plain, but a
   human read of the top and bottom pages before linking is cheap.

## Traps

- The index is one static table (~1,200 rows). Fine for an unlisted page; paginate before promoting it.
- `results.json` is several MB. It is linked from the data page only.
- Dates on home pages: calendars print future dates; the scanner ignores anything after today + 1.
  Copyright years are not dates. "Couldn't check" freshness is common (about 4 in 10) and is honest.
- The `links` check ran out of time on ~1 in 5 sites in the first pass; those were re-checked with a
  shorter per-link timeout (`redo.py --where links-timeout`). Expect the same on a re-run.

## Probe

- Live: `curl -s https://station.solutions/oklahoma-report-card/ | grep -c noindex` → 1.
- Not in the sitemap: `curl -s https://station.solutions/sitemap.xml | grep -c oklahoma-report-card` → 0.
- Not linked: `grep -rl "oklahoma-report-card" --include=*.html . | grep -v "^./oklahoma-report-card/"` → nothing.
- link-preflight on the ranking URL before it goes to anyone outside the estate.
