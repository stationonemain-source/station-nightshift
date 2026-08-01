# CAMBER Auto Works — Precision Auto Care
### Station auto-shop niche template (#10) · Concept: THE INSPECTION

**Camber** (n.) — the precise angle at which a wheel meets the road.
The name is the promise: a shop that measures everything.

Fictional shop, Houston TX. Two tiers from ONE content file (`content.js`):
- `/` — **Premium**: the digital-inspection scroll experience. Dark garage-noir
  that resolves to a clean daylight workshop. $15k-site energy, zero AI-slop risk
  (pure-code signature — the HALATION lesson: Lane A for real processes).
- `/simple/` — **Simple**: calm, light, trustworthy one-pager. What most shops buy.

**The narrative glue:** CAMBER's real differentiator is the 50-point digital
inspection texted to every customer. The premium page IS that inspection —
the visitor's scroll performs one on a car.

---

## Palette (design tokens)

| Token | Value | Role |
|---|---|---|
| `--asphalt` | `#0B0C0E` | night-shop black (cool, near-black) |
| `--carbon` | `#15171B` | panel / card surface on dark |
| `--amber` | `#F0A32F` | work-light amber — the only warm on dark |
| `--amber-dim` | `#7A5417` | dying-lamp amber for glows/rules |
| `--steel` | `#8B919A` | steel gray — captions, readouts |
| `--bone` | `#EFECE5` | daylight-workshop light sections + simple tier |
| `--bone-dim` | `#E2DDD2` | secondary light surface |
| `--pass` | `#2FA36B` | semantic only — PASS stamps, spec-ok ticks |

Journey: premium opens **asphalt + amber** (night diagnostic) and resolves to
**bone** (clean daylight workshop) → back to dark for the booking bay + footer.

## Type

- **Archivo** (variable: wght + wdth) — wordmark at wide/black (license-plate,
  motorsport-plate energy), body at normal width. One family, two personalities.
- **IBM Plex Mono** — instrumentation: VIN readouts, torque specs, service-log
  entries, PASS stamps, prices.

## Photo direction (one photographic eye)

Night shift in an immaculate premium workshop. Single-source warm tungsten work
lamps against deep cool shadows, polished-concrete reflections, shallow DOF,
35mm cinematic grade. Hero car: classic silver air-cooled coupe (timeless, not
brand-specific). 10 stills, nano_banana_2 @ 2k, 2cr each = 20 credits.

## Premium storyboard

1. **INTAKE** — full-bleed hero photo (coupe on the lift, amber pools). Huge
   CAMBER wordmark. Mono readout: `BAY 02 · INTAKE ACCEPTED · ODO 84,212`.
   Cue: "begin inspection ↓"
2. **THE INSPECTION** (signature, pinned ~320vh) — blueprint grid dark stage.
   A hand-drawn SVG coupe (amber linework) draws itself in, rises on a two-post
   lift as scroll scrubs; a scan line sweeps; four systems check in one at a
   time with live mono spec readouts → `SET TO SPEC` stamps:
   BRAKES (rotor mm, pad %) → SUSPENSION (camber °, toe) → OIL & ENGINE
   (torque N·m, temp) → ALIGNMENT (all four corners green).
   Ends: `50-POINT INSPECTION · COMPLETE` + verdict line.
3. **LIGHTS ON** — dark snaps to bone. Manifesto: "We measure. Then we fix."
   Stats band (years, cars serviced, warranty mi).
4. **THE SERVICE MENU** — editorial rows on bone: six services, each with mono
   spec sub-line + from-price. Amber sweep hover.
5. **THE SHOP** — photo trio + master-tech story block.
6. **THE LOGBOOK** — reviews styled as service-log entries (mono date · vehicle
   · note), broken-grid.
7. **BOOK YOUR BAY** — back to asphalt. Phone CTA, hours, address, warranty
   badges (36-mo/36k-mi, ASE, digital report).
8. Footer — dark, real social SVGs.

## Simple storyboard

Light bone one-pager: sticky header, hero photo + headline + call CTA,
trust badge row, services grid (cards), about + photo, reviews, hours/contact
split, footer. Reveal-on-scroll only, no pinning. Calm = trust.

## Verification

Dev contract in both tiers: `?jump=<y>` force-settled + `window.__ready`.
verify.js (puppeteer-core + system Chrome): screenshot every beat + jank test
(p95/max rAF deltas, target max < 50ms). Breakpoints 320/768/1024/1440.
