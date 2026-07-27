# Deploy checklist — analytics/lead-capture fix (staged 2026-07-22)

**STATUS: STAGED, NOT DEPLOYED. Hard gate: GHL A2P review must be approved first
(Charlie confirms), and Charlie approves the push.**

## What's staged in this working tree (uncommitted)

`analytics.js` only. Two logical changes stacked together:

1. **Pre-existing edit (not Claude's, from the legal-scrub session):** cookie-banner
   button labels "Accept analytics & ads"/"Essentials only" → "Accept"/"Deny".
   Decide at deploy time whether to keep (it's preserved as-is).
2. **Analytics pipe fix (Claude, 2026-07-22):**
   - Beacons now WORK in production: endpoint auto-selects — localhost → Station World
     collector (`127.0.0.1:8790`) · production → n8n relay
     (`…/webhook/range-event`, `…/webhook/range-lead`). The old `IS_LOCAL` no-op gate
     (which silently dropped ALL real-visitor analytics/consent/leads) is removed.
   - `wireAuditLead()` added: audit-form submissions are captured to the Website
     Analytics leads board (n8n relay → Circle pulls). Honeypot (`company_url`) bots
     dropped; `company_url`/`_t` never captured. Runs un-gated by cookie consent
     (first-party form submission, not tracking) — same rationale as the existing
     GHL webhook post in film.js, which is untouched and stays the CRM system of record.
   - Beacon Blob now `text/plain` (a type-less Blob arrives at n8n as an empty body).
   - Duplicate `audit_submit`/Meta-Lead listener removed from `boot()` (now in
     `wireAuditLead`).
   - `META_PIXEL_ID` still `""` — paste when Charlie's Meta business portfolio +
     Pixel exist (Launchpad item `range-meta-pixel`).

## Deploy steps (when the gate clears)

```
cd C:\Users\Circl\.station\website\nightshift
git stash            # protect the staged analytics.js
git fetch origin && git reset --hard origin/main
git stash pop        # re-apply; resolve if analytics.js changed upstream
# review: git diff analytics.js
git add analytics.js && git commit -m "analytics: production beacons via n8n relay + lead capture"
git push origin main # NEVER force-push
```

Then verify live (~90s after push): fresh/incognito browser on station.solutions →
banner shows → accept → within ~2 min the consent event appears on
`127.0.0.1:8790/range-analytics` (Cookies tab). Submit a test audit → lead appears
on the Free audit tab with expandable detail.

## Relay reference

- n8n workflow: "Station - Range Analytics Relay" (`ESAggDPVu6JIfgIb`), ACTIVE.
- Secrets/URLs: `~/.station/secrets/range-relay.json` (token-gated feed).
- Circle pulls the feed on dashboard load, 60s TTL (`_relay_sync()` in
  `station-world/server.py`).
- Buffer: n8n workflow static data (events 5000 / leads 1000 cap). Flip to Google
  Sheets for durability once the n8n Google credential is reconnected (EXPIRED as
  of 2026-07-22 — also silently failing TC Intel nightly since ~Jul 18).
