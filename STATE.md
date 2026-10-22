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
| `/partners/` | **Retired 2026-10-07.** Forwards to Partner World (partners.station.solutions, repo `partner-world`). `products.json`, `guide.md` and `agreement.html` in this folder are still served: the engine, Circle and the site read them. The old one-file portal app is in git history. |
| `/partners/agreement.html` | The signed-policy authority for tracks/rates |
| `/thanks/`, `/audit` | Funnel pages |
| `/oklahoma-report-card/` | **Oklahoma Public-Entity Website Report Card** (2026-10-17) — unlisted, noindex, not in the sitemap, linked from nowhere. Deterministic grades for every OK school district, county, city and town website; its own HEAD is `oklahoma-report-card/STATE.md`. |
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
- **The live audit forms are v5.js, not film.js** (2026-10-15, `cd896b7`). A form
  handler that posts to the free-audit intake MUST pack attribution + consent
  evidence (`packLead()` in v5.js); v5.js shipped without it and every lead
  reached the CRM as "direct". And never fire a relay event in the same tick as
  the lead beacon: the n8n relay saves leads and events in one blob,
  last-writer-wins (analytics.js now delays audit_submit/consent_sms 1.5s).

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

## 2026-09-30 — Apple HIG audit pass (branch `apple-design-audit-0930`, NOT merged)

Audited `/` with the `apple-design` skill (web scope: principles + foundations). All CSS lives in one
block at the END of `v5.css` ("Apple HIG audit"), plus a mapping applied to the whole stylesheet.

- **Type floor 12px.** Whole `v5.css` moved 10.5/12/12.5/13.5 -> 12/13/13/15 (mock-ups `.iphone*`,
  `.rev2`, `.edraft`, `.gr-*` left alone). Form labels are 13px sentence case, prices 20px.
  `_tests/sweep_site_test.py` scale set updated to match.
- **Targets 44px** on buttons, nav icons, chips, footer and legal links, form inputs 48px. Deliberately NOT
  changed: "learn" on quiz tiles and consent-copy links (earlier pass, see comments in `v5.css`).
- **Hero:** one amber primary (`.btn.amber-fill`), "Get a free audit" is a quiet `.hf-link`. The
  hacked-site quiet line was kept on purpose (pinned by a test from the 09-28 Sweeper build).
- **One name for the audit action:** "Get a free audit" on buttons, footer and mega menu.
- **`[hidden]{display:none!important}`** — `.btn` is `inline-flex`, which beat the UA rule, so the cart
  summary's "Continue with these" button showed at $0.
- **Focus:** form inputs and search get a 2px solid outline, not an 8% halo.
- Not done (decisions): 14 "Add to cart" buttons on the shelf, dark appearance, headline copy.

## 2026-10-16 — why /audit/ and /custom/ were not in Google, and what changed (66a10ad)

