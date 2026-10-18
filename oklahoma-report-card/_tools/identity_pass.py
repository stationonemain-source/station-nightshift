#!/usr/bin/env python3
"""
identity_pass.py - re-reads every graded site's home page text (no checks, just the text) and applies
the identity rules the gate now has: civic/school words, tiny placeholder pages, parked markers,
hosting splash titles. Writes `identity` into each row; rows that fail are listed for a re-scan.

  python -I identity_pass.py [--workers 8]
"""
import argparse, asyncio, json, os, re, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import scan  # noqa: E402  (for the regexes and UA handling)

P = os.path.join(HERE, "data", "results.jsonl")


async def read_text(browser, url):
    ctx = await browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True,
                                    ignore_https_errors=True, user_agent=scan.UA)
    pg = await ctx.new_page()
    try:
        try:
            await pg.goto(url, wait_until="load", timeout=35000)
        except Exception:
            pass
        await pg.wait_for_timeout(1500)
        data = await asyncio.wait_for(pg.evaluate("() => ({title: document.title||'', text: (document.body? document.body.innerText : '')||'', lang: document.documentElement.getAttribute('lang')||'', navText: Array.from(document.querySelectorAll('a, nav, li, button, h1, h2, h3, h4, h5, h6, footer, label, option')).map(e => (e.textContent||'').trim()).filter(Boolean).join(' | ').slice(0,120000)})"), 20)
        data["final_url"] = pg.url
        return data
    except Exception as e:
        return {"error": f"{type(e).__name__}: {str(e)[:100]}"}
    finally:
        await ctx.close()


def judge(r, ent, data):
    if data.get("error"):
        return {"ok": None, "why": "could not re-read the page: " + data["error"]}
    text = data.get("text") or ""
    title = (data.get("title") or "").strip()
    hay = re.sub(r"\s+", " ", (title + "\n" + text[:200000]).lower())
    if scan.PARKED.search(hay):
        return {"ok": False, "why": "parked domain page"}
    if scan.PLACEHOLDER_TITLE.search(title):
        return {"ok": False, "why": f"the address serves a placeholder page ({title[:40]}), not a website"}
    words = scan.SCHOOL_WORDS if ent["type"] == "district" else scan.CIVIC_WORDS
    hits = sorted({m.group(0).lower() for m in words.finditer(text[:200000] + " | " + (data.get("navText") or ""))})
    authoritative = bool(scan.AUTHORITATIVE_HOST.search(scan.host_of(data.get("final_url") or r.get("site") or "")))
    name_in_text = any(t.lower() in hay for t in ent["tokens"]) or (ent["type"] == "district" and any(t.lower() in hay for t in ent.get("city_tokens") or []))
    if not name_in_text and len(text.strip()) < 200:
        return {"ok": False, "why": "the page has almost no content and does not mention the entity (a placeholder)"}
    strong = scan.STRONG_SCHOOL if ent["type"] == "district" else scan.STRONG_CIVIC
    kind = "school" if ent["type"] == "district" else "government"
    if (len(hits) < 2 or not any(strong.search(h) for h in hits)) and not authoritative:
        return {"ok": False, "why": f"the page mentions the name but not the usual {kind} words (found {', '.join(hits) if hits else 'none'}), so it does not look like the entity's own site", "hits": hits}
    body = re.sub(r"skip to (main )?(content|navigation)", "", text[:600], flags=re.I).strip()
    if len(text.strip()) < 600 and re.search(r"under construction|coming soon|site is being (built|updated)|check back soon", body, re.I):
        return {"ok": False, "why": "the address serves a page that says it is under construction, so there is nothing to grade yet"}
    return {"ok": True, "hits": hits[:12]}


async def worker(q, browser, ents, out):
    while True:
        r = await q.get()
        if r is None:
            q.task_done()
            return
        data = await read_text(browser, r["site"])
        r["identity"] = judge(r, ents[r["id"]], data)
        out.append(r)
        print(f"{r['name'][:36]:36} {'OK ' if r['identity'].get('ok') else 'NO ' if r['identity'].get('ok') is False else '?? '} {r['identity'].get('why', '')[:90]}", flush=True)
        q.task_done()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--ids", default=None, help="comma-separated ids, or a path to a JSON list")
    a = ap.parse_args()
    ents = {e["id"]: e for e in json.load(open(os.path.join(HERE, "data", "entities.json"), encoding="utf-8"))}
    rows = [json.loads(l) for l in open(P, encoding="utf-8") if l.strip()]
    todo = [r for r in rows if r.get("outcome") == "scanned" and r.get("site")]
    if a.ids:
        want = set(json.load(open(a.ids))) if a.ids.endswith(".json") else set(a.ids.split(","))
        todo = [r for r in todo if r["id"] in want]
    print(f"{len(todo)} graded sites to re-read", flush=True)
    exe = os.path.join(os.environ.get("LOCALAPPDATA", ""), "ms-playwright", "chromium_headless_shell-1228", "chrome-headless-shell-win64", "chrome-headless-shell.exe")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path=exe if os.path.exists(exe) else None)
        ctx = await browser.new_context()
        pg = await ctx.new_page()
        scan.UA = (await pg.evaluate("navigator.userAgent")).replace("HeadlessChrome", "Chrome") + " " + scan.BOT
        await ctx.close()
        q = asyncio.Queue()
        for r in todo:
            q.put_nowait(r)
        for _ in range(a.workers):
            q.put_nowait(None)
        out = []
        await asyncio.gather(*[worker(q, browser, ents, out) for _ in range(a.workers)])
        await browser.close()
    byid = {r["id"]: r for r in out}
    with open(P, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(byid.get(r["id"], r), ensure_ascii=False) + "\n")
    bad = [r for r in out if r["identity"].get("ok") is False]
    unk = [r for r in out if r["identity"].get("ok") is None]
    print(f"\nfailed identity: {len(bad)}; could not re-read: {len(unk)}")
    for r in bad:
        print("  NO", r["type"], r["name"], r["site"], "|", r["identity"]["why"][:120])
    json.dump([r["id"] for r in bad], open(os.path.join(HERE, "data", "identity_failed_ids.json"), "w"))


if __name__ == "__main__":
    asyncio.run(main())
