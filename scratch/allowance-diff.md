# Allowance diff: what the site promises vs the Platform catalogue

Branch `exit/buy-2`, re-run 2026-11-04 after the alignment. Platform = `~/station-platform/catalog/catalog.json` at build/platform `64a996f` (deployed, Stripe re-synced). Generated product pages were regenerated from the PC generator (inputs edited there). Platform figures below are read from the file by the script that wrote this table.

**49 rows: 43 match, 0 differ unexplained, 6 kept with a reason** (Tap page story, Echo/Dispatch hand-done extras, Marquee managed ad fee, tiers the site does not offer, Pursuit sequence length).

| product | tier | unit | site | Platform | source | same |
|---|---|---|---|---|---|---|
| every product | all | trial allowance | "14 days free from the day your first product goes live; the trial includes half your monthly allowance." | rules.trial: 14 days from go-live, allowance_factor 0.5, use stops at the cap | every product page usage (:187 / :254), products/index.html:239, checkout/index.html:56, legal/tos.html §4 | yes |
| every metered product | all | first overage | no free month; billed from the first month (the "on us" line is gone) | rules.grace_months 0 | usage paragraphs, legal/tos.html §4, partners/guide.md | yes |
| every metered product | all | overage rate | "twice your plan's per-unit rate" | rules.overage_multiplier 2.0; each tier figure below equals 2 x price / allowance | usage paragraphs | yes |
| every metered product | all | usage notice | "We let you know at 80%" | meter.py notice at 80% | usage paragraphs | yes |
| every metered product | all | limit on extras | Terms §4: extras pause at the monthly limit on extras you set (product pages do not mention it) | meter.py: overage capped by the client's monthly limit; no limit = no extras | legal/tos.html §4 | yes |
| every metered product | all | top-up packs | "a top-up bought ahead is cheaper" (no pack sizes shown) | every pack is cheaper per unit than that tier's overage (checked per row below) | usage paragraphs | yes |
| Greet | Standard | chats / month | 250 conversations | 250 | greet/index.html:185 | yes |
| Greet | Standard | overage | 63¢ a chat | $0.6320 | greet/index.html:185, :187 | yes |
| Greet | Busy | chats / month | 750 conversations | 750 | greet/index.html:185 | yes |
| Greet | Busy | overage | 40¢ a chat | $0.3973 | greet/index.html:185, :187 | yes |
| Greet | High volume | chats / month | 1,750 conversations | 1,750 | greet/index.html:185 | yes |
| Greet | High volume | overage | 28¢ a chat | $0.2846 | greet/index.html:185, :187 | yes |
| Slate | Standard | reminders + overage | 250 text + 1,000 email reminders; over: 47¢ / 12¢ | 250 text + 1,000 email; $0.4720 / $0.1180 | slate/index.html:185, :187, :152, llms.txt:13 | yes |
| Slate | Busy | reminders + overage | 500 text + 2,500 email reminders; over: 39¢ / 8¢ | 500 text + 2,500 email; $0.3880 / $0.0776 | slate/index.html:185, :187, :152, llms.txt:13 | yes |
| Slate | all | inside Frontdesk | not included in Frontdesk (the "free inside / we'll credit you" lines are gone) | no Slate in Frontdesk | slate/index.html, frontdesk/index.html, products/index.html:232 | yes |
| Lineback | Standard | texts / month | 1,450 texts | 1,450 | lineback/index.html:252, :211, :244, llms.txt:14 | yes |
| Lineback | Standard | overage | 27¢ a text | $0.2717 | lineback/index.html:252, :254 | yes |
| Lineback | Busy | texts / month | 2,000 texts | 2,000 | lineback/index.html:252, :211, :244, llms.txt:14 | yes |
| Lineback | Busy | overage | 30¢ a text | $0.2970 | lineback/index.html:252, :254 | yes |
| Frontdesk | Standard | minutes / overage / per-minute in plan | 750 minutes; over: $1.06 a minute; 53¢ a minute in plan | 750; $1.0587; $0.5293 | frontdesk/index.html:252, :254, :211 | yes |
| Frontdesk | Busy | minutes / overage / per-minute in plan | 1,200 minutes; over: $1.00 a minute; 50¢ a minute in plan | 1,200; $0.9950; $0.4975 | frontdesk/index.html:252, :254, :211 | yes |
| Frontdesk | High volume | minutes / overage / per-minute in plan | 2,500 minutes; over: $0.72 a minute; 36¢ a minute in plan | 2,500; $0.7176; $0.3588 | frontdesk/index.html:252, :254, :211 | yes |
| Frontdesk | all | booking | books into your calendar; Slate ($59) adds the booking page and reminders | setup step "calendar"; Slate is a separate product | frontdesk/index.html:244-252 | yes |
| Tap | Standard | tier features | Payment links · Invoices | Payment links and invoices | tap/index.html:185, :186 | yes |
| Tap | page story | features | title, description, hero, steps and the side panel still sell tap-to-pay, text-to-pay and estimates at $47 | those are Tap Pro ($97: text-to-pay, estimates) / not in any tier (tap-to-pay) | tap/index.html:3-6, :121, :148-181, :185 side; dial/index.html:193 | kept: the page is built around those features and the site only sells Standard; Circle decides: sell Tap Pro on the page, or rewrite the story |
| Pursuit | Standard | texts + emails / overage | 1,500 texts + 15,000 emails; over 33¢ a text, 3¢ an email | 1,500 + 15,000; $0.3293 / $0.0329 | pursuit/index.html:185, :187, llms.txt:16 | yes |
| Pursuit | Busy | texts + emails / overage | 2,000 texts + 40,000 emails; over 35¢ a text, 2¢ an email | 2,000 + 40,000; $0.3470 / $0.0174 | pursuit/index.html:185, :187, llms.txt:16 | yes |
| Repute | Standard | review requests / overage | 300 review requests a month; over 300: $1.31 a request | 300; $1.3133 | repute/index.html:252, :254 | yes |
| Repute | Standard | replies | every reply a draft you approve (auto-reply panel removed) | 300 review requests · reply drafts (auto-reply to 5-star is Pro) | repute/index.html:244-252 | yes |
| Repute | extra location | price | $177 a month each | $177 | repute/index.html:252, :211 | yes |
| Echo | Standard | posts / report | one Google post a week; monthly 9-point map-rank report; no LinkedIn | 1 post a week · 9-point Maps rank grid · profile fixes | echo/index.html:252, :254, llms.txt:18 | yes |
| Echo | Standard | extras named on the page | setup, citation sweep, weekly listing watch, monthly photos | "profile fixes" (gets is a one-line summary) | echo/index.html:244-252 | kept: service work Station does by hand inside "profile fixes"; nothing metered |
| Echo | extra location | price | $197 a month each | $197 | echo/index.html:252 | yes |
| Marquee | Self-serve | features | schedule and post to up to 3 accounts; content calendar | Schedule and post to up to 3 accounts | marquee/index.html:185, :187, products/index.html:232, :237 | yes |
| Marquee | Managed | features | 12 posts a month made for you; ads built, launched and managed | 12 posts a month written and posted · ads run (ad spend extra) | marquee/index.html:185 | yes |
| Marquee | Managed | ad fee | +10% of spend above $2,000 a month | not in the catalogue | marquee/index.html:187 | kept: billed by hand (coordinator, 11-04) |
| Dispatch | Self-serve | emails / overage | 8,000 emails a month; 2.35¢ over | 8,000; $0.0235 | dispatch/index.html:252, :254, :211, llms.txt:21 | yes |
| Dispatch | Managed | emails / campaigns / overage | 35,000 emails; 4 campaigns written for you; 2.27¢ over | 35,000; 4 written and sent; $0.0227 | dispatch/index.html:252, :254, :211 | yes |
| Dispatch | Managed | extra named on the page | quarterly list strategy | not in gets | dispatch/index.html:252 | kept: service work done by hand; nothing metered |
| Revive | Standard | contacts per wave | up to 5,000 contacts | 5,000 (wave_cap) | revive/index.html:185, :152 | yes |
| Radar | Standard | prospects | 5 a week, 3 trades | 5 prospects a week · 3 trades | radar/index.html:185 | yes |
| Radar | Pro | prospects | 20 a week, six trade targets | 20 prospects a week · 6 trades | radar/index.html:185 | yes |
| several | Lineback/Slate/Pursuit Max, Tap Pro/Max, Repute/Echo/Marquee/Dispatch Pro, Revive Pro/Max, Radar Max | tiers | not offered on the site | exist in the catalogue | — | kept: the site sells a subset; nothing is promised about them (Lineback Max 1,750 texts is below Busy 2,000 in the catalogue: worth a look on the Platform side) |
| Answer (collection) | $349 | allowances | none named, by design | text 400 · chat 250 · reminders 250 + 1,000 · minutes 500 | products/index.html:237 | yes |
| Get Found (collection) | $497 | social | social scheduling, up to 3 accounts | Marquee standard: up to 3 accounts | products/index.html:237 | yes |
| Core (plan) | $1,497 | receptionist minutes | AI receptionist, 750 minutes | 750 | products/index.html:238 | yes |
| Pro (plan) | $2,497 | social / email | 12 social posts a month drafted for your approval; 2 email campaigns drafted | Marquee pro: 12 drafted to approve; Dispatch pro: 2 drafted | products/index.html:238, llms.txt:33 | yes |
| Max (plan) | $3,897 | receptionist / support | AI receptionist, 2,500 minutes; priority support and the quarterly review call removed | 2,500 minutes; "priority support" retired; no quarterly call anywhere in the Platform or its STATE | products/index.html:238 | yes |
| Pursuit | all | sequence length | "five touches over ten days" | sequences.py: 5 texts + 5 emails over 14 days | pursuit/index.html:120-122 (steps) | kept: wording about the sequence, not an allowance; flag for the Platform or the copy |
