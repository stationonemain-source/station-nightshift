# Allowance diff: what the site promises vs the Platform catalogue

Branch `exit/buy-2`, 2026-11-04. Platform = `~/station-platform/catalog/catalog.json` version `2026-11-03-draft-2` (the copy deployed on the VPS is identical for collections/plans; products read from the local file). Prices are equal everywhere; this table is the units, rates and features. Line numbers are in the branch's files. "not shown" = the site does not offer that tier at all.

**84 rows, 49 differ.** Nothing on the site was changed for this table.

| product | tier | unit | site | Platform | source | same |
|---|---|---|---|---|---|---|
| every product | all | trial allowance | "14 days free", full plan (no cap stated) | trial = 50% of the allowance, hard stop at the cap (rules.trial.allowance_factor 0.5, pause_at_cap) | every product page, pz-note / usage | **no** |
| every metered product | all | first overage | "The first time you go over, it's on us" | no grace (rules.grace_months 0; "grace month" in retired) | greet/index.html:187, lineback/index.html:254, frontdesk/index.html:254, pursuit/index.html:187 | **no** |
| every metered product | all | overage rate | "twice your plan's per-unit rate" | rules.overage_multiplier 2.0 (the tier overage figures below) | greet/index.html:187, lineback/index.html:254, frontdesk/index.html:254, pursuit/index.html:187 | yes |
| every metered product | all | usage notice | "We let you know at 80%" | meter.py notice at 80% of the cap | greet/index.html:187, lineback/index.html:254, frontdesk/index.html:254, pursuit/index.html:187 | yes |
| every metered product | all | top-up packs | no pack sizes or prices shown; only "a top-up bought ahead is cheaper" (/top-up/ sends people to the account) | packs exist per tier (below); each is cheaper per unit than that tier's overage | greet/index.html:187, lineback/index.html:254, frontdesk/index.html:254, pursuit/index.html:187, top-up/index.html | yes |
| Greet | standard | chats / month | 250 conversations | 250 | greet/index.html:185 (also :4, :152, products/index.html:232 for Standard) | yes |
| Greet | standard | overage per chat | 63¢ | $0.6320 | greet/index.html:185, :187 | yes |
| Greet | standard | top-up pack | not stated | 100 for $47 | — | yes |
| Greet | pro (Busy) | chats / month | 750 conversations | 750 | greet/index.html:185 (also :4, :152, products/index.html:232 for Standard) | yes |
| Greet | pro (Busy) | overage per chat | 40¢ | $0.3973 | greet/index.html:185, :187 | yes |
| Greet | pro (Busy) | top-up pack | not stated | 100 for $30 | — | yes |
| Greet | max (High volume) | chats / month | 1,750 conversations | 1,750 | greet/index.html:185 (also :4, :152, products/index.html:232 for Standard) | yes |
| Greet | max (High volume) | overage per chat | 28¢ | $0.2846 | greet/index.html:185, :187 | yes |
| Greet | max (High volume) | top-up pack | not stated | 100 for $21 | — | yes |
| Slate | standard | reminders / month | 1,000 reminders (text and email not split) | 100 text + 250 email reminders | slate/index.html:185, :152, llms.txt:13 | **no** |
| Slate | pro (Busy) | reminders / month | 2,500 reminder texts | 300 text + 900 email reminders | slate/index.html:185 | **no** |
| Slate | max | reminders / month | tier not shown | $147 · 400 text + 2,500 email reminders | — | **no** |
| Slate | standard | overage | not stated | $1.18 a text reminder, $0.472 an email reminder | slate/index.html:187 | **no** |
| Slate | pro (Busy) | overage | not stated | $0.6467 a text reminder, $0.2156 an email reminder | slate/index.html:187 | **no** |
| Slate | all | top-up pack | not stated | 100 text reminders for $15 | — | yes |
| Slate | all | inside Frontdesk | "free inside Frontdesk", "we'll credit you" | no Slate allowance or credit attached to Frontdesk in the catalogue | slate/index.html:4, :187, products/index.html:232 | **no** |
| Lineback | standard | texts / month | 1,500 texts | 400 | lineback/index.html:252, :211, llms.txt:14 | **no** |
| Lineback | standard | overage per text | 26¢ | $0.985 | lineback/index.html:252, :254 | **no** |
| Lineback | pro (Busy) | texts / month | 5,000 texts | 1,000 | lineback/index.html:252, :211 | **no** |
| Lineback | pro (Busy) | overage per text | 12¢ | $0.594 | lineback/index.html:252, :254 | **no** |
| Lineback | max | texts / month | tier not shown | $397 · 1,750 texts | — | **no** |
| Lineback | standard / pro | top-up pack | not stated | 200 texts for $148 / $89 | — | yes |
| Frontdesk | standard | minutes / month | 750 minutes | 500 | frontdesk/index.html:252, :211, :241 | **no** |
| Frontdesk | standard | overage per minute | $1.06 | $1.5880 | frontdesk/index.html:252, :254 | **no** |
| Frontdesk | standard | per-minute in plan | 53¢ a minute | $0.79 a minute | frontdesk/index.html:252 | **no** |
| Frontdesk | standard | top-up pack | not stated | 100 for $119 | — | yes |
| Frontdesk | pro (Busy) | minutes / month | 1,200 minutes | 900 | frontdesk/index.html:252, :211 | **no** |
| Frontdesk | pro (Busy) | overage per minute | $1.00 | $1.3267 | frontdesk/index.html:252, :254 | **no** |
| Frontdesk | pro (Busy) | per-minute in plan | 50¢ a minute | $0.66 a minute | frontdesk/index.html:252 | **no** |
| Frontdesk | pro (Busy) | top-up pack | not stated | 100 for $100 | — | yes |
| Frontdesk | max (High volume) | minutes / month | 2,500 minutes | 1,600 | frontdesk/index.html:252, :211 | **no** |
| Frontdesk | max (High volume) | overage per minute | $0.72 | $1.1213 | frontdesk/index.html:252, :254 | **no** |
| Frontdesk | max (High volume) | per-minute in plan | 36¢ a minute | $0.56 a minute | frontdesk/index.html:252 | **no** |
| Frontdesk | max (High volume) | top-up pack | not stated | 100 for $84 | — | yes |
| Frontdesk | add-on | premium voice | not stated | $39 / $49 / $99 a month by tier | — | yes |
| Tap | standard | features | tap-to-pay, text-to-pay links, estimates and invoices (unlimited), receipts | payment links and invoices only (text-to-pay and estimates are Pro $97; deposits/tipping/locations are Max $147) | tap/index.html:185, :186, llms.txt:20 | **no** |
| Tap | pro / max | tiers | not shown ("One plan") | $97 / $147 | tap/index.html:185 | **no** |
| Pursuit | standard | texts + emails / month | 2,500 texts + 15,000 emails | 1,500 texts + 4,000 emails | pursuit/index.html:185, llms.txt:16 | **no** |
| Pursuit | standard | overage | 20¢ a text, 3¢ an email | $0.3293 a text, $0.1235 an email | pursuit/index.html:185, :187 | **no** |
| Pursuit | pro (Busy) | texts + emails / month | 6,000 texts + 40,000 emails | 2,000 texts + 8,000 emails | pursuit/index.html:185 | **no** |
| Pursuit | pro (Busy) | overage | 12¢ a text, 2¢ an email | $0.347 a text, $0.0867 an email | pursuit/index.html:185, :187 | **no** |
| Pursuit | max | texts + emails / month | tier not shown | $497 · 2,750 texts + 12,000 emails | — | **no** |
| Pursuit | standard | top-up packs | not stated | 200 texts for $49 · 10,000 emails for $926 | — | yes |
| Repute | standard | review requests / month | "a review ask after every job" (no cap stated) | 300 | repute/index.html:252 | **no** |
| Repute | standard | overage per request | not stated | $1.3133 | — | **no** |
| Repute | pro / max | tiers | not shown | $297 · 1,000 requests, auto-reply to 5-star, widget / $447 · 2,000, 2 locations | — | **no** |
| Repute | extra location | price | $177 a month each | $177 (addons.extra_location_repute) | repute/index.html:252, :211 | yes |
| Echo | standard | posts | weekly Google posts + LinkedIn posts written for you | 1 Google post a week (no LinkedIn) | echo/index.html:252, llms.txt:18 | **no** |
| Echo | standard | rank report | monthly grid-rank report (grid size not stated) | 9-point Maps rank grid | echo/index.html:252 | yes |
| Echo | pro / max | tiers | not shown | $347 · 2 posts/wk, 25-pt grid / $497 · 3 posts/wk, 49-pt grid, 2 locations | — | **no** |
| Echo | extra location | price | $197 a month each | $197 (addons.extra_location_echo) | echo/index.html:252, :211, llms.txt:18 | yes |
| Marquee | standard (Self-serve) | accounts | post and schedule to 9 platforms; brand board built week one; self-serve ads on Meta and Google | up to 3 accounts, scheduling only | marquee/index.html:185, :186, products/index.html:237 (Get Found "9 networks") | **no** |
| Marquee | pro | tier | not shown | $397 · up to 6 accounts, 12 posts a month drafted for approval | — | **no** |
| Marquee | max (Managed) | posts | 12 posts a month made for you; ads built, launched, managed | 12 posts a month written and posted · ads run (spend extra) | marquee/index.html:185 | yes |
| Marquee | max (Managed) | ad management fee | +10% of spend above $2,000 a month | not in the catalogue | marquee/index.html:187 | **no** |
| Dispatch | standard (Self-serve) | emails / month | unmetered below 100,000 sends | 8,000 emails | dispatch/index.html:252, :254, :211, llms.txt:21 | **no** |
| Dispatch | standard (Self-serve) | overage per email | none (unmetered) | $0.0235 | dispatch/index.html:254 | **no** |
| Dispatch | pro | tier | not shown | $197 · 15,000 emails, 2 campaigns drafted | — | **no** |
| Dispatch | max (Managed) | emails / campaigns | 4 campaigns a month written for you, quarterly list strategy (email volume not stated) | 35,000 emails · 4 campaigns written and sent | dispatch/index.html:252, :211 | yes |
| Dispatch | standard | top-up pack | not stated | 10,000 emails for $176 | — | yes |
| Revive | standard | contacts per wave | up to 5,000 contacts | 5,000 (wave_cap) | revive/index.html:185, :152, llms.txt:23 | yes |
| Revive | standard | emails / month | not stated | 10,000 | — | yes |
| Revive | pro / max | tiers | not shown ("One plan") | $297 · 10,000 contacts / $447 · 20,000 | revive/index.html:185 | **no** |
| Revive | standard | top-up packs | not stated | 10,000 emails for $296 · 2,500 wave contacts for $129 | — | yes |
| Radar | standard | prospects / trades | 5 audited prospects a week, 3 trades | 5 a week · 3 trades | radar/index.html:185, :152, llms.txt:22 | yes |
| Radar | pro | prospects / trades | 20 a week, six trade targets | 20 a week · 6 trades | radar/index.html:185, llms.txt:22 | yes |
| Radar | max | tier | not shown | $797 · 50 a week, 10 trades, 2 areas | — | **no** |
| Answer (collection) | $349 | allowances | none stated (lists receptionist, text-back, chat, booking, number, payments) | text 400 · chat 250 · text reminders 100 · email reminders 250 · minutes 500 (each item at Standard) | products/index.html:237 | yes |
| Get Found (collection) | $497 | social posting | "Social posting to 9 networks" | Marquee standard: up to 3 accounts | products/index.html:237 | **no** |
| Get Found (collection) | $497 | review requests | not stated | 300 | products/index.html:237 | yes |
| Follow Up (collection) | $437 | allowances | none stated | texts 1,500 · emails 22,000 (Pursuit 4,000 + Revive 10,000 + Dispatch 8,000) | products/index.html:237 | yes |
| Core (plan) | $1,497 | receptionist minutes | AI receptionist, 750 minutes | 500 | products/index.html:238 | **no** |
| Core (plan) | $1,497 | website | a free Station-built website | "website": "custom"; Stripe: "plus a free Station-built website" | products/index.html:238 | yes |
| Pro (plan) | $2,497 | social posts | 12 social posts a month, written and posted | Marquee pro: 12 drafted for approval, up to 6 accounts | products/index.html:238, llms.txt:33 | **no** |
| Pro (plan) | $2,497 | email campaigns | 4 email campaigns a month, written and sent | Dispatch pro: 2 campaigns drafted, 15,000 emails | products/index.html:238, llms.txt:33 | **no** |
| Pro (plan) | $2,497 | receptionist minutes | not stated (busy tier = 1,200 on /frontdesk/) | 900 | products/index.html:238 | **no** |
| Max (plan) | $3,897 | receptionist minutes | AI receptionist, 2,500 minutes | 1,600 | products/index.html:238 | **no** |
| Max (plan) | $3,897 | support | priority support and a quarterly review call | "priority support" is in retired | products/index.html:238 | **no** |
| Max (plan) | $3,897 | website | a custom-designed website | "website": "custom" | products/index.html:238 | yes |
