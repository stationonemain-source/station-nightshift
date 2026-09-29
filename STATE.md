# STATE — station.solutions (the public site)

*The HEAD for this system (estate doctrine, `kb/systems_map.md` v2). Read this
first when landing here; update it last when you change the system.*

## What this is

The public site at **station.solutions**, built by **GitHub Pages straight from
this repo** (`station-nightshift`, branch `main`). The VPS is NOT involved —
push to `main` and Pages publishes it. CNAME lives in the repo. CDN (Fastly)
can lag a deploy by several minutes; check the Pages build API before blaming
the push.

## Load-bearing surfaces

| Path | What it is |
|---|---|
| `/` | The marketing site + funnel (payment paths, audit form, analytics beacon, CRO popups) |
| `/partners/` | **The Partner portal** — a full app in one file (`partners/index.html`), talking to the n8n Affiliate Engine webhook. Tabs: Dashboard · Foundry · Book of business · Calendar · Products & scripts · How you get paid (rest hidden by CSS) |
| `/partners/agreement.html` | The signed-policy authority for tracks/rates |
| `/thanks/`, `/audit` | Funnel pages |
| `/website-brief/` | **Prospect brief** — the questionnaire we send someone before drafting a site. Prefill per prospect with `?for=Business&site=example.com&name=&email=`. noindex, linked from nowhere. POSTs JSON to the n8n **`/webhook/client-brief`** workflow (`Station - Client Brief`, id `tdx6Iw4kbqCbJK6m`) → Discord #ops **and** an email to main@station.solutions (SMTP credential `Station briefs (gmail SMTP)`, sending as stationonemain@gmail.com because `secrets/smtp.json` has no app password for main@; Reply-To is set to whoever filled the form in). ⚠️ Do NOT point it at `/webhook/free-audit`: that workflow generates an audit report and emails the lead "Your Station audit for …", which is the wrong reply to a design brief. |

## Position (2026-09-01)

- Partner portal: **Add client** shipped — Partners put closed clients straight
  into their own book (engine v4.26 `client_add`), and a client is a **stack**
  of any of the 17 catalogue products, optionally on a bundle (v4.27).
  ⚠️ GHL search lags tag writes ~5 min; the portal draws just-added rows from
  the engine response — never force-reload the book right after a write.
- Volume tiers (Greet/Slate/Lineback/Frontdesk) are selectable per client and
  stored as `sku-<sku>-<plan>` (v4.28); a tier change retires the superseded tag.
- `partners/products.json` is now the price authority for the portal AND the
  engine (machine-readable `mrr`/`setup`/`plans` per product + `bundles`). It must
  be deployed BEFORE any engine change that prices against it.
- GEO layer (llms.txt + structured data) live since `9e1b4b6`.
- Site visual audit clean as of 08-31 (see memory `station-site-visual-audit-2026-08-31`).

## Traps

- `.bak-*` files in `partners/` are untracked working backups — leave them.
- Another session may push concurrently — `git fetch` before concluding what is
  or isn't published.
- The portal is ONE inline IIFE: a single syntax error kills the whole app.
  `node --check` the extracted script blocks before pushing (see memory
  `circle-html-iife-crash-class`).
- Office/Optimum DNS can hijack station.solutions locally — verify against
  185.199.109.x (GitHub Pages) before trusting a local fetch.

## Probe

- Pages build: `GET api.github.com/repos/stationonemain-source/station-nightshift/pages/builds/latest`
- Analytics beacon + wiring alarms: see memory `station-wiring-closure-2026-08-31`.

## Where observations go

Memory rows `station-*-site`, `partner-workspace-in-portal` (the portal),
`affiliate-portal-sheets-v46` (the sheet engine). Engine-side state lives with
the n8n Affiliate Engine (patches + backups in `~/.station/`).

## 2026-09-22 — free audit + newsletter (Station work plan B1)

- **No newsletter.** The v5.js pop-up and the /thanks/ list sign-up are gone; n8n
  `Station - Newsletter Subscribe` (ZBqiln8PJzB9hr0C) is deactivated, not deleted.
- **Free audit sends automatically** (n8n intake `REVIEW_MODE = false`). Form: phone optional,
  no SMS consent (email-only since 09-21). Copy says "twelve checks · in your inbox in about a
  minute" — true: two live tests landed in the Gmail Inbox in 62s / 69s.
