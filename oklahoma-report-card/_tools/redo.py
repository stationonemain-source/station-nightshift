#!/usr/bin/env python3
"""
redo.py - drop rows from results.jsonl so scan.py re-checks them (it skips ids already present).

  python -I redo.py --where links-timeout      # link checks that ran out of time
  python -I redo.py --where signin             # candidates refused as "does not mention" that were really sign-in pages
  python -I redo.py --ids nces-4003570,fips-40057
Prints the ids it removed. A dated backup of results.jsonl is written first.
"""
import argparse, json, os, shutil, datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "data", "results.jsonl")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--where", default=None)
    ap.add_argument("--ids", default=None)
    a = ap.parse_args()
    rows = [json.loads(l) for l in open(P, encoding="utf-8") if l.strip()]
    want = set((a.ids or "").split(",")) - {""}
    drop = set()
    for r in rows:
        if r["id"] in want:
            drop.add(r["id"])
        if a.where == "links-timeout":
            lk = (r.get("checks") or {}).get("links") or {}
            if lk.get("status") == "couldnt" and "out of time" in (lk.get("reason") or ""):
                drop.add(r["id"])
        if a.where == "signin":
            for t in r.get("tried") or []:
                if "does not mention" in (t.get("outcome") or "") and "sites.google.com" in (t.get("url") or ""):
                    drop.add(r["id"])
        if a.where == "vendor":
            from urllib.parse import urlsplit
            h = (urlsplit(r.get("site") or "").hostname or "").lower()
            h = h[4:] if h.startswith("www.") else h
            if h in {"connectionsacademy.com", "k12.com", "insightschools.net", "stridelearning.com", "connectionseducation.com"}                     and not (urlsplit(r.get("site") or "").path or "/").strip("/"):
                drop.add(r["id"])
        if a.where == "changed":
            import json as _j
            if r["id"] in set(_j.load(open(os.path.join(HERE, "data", "changed_ids.json")))):
                drop.add(r["id"])
        if a.where == "errors":
            if r.get("outcome") in ("timeout", "error"):
                drop.add(r["id"])
    shutil.copyfile(P, P + ".bak-" + dt.datetime.now().strftime("%Y%m%d-%H%M%S"))
    keep = [r for r in rows if r["id"] not in drop]
    with open(P, "w", encoding="utf-8") as f:
        for r in keep:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"removed {len(drop)} rows, kept {len(keep)}")
    print(",".join(sorted(drop)))


if __name__ == "__main__":
    main()
