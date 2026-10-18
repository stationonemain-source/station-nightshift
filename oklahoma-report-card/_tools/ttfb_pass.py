#!/usr/bin/env python3
"""
ttfb_pass.py - re-measure time to first byte for every scanned site in a quiet pass (low concurrency,
no browser), because the main scan measured it while ten page loads were saturating the CPU.

Keeps the scan-time figure as checks.speed.ttfb_s_scan and writes the quiet figure (best of two
requests, a second apart) into checks.speed.ttfb_s. Also records when the pass ran.

  python -I ttfb_pass.py [--results data/results.jsonl] [--workers 4]
"""
import argparse, asyncio, json, os, time, datetime as dt
import httpx

HERE = os.path.dirname(os.path.abspath(__file__))
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 "
      "StationReportCard/1.0 (+https://station.solutions/oklahoma-report-card/methodology/)")


async def measure(client, url):
    best = None
    for i in range(2):
        try:
            t0 = time.monotonic()
            async with client.stream("GET", url, follow_redirects=False) as r:
                ttfb = time.monotonic() - t0
                await r.aread()
            if 200 <= r.status_code < 400:
                best = ttfb if best is None else min(best, ttfb)
        except Exception:
            pass
        await asyncio.sleep(1.0)
    return None if best is None else round(best, 3)


async def worker(q, client, out):
    while True:
        r = await q.get()
        if r is None:
            q.task_done()
            return
        sp = (r.get("checks") or {}).get("speed") or {}
        if r.get("site") and sp.get("status") == "ok":
            v = await measure(client, r["site"])
            if v is not None:
                sp["ttfb_s_scan"] = sp.get("ttfb_s")
                sp["ttfb_s"] = v
                sp["ttfb_quiet_pass_at"] = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        out.append(r)
        q.task_done()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", default=os.path.join(HERE, "data", "results.jsonl"))
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    rows = [json.loads(l) for l in open(a.results, encoding="utf-8") if l.strip()]
    q = asyncio.Queue()
    for r in rows:
        q.put_nowait(r)
    for _ in range(a.workers):
        q.put_nowait(None)
    out = []
    async with httpx.AsyncClient(headers={"User-Agent": UA, "Accept": "text/html,*/*;q=0.8"}, timeout=httpx.Timeout(20.0, connect=10.0),
                                 limits=httpx.Limits(max_connections=8)) as client:
        await asyncio.gather(*[worker(q, client, out) for _ in range(a.workers)])
    byid = {r["id"]: r for r in out}
    with open(a.results, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(byid.get(r["id"], r), ensure_ascii=False) + "\n")
    changed = [r for r in out if ((r.get("checks") or {}).get("speed") or {}).get("ttfb_s_scan") is not None]
    print(f"re-measured {len(changed)} of {len(rows)}")
    worse = sum(1 for r in changed if r["checks"]["speed"]["ttfb_s"] > r["checks"]["speed"]["ttfb_s_scan"])
    print(f"quiet figure lower than scan figure for {len(changed) - worse}, higher for {worse}")


if __name__ == "__main__":
    asyncio.run(main())