- **The hosted page** at `/a/<slug>/` is rendered by Foundry `pipeline/audit_page.py`
  (returned as `html_report_page` by `/api/audit_one`), not the old n8n template.

## 2026-09-22 — custom website form (Station work plan B3, Station half)

- **`/custom/`** — question-by-question form (one question per screen, progress bar, Enter to
  continue, draft kept in the visitor's browser, review screen). 24 questions; budget and
  timeline required. Logo/photo uploads go to the **Station sub-account Media library** via
  n8n `Station - Custom Website Request` (lonlAoK8kd2TWOyl, `/webhook/custom-website-upload`);
  the submission hits `/webhook/custom-website`: GHL contact (looked up first, never upserted),
  tags `custom-website-request website-lead src-custom-form`, full brief as a contact note,
  Discord #station-alerts, Circle Needs You (via the range-alert relay), confirmation email
  "your demo will be in your inbox within 2–3 business days". Demos are built BY HAND.
- **Retired:** `/website-demo/` and `/website-brief/` redirect to `/custom/` (the
  `/website-demo/view/` pages stay — demo links already sent point there). n8n
  `Station - Demo Request` (pvOXTfun0H62aoBu) deactivated. Storefront "Custom" button → `/custom/`.
- Trap: n8n Code nodes run in a task runner — a Buffer body sent with `this.helpers.httpRequest`
  reaches the API mangled (GHL 400). Upload binaries with the native HTTP Request node.

## 2026-09-23 — Storefront Premium retired

- Station sells the **Custom website only**: /storefront/ is its page ("priced to your project",
  free demo in 2–3 business days via /custom/, no monthly care line, no 48-hour promise).
- `storefront` SKU removed from STATION_CATALOG on 22 pages (drawer, cart, checkout); carts saved
  before the retirement drop it on load (v5.js `cartGet` / checkout `get`). Partners:
  `storefront` moved to `_retired_skus`. llms.txt, chat bot, Marquee, Portfolio reworded.
- Stripe: payment link `plink_1TzVcq…` deactivated, product `prod_UzUbojMA3GfZL2` ($500 build)
  archived. The old retired-Premium care product (`prod_UzUbgUnO1xtagW`) is still ACTIVE (no subscribers,
  nothing sells it) — decide with D2 (Hosting & Care).
- Premium will be replaced by a referral to Circle's design-your-own-website business (pending).
- Trap hit: the checkout block in v5.js has its own scope — `CATALOG`/`prod` are NOT visible there;
  use its local `cat`. A ReferenceError there blanks checkout silently for every visitor.

## 2026-09-23 — usage billing + hosting & care (Station work plan D1, D2)

- **Usage (D1):** every product page, `/checkout/` and ToS §4 state the rule: warning at 80%, the first
  time over is free (once per product), after that overage at 2× the plan's per-unit rate. `/top-up/`
  sells packs at 1.5× through Stripe payment links carrying `client_reference_id`=location. The meter
  lives in Circle (`station-world/usage_meter.py`), not on this site.
- **Hosting (D2):** no fixed care price anywhere. Hosting = the domain's cost; care is quoted.
  `/custom/` asks domain / who buys it / who hosts. `/cancel-hosting/` (noindex) posts to n8n
  `/webhook/hosting-cancel` (request → emailed single-use link → check → confirm with the ticked warning).
  `/site-help/` posts to `/webhook/site-help`. Both linked from the Storefront FAQ.
- Runbook for the manual takedown and domain transfer: brain `kb/client_hosting_runbook.md`.
- 2026-09-23 later: hosting is **billed once a year** (Storefront + /custom/ copy). Takedown and domain handover after
  a cancel are automatic in Circle (`hosting_care.py`). This site only hosts the pages that start it.
- 2026-09-27 (batch 2): Circle's 09-24 rule (a fixed monthly Care Plan price, with a partner discount floor) was
  put on `/storefront/`, `/custom/`, `/website-demo/view/`, `llms.txt`, the v5.js concierge and the partner guide.
  **Reversed 2026-09-28** — see below. Its numbers are deliberately not repeated here: this file is public.

## 2026-09-28 — partner payouts follow the money to the bank (engine v4.48)

- **How you get paid** now shows two more stages after "Sent to your Stripe account": **On its way to your bank ·
  expected <date>** and **In your bank · <date>**. The wording comes from the Affiliate Engine (v4.48,
  `station-world/ops/n8n/patches/apply_payout_bank_patch.py`): the payout log already prints each line's
  `status_text`; `paintXfers` now appends each transfer's `bank_text` under "Payouts sent" (absent when Stripe can't
  show it, so nothing is claimed that wasn't read). `partners/guide.md` lists the two new statuses.
- Review fixes (same day): lines older than 60 days (or past the newest 10 transfers) read **Paid to your Stripe
  account · <date>** instead of sliding back from "In your bank" to "Sent"; the guide says so. `paintPayLog` adds
  "Couldn't check your bank payouts with Stripe just now…" when `money_lines.bank_read` is `failed`/`partial` and a
  paid line's `bank_stage` is `unknown` (the engine's "not observable" state). "In your bank" is described as "Stripe
  has marked the payout as paid", and a failed payout going back to "Sent" is explained.
