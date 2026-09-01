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

## Position (2026-09-01)

- Partner portal: **Add client** shipped — Partners put closed clients straight
  into their own book (engine v4.26 `client_add`), and a client is a **stack**
  of any of the 17 catalogue products, optionally on a bundle (v4.27).
  ⚠️ GHL search lags tag writes ~5 min; the portal draws just-added rows from
  the engine response — never force-reload the book right after a write.
- `partners/products.json` is now the price authority for the portal AND the
  engine (machine-readable `mrr`/`setup` per product + `bundles`). It must be
  deployed BEFORE any engine change that prices against it.
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