**Evidence (GSC URL Inspection via the SEO funnel's read-only token, 10-16):** `/audit/` "Discovered - currently not
indexed", never crawled, only referrer known = /radar/. `/custom/` "URL is unknown to Google" at 11:05Z and "Discovered"
by 14:00Z, never crawled. 18 of 29 sitemap URLs indexed; the other 9 (greet, revive, sweep, echo, lineback, repute,
portfolio, portfolio/emails, site-help) are the same class. **Nothing blocked them:** robots.txt `Allow: /`, 200 for
Googlebot, no meta robots or X-Robots-Tag, `/audit` and http/www → one 301 to the slash URL, both in the sitemap.
So the cause is Google deferring the crawl of a young, low-authority domain, plus page signals that gave it little
reason to hurry:
- `/custom/` was a JS-only app: **1 word** in the HTML without JS, no canonical, no OG, no nav, no outbound links, and
  linked from only 4 pages (/, /storefront/, /sweep/, /portfolio/).
- `/audit/` had ~120 words of its own (the rest was nav and footer), no structured data, and a title nobody searches.
- `sitemap.xml` had no `lastmod` on 27 of 29 URLs, so a re-read told Google nothing had changed.

**Fixed in 66a10ad:** /custom/ intro is in the HTML (JS still replaces it) + a "How it works" block shown on the first
screen only (hidden once a visitor starts) + canonical/OG + Service/BreadcrumbList JSON-LD + title "Free custom website
demo for your business"; /audit/ gets the twelve checks (wording from Foundry `report_local._WHAT_IT_MEANS`), how it
works and four questions as static text (345 → 840 words without JS) + Service/FAQPage/BreadcrumbList; /custom/ is in
every page's footer ("Free website demo") and the Websites & Google menu; real `lastmod` on all 29 sitemap URLs
(from git, only a real content change moves it — not nav/footer edits); canonicals on legal/* and /site-help/;
`noindex, follow` on the portfolio concept demos about other real businesses (`/portfolio/t/*`; the two `kit/` pages
whose canonical points to higgsfield.app keep that and no noindex); llms.txt audit line = twelve checks.

**Submitted:** IndexNow (key file `/53189cdf75cd0fb7e6671f60242b00a0.txt`, all 29 URLs, 202) and Bing API SubmitFeed +
SubmitUrlBatch (both 200). **Not possible from here:** Google sitemap resubmit or "Request indexing" — the GSC token is
`webmasters.readonly` and the API has no request-indexing call. The one-click lever left is a founder's: GSC → URL
Inspection → Request indexing on both URLs.

**How to tell if it worked (check 10-23, then 10-30):** Circle › Funnels › SEO & GEO › Google (inspect.json on the VPS,
`/docker/circle/data/.station/seo/seo/inspect.json`) — /audit/ and /custom/ should show a `last_crawl` date and then
"Submitted and indexed". If both are still uncrawled on 10-30, the fault is not on the page: it is authority (links from
other sites), and the next step is off-site, not more on-page work.

**Rules for new pages here:** every indexable page needs its content in the HTML (not only JS), a self-canonical, a
title a buyer would search, and a link from the shared footer or menu; when a page's content really changes, set its
`lastmod` in sitemap.xml. Pages about other businesses (demos, spec sites) are `noindex, follow`.

## 2026-10-17 — /ai-check/ "Is ChatGPT ignoring you?" (free AI visibility check, efe6195)

- **What:** a visitor types a website and gets a score out of 100 plus fixes on screen, no email needed. The checks run on
  the **foundry-aicheck** endpoint (`POST https://aicheck.srv1748596.hstgr.cloud/v1/check`, its own container beside
  Foundry; head = Foundry STATE.md 10-17). Deterministic code, no LLM. CORS allows only `https://station.solutions` (and www),
  so **the page can't be tested from localhost**: verify on the live page.
- **Honesty:** the page says it can't see what ChatGPT actually says about you. "Couldn't check" is left out of the score.
  llms.txt is reported but not scored. All API text is inserted with `textContent` (it carries strings from other people's
  sites, e.g. their H1). Never switch it to innerHTML.
- **Lead capture:** "Email me the full report" is a `form[data-audit]`, so v5.js posts it to the free-audit intake with
  packLead attribution and analytics.js sends the lead beacon. Hidden `form=ai_check` + `minimal=1` route it to its own n8n
  branch, which records the lead in Circle (variant `ai-check`) and sends **nothing** while `AI_CHECK_EMAIL_LIVE = false`.
  The done text promises the report "within one business day" from a person, which is true while the switch is off (the
  #station-alerts row says "Needs you · email them the report"). **If you remove `form=ai_check`, the submit falls into the
  FREE AUDIT path and auto-emails an audit.**
- **SEO:** content in the HTML, self-canonical, WebApplication + FAQPage + BreadcrumbList JSON-LD, sitemap lastmod 10-17,
  linked from /audit/ (one line) and, since 693a5c5 (10-17), from every shared footer: "Is ChatGPT ignoring you? →"
  under the free-audit line in the brand column, same style, on the 24 pages that carry that footer. Not in the mega menu
  or the mobile drawer yet (the 10-16 rule still applies there).

## 2026-10-16 — phone hero started above the viewport (fixed c1da31e)

- **Symptom:** at scroll 0 on 360–414 px phones the h1 began 12–63 px *above* the viewport
  (and behind the 58 px nav even at 430), so the headline opened mid-sentence.
- **Cause:** layout, not the parallax (its drift is 0 at scroll 0). The title block grew to
  ~715 px on phones (router cards stack to one column) but was still centred on `top:38%` of
  an 88vh scene.
- **Fix:** at ≤760 px the block is in the flow (`.parallax__layers` relative, 92 px top pad,
  scene `height:auto; min-height:max(560px,88vh)`). The JS writes
  `translate(var(--tx,-50%),var(--ty,-50%)) translateY(drift)`; phones set `--tx/--ty:0`.
  **If you edit the hero transform, keep the vars** or phones re-centre and the bug returns.
- Verified on the deployed page (Playwright Chromium, isMobile, DPR 2): h1 top 125 px at
  360/375/390/414/430; 768/1440/1920 screenshots pixel-identical to before.

## 2026-10-17 — phone-visitor audit (20c83bd)

Audited every sitemap page plus the funnel/utility pages (48 paths) on the LIVE site at 375 px (isMobile, DPR 2)
and 1440 px with Playwright's own Chromium; every internal + external link (all 200), every cross-page anchor,
every form endpoint (all 11 n8n webhooks answer "not registered for GET" = registered for POST; nothing was
submitted), meta/OG/canonical, accesslint on /, /audit/, /sweep/, /storefront/, /custom/, /checkout/.

**Fixed:**
- **Consent card unstyled on /custom/, /site-help/, /cancel-hosting/** — those pages don't load v5.css, so #ck was plain
  text with UA buttons below the footer. They now load `/ck.css` (a copy of v5.css's #ck block with literal colours).
  **Change one, change the other.**
- **Storefront sticky bar** text wrapped to 4 lines on phones and showed above the nav: `.pp-bar .p` is one line with an
  ellipsis at ≤760 px.
- **Calculator sliders** had no accessible name: v5.js gives each `<label for>` + `aria-labelledby` on the label text.
- **"(optional)"** on the audit forms was 2.5:1 (opacity .6): now normal weight, full colour.
- **Legal pages** ran text to the glass at 375 px: `@media screen` gutter, 15 px text on phones, wide tables scroll inside
  themselves (cookies table pushed the page 18 px wide). Print layout unchanged. Links #8a5a00 (were 4.45:1 in the cream cards, 95e57d6). Descriptions + OG on accessibility,
  cookies, privacy, sms-terms; OG on tos, cancellation, /site-help/. cancellation.html: `lang`, one h1.
- **Core/Pro/Max said "every product"** — Radar is in none of them (station-world `upsell_engine.py` CORE_SET; guide.md
  "Radar is never included"). Now "every product except Radar" on /, llms.txt, products.json, guide.md; heading
  "Twelve products, one plan, three sizes." (Partner World's data.js is generated from guide.md — it picks this up on its
  next `build_data.py --fetch`.)
- **Refund policy contradicted the offer:** the homepage, checkout, llms.txt and guide promise a 30-day money-back on the
  first paid month of Core/Pro/Max; cancellation.html and ToS s5 said no delivered month is ever refunded. Both now name
  the exception in the guide's own words (marked Updated 2026-10-17). ⚠ Legal text, not attorney-reviewed — Circle to eyeball.
- **Portfolio demos:** roofing footer read "Denver, Texas · Since" (site.js hard-coded ", Texas"; now `brand.region`, as
  pool already did); empty "Since" dropped on roofing/wedding; all five `/portfolio/t/*` carry "Designed & hosted by
  Station.Solutions". **Golf demo photo FILE NAMES do not match the photos** (hero.jpg = fries, green.jpg = a burger,
  practice.jpg = salmon + wine, cart.jpg = the dining room; only dinner.jpg and bunker.jpg show the course): hole 17's card
  was a burger. Every reference and alt now matches what the picture shows. Never trust those file names.

**Checked, not a bug:** accesslint's ~140 contrast hits at 2.3–2.6:1 are `.rv` reveals at opacity .6 in an unscrolled
tab — re-audit with reveals settled. `/media/logos/facebook.svg` "broken" = viewBox-only SVG reports naturalWidth 0.
Desktop "overflow" on product pages = `.bleed-art` clipped by `overflow-x:clip`. 14-day trial copy is the 10-04 rule
(the 08-09 "7 days" memory is stale).

**Resolved the same day (653ba39, the five Circle approved — next section):** the golf demo's real course and invented
history, its header and generated photo; the three spec-site footer credits; the BidBridge footer link; the retired
flagship-build figure on `/summer/`. **The sixth, the Core card's "Worth … /mo separately" line, was a pricing decision:**
it counted ten products, not the twelve the card lists (it left out Slate and Tap). Circle approved the same day and
5d92767 sets it to the Standard sum of all twelve from `partners/products.json`, in `index.html`, `partners/guide.md` and
`products.json` together (Partner World's data.js picks the guide line up on its next `build_data.py --fetch`).

## 2026-10-17 — audit follow-ups: golf demo, footers, /summer/ (653ba39)

- **The golf demo is fictional now.** `/portfolio/t/golf/` was "Cementville Grill at The Quarry Golf Course", a real
  San Antonio business: its address, phone, map embed, hours and three real people's Google reviews sat under invented
  history. It is **Cedar Bend Golf Club** (the estate's fictional demo town, as in cedar-bend-demo): a 555 phone, a
  made-up Fairway Drive address, an `.example` email, no map, no reviews (the section hides itself when `reviews` is
  empty), no "since / years / parkland" copy anywhere, and the footer fine print says it is sample content. The `kit/`
  subfolder (the BRAESIDE template) is untouched apart from the header fix. The `/portfolio/` card and rail are renamed;
  the recorded scroll video and poster (`portfolio/media/quarry-golf.*`) still show the old name — re-record when convenient.
- **Header over the hero:** the kit header is transparent and inherits ink, so over the photo it was unreadable at every
  width. Fixed in the kit (shared by the demo and `kit/index.html`): `<header class="hdr on-dark">` from first paint,
  `.hero` added to premium.js's ScrollTrigger dark list so it flips to ink once the hero scrolls out, a scrim band on
  `.hero-plate::before`, and `body:has(.mobile-menu.open) .hdr.on-dark{color:var(--ink)}` so the burger stays visible on
  the cream menu sheet. No new type sizes.
- **`pro.jpg` (generated: garbled sign and crest text) is deleted** from the demo. `lesson.jpg` / `lesson-portrait.jpg`
  are a real photo: U.S. Air Force, Benjamin Faske, public domain, Wikimedia Commons "Annual Junior Golf Clinic
  120613-F-ST721-266.jpg". Unsplash and Pexels both answer scripts with bot checks; Commons (the path in Foundry's
  `tools/fetch_kit_photos.py`) is the keyless source that works.
- **Footer credit** "Designed & hosted by Station.Solutions" added to gtz-tint (`main` site/ and the `pages` branch),
  earth-cafe (`src/earth.tpl.html` → build.py → `public/`) and cedar-bend-demo (the `build.py` layout, all seven pages),
  each in its own repo, each styled like that footer's own fine print.
- **BidBridge** link removed from the homepage footer (the only footer that carried it; the legal pages' SMS-program text
  stays, as it describes a live program).
- **`/summer/`:** the three mentions of the retired flagship-build figure are gone; Custom is quoted per project, so no
  figure replaces it. The deck's "7-day trials" and "Fourteen products" lines are also stale (out of scope, noted).
- Verified on the live pages after the Pages rebuild at 375 px and 1440 px with Playwright's own Chromium; link-preflight
  PASS on all seven pages. Before/after screenshots are in the side-session notes folder, `site-fixes-1017/`.

## 2026-10-17 — Oklahoma Public-Entity Website Report Card (`/oklahoma-report-card/`, UNLISTED)

The government lane had zero references, so every Oklahoma school district (NCES CCD, incl. charters),
all 77 counties and the incorporated cities and towns (Wikidata) had their official website put through
eight deterministic checks (HTTPS, phone layout, accesslint accessibility, freshness, broken links, contact
details, speed, accessibility-statement + records/meetings links) with Playwright's own Chromium, robots.txt
honoured, one request per second per host. A check that could not run is "couldn't check" and excluded —
never a fail; a site that did not answer to the entity's name is not graded. No LLM in the grading. Pages:
ranking, one per entity, methodology, data (CSV + JSON). `noindex`, not in `sitemap.xml`, linked from nowhere
on the site — it goes public only when Circle decides. The feature's own HEAD, the re-run recipe and the
"before it goes public" list are in `oklahoma-report-card/STATE.md`. Sends nothing, spends nothing.

## 2026-10-21 — conversion pass (Circle approved the five items; LIVE, commit b78a5f3)

Scored the live site as a cold visitor: message 9, pricing 9, friction 7, CTA hierarchy 6, **trust 2**, mobile 6, speed 6 → 6.5/10.
Shipped the five mechanical fixes; the trust gap (no testimonial, logo, founder, case study anywhere) is open and is Circle's call on what proof to show.

- Home hero: **Get the free audit** is the filled button, See the products is secondary. The proof line is plain text ("no card, no call").
- **Contact** in the nav on 28 pages → `/contact/` (a form). It was a `mailto:` that opened an empty mail app on desktop.
- Audit form: City optional; the required "Email me my audit results" checkbox is gone (it was the OPTIONAL marketing field `email_consent`, see analytics.js §7.1 — the report itself needs no consent field); button reads **Send my audit** with one line under it. `v5.js`/`analytics.js` already post `email_consent=no` when the box is absent. ⚠ If the Google-listing check starts returning "couldn't check" more often, the engine wanted City — put `required` back.
- Every 14-day trial card (13 product pages + 3 collections on `/products/`) carries `.pz-note` "$0 today · card on Stripe's secure page · nothing charged for 14 days", the same rule `/checkout/` states.
- Chat pill is a 48px icon on phones (≤640px) so it stops sitting on card buttons. Both stylesheets (`/s/station.css` and `/v5.css`) bumped to `?v=20261021a`.
- Not changed: the cookie card still sits bottom-left until a choice is made (consent by design). The hero copy fades in via CSS animation and is invisible until it runs — fine on real devices, a no-animation fallback would remove the risk.

## 2026-10-21 — product pages v2, ten buyer types (branch `product-pages-v2`, NOT on main until Circle says ship)

Circle: "go through every product page and ask would I buy this from 10 different buying personas". Every page was
written for one buyer (a solo plumber). Added to all 14 product pages, from the generator, not by hand:
- **What it actually looks like** — a phone showing the real artifact (text thread, call transcript, invoice, review +
  drafted reply, monthly report, content calendar, campaign stats, prospect audit, demo contents). Each uses a different
  invented example business (salon, caterer, auto shop, groomer, marina…), labelled as an example, like /products/ does.
- **Who it's for** — four kinds of business with one line each, plus an honest "Not a fit if".
- **Your other options, honestly** — DIY / hiring / this product, with when each is the better pick.
- **No-catch strip** under pricing — no contract, $0 today, cancel from your account, the product's "yours to keep" fact,
  and "Rather talk to a person first? Book fifteen minutes" (/book/) or /contact/.
- **Two or three new questions** per page (front-desk staff fear, older customers, staff access, gating, passwords…).
Source: `~/.claude/scratch/heroes/products_v2.py` (data) + `build_funnel.py` `v2_html()` (template, CSS `pv-*`).
The generator also now carries the 10-21 trial card note and `station.css?v=20261021b`, so a rebuild no longer drops them.
Rule kept: no testimonials, integrations, compliance claims or location. Every fact was already on that product's page.

## 2026-10-21 — /about/ (Circle: "an about us page with Charlie and Ewan… a personal brand feel")

Built by `~/.claude/scratch/heroes/build_about.py` (workshop painting hero, same nav/footer/dark theme as the product pages).
Sections: hero "We're Charlie and Ewan. We build it ourselves." · The two of us · Why Station exists · How we work (five
policies already stated on the site) · What we've built (products, portfolio, solutions) · Say hello (/book/, /contact/, /audit/).
**Photos:** drop `about/charlie.jpg` and `about/ewan.jpg` (or .webp/.png) in this repo and re-run the script; until then each
slot is an initial on an ink or paper tile. **Bios are empty on purpose** — nothing on record says who does what; fill
`FOUNDERS[...]['bio']` in the script when Circle supplies them. First names only (no surname on record for Ewan). No location.
"About us" added to the Company column of every footer (26 pages) and to sitemap.xml.