- ⚠️ Order: apply the engine patch first, then push this. Pushed alone, the portal is unchanged (no `bank_text` yet)
  but the guide would describe statuses nobody can see.

## 2026-09-28 — hosting & care is quoted per client (Circle; reverses the 09-24 fixed price)

- **The rule:** website hosting & care is ONE monthly subscription that Station quotes for each client. The quote
  covers what the client's domain costs plus the care that fits that business. There is **no list price**, so no
  public or partner-facing page states a care number. Partners never set, quote or discount it: they tell Station
  (Message Station) and Station quotes. The partner earns 40% of whatever the client actually pays for it.
- Public copy (quoted-with-your-demo wording): `/storefront/`, `/custom/` (hosting question help), `/website-demo/view/`
  (price box now "Priced to your project"), `/portfolio/` ("Hosting & care, quoted"), `llms.txt`, the v5.js concierge,
  and the unreferenced `bots.js`. The separate "hosting alone, billed once a year" option is gone from every page.
- Partner portal: the **Care rate** button, its box and its JS (`ibxCare*`) are removed; the client workspace shows one
  line, "Hosting & care is quoted by Station for each client. Message Station with what they need." (the existing
  `data-go="msgs"` link). "Discounts lower your commission" no longer uses a care example with numbers.
  `partners/guide.md` (the ONE source Ask Station answers from) and `partners/products.json` say the same.
- ⚠️ Order: apply the engine patch (v4.49, `station-world/ops/n8n/patches/apply_care_quoted.py`: `care_rate` refuses)
  and push this together. Pushed alone, nothing breaks (no page calls `care_rate` any more), but the engine would
  still accept the action from an old cached portal.
- ⚠️ This file is served publicly at station.solutions/STATE.md (no `.nojekyll`/exclude), so keep prices out of it.

## 2026-09-28 — free website check (Station › Funnels › Bug Sweeper, site half) — branch `bs-sweep-site`, NOT deployed

- **What customers see:** "Free website check" (never "Bug Sweeper", which is Circle's name for the funnel, and
  never the retired names). Two things are for sale only after a find: the **Full report** and the **Cleanup**.
