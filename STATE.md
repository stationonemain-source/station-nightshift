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
  free demo in 2–3 business days via /custom/, no $49/mo line, no 48-hour promise).
- `storefront` SKU removed from STATION_CATALOG on 22 pages (drawer, cart, checkout); carts saved
  before the retirement drop it on load (v5.js `cartGet` / checkout `get`). Partners:
  `storefront` moved to `_retired_skus`. llms.txt, chat bot, Marquee, Portfolio reworded.
- Stripe: payment link `plink_1TzVcq…` deactivated, product `prod_UzUbojMA3GfZL2` ($500 build)
  archived. The $49 Care Plan product (`prod_UzUbgUnO1xtagW`) is still ACTIVE (no subscribers,
  nothing sells it) — decide with D2 (Hosting & Care $10).
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
