# CONTRACT-NOTES — WS6 sweepsite (station-nightshift, branch `bs-sweep-site`)

These notes record where this stream did something the contract (CONTRACT.md, 2026-09-28) doesn't say, or says two ways.
Each item names what was done and what the lead session still has to do.

**Where this file lives.** It sits in `_notes/`, not in the repo root as the contract says. GitHub Pages builds
this repo with Jekyll, which has no `.nojekyll` and no `_config.yml`. Jekyll serves a root `.md` file as it is (for example
`https://station.solutions/STATE.md` answers 200) and skips folders whose names start with `_`. The GitHub repo
itself is public, so the file still names no business and no secret. `_tests/sweep_site_test.py`
(`RepoHygiene`) fails if any `CONTRACT-NOTES*` file appears outside a `_` folder.

## 1. Analytics: the five-place rule (gap, needs the lead session)

`sweep_view`, `sweep_submit` and `sweep_code_open` are in `EVENTS` in `analytics.js` here. Two other whitelists
drop unknown event names without an error, and neither of them is in this repo:

- station-world `server.py` `_RANGE_EVENTS` (about line 11346; WS5 owns it). Add the three names and cover them with a WS5 test.
- the live n8n workflow "Station - Range Analytics Relay" (`ESAggDPVu6JIfgIb`): the `ALLOW` array in its "Store Event" node.
  The repo copy is station-world `ops/n8n/workflows/station-range-analytics-relay.ESAggDPVu6JIfgIb.json`.
  Changing it is a live write, so the lead session does it, and only with Circle's OK.

Also, nothing reads these events yet. WS5's Funnels › Numbers should count `sweep_view` and `sweep_submit`, split by
the `sweep_page` and `home_band` labels. Until the whitelists and the reader are live, Numbers must not suggest
that site traffic is being tracked. The event names fit the collector's caps (ev ≤ 24, label ≤ 60).

## 2. How `sweep_view` fires

The contract says to call `window.__rangeTrack("sweep_view", "sweep_page")` when /sweep/ loads. Instead, the event
goes through the same `track()` function from `boot()` in `analytics.js`, driven by
`<body data-range-view="sweep_view:sweep_page">`. That way a visitor who accepts cookies after the page loads still
counts. A call at load time would be dropped by the consent gate and never retried. `sweep_submit` and
`sweep_code_open` go through `window.__rangeTrack` from `v5.js`, as the contract says.

## 3. `sweep_code_open` with the label `home_band`

§9 gives the band a link ("Got a code from our email?" → `/sweep/#code`), not a code form, but it lists `home_band`
as a label for the code-form event. The link keeps its exact href, `/sweep/#code`. Clicking it stores
`station_sweep_code_from=home_band` in sessionStorage (this tab only, as a view convenience), and the /sweep/ code form
uses that label once. If storage is blocked, the label is `sweep_page`.

## 4. Neutral category names

§5.4's own examples ("betting sites", "online pharmacies", "essay-writing services") contain §5.3 words ("betting",
"essay", and "pharmacy" from the WEAK list). The pages use names that contain no §5.3 token at all: "online wagering
sites", "online drug shops", "adult sites" and "homework-for-hire services". The tests check this against the full
list.

## 5. Privacy retention: the page says only what runs today

The review found that no stream deletes the service's check records. That covers `requests/<CODE>.json`,
`requests.jsonl`, `requests-honeypot.jsonl`, `codes/`, the scans and evidence of unpaid checks, and the `to` column
of WS4's `mail.jsonl`. So the 12-month promise was removed. The retention line now says:

- the records are kept while they are useful for the result and for any report or cleanup;
- they are deleted when someone emails main@station.solutions, except for purchase records that tax law requires us to keep;
- the email address stays in Station's contact records until the person asks for it to be removed.

A test (`test_retention_line_promises_nothing_that_does_not_run`) fails if the line names a period. If WS3 later
adds a purge to `engine/retention.py` (and WS4 prunes `mail.jsonl`), change the line and the test in the same
commit. Deleting on request is manual today: files on the VPS plus the GHL contact. Both paragraphs carry
`<!-- draft pending attorney review -->` for Circle's attorney (G10).