- **`/sweep/`** (`sweep/index.html`): the check form and the code box, three anonymised real finds (counts read from
  the stored scans; where the links point is never shown; each one a case the evidence gate KEEPS as "hidden links
  found" — re-check against the gate before swapping a card), how the check works and what it can't see, the two
  prices, how the cleanup works (developer / own backup / backup restore / liability summary → the full cleanup
  authorization on the service), FAQ with matching FAQPage JSON-LD. Indexable, in `sitemap.xml` and `llms.txt`.
- **Homepage:** both hero buttons unchanged; the quiet line under them scrolls to `<section id="sweep-band">`, which
  sits immediately above "Start here" (`#shop`) with the same inline form (`src=home_band`).
- **The forms are plain HTML.** Check: `POST https://audit.station.solutions/sweep/check` with `website`, `email`,
  `company_fax` (honeypot, off-screen, `tabindex=-1`) and `src` (`sweep_page` | `home_band`). Code:
  `GET https://audit.station.solutions/sweep/code?c=…`. No fetch, no CORS; they work with JavaScript off. The
  microcopy under each check form is exactly "We'll email your result to this address. No marketing unless you ask.",
  with "Terms for the check · How we use your email" under it on both forms. The honeypot keeps the contract name
  `company_fax` but its label/id match no autofill ("Leave this empty"), it carries the password-manager ignore
  attributes, and v5.js clears it only when the browser itself autofilled it.
- **`?url=` / `?code=` prefill** on `/sweep/`: an inline `<head>` script copies them to `window.__sweepPrefill` and
  strips them from the address before attribution.js / analytics.js / the Meta Pixel run (a code opens a result page).
- **Entry points:** Storefront mega-menu Help column ("Website check — hacked or not?") on all 22 inline navs +
  `/sweep/`, the footer "Start here" column, the mobile drawer and the search index in `v5.js`, and the v5.js
  concierge ("is my site hacked?" → `/sweep/`). Cache keys: `v5.css?v=20260928`, `v5.js?v=20260928`.
- **Analytics:** `sweep_view` (from `<body data-range-view>` via `analytics.js` boot, label `sweep_page`),
  `sweep_submit` (label = `src`), `sweep_code_open` (`sweep_page`, or `home_band` after the band's code link).
  ⚠️ Five-place rule: these three names must ALSO be added to station-world `server.py` `_RANGE_EVENTS` and to the
  n8n "Station - Range Analytics Relay" Store Event `ALLOW` array, or they are dropped there without an error.
- **`audit-popup.js`** never loads on `/sweep/` (the page doesn't include it, and the file itself refuses the path);
  on `/` it also waits while someone is typing into the check band.
- **`/unsubscribe/` is scanner-safe:** opening the link only asks "Stop all email from Station to this address?";
  the two POSTs (cold engine + n8n station-unsub) go on the button press. Independent of the rest; safe to ship alone.
  Known limit: with JavaScript off the page can't act (its noscript note offers the reply-"unsubscribe" route); a
  no-JS form needs the engine (station-world `cold_public.py`) to accept a form POST and answer with HTML.
- **`/legal/privacy.html#website-check`:** what the check keeps and why, plus a retention line that names NO period:
  kept while useful for the result / a report / a cleanup, deleted on request to main@station.solutions (by hand today:
  the service's files + the contact), the contact record stays until they ask. Both carry
  `<!-- draft pending attorney review -->`. Nothing purges check records on a timer yet; if a purge job ships, add its
  period to the line and to `_tests` in the same change, never before.
- **Tests:** `python3 _tests/sweep_site_test.py` (static) and, with `~/.claude/scripts/test-browser.sh start
  bs-sweepsite 9996`, `node _tests/sweep_browser.test.mjs` (starts its own static server; answers every outside
  request itself). `_tests/` and `_notes/` start with `_`, so the Pages build never publishes them; build notes for
  the lead session are in `_notes/CONTRACT-NOTES-sweepsite.md` (a test fails if one appears outside a `_` folder).
- ⚠️ **Order:** the check service (its `/sweep` routes, its legal pages and the ~15 s watcher behind "usually under a
  minute") must be live at `audit.station.solutions/sweep`, AND the Bug Sweeper mail switch
  (`$STATION/funnels/bugsweeper/MAIL_ENABLED`) must be on — until it is, every result mail is held, so "Result by
  email" would be false — BEFORE this branch reaches `main`, and only on Circle's go (it is public content). Run
  link-preflight on `https://station.solutions/sweep/` after publishing.
  **Gap fixes 2026-09-29 (the full ordered list is station-parasite STATE.md "Deploy"):** also publish only when the
  check really takes checks: `/docker/parasite/data/CHECKS_OPEN` exists AND the evidence browser is ready with its
  sandbox on (the service now closes the check by itself otherwise, and this page's forms would land on "paused for a
  moment"); and only after a founder has checked Station's GHL workflows (a workflow on Contact Created or on an
  unfiltered tag would mail marketing to every checker, and both forms here promise "No marketing unless you ask").
  Circle's mail switch refuses until both are true. If only the $79 report is on sale at first (the cleanup links wait
  for the connector test and the 30-day watch), a report buyer is told "we'll quote this one" for the cleanup while
  this page lists $349 / $749: Circle's call whether such a quote holds to the listed price (_notes §10).
