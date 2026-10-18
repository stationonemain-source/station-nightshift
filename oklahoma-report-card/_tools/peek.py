#!/usr/bin/env python3
"""
peek.py - screenshots of the top N and bottom N graded sites at phone width, for the
"are we being retarded?" pass. Writes data/peek/<rank>-<slug>.png and prints the grade lines.

  python -I peek.py --n 10 [--type district]
"""
import argparse, asyncio, json, os, sys
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from scoring import rescore  # noqa: E402


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=10)
    ap.add_argument("--type", default=None)
    a = ap.parse_args()
    rows = [json.loads(l) for l in open(os.path.join(HERE, "data", "results.jsonl"), encoding="utf-8") if l.strip()]
    for r in rows:
        rescore(r)
    g = [r for r in rows if r.get("score") is not None and (not a.type or r["type"] == a.type)]
    g.sort(key=lambda r: (-r["score"], r["name"]))
    pick = [("top", i + 1, r) for i, r in enumerate(g[:a.n])] + [("bottom", len(g) - i, r) for i, r in enumerate(reversed(g[-a.n:]))]
    out = os.path.join(HERE, "data", "peek")
    os.makedirs(out, exist_ok=True)
    exe = os.path.join(os.environ.get("LOCALAPPDATA", ""), "ms-playwright", "chromium_headless_shell-1228", "chrome-headless-shell-win64", "chrome-headless-shell.exe")
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, executable_path=exe if os.path.exists(exe) else None)
        for which, rank, r in pick:
            ctx = await b.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=1, is_mobile=True, has_touch=True, ignore_https_errors=True)
            pg = await ctx.new_page()
            fn = os.path.join(out, f"{which}-{rank:03d}-{r['slug']}.png")
            try:
                await pg.goto(r["site"], wait_until="load", timeout=35000)
                await pg.wait_for_timeout(2500)
                await pg.screenshot(path=fn, full_page=False)
            except Exception as e:
                print("ERR", r["name"], e)
            await ctx.close()
            c = r["checks"]
            print(f"{which:6} #{rank:3} {r['grade']} {r['score']:5.1f} {r['name'][:38]:38} {r['site']}")
            print("        " + " | ".join(f"{k}:{(c.get(k) or {}).get('score', '-')}" for k in ("https", "mobile", "accessibility", "freshness", "links", "contact", "speed", "required")))
        await b.close()


if __name__ == "__main__":
    asyncio.run(main())
