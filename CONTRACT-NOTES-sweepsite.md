# CONTRACT-NOTES — WS6 sweepsite (station-nightshift, branch `bs-sweep-site`)

Where this stream did something the contract (CONTRACT.md, 2026-09-28) does not say, or says
two ways. Each item names what was done and what the lead session still has to do.

This file is in the repo root, which GitHub Pages publishes, so it names no business and no secret.
Fold what is still open into STATE.md and delete this file before the branch reaches `main`.

## 1. Analytics: the five-place rule (gap, needs the lead session)

`sweep_view`, `sweep_submit` and `sweep_code_open` are in `analytics.js` `EVENTS` here. Two other
whitelists drop unknown event names without an error, and neither is in this repo:

- station-world `server.py` `_RANGE_EVENTS` (about line 11346; WS5's file);
- the live n8n workflow "Station - Range Analytics Relay" (`ESAggDPVu6JIfgIb`), node "Store Event",
  array `ALLOW` (repo copy: station-world `ops/n8n/workflows/station-range-analytics-relay.ESAggDPVu6JIfgIb.json`).

Until both list the three names, the browser sends the events and the relay throws them away, so
Funnels › Numbers shows no website-check traffic. The n8n edit is a live write: lead session, with
Circle's OK. Lengths fit the collector caps (ev ≤ 24, label ≤ 60).

## 2. How `sweep_view` fires

The contract says `window.__rangeTrack("sweep_view", "sweep_page")` on /sweep/ load. It fires through
the same `track()` function, from `analytics.js` `boot()`, driven by
`<body data-range-view="sweep_view:sweep_page">`. That way a visitor who accepts cookies after the page
has loaded still counts (a call at load time would be dropped by the consent gate and never retried).
`sweep_submit` and `sweep_code_open` go through `window.__rangeTrack` from `v5.js`, as written.

## 3. `sweep_code_open` with label `home_band`

§9 gives the band a link ("Got a code from our email?" → `/sweep/#code`), not a code form, yet lists
`home_band` as a label for the code-form event. The link keeps its exact href `/sweep/#code`; clicking it
stores `station_sweep_code_from=home_band` in sessionStorage (this tab only, a view convenience), and the
/sweep/ code form uses it as its label once. Storage blocked → label `sweep_page`.

## 4. Neutral category names

§5.4 gives "betting sites", "online pharmacies", "adult sites", "essay-writing services" as examples, but
"betting" and "essay" are themselves in the §5.3 vocabulary (and "pharmacy" is in the WEAK list). The pages
use names with no §5.3 token at all: "online wagering sites", "online drug shops", "adult sites",
"homework-for-hire services". `_tests/sweep_site_test.py` checks every customer-visible string on /sweep/,
the homepage band, the llms.txt line and the privacy paragraph against the full list (STRONG as substrings,
WEAK and the extra list as whole words).

## 5. Privacy retention needs a deletion job (gap)

The privacy paragraph must say "how long". It says the check record (website, email, IP, browser type,
time) is kept up to 12 months, or while a report or cleanup is open. No stream owns deleting the service's
`/data/requests/<CODE>.json` and `requests.jsonl` rows. Before publishing: extend WS3's
`engine/retention.py` (or a cron) to delete request records older than 12 months with no open
report/cleanup, or change the line. Circle's attorney reviews the paragraph (G10); it carries
`<!-- draft pending attorney review -->`.

## 6. Smaller calls

- `/sweep/` on station.solutions is indexable and in `sitemap.xml`; only the service's result pages are
  `noindex` (G3).
- The page links the service's legal pages by URL (`/sweep/legal/sweep-terms.html`,
  `cleanup-authorization.html`, `scanning-disclosure.html`, WS1). The deploy order (station-parasite first)
  makes them live before this page.
- The mega-menu entry reads "Website check — hacked or not?" (matching the neighbouring "Free audit — see
  what's broken"); the drawer and footer read "Website check".
- The three anonymised finds were checked read-only against the stored scans on the VPS (med spa: 42 links,
  7 of 12 pages, 30 off-screen, 40 destinations; plumber: 3 off-screen links on the home page; agency: 115
  links, 7 of 13 pages, 99 hidden, 26 destinations). None of them is one of the finds N3 demotes or sends
  back for a re-capture.
- Cleanup tier descriptions follow the approved plan and `engine/tier.py` (standard ≤ 25 pages, nothing
  shown only to Google; deep: cloaked, back doors or 26–150 pages; large: more than 150 pages, online
  stores, multisite, quoted).
- station-nightshift had no test suite, so the tests live in `_tests/` (Jekyll skips `_` folders, so Pages
  never publishes them).
- The site concierge in `v5.js` now answers "is my site hacked?" with the check. Before, it fell through to
  the custom-website pitch.
- Outside this build, but seen: `audit-popup.js` fires `audit_popup_shown` / `audit_popup_submitted`, which
  are in no whitelist, so they have always been dropped. Its thank-you line also says "A person reads every
  audit before it goes out", but the free audit has sent automatically since 09-22 (REVIEW_MODE false).
  Neither was changed here.
