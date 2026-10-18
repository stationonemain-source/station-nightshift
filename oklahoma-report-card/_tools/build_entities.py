#!/usr/bin/env python3
"""
build_entities.py - the entity list for the Oklahoma Public-Entity Website Report Card.

Sources (all read-only):
  data/ccd_lea_2223.csv       NCES Common Core of Data LEA directory 2022-23 (Quorum's cache of the
                              federal file). Every Oklahoma LEA with its WEBSITE column.
  data/leads.jsonl            Quorum's lead store, copied from the VPS. Its canonical_url values were
                              corroborated by Quorum (name + city on the fetched page), so they rank first.
  data/wikidata_counties.json Wikidata: items that are counties located in Oklahoma, with P856 (official website).
  data/wikidata_munis.json    Wikidata: cities/towns located in Oklahoma, with P856 and P1082 (population).

Output: data/entities.json - one row per entity with ordered site candidates. Nothing here decides
which candidate is the official site; scan.py fetches each candidate in order and keeps the first one
whose page answers to the entity's name (the corroboration gate).
"""
import csv, io, json, re, sys, os
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
OKC_REG = {}
D = os.path.join(HERE, "data")

GENERIC = set("""public schools school district districts isd ind independent of the city town county consolidated
unified dist charter academy academies elementary high middle community college learning center centre
oklahoma ok inc llc board education technology technologies science sciences arts virtual online program programs
prep preparatory college k12 k-12 and & ps pcs jr sr mid dept department unit union area rural grade grades campus
heritage new north south east west central acad sch schs ind cons indep inter ctr co coop hall fine john park lake high home main view rock oaks hill mill ford glen wood pine star fair town twin rose bell gold west east plus tech prep univ fort port""".split())

SHARED_HOSTS = ("sites.google.com", "google.com", "wixsite.com", "wix.com", "weebly.com", "squarespace.com",
                "godaddysites.com", "edlio.net", "blogspot.com", "wordpress.com", "myschoolapp.com",
                "schoolwires.net", "sharpschool.com", "facebook.com", "wordpress.org")


def norm_url(u):
    if not u:
        return None
    u = u.strip()
    if not u or u.lower() in ("n/a", "none", "null"):
        return None
    if "." not in u or " " in u or u.startswith("_"):
        return None  # "_blank", "n/a" and the like are not addresses
    if not re.match(r"^https?://", u, re.I):
        u = "http://" + u
    # drop fragments, keep path
    u = u.split("#", 1)[0]
    return u


VENDOR_HOSTS = {
    "connectionsacademy.com": "the vendor's national site (Connections Academy), not this school's own pages",
    "k12.com": "the vendor's national site (K12 / Stride), not this school's own pages",
    "insightschools.net": "the vendor's national site (Insight Schools), not this school's own pages",
    "stridelearning.com": "the vendor's national site (Stride), not this school's own pages",
}


def vendor_bare(u):
    """A bare vendor host (no entity subdomain, no path) identifies the vendor, not the school."""
    try:
        from urllib.parse import urlsplit
        p = urlsplit(u)
    except Exception:
        return None
    host = (p.hostname or "").lower()
    path = (p.path or "/").strip("/")
    for vh, why in VENDOR_HOSTS.items():
        if (host == vh or host == "www." + vh) and not path:
            return why
    return None


def bare_shared_host(u):
    """A bare shared platform host names nobody (Quorum's website.py rule)."""
    try:
        from urllib.parse import urlsplit
        p = urlsplit(u)
    except Exception:
        return True
    host = (p.hostname or "").lower()
    path = (p.path or "/").strip("/")
    for sh in SHARED_HOSTS:
        if host == sh or host == "www." + sh:
            return not path  # bare host = identifies nobody; a path identifies someone
    return False