## 6. The three showcase cases

The cards are the three `keep` rows of the lead session's evidence-gate dry run (`evidence-dryrun.md`, gate
version 1), which are the only stored cases that pass all of (a)–(d):

- **Med spa · Texas.** 42 links on 7 of the 12 pages read, 30 of them hidden off-screen, 40 destinations.
- **Plumbing company · Texas.** 3 off-screen links on the home page, 3 destinations, 2 of them wagering sites.
- **Dental practice · Texas.** 1 link on 1 of the 13 pages read, served only to the Google view, with a changed page
  title. It points to an online drug shop.

The first build showed a marketing agency instead of the dental practice. The gate fails that agency case on
check (b), because its specimen was a visible link, and has queued it for a re-capture. The first version of these
notes wrongly said none of the three was demoted. `test_cases_are_evidence_gate_keeps` pins the three tags. Swap a
card only after checking the new case against the gate. Before publishing, the lead session should re-check all
three against the dry run as it stands at deploy time.

## 7. The honeypot keeps the contract name

The field is still `name="company_fax"`, as §1.4 says. The review pointed out that autofill and password managers
match on name, id and label, and a filled honeypot quietly drops a real person's check. Three changes follow:

- The label reads "Leave this empty", and the ids are `sw-hp1` / `swb-hp1`. Neither contains any word autofill looks for.
- The field carries `data-1p-ignore`, `data-lpignore="true"`, `data-bwignore` and `data-form-type="other"`.
- `v5.js` clears it at submit only if the browser marks it `:autofill` / `:-webkit-autofill`. A bot that types into
  it, or posts without the page, is untouched.

Suggested for the lead session:

- Rename the field to something neutral in a later contract revision (WS1 reads the name).
- Show a honeypot-hit count in Circle (WS1 already writes `requests-honeypot.jsonl`), so false positives are visible.

## 8. `?url=` and `?code=` never reach the Meta Pixel

§9's prefill stays. An inline `<head>` script on /sweep/ copies the two values into `window.__sweepPrefill`, then
removes them from the address with `history.replaceState`. This happens before `attribution.js`, `analytics.js`
(which loads the Meta Pixel and fires PageView) or any other script runs. Other parameters (`utm_*`, `ref`,
`fbclid`) are kept. A public code opens that site's result page, so it must never be sent to Meta. The browser test
checks that no request other than the code form's own GET carries either value.

## 9. Smaller calls

- `/sweep/` on station.solutions can be indexed and is in `sitemap.xml`. Only the service's result pages are
  `noindex` (G3).
- The page and the homepage band link the service's legal pages by URL (`/sweep/legal/sweep-terms.html`,
  `cleanup-authorization.html`, `scanning-disclosure.html`; WS1 owns them). The deploy order (station-parasite first)
  puts them live before this page.
- The mega-menu entry reads "Website check — hacked or not?", matching the neighbouring "Free audit — see what's
  broken". The drawer and the footer read "Website check".
- Cleanup tier descriptions follow the approved plan and `engine/tier.py`:
  - standard: up to 25 pages, nothing shown only to Google;
  - deep: pages shown only to Google, back doors, or 26–150 pages;
  - large: more than 150 pages, online stores, multisite, quoted.
- The watch promise uses cleanup-authorization §7's wording: "the same kind of hidden links", and new problems are
  not covered. The verdict-queue promise says "usually within one business day", as WS1's result page does.
- station-nightshift had no test suite, so the tests live in `_tests/`.
- The site concierge in `v5.js` sends only hack-shaped questions to the check (`siteCheckQ`). A plain "check my
  website speed" still gets the website or audit answer.
- `/unsubscribe/` with JavaScript off shows a noscript note that offers the reply-"unsubscribe" route. A true no-JS
  form would need the engine to accept `?u` on a form POST and answer with HTML (station-world `cold_public.py`),
  so it is not built here.
- Seen outside this build, not changed: `audit-popup.js` fires `audit_popup_shown` / `audit_popup_submitted`, which no
  whitelist lists, so they are dropped. Its thank-you text also describes a manual review step that the free audit
  no longer has. Both are worth a separate look.
