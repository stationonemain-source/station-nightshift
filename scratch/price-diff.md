# Price diff: what the site shows vs the Platform price file

Branch `exit/buy`, 2026-11-03. **No displayed price was changed on this branch.** This table is what the separate price-switch branch will change: the left number is what a visitor sees today, the right number is `station-platform/catalog/catalog.json` (version `2026-10-18-draft-1`, status "draft: approved plan, not live") for the same lookup key.

Tier mapping used for the buy buttons: product page default / Standard / Self-serve = `*_standard_v2`; Busy / Pro = `*_pro_v2`; High volume / Managed ("Have us run it") = `*_max_v2`. Echo is `map` on the site and `echo` on the Platform.

| Where on the site | Label as shown | Site price | Platform lookup key | Platform price | Delta |
|---|---|---|---|---|---|
| catalog line (cart, shelf, search) | Greet · $79 /mo | $79 | `greet_standard_v2` | $79 | same |
| catalog line (cart, shelf, search) | Slate · $59 /mo | $59 | `slate_standard_v2` | $39 | -20 |
| catalog line (cart, shelf, search) | Lineback · $197 /mo | $197 | `lineback_standard_v2` | $79 | -118 |
| catalog line (cart, shelf, search) | Frontdesk · $397 /mo | $397 | `frontdesk_standard_v2` | $199 | -198 |
| catalog line (cart, shelf, search) | Pursuit · $247 /mo | $247 | `pursuit_standard_v2` | $247 | same |
| catalog line (cart, shelf, search) | Repute · $197 /mo | $197 | `repute_standard_v2` | $197 | same |
| catalog line (cart, shelf, search) | Echo · $247 /mo | $247 | `echo_standard_v2` | $247 | same |
| catalog line (cart, shelf, search) | Dispatch · $94 /mo | $94 | `dispatch_standard_v2` | $94 | same |
| catalog line (cart, shelf, search) | Revive · $197 /mo | $197 | `revive_standard_v2` | $197 | same |
| catalog line (cart, shelf, search) | Radar · $297 /mo | $297 | `radar_standard_v2` | $297 | same |
| catalog line (cart, shelf, search) | Tap · $47 /mo + card rates | $47 | `tap_standard_v2` | $47 | same |
| catalog line (cart, shelf, search) | Marquee · $197 /mo | $197 | `marquee_standard_v2` | $197 | same |
| /lineback/ tier card | Standard · $197/month | $197 | `lineback_standard_v2` | $79 | -118 |
| /lineback/ tier card | Busy · $297/month | $297 | `lineback_pro_v2` | $149 | -148 |
| /pursuit/ tier card | Standard · $247/month | $247 | `pursuit_standard_v2` | $247 | same |
| /pursuit/ tier card | Busy · $347/month | $347 | `pursuit_pro_v2` | $347 | same |
| /slate/ tier card | Standard · $59/month | $59 | `slate_standard_v2` | $39 | -20 |
| /slate/ tier card | Busy · $97/month | $97 | `slate_pro_v2` | $69 | -28 |
| /tap/ tier card | Standard · $47/month | $47 | `tap_standard_v2` | $47 | same |
| /repute/ tier card | Standard · $197/month | $197 | `repute_standard_v2` | $197 | same |
| /repute/ tier card | More locations · $177/month each | $177 | `extra_location_repute` | $177 | same |
| /echo/ tier card | Standard · $247/month | $247 | `echo_standard_v2` | $247 | same |
| /echo/ tier card | More locations · $197/month each | $197 | `extra_location_echo` | $197 | same |
| /greet/ tier card | Standard · $79/month | $79 | `greet_standard_v2` | $79 | same |
| /greet/ tier card | Busy · $149/month | $149 | `greet_pro_v2` | $149 | same |
| /greet/ tier card | High volume · $249/month | $249 | `greet_max_v2` | $249 | same |
| /marquee/ tier card | Self-serve · $197/month | $197 | `marquee_standard_v2` | $197 | same |
| /marquee/ tier card | Managed · $597/month + ad spend | $597 | `marquee_max_v2` | $597 | same |
| /dispatch/ tier card | Self-serve · $94/month | $94 | `dispatch_standard_v2` | $94 | same |
| /dispatch/ tier card | Managed · $397/month | $397 | `dispatch_max_v2` | $397 | same |
| /revive/ tier card | Monthly · $197/month | $197 | `revive_standard_v2` | $197 | same |
| /radar/ tier card | Standard · $297/month | $297 | `radar_standard_v2` | $297 | same |
| /radar/ tier card | Pro · $497/month | $497 | `radar_pro_v2` | $497 | same |
| /frontdesk/ tier card | Standard · $397/month | $397 | `frontdesk_standard_v2` | $199 | -198 |
| /frontdesk/ tier card | Busy · $597/month | $597 | `frontdesk_pro_v2` | $349 | -248 |
| /frontdesk/ tier card | High volume · $897/month | $897 | `frontdesk_max_v2` | $599 | -298 |
| /products/ collection | Get Found · $497/month | $497 | `collection_get_found_v2` | $497 | same |
| /products/ collection | Answer · $297/month | $297 | `collection_answer_v2` | $349 | +52 |
| /products/ collection | Follow Up · $427/month | $427 | `collection_follow_up_v2` | $437 | +10 |
| /products/ plan | Core · $1,297/mo | $1,297 | `plan_core_v2` | $1,497 | +200 |
| /products/ plan | Pro · $2,197/mo | $2,197 | `plan_pro_v2` | $2,497 | +300 |
| /products/ plan | Max · $2,797/mo | $2,797 | `plan_max_v2` | $3,897 | +1100 |
| /top-up/ pack (retired page) | Greet Standard · 100 chats · $47 | $47 | `topup_greet_standard_chat_v2` | $47 | same |
| /top-up/ pack (retired page) | Greet Busy · 100 chats · $30 | $30 | `topup_greet_pro_chat_v2` | $30 | same |
| /top-up/ pack (retired page) | Greet High volume · 100 chats · $21 | $21 | `topup_greet_max_chat_v2` | $21 | same |
| /top-up/ pack (retired page) | Lineback Standard · 500 texts · $98 (pack is 200 texts on the Platform) | $98 | `topup_lineback_standard_text_v2` | $59 | different pack size |
| /top-up/ pack (retired page) | Lineback Busy · 500 texts · $45 (pack is 200 texts on the Platform) | $45 | `topup_lineback_pro_text_v2` | $45 | different pack size |
| /top-up/ pack (retired page) | Frontdesk Standard · 100 minutes · $79 | $79 | `topup_frontdesk_standard_minute_v2` | $60 | -19 |
| /top-up/ pack (retired page) | Frontdesk Busy · 100 minutes · $75 | $75 | `topup_frontdesk_pro_minute_v2` | $60 | -15 |
| /top-up/ pack (retired page) | Frontdesk High volume · 100 minutes · $54 | $54 | `topup_frontdesk_max_minute_v2` | $60 | +6 |
| /top-up/ pack (retired page) | Dial Standard · 500 texts · $35 | $35 | `(Dial retired, no key)` | — |  |
| /top-up/ pack (retired page) | Pursuit Standard · 1000 texts · $148 (pack is 200 texts on the Platform) | $148 | `topup_pursuit_standard_text_v2` | $49 | different pack size |
| /top-up/ pack (retired page) | Pursuit Busy · 1000 texts · $87 (pack is 200 texts on the Platform) | $87 | `topup_pursuit_pro_text_v2` | $52 | different pack size |

**22 of 53 prices differ.** Not on the Platform at all: yearly collection/plan prices (the Monthly/Yearly switch on /products/ is hidden on this branch), the Marquee Managed tier until Meta approves Station (its key `marquee_max_v2` exists: $597 on both sides), Dial (retired).

Also shown on the site but not keyed: `llms.txt` repeats the Standard prices above; `partners/products.json` is the partner engine's own price authority and was not touched here.