def title_case(name):
    small = {"of", "the", "and", "at", "in", "for"}
    out = []
    for i, w in enumerate(re.split(r"(\s+|-)", name.strip())):
        if not w or w.isspace() or w == "-":
            out.append(w)
            continue
        lw = w.lower()
        if lw in small and i:
            out.append(lw)
        elif re.match(r"^[ivx]+$", lw) and len(lw) <= 4 and lw not in ("i",):
            out.append(w.upper())
        elif lw in ("isd", "jr", "sr", "k-12", "k12", "stem", "ps", "pcs", "ok", "okc"):
            out.append({"isd": "ISD", "jr": "Jr", "sr": "Sr", "k-12": "K-12", "k12": "K12", "stem": "STEM",
                        "ps": "PS", "pcs": "PCS", "ok": "OK", "okc": "OKC"}[lw])
        elif "'" in lw or "." in lw:
            out.append(w[:1].upper() + w[1:].lower())
        else:
            out.append(w[:1].upper() + w[1:].lower())
    return "".join(out)


def tokens_for(name, extra=()):
    """Distinctive tokens the entity's own home page must mention (case-insensitive)."""
    base = re.sub(r"[^a-z0-9 \-']", " ", name.lower())
    words = [w for w in re.split(r"[\s\-]+", base) if w]
    # four-letter names (Dove, KIPP, Enid) count; common four-letter words sit in GENERIC so they cannot match by accident
    distinct = [w for w in words if w not in GENERIC and len(w) >= 4 and not w.isdigit()]
    if not distinct:
        # a name made only of short words ("John W Rex") keeps its three-letter ones rather than nothing
        distinct = [w for w in words if w not in GENERIC and len(w) == 3 and not w.isdigit()]
    phrases = []
    # the whole name minus trailing generic words, as a phrase
    core = words[:]
    while core and core[-1] in GENERIC:
        core.pop()
    while core and core[0] in GENERIC:
        core.pop(0)
    if len(core) >= 2:
        phrases.append(" ".join(core))
    toks = OrderedDict()
    for p in phrases:
        toks[p] = 1
    for w in distinct:
        toks[w] = 1
    for e in extra:
        if e:
            toks[e.lower()] = 1
    if not toks and words:
        # every word is generic on its own ("Oklahoma Union"): the whole name must appear
        toks[" ".join(words)] = 1
    return list(toks.keys())


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s or "x"


def main():
    raw = open(os.path.join(D, "ccd_lea_2223.csv"), "rb").read().decode("latin-1")
    ccd = [r for r in csv.DictReader(io.StringIO(raw)) if r.get("ST") == "OK"]
    leads = [json.loads(l) for l in open(os.path.join(D, "leads.jsonl"), encoding="utf-8") if l.strip()]
    q_by_leaid, q_by_wd = {}, {}
    for r in leads:
        for e in r.get("external_ids") or []:
            if e.get("scheme") == "nces_leaid":
                q_by_leaid[e["value"]] = r
            if e.get("scheme") == "wikidata":
                q_by_wd[e["value"]] = r

    ents = []
    slugs = set()

    def uniq_slug(base):
        s = base
        i = 2
        while s in slugs:
            s = f"{base}-{i}"
            i += 1
        slugs.add(s)
        return s

    # ---- school districts (regular + independent charter, open) ----
    for r in ccd:
        if r.get("SY_STATUS_TEXT") not in ("Open", "New"):
            continue
        t = r.get("LEA_TYPE_TEXT", "")
        if t.startswith("Regular public"):
            kind = "district"
        elif t.startswith("Independent charter"):
            kind = "charter"
        else:
            continue
        leaid = r["LEAID"]
        q = q_by_leaid.get(leaid)
        name = title_case(r["LEA_NAME"])
        display = (q or {}).get("display_name") or name
        display = re.sub(r"\bDist\b", "District", display)
        display = re.sub(r"\bSch\b", "School", display)
        if kind == "district" and not re.search(r"school|academy|charter|district|public", display, re.I):
            display_full = display + " Public Schools"
        else:
            display_full = display
        city = title_case(r.get("LCITY", "") or r.get("MCITY", ""))
        cands = []
        if q and q.get("canonical_url") and not q.get("url_suspect"):
            cu = norm_url(q["canonical_url"])
            vb = vendor_bare(cu)
            if vb:
                cands.append({"url": cu, "source": "quorum canonical_url", "excluded": vb})
            else:
                cands.append({"url": cu, "source": "quorum canonical_url (corroborated by Quorum)"})
        w = norm_url(r.get("WEBSITE"))
        if w and not bare_shared_host(w) and all(c["url"].rstrip("/").lower() != w.rstrip("/").lower() for c in cands):
            vb = vendor_bare(w)
            if vb:
                cands.append({"url": w, "source": "NCES CCD 2022-23 WEBSITE", "excluded": vb})
            else:
                cands.append({"url": w, "source": "NCES CCD 2022-23 WEBSITE"})
        if q and q.get("canonical_url") and q.get("url_suspect"):
            cu = norm_url(q["canonical_url"])
            if cu and not bare_shared_host(cu) and all(c["url"].rstrip("/").lower() != cu.rstrip("/").lower() for c in cands):
                cands.append({"url": cu, "source": "quorum canonical_url (marked url_suspect by Quorum)"})
        ents.append({
            "id": f"nces-{leaid}", "type": "district", "kind": kind,
            "name": display_full, "short": display, "city": city,
            "county": None,
            "enrollment": (q or {}).get("enrollment"),
            "population": None,
            "slug": uniq_slug(slugify(display)),
            "tokens": tokens_for(display, extra=[]),
            "city_tokens": tokens_for(city) if city else [],
            "candidates": [c for c in cands if c["url"]],
            "ids": {"nces_leaid": leaid, "st_leaid": r.get("ST_LEAID")},
            "phone": r.get("PHONE") or (q or {}).get("phone"),
            "zip": (r.get("LZIP") or r.get("MZIP") or "")[:5],
        })

    # ---- counties ----
    wc = json.load(open(os.path.join(D, "wikidata_counties.json")))
    global OKC_REG
    OKC_REG = {}
    for row in json.load(open(os.path.join(D, "okcounties_countyData.json"), encoding="utf-8")):
        OKC_REG[row["name"].lower().replace(" ", "")] = row
    counties = OrderedDict()
    for row in wc:
        fips = row.get("fips") or ""
        if not fips.startswith("40"):
            continue
        it = row["item"]
        c = counties.setdefault(it, {"item": it, "label": row["itemLabel"], "fips": fips, "sites": [], "pop": row.get("pop")})
        if row.get("site") and row["site"] not in c["sites"]:
            c["sites"].append(row["site"])
    # Wikidata "official website" values that are not the county government's own site.
    NOT_COUNTY = {
        "oklahoma.gov": "a state agency (OKDHS) resource page, not the county's site",
        "hugook.com": "the Hugo chamber of commerce, not the county",
        "cityofpawnee.com": "the City of Pawnee's site, not the county",
        "visitmurraycountyok.com": "a tourism site, not the county government",
    }
    for c in counties.values():
        name = c["label"]
        base = name.replace(" County", "").strip()
        slug = slugify(base)
        cands = []
        seen_hp = set()

        def hp(u):
            return re.sub(r"^https?://(www\.)?", "", (u or "").lower()).rstrip("/")
        for s in c["sites"]:
            host = hp(s).split("/")[0]
            if hp(s) in seen_hp:
                continue
            seen_hp.add(hp(s))
            skip = next((why for h, why in NOT_COUNTY.items() if host.endswith(h)), None)
            if skip:
                cands.append({"url": norm_url(s), "source": "Wikidata P856", "excluded": skip})
            else:
                cands.append({"url": norm_url(s), "source": "Wikidata P856"})
        # okcounties.org publishes a registry of all 77 counties (countyData.json): the county's own
        # site in `link`, and whether the county is hosted on the portal itself (`on_okcs`).
        reg = OKC_REG.get(base.lower().replace(" ", ""))
        if reg:
            lk = norm_url(reg.get("link"))
            if lk and hp(lk) not in seen_hp:
                seen_hp.add(hp(lk))
                cands.insert(0, {"url": lk, "source": "okcounties.org county registry (countyData.json) link"})
            if reg.get("on_okcs"):
                okc = f"https://{reg['region_code']}.okcounties.org/"
                if hp(okc) not in seen_hp:
                    seen_hp.add(hp(okc))
                    cands.append({"url": okc, "source": "okcounties.org county portal page (registry says this county is hosted there)"})
        ents.append({
            "id": f"fips-{c['fips']}", "type": "county", "kind": "county",
            "name": name, "short": base, "city": None, "county": name,
            "enrollment": None, "population": int(float(c["pop"])) if c.get("pop") else None,
            "slug": uniq_slug(slug),
            "tokens": [base.lower() + " county", base.lower()] if len(base) >= 4 else [base.lower() + " county"],
            "city_tokens": [],
            "candidates": cands,
            "ids": {"fips": c["fips"], "wikidata": it.rsplit("/", 1)[-1]},
            "phone": None, "zip": None,
        })

    # ---- cities and towns ----
    wm = json.load(open(os.path.join(D, "wikidata_munis.json")))
    munis = OrderedDict()
    for row in wm:
        it = row["item"]
        m = munis.setdefault(it, {"item": it, "label": row["itemLabel"], "sites": [], "pop": row.get("pop"),
                                  "types": set()})
        m["types"].add(row.get("typeLabel", ""))
        if row.get("site") and row["site"] not in m["sites"]:
            m["sites"].append(row["site"])
        if row.get("pop") and (not m.get("pop") or float(row["pop"]) > float(m["pop"])):
            m["pop"] = row["pop"]
    for m in munis.values():
        wd = m["item"].rsplit("/", 1)[-1]
        q = q_by_wd.get(wd)
        label = m["label"]
        if label.startswith("Q") and label[1:].isdigit():
            continue
        base = re.sub(r",.*$", "", label).strip()
        types = m["types"]
        if "town" in " ".join(types).lower() and "city" not in " ".join(types).lower():
            kind = "town"
        else:
            kind = "city"
        display = (q or {}).get("display_name") or (("Town of " if kind == "town" else "City of ") + base)
        cands = []
        if q and q.get("canonical_url") and not q.get("url_suspect"):
            cands.append({"url": norm_url(q["canonical_url"]), "source": "quorum canonical_url (corroborated by Quorum)"})
        for s in m["sites"]:
            u = norm_url(s)
            if u and not bare_shared_host(u) and all(c["url"].rstrip("/").lower() != u.rstrip("/").lower() for c in cands):
                cands.append({"url": u, "source": "Wikidata P856"})
        ents.append({
            "id": f"wd-{wd}", "type": "city", "kind": kind,
            "name": display, "short": base, "city": base, "county": None,
            "enrollment": None, "population": int(float(m["pop"])) if m.get("pop") else None,
            "slug": uniq_slug(slugify(base)),
            "tokens": tokens_for(base) or [base.lower()],
            "city_tokens": [],
            "candidates": cands,
            "ids": {"wikidata": wd, "population_source": "Wikidata P1082"},
            "phone": None, "zip": None,
        })

    json.dump(ents, open(os.path.join(D, "entities.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    from collections import Counter
    print("entities", len(ents), Counter(e["type"] for e in ents))
    print("with >=1 candidate", Counter(e["type"] for e in ents if any(not c.get("excluded") for c in e["candidates"])))
    print("districts w/o any candidate", [e["name"] for e in ents if e["type"] == "district" and not e["candidates"]][:40])


if __name__ == "__main__":
    main()
