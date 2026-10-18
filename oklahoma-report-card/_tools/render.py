#!/usr/bin/env python3
"""
render.py - builds the static /oklahoma-report-card/ section from data/results.jsonl + data/entities.json.

  python -I render.py --out "C:/Users/Circl/station-nightshift-wt-okrc/oklahoma-report-card"

Every page carries noindex and is linked from nowhere else on the site. Scores are recomputed here
from the raw check fields (scoring.py), so a scoring change never needs a re-crawl.
"""
import argparse, csv, datetime as dt, html, json, os, re, shutil, sys
from collections import Counter, defaultdict
from urllib.parse import urlsplit

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from scoring import rescore, WEIGHTS, LABELS, has_viewport  # noqa: E402

ORDER = ["https", "mobile", "accessibility", "freshness", "links", "contact", "speed", "required"]
SHORT = {"https": "HTTPS", "mobile": "Phone", "accessibility": "Access.", "freshness": "Updated", "links": "Links",
         "contact": "Contact", "speed": "Speed", "required": "Notices"}
KIND_LABEL = {"district": "School district", "charter": "Charter district", "county": "County", "city": "City", "town": "Town"}
TYPE_LABEL = {"district": "School districts", "county": "Counties", "city": "Cities and towns"}
SITE = "https://station.solutions"
BASE = "/oklahoma-report-card"


def esc(s):
    return html.escape("" if s is None else str(s), quote=True)


def fmt_date(iso):
    try:
        d = dt.date.fromisoformat(iso[:10])
        return d.strftime("%-d %B %Y") if os.name != "nt" else d.strftime("%d %B %Y").lstrip("0")
    except Exception:
        return iso


def nice_host(u):
    if not u:
        return ""
    h = urlsplit(u).hostname or u
    return h[4:] if h.startswith("www.") else h


def num(n):
    return f"{n:,}" if isinstance(n, (int, float)) and n is not None else ""


def pts(check, key):
    w = WEIGHTS[key]
    if not check or check.get("status") != "ok" or check.get("score") is None:
        return None
    return round(w * check["score"], 1)


# ---------------------------------------------------------------- sentences
def sentence(key, c):
    """One plain sentence per check, written for the clerk who runs the site."""
    if not c or c.get("status") != "ok":
        return "Couldn\u2019t check: " + (c.get("reason") if c else "this check did not run") + "."
    if key == "https":
        if c.get("https") and c.get("http_redirects"):
            return "Served over HTTPS, and plain http:// addresses redirect to it."
        if c.get("https") and c.get("http_redirects") is False:
            return "Served over HTTPS, but a plain http:// address does not redirect to it" + (f" ({c['http_error']})" if c.get("http_error") else "") + "."
        if c.get("https") and c.get("http_redirects") is None:
            return "Served over HTTPS; the plain http:// address did not answer" + (f" ({c['http_error']})" if c.get("http_error") else "") + "."
        why = c.get("https_error") or "no HTTPS answer"
        return f"Not served over HTTPS ({why})." + (" Plain http:// redirects somewhere secure." if c.get("http_redirects") else "")
    if key == "mobile":
        vp, ov = has_viewport(c), c.get("overflow_375")
        if vp and not ov:
            return "Has a viewport tag and nothing spills past the edge of a 375-pixel-wide phone screen."
        parts = []
        parts.append("Has a viewport tag" if vp else "No viewport tag, so phones show the desktop layout shrunk down")
        if ov:
            parts.append(f"the page is {c.get('scroll_width')} px wide on a {c.get('inner_width')} px screen, so it scrolls sideways")
        else:
            parts.append("nothing spills off the screen")
        return "; ".join(parts) + "."
    if key == "accessibility":
        bi, dr = c.get("by_impact") or {}, c.get("distinct_rules") or {}
        total = c.get("total", 0)
        if total == 0:
            return f"No issues found on the home page by the {c.get('rule_count', '')}-rule accesslint engine."
        nr = sum(dr.values())
        bits = [f"{bi.get(k, 0)} {k}" for k in ("critical", "serious", "moderate", "minor") if bi.get(k)]
        return f"{total} issue{'s' if total != 1 else ''} on the home page across {nr} rule{'s' if nr != 1 else ''}: " + ", ".join(bits) + "."
    if key == "freshness":
        return f"{c.get('basis', 'Newest date').capitalize()}: {fmt_date(c['date'])} ({c['days']} day{'s' if c['days'] != 1 else ''} ago)."
    if key == "links":
        if c["broken"] == 0:
            return f"All {c['checked']} internal links we followed from the home page answered."
        return f"{c['broken']} of the {c['checked']} internal links we followed from the home page {'was' if c['broken'] == 1 else 'were'} broken."
    if key == "contact":
        have = [n for n, k in (("a phone number", "phone"), ("a street address", "address"), ("an email address", "email"), ("a contact form or link", "contact_form_or_link")) if c.get(k)]
        miss = [n for n, k in (("phone number", "phone"), ("street address", "address")) if not c.get(k)]
        if not (c.get("email") or c.get("contact_form_or_link")):
            miss.append("email address or contact form")
        s = ("The home page shows " + ", ".join(have) + ".") if have else "The home page shows no contact details."
        if miss:
            s += " Not found on it: " + ", ".join(miss) + "."
        return s
    if key == "speed":
        bits = []
        if c.get("ttfb_s") is not None:
            bits.append(f"first byte in {c['ttfb_s']:.2f} s")
        if c.get("html_kb") is not None:
            bits.append(f"{c['html_kb']:g} KB of HTML")
        if c.get("requests") is not None:
            bits.append(f"{c['requests']} requests to load the page")
        return (", ".join(bits)[0].upper() + ", ".join(bits)[1:] + ".") if bits else "No timing."
    if key == "required":
        a, r = c.get("accessibility_statement_link"), c.get("records_or_meetings_link")
        if a and r:
            return "The home page links to an accessibility statement and to public records or meetings."
        if a:
            return "The home page links to an accessibility statement; no public-records or meetings link found on it."
        if r:
            return "The home page links to public records or meetings; no accessibility-statement link found on it."
        return "No accessibility-statement link and no public-records or meetings link found on the home page."
    return ""


def cell_class(c):
    if not c or c.get("status") != "ok" or c.get("score") is None:
        return "na"
    s = c["score"]
    return "ok" if s >= 0.9 else "mid" if s >= 0.5 else "bad"


CELL_GLYPH = {"ok": "\u25cf", "mid": "\u25d0", "bad": "\u25cb", "na": "\u2013"}
CELL_WORD = {"ok": "good", "mid": "partly", "bad": "poor", "na": "couldn\u2019t check"}


# ---------------------------------------------------------------- shell
CSS = r"""
:root{--bg:#F5F4F1;--card:#fff;--bg-2:#FAF9F6;--bg-3:#F1EFE9;--line:#E7E4DE;--line-2:#DDD9D0;--ink:#1D1D1F;--muted:#5F5F64;--faint:#6E6E73;
--accent:#8A5A00;--good:#167A44;--good-bg:#EDF6F0;--red:#C03B2B;--red-bg:#FBEEEC;--amber:#8A5A00;--amber-bg:#FFF6E5;--grey-bg:#ECEBE7;
--fd:'Inter','Segoe UI',system-ui,sans-serif;--fm:'JetBrains Mono',Consolas,ui-monospace,monospace}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 var(--fd);-webkit-font-smoothing:antialiased}
a{color:var(--ink)}
.top{border-bottom:1px solid var(--line);background:rgba(245,244,241,.92)}
.top-in{max-width:1180px;margin:0 auto;padding:0 22px;height:58px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.home{display:flex;align-items:center;gap:9px;font:700 12px var(--fd);letter-spacing:.13em;text-decoration:none;color:var(--ink)}
.home svg{width:19px;height:19px}
.topnav{display:flex;gap:18px;font-size:14px}.topnav a{color:var(--muted);text-decoration:none}.topnav a:hover,.topnav a[aria-current]{color:var(--ink)}
.wrap{max-width:1180px;margin:0 auto;padding:40px 22px 60px}.wrap.narrow{max-width:800px}
.k{font:600 11px var(--fm);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 12px}
h1{font-size:clamp(1.7rem,4vw,2.5rem);line-height:1.12;letter-spacing:-.025em;margin:0 0 12px;text-wrap:balance}
h2{font-size:1.35rem;letter-spacing:-.02em;margin:40px 0 12px}h3{font-size:1.05rem;margin:24px 0 8px}
.lede{color:var(--muted);margin:0 0 24px;max-width:66ch}
p{margin:0 0 1em}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 28px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.tile .n{font-size:1.7rem;font-weight:800;letter-spacing:-.03em;line-height:1.1}.tile .u{color:var(--muted);font-size:13.5px;margin-top:4px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 14px}
.bar button{font:600 14px var(--fd);border:1.5px solid var(--line-2);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 14px;cursor:pointer}
.bar button[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
.bar input{font:500 15px var(--fd);border:1.5px solid var(--line-2);border-radius:999px;padding:8px 14px;min-width:220px;background:var(--card);color:var(--ink)}
.bar input:focus,.bar button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.hint{color:var(--faint);font-size:13.5px;margin:0 0 10px}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--card)}
table{border-collapse:collapse;width:100%;font-size:14.5px}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;white-space:nowrap}
th{font:600 12px var(--fm);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:var(--bg-2);position:sticky;top:0;cursor:pointer;user-select:none}
th[aria-sort=ascending]::after{content:" \25B4"}th[aria-sort=descending]::after{content:" \25BE"}
td.nm{white-space:normal;min-width:220px}td.nm a{font-weight:600;text-decoration:none}td.nm a:hover{text-decoration:underline}td.nm .pl{display:block;color:var(--faint);font-size:12.5px}
td.r{text-align:right;font-family:var(--fm);font-size:13px}
td.c{text-align:center;font-size:15px;line-height:1}
.rn{color:var(--faint);font-weight:700;margin-left:1px}
.ok{color:var(--good)}.mid{color:var(--amber)}.bad{color:var(--red)}.na{color:#B5B3AD}
.g{display:inline-block;font:700 13px var(--fm);border-radius:999px;padding:3px 10px;min-width:30px;text-align:center}
.g-A{background:var(--good-bg);color:var(--good)}.g-B{background:#EAF3EC;color:#2F6B45}.g-C{background:var(--amber-bg);color:var(--amber)}
.g-D{background:#FBEFE3;color:#9A4B00}.g-F{background:var(--red-bg);color:var(--red)}.g-N{background:var(--grey-bg);color:var(--muted);font-weight:600}
.site{color:var(--muted);font-size:13px;text-decoration:none}.site:hover{text-decoration:underline}
tr.hide{display:none}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px;margin:0 0 16px}
.head{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;justify-content:space-between}
.score{font-size:2.6rem;font-weight:800;letter-spacing:-.04em;line-height:1}.score small{font-size:1rem;color:var(--muted);font-weight:500;letter-spacing:0}
.meta{color:var(--muted);font-size:14.5px}.meta a{color:var(--ink)}
.checks{width:100%;border-collapse:collapse;font-size:15px}.checks td,.checks th{white-space:normal;padding:12px 10px;vertical-align:top}
.checks th{position:static;cursor:default}
.checks td.lab{font-weight:600;width:190px}.checks td.p{font-family:var(--fm);font-size:13px;text-align:right;white-space:nowrap;width:90px}
.checks .cc{color:var(--faint);font-style:italic}
.note{background:var(--bg-3);border-radius:14px;padding:16px 18px;color:var(--muted);font-size:15px;margin:18px 0}.note b{color:var(--ink)}
ul.plain{padding-left:20px;margin:0 0 1em}ul.plain li{margin:4px 0}
.small{font-size:13.5px;color:var(--faint)}
code,.mono{font-family:var(--fm);font-size:.92em}
dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:0}dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}
footer{border-top:1px solid var(--line);margin-top:40px;padding:22px;color:var(--faint);font-size:13px;text-align:center}
footer a{color:var(--muted)}
@media (max-width:640px){.wrap{padding:28px 16px 48px}th,td{padding:7px 7px}.score{font-size:2.2rem}dl{grid-template-columns:1fr}.topnav{display:none}
.checks thead{display:none}.checks tr{display:block;padding:12px 4px;border-bottom:1px solid var(--line)}.checks tr:last-child{border-bottom:0}.checks td{display:block;padding:2px 0;border:0;width:auto}.checks td.lab{width:auto}.checks td.p{text-align:left;width:auto;color:var(--muted)}}
"""

MARK = ('<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><g transform="rotate(45 50 50)">'
        '<rect x="29.5" y="3" width="18" height="36" rx="8.5"/><rect x="52.5" y="3" width="18" height="36" rx="8.5"/>'
        '<rect x="29.5" y="61" width="18" height="36" rx="8.5"/><rect x="52.5" y="61" width="18" height="36" rx="8.5"/>'
        '<rect x="3" y="29.5" width="36" height="18" rx="8.5"/><rect x="3" y="52.5" width="36" height="18" rx="8.5"/>'
        '<rect x="61" y="29.5" width="36" height="18" rx="8.5"/><rect x="61" y="52.5" width="36" height="18" rx="8.5"/></g>'
        '<circle cx="50" cy="50" r="16.5" fill="#F5F4F1"/></svg>')


def shell(title, body, desc="", current="", narrow=False, path="/"):
    nav = [("Ranking", BASE + "/", "ranking"), ("Methodology", BASE + "/methodology/", "methodology"), ("Data", BASE + "/data/", "data")]
    navh = ""
    for t, h, k in nav:
        cur = ' aria-current="page"' if k == current else ""
        navh += f'<a href="{h}"{cur}>{t}</a>'
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="robots" content="noindex,nofollow"><meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE}{esc(path)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{BASE}/rc.css?v=1">
<link rel="icon" href="/favicon.ico">
</head><body><header class="top"><div class="top-in"><a class="home" href="/" aria-label="Station home">{MARK}STATION</a><nav class="topnav" aria-label="Report card">{navh}</nav></div></header>
<main class="wrap{' narrow' if narrow else ''}">
{body}
</main>
<footer>Oklahoma Public-Entity Website Report Card &middot; an independent, automated reading of public websites, offered for information. Corrections: <a href="/contact/">station.solutions/contact</a><br>
Station Automations Group LLC &middot; 1856 Branard St, Houston, TX 77098 &middot; Designed &amp; hosted by <a href="https://station.solutions/">Station.Solutions</a></footer>
</body></html>"""


# ---------------------------------------------------------------- pages
def entity_href(r):
    return f"{BASE}/{r['type']}/{r['slug']}/"


NET_ERRORS = {
    "ERR_NAME_NOT_RESOLVED": "the address does not resolve any more (no DNS record)",
    "ERR_CONNECTION_REFUSED": "the server refused the connection",
    "ERR_CONNECTION_TIMED_OUT": "the server did not answer in time",
    "ERR_CONNECTION_RESET": "the connection was reset by the server",
    "ERR_SSL_PROTOCOL_ERROR": "the server's HTTPS set-up failed",
    "ERR_CERT_": "the HTTPS certificate is not valid",
    "ERR_TOO_MANY_REDIRECTS": "the address redirects in a loop",
    "ERR_ADDRESS_UNREACHABLE": "the address is unreachable",
    "ERR_HTTP2_PROTOCOL_ERROR": "the server's HTTP/2 connection failed",
    "ERR_EMPTY_RESPONSE": "the server sent an empty response",
    "ERR_ABORTED": "the page load was aborted",
}


def clean_outcome(s):
    """Plain words for a browser error string; the raw text stays in the data files."""
    if not s:
        return ""
    s = s.split("\nCall log")[0].strip()
    for code, words in NET_ERRORS.items():
        if code in s:
            return "could not load: " + words
    s = re.sub(r"\s+", " ", s)
    s = s.replace("Error: Page.goto: ", "").replace("Timeout 35000ms exceeded.", "the page took more than 35 s to load")
    return s[:220]


def place_of(r, ent):
    if r["type"] == "district":
        return ent.get("city") or ""
    if r["type"] == "county":
        return "Oklahoma"
    return "Oklahoma"


def size_of(r):
    if r["type"] == "district":
        return (num(r.get("enrollment")) + " students") if r.get("enrollment") else ""
    return (num(r.get("population")) + " people") if r.get("population") else ""



def outcome_words(r):
    o = r.get("outcome")
    if o == "no-site":
        return "No official website is on record for this entity in the registries we used."
    if o == "unreachable":
        tried = r.get("tried") or []
        if tried and all("portal" in (t.get("source") or "") and "ERR_NAME_NOT_RESOLVED" in (t.get("outcome") or "") for t in tried):
            return "No official website is on record for this county in the registries we used, and it has no page on the okcounties.org portal, so it is not graded."
        reasons = [t.get("outcome") for t in tried if (t.get("outcome") or "").startswith("not accepted:")]
        if reasons:
            why = reasons[-1][len("not accepted: "):]
            return "Not graded: " + why[0].upper() + why[1:] + ". The addresses we tried are listed below."
        reasons = [t.get("outcome") for t in tried if (t.get("outcome") or "").startswith(("could not load", "robots.txt", "home page answered"))]
        if reasons:
            why = clean_outcome(reasons[-1])
            return "Not graded: " + why[0].upper() + why[1:] + ". The addresses we tried are listed below."
        return "We could not reach, or could not confirm, an official website for this entity, so it is not graded. The addresses we tried are listed below."
    if o == "timeout":
        return "The checks on this site ran out of time, so it is not graded."
    if o == "error":
        return "The scanner hit an error on this site, so it is not graded."
    if o == "scanned" and r.get("score") is None:
        return "Too few checks could run on this site for a fair grade (" + (r.get("grade_note") or "") + ")."
    return r.get("outcome_note") or ""


def grade_pill(r):
    g = r.get("grade") or "Not graded"
    cls = "g-N" if g == "Not graded" else "g-" + g
    return f'<span class="g {cls}">{esc(g)}</span>'


def index_page(results, ents, scanned_on):
    by_type = defaultdict(list)
    for r in results:
        by_type[r["type"]].append(r)
    graded = [r for r in results if r.get("score") is not None]
    unreachable = [r for r in results if r.get("outcome") in ("unreachable", "timeout", "error") or (r.get("outcome") == "scanned" and r.get("score") is None)]
    nosite = [r for r in results if r.get("outcome") == "no-site"]
    # rank within type
    rank = {}
    for t, rows in by_type.items():
        g = sorted([r for r in rows if r.get("score") is not None], key=lambda r: (-r["score"], r["name"]))
        for i, r in enumerate(g, 1):
            rank[r["id"]] = i
    gcount = Counter(r["grade"] for r in graded)
    tiles = f"""<div class="tiles">
<div class="tile"><div class="n">{len(graded):,}</div><div class="u">websites graded</div></div>
<div class="tile"><div class="n">{len([r for r in graded if r['type']=='district']):,}</div><div class="u">school districts</div></div>
<div class="tile"><div class="n">{len([r for r in graded if r['type']=='county']):,}</div><div class="u">counties</div></div>
<div class="tile"><div class="n">{len([r for r in graded if r['type']=='city']):,}</div><div class="u">cities and towns</div></div>
<div class="tile"><div class="n">{len(unreachable):,}</div><div class="u">couldn\u2019t be checked</div></div>
<div class="tile"><div class="n">{len(nosite):,}</div><div class="u">no website on record</div></div>
</div>"""
    rows = []
    allrows = sorted(results, key=lambda r: (0 if r.get("score") is not None else 1, -(r.get("score") or 0), r["name"]))
    for r in allrows:
        ent = ents[r["id"]]
        cells = []
        for k in ORDER:
            c = (r.get("checks") or {}).get(k)
            cc = cell_class(c)
            cells.append(f'<td class="c {cc}" title="{esc(LABELS[k])}: {CELL_WORD[cc]}"><span aria-hidden="true">{CELL_GLYPH[cc]}</span><span hidden>{esc(LABELS[k])} {CELL_WORD[cc]}</span></td>')
        if r.get("outcome") == "no-site":
            name_cell = f'<td class="nm">{esc(r["name"])}<span class="pl">{esc(KIND_LABEL[r["kind"]])}{(" &middot; " + esc(place_of(r, ent))) if r["type"] == "district" and place_of(r, ent) else ""} &middot; no official website on record</span></td>'
            site = ""
        else:
            why = ""
            if r.get("outcome") != "scanned":
                why = " &middot; " + esc(outcome_words(r))
            elif r.get("score") is None:
                why = " &middot; " + esc(r.get("grade_note") or "")
            name_cell = f'<td class="nm"><a href="{entity_href(r)}">{esc(r["name"])}</a><span class="pl">{esc(KIND_LABEL[r["kind"]])}{(" &middot; " + esc(place_of(r, ent))) if r["type"] == "district" and place_of(r, ent) else ""}{why}</span></td>'
            site = f'<a class="site" href="{esc(r["site"])}" rel="nofollow noopener" target="_blank">{esc(nice_host(r["site"]))}</a>' if r.get("site") else ""
        sc = r.get("score")
        ran = r.get("checks_ran", 0)
        sc_cell = "" if sc is None else (f'{sc:g}' if ran == 8 else f'{sc:g}<span class="rn" title="{ran} of 8 checks ran">*</span>')
        rows.append(f'<tr data-t="{r["type"]}" data-g="{"1" if sc is not None else "0"}" data-s="{sc if sc is not None else -1}" data-n="{esc(r["name"].lower())}" data-k="{esc((r["name"] + " " + (ent.get("city") or "")).lower())}">'
                    f'<td class="r">{rank.get(r["id"], "")}</td>{name_cell}<td>{grade_pill(r)}</td><td class="r">{sc_cell}</td>'
                    + "".join(cells) + f'<td class="r">{esc(size_of(r))}</td><td>{site}</td></tr>')
    ths = "".join(f'<th scope="col" data-k="{k}" title="{esc(LABELS[k])}">{SHORT[k]}</th>' for k in ORDER)
    body = f"""<p class="k">Oklahoma &middot; school districts, counties, cities and towns</p>
<h1>Oklahoma Public-Entity Website Report Card</h1>
<p class="lede">The official website of every Oklahoma school district, county, city and town, put through the same eight automated checks on {scanned_on}: HTTPS, phone layout, accessibility, how recently it was updated, broken links, contact details, speed, and the notices a public body is expected to link to. Any check that could not run is marked \u201ccouldn\u2019t check\u201d and left out of that site\u2019s score. <a href="{BASE}/methodology/">How the grades work</a>.</p>
{tiles}
<div class="bar" role="group" aria-label="Filter">
<button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="district" aria-pressed="false">School districts</button><button type="button" data-f="county" aria-pressed="false">Counties</button><button type="button" data-f="city" aria-pressed="false">Cities &amp; towns</button><button type="button" data-f="ng" aria-pressed="false">Not graded</button>
<input type="search" id="q" placeholder="Search by name or town" aria-label="Search by name or town">
</div>
<p class="hint">Click a column heading to sort. &#9679; good &nbsp; &#9680; partly &nbsp; &#9675; poor &nbsp; &ndash; couldn\u2019t check. Rank is within each group. Grades: A 90+, B 80+, C 70+, D 60+, F below 60. A score marked * came from fewer than eight checks (hover for how many).</p>
<div class="tw"><table id="t"><thead><tr><th scope="col" data-k="rank">#</th><th scope="col" data-k="name">Entity</th><th scope="col" data-k="grade">Grade</th><th scope="col" data-k="score">Score</th>{ths}<th scope="col" data-k="size">Size</th><th scope="col" data-k="site">Website</th></tr></thead>
<tbody>{"".join(rows)}</tbody></table></div>
<p class="small" style="margin-top:14px">Scanned {scanned_on} with Station\u2019s report-card scanner (deterministic checks, no AI in the grading). Sources: NCES Common Core of Data 2022-23 LEA directory, the okcounties.org county registry, Wikidata, Quorum\u2019s resolved Oklahoma site list. <a href="{BASE}/data/">Download the data</a>.</p>
<script>
(function(){{var t=document.getElementById('t'),tb=t.tBodies[0],rows=Array.prototype.slice.call(tb.rows),f='all',q='';
function apply(){{rows.forEach(function(r){{var ok=(f==='all')||(f==='ng'?r.dataset.g==='0':(r.dataset.t===f));if(ok&&q)ok=r.dataset.k.indexOf(q)>-1;r.classList.toggle('hide',!ok);}});}}
document.querySelectorAll('.bar button').forEach(function(b){{b.addEventListener('click',function(){{f=b.dataset.f;document.querySelectorAll('.bar button').forEach(function(x){{x.setAttribute('aria-pressed',x===b?'true':'false');}});apply();}});}});
document.getElementById('q').addEventListener('input',function(e){{q=e.target.value.trim().toLowerCase();apply();}});
var ths=t.tHead.rows[0].cells;Array.prototype.forEach.call(ths,function(th,i){{th.addEventListener('click',function(){{var dir=th.getAttribute('aria-sort')==='descending'?'ascending':'descending';Array.prototype.forEach.call(ths,function(x){{x.removeAttribute('aria-sort');}});th.setAttribute('aria-sort',dir);
var k=th.dataset.k;rows.sort(function(a,b){{var va,vb;if(k==='score'||k==='rank'){{va=parseFloat(a.cells[i].textContent)||-1;vb=parseFloat(b.cells[i].textContent)||-1;}}else if(k==='name'||k==='grade'||k==='site'||k==='size'){{va=a.cells[i].textContent.trim().toLowerCase();vb=b.cells[i].textContent.trim().toLowerCase();if(k==='size'){{va=parseFloat(va.replace(/,/g,''))||0;vb=parseFloat(vb.replace(/,/g,''))||0;}}}}else{{var m={{ok:3,mid:2,bad:1,na:0}};va=m[a.cells[i].className.replace('c ','')]||0;vb=m[b.cells[i].className.replace('c ','')]||0;}}
if(va<vb)return dir==='ascending'?-1:1;if(va>vb)return dir==='ascending'?1:-1;return 0;}});rows.forEach(function(r){{tb.appendChild(r);}});}});}});}})();
</script>"""
    return shell("Oklahoma Public-Entity Website Report Card", body,
                 desc="Every Oklahoma school district, county, city and town website graded with the same eight automated checks.",
                 current="ranking", path=BASE + "/")


def entity_page(r, ent, scanned_on):
    kind = KIND_LABEL[r["kind"]]
    place = place_of(r, ent)
    k = f"{kind}" + (f" &middot; {esc(place)}, Oklahoma" if r["type"] == "district" and place else " &middot; Oklahoma")
    size = size_of(r)
    head_meta = []
    if r.get("site"):
        head_meta.append(f'Website: <a href="{esc(r["site"])}" rel="nofollow noopener" target="_blank">{esc(nice_host(r["site"]))}</a>')
    if size:
        head_meta.append(esc(size))
    head_meta.append(f"Checked {scanned_on}")
    if r.get("outcome") != "scanned":
        tried = "".join(f'<li><span class="mono">{esc(t["url"])}</span> <span class="small">({esc(t["source"])})</span><br><span class="small">{esc(clean_outcome(t["outcome"]))}</span></li>' for t in r.get("tried") or [])
        body = f"""<p class="k">{k}</p><h1>{esc(r["name"])}</h1>
<p class="meta">{" &middot; ".join(head_meta)}</p>
<div class="card"><div class="head"><div><div class="score">{grade_pill(r)}</div></div><div class="meta" style="max-width:60ch">{esc(outcome_words(r))}</div></div></div>
<h2>What we tried</h2>
{("<ul class='plain'>" + tried + "</ul>") if tried else "<p>No candidate website was on record for this entity in the registries we used (NCES, Wikidata, Quorum).</p>"}
<div class="note">A site that could not be confirmed as the entity\u2019s own is not graded. It is never marked as failing. If you run this site and know its correct address, <a href="/contact/">tell us</a> and we will re-check it.</div>
<p class="small"><a href="{BASE}/">Back to the ranking</a> &middot; <a href="{BASE}/methodology/">Methodology</a></p>"""
        return shell(f"{r['name']} \u2014 Oklahoma Website Report Card", body, desc=f"Website report card for {r['name']}.", narrow=True, path=entity_href(r))

    checks = r.get("checks") or {}
    trs = []
    for key in ORDER:
        c = checks.get(key)
        p = pts(c, key)
        if p is None:
            pcell = f'<td class="p cc">&ndash; / {WEIGHTS[key]}</td>'
        else:
            pcell = f'<td class="p">{p:g} / {WEIGHTS[key]}</td>'
        cls = cell_class(c)
        trs.append(f'<tr><td class="lab"><span class="{cls}" aria-hidden="true">{CELL_GLYPH[cls]}</span> {esc(LABELS[key])}</td><td{" class=cc" if cls == "na" else ""}>{esc(sentence(key, c))}</td>{pcell}</tr>')
    a11y = checks.get("accessibility") or {}
    a11y_rows = ""
    if a11y.get("status") == "ok" and a11y.get("rules"):
        a11y_rows = "<h2>Accessibility issues found (by rule)</h2><div class='tw'><table class='checks'><thead><tr><th>Rule</th><th>Impact</th><th>Count</th><th>What it means</th></tr></thead><tbody>" + "".join(
            f"<tr><td class='mono'>{esc(x['ruleId'])}</td><td>{esc(x['impact'])}</td><td class='p'>{x['count']}</td><td>{esc(x.get('message') or '')}</td></tr>" for x in a11y["rules"]) + "</tbody></table></div>"
        if a11y.get("total", 0) > sum(x["count"] for x in a11y["rules"]):
            a11y_rows += f"<p class='small'>Showing the first {len(a11y['rules'])} rules; {a11y['total']} issues in total.</p>"
    links = checks.get("links") or {}
    broken_rows = ""
    if links.get("broken_list"):
        broken_rows = "<h2>Broken links on the home page</h2><ul class='plain'>" + "".join(
            f"<li><span class='mono'>{esc(b['url'])}</span> <span class='small'>&mdash; {esc(b['text']) if b.get('text') else ''} answered {esc(b['status'] if b.get('status') else (b.get('note') or 'no answer'))}</span></li>" for b in links["broken_list"]) + "</ul>"
    facts = []
    if r.get("platform"):
        facts.append(("Built on", ", ".join(r["platform"])))
    if r.get("generator"):
        facts.append(("Generator tag", r["generator"]))
    if r.get("title"):
        facts.append(("Page title", r["title"]))
    facts.append(("Language tag", r.get("lang") or "none"))
    facts.append(("Site source", r.get("site_source") or ""))
    facts.append(("robots.txt", r.get("robots") or ""))
    sp = checks.get("speed") or {}
    if sp.get("status") == "ok":
        facts.append(("Page weight", f"about {round((sp.get('resource_bytes') or 0) / 1024 / 1024, 1)} MB of files loaded by the home page (where the browser could measure them)"))
    tried = "".join(f'<li><span class="mono">{esc(t["url"])}</span> <span class="small">({esc(t["source"])}) &mdash; {esc(clean_outcome(t["outcome"]))}</span></li>' for t in r.get("tried") or [])
    notes = "".join(f"<li>{esc(n)}</li>" for n in r.get("notes") or [])
    body = f"""<p class="k">{k}</p><h1>{esc(r["name"])}</h1>
<p class="meta">{" &middot; ".join(head_meta)}</p>
<div class="card"><div class="head"><div><div class="score">{r["score"]:g}<small> / 100</small></div><div style="margin-top:8px">{grade_pill(r)}</div></div>
<div class="meta" style="max-width:52ch">{esc(r.get("grade_note") or "")}. Points come only from checks that ran; a check that could not run is left out, never counted as a failure. <a href="{BASE}/methodology/">How the grades work</a>.</div></div></div>
<div class="tw"><table class="checks"><thead><tr><th>Check</th><th>What we found on the home page</th><th>Points</th></tr></thead><tbody>{"".join(trs)}</tbody></table></div>
{a11y_rows}
{broken_rows}
<h2>About this site</h2>
<div class="card"><dl>{"".join(f"<dt>{esc(a)}</dt><dd>{esc(b)}</dd>" for a, b in facts)}</dl></div>
<h3>What we tried</h3><ul class="plain">{tried}</ul>
{("<h3>Notes</h3><ul class='plain'>" + notes + "</ul>") if notes else ""}
<div class="note">This is an automated reading of one page, the home page, on one day. It is not a compliance finding and it is not a judgement of the people who run the site. If something here is wrong, <a href="/contact/">tell us</a> and we will re-check it.</div>
<p class="small"><a href="{BASE}/">Back to the ranking</a> &middot; <a href="{BASE}/methodology/">Methodology</a> &middot; <a href="{BASE}/data/">Data</a></p>"""
    return shell(f"{r['name']} \u2014 Oklahoma Website Report Card", body,
                 desc=f"Website report card for {r['name']}: grade {r['grade']}, {r['score']:g} of 100.", narrow=True, path=entity_href(r))


def methodology_page(scanned_on, counts):
    body = f"""<p class="k">Methodology</p><h1>How the report card works</h1>
<p class="lede">Eight automated checks, run the same way on every site, on one day. Nothing here is a legal finding, a security audit or a compliance opinion. It is what a visitor on a phone would meet on the home page, measured with code and written down plainly.</p>

<h2>Who is on the list</h2>
<ul class="plain">
<li><b>School districts</b> ({counts['district']}): every open Oklahoma local education agency in the federal <a href="https://nces.ed.gov/ccd/" rel="noopener">NCES Common Core of Data</a> LEA directory (2022-23 file) of type regular public district or independent charter district. Other agency types (state schools, programs run by other bodies) are not included.</li>
<li><b>Counties</b> ({counts['county']}): the 77 counties, matched by FIPS code. Addresses come from the okcounties.org county registry (<span class="mono">countyData.json</span>, which also says whether a county is hosted on that portal) and from Wikidata.</li>
<li><b>Cities and towns</b> ({counts['city']}): incorporated cities and towns in Oklahoma listed in Wikidata. Census-designated places are not included.</li>
</ul>
<h3>Finding the official website</h3>
<p>Candidate addresses come from, in order: the website Quorum had already confirmed for the entity (its page was fetched and showed the entity\u2019s name and town), the WEBSITE column of the NCES directory, Wikidata\u2019s \u201cofficial website\u201d property, and for counties the county\u2019s page on the shared <span class="mono">okcounties.org</span> portal. We never guess domain names.</p>
<p>A candidate is accepted only if its home page loads, mentions the entity\u2019s name (or, for a district, its town, or carries the name in its own address), and reads like a government or school site: at least two of the ordinary words such a site uses (council, clerk, agenda, minutes, utilities, sheriff, courthouse; school, student, superintendent, enroll, campus), including one of the strong ones, counted in the visible text and the menus. Sites on a <span class="mono">.gov</span>, <span class="mono">.k12.ok.us</span>, <span class="mono">.ok.us</span> or <span class="mono">okcounties.org</span> address skip the vocabulary test, because the address itself settles who owns it. Pages that redirect to a sign-in screen, parked or expired domains, bare shared hosts such as <span class="mono">sites.google.com</span>, social-media pages, chamber-of-commerce and tourism sites (separate bodies), placeholder pages (\u201cIIS Windows Server\u201d, \u201cUnder Construction\u201d), bot-check screens, a vendor\u2019s national home page, and pages whose content is in another language or reads like gambling or pharmacy spam (a sign the domain has lapsed or changed hands) are all refused. Each entity\u2019s page says exactly which addresses were tried and why each was refused, because a lapsed domain is itself something the office that owns it will want to know. An entity with no accepted site is listed as \u201ccouldn\u2019t be checked\u201d and is not graded. It is never marked as failing.</p>

<h2>The eight checks</h2>
<p>All checks look at the <b>home page only</b>, loaded once in a plain Chromium browser at a phone width of 375 pixels, plus a few direct HTTP requests. Each check scores 0 to 1 and carries the weight shown. The checks ran on {scanned_on}.</p>
<div class="tw"><table class="checks"><thead><tr><th>Check</th><th>Weight</th><th>What is measured</th></tr></thead><tbody>
<tr><td class="lab">HTTPS</td><td class="p">15</td><td>Does <span class="mono">https://</span> serve the home page with a valid certificate (2/3 of the points)? Does a plain <span class="mono">http://</span> address redirect to it (1/3)?</td></tr>
<tr><td class="lab">Works on a phone</td><td class="p">15</td><td>Is there a <span class="mono">&lt;meta name="viewport"&gt;</span> tag with a width or an initial scale (half the points)? On a 375-pixel-wide screen, does the page stay within the screen with no sideways scrolling (half)?</td></tr>
<tr><td class="lab">Accessibility</td><td class="p">20</td><td>The open-source <a href="https://github.com/AccessLint/accesslint" rel="noopener">accesslint core</a> engine (version 0.21.0, 94 WCAG 2.2 A/AA and best-practice rules) runs on the live page. The score starts at 1 and loses 0.15 for each distinct critical rule failing, 0.09 per serious rule, 0.04 per moderate, 0.015 per minor, plus 0.004 per individual critical or serious instance (capped at 0.25). Past a penalty of 0.5 the score decays smoothly towards zero instead of stopping dead, so badly scoring sites still rank among themselves.</td></tr>
<tr><td class="lab">Kept up to date</td><td class="p">10</td><td>The newest full date (day, month and year) printed on the home page that is not in the future, or failing that a usable <span class="mono">Last-Modified</span> header. Within 30 days: 1. Within 90: 0.75. Within 180: 0.5. Within a year: 0.25. Older: 0. No date found: couldn\u2019t check.</td></tr>
<tr><td class="lab">Links that work</td><td class="p">10</td><td>Up to 20 distinct links from the home page to the site\u2019s own domain are requested (HEAD, then GET if refused). A link answering 400 or above, or not answering at all, is broken. Score is the share that worked. Links that timed out are not counted either way.</td></tr>
<tr><td class="lab">Contact details</td><td class="p">10</td><td>A phone number (1/3), a street address, PO box or Oklahoma ZIP code (1/3), and an email address or a contact form or contact link (1/3), anywhere on the home page.</td></tr>
<tr><td class="lab">Speed</td><td class="p">10</td><td>Average of three: time to first byte, measured in a quiet second pass as the best of two requests a second apart (1 up to 0.5 s, 0.75 to 1 s, 0.5 to 2 s, 0.25 to 4 s), size of the home page HTML as transferred (1 up to 100 KB, 0.75 to 300 KB, 0.5 to 600 KB, 0.25 to 1 MB), and the number of requests the page makes while loading (1 up to 50, 0.75 to 100, 0.5 to 150, 0.25 to 250).</td></tr>
<tr><td class="lab">Required notices</td><td class="p">10</td><td>Among the home page\u2019s links: one to an accessibility statement (half the points) and one to public records, open records, agendas, minutes or meetings (half). A notice that lives elsewhere on the site but is not linked from the home page is not found by this check, and the page says so.</td></tr>
</tbody></table></div>

<h2>The grade</h2>
<p>Score = points earned &divide; points available &times; 100, where \u201cavailable\u201d counts only the checks that actually ran. A 90 or more is an A, 80 a B, 70 a C, 60 a D, and below 60 an F. No single check weighs more than 20 of 100 points, so no site is graded F on the strength of one check. A site needs at least four of the eight checks to have run to receive a grade at all.</p>

<h2>Honesty rules</h2>
<ul class="plain">
<li>A check that could not run says \u201ccouldn\u2019t check\u201d with the reason, and is excluded from the score. It is never scored as a failure.</li>
<li>A site that did not answer to the entity\u2019s name is not graded, rather than graded on somebody else\u2019s page.</li>
<li>Everything is deterministic: the same page, the same day, the same answer. No language model touches the grading or the wording of results.</li>
<li>The scanner identified itself as <span class="mono">StationReportCard/1.0</span> with a link to this page, honoured each site\u2019s <span class="mono">robots.txt</span> (including crawl delays), made at most one deliberate request per second to any host, and stopped at 20 links per site.</li>
</ul>

<h2>Limits worth knowing</h2>
<ul class="plain">
<li>One page, one day. A home page that happened to be slow or briefly broken that day scores accordingly; the date is on every page.</li>
<li>Home page only. A district whose accessibility statement sits on an \u201cAbout\u201d page gets no credit for it here.</li>
<li>Automated accessibility tools find only part of what a person using assistive technology would find. A clean run is not proof of accessibility; a run with issues is a list of things worth looking at.</li>
<li>The phone test uses Chromium\u2019s device emulation, not a physical phone.</li>
<li>Sites behind aggressive bot protection may have refused the scanner; those show as couldn\u2019t check.</li>
<li>Registries lag. A district that changed its address recently may have been checked at an older one; the \u201cWhat we tried\u201d list on each page shows exactly which addresses were used.</li>
<li>The checks ran over two days, 17 and 18 October 2026. Sites whose first pass was spoiled by a scanner fault (a browser that stopped answering) were re-run on the second day; every page shows its own date.</li>
<li>Towns with no address in any registry we used are listed as \u201cno website on record\u201d. That is a statement about the registries, not about the town.</li>
</ul>

<h2>Corrections</h2>
<p>If you run one of these sites and something here is wrong, <a href="/contact/">tell us</a>. We will re-run the checks and update the page. The raw results are published as JSON and CSV on the <a href="{BASE}/data/">data page</a>.</p>
<p class="small"><a href="{BASE}/">Back to the ranking</a></p>"""
    return shell("Methodology \u2014 Oklahoma Website Report Card", body, desc="How the Oklahoma Public-Entity Website Report Card is measured.",
                 current="methodology", narrow=True, path=BASE + "/methodology/")


def data_page(scanned_on, counts):
    body = f"""<p class="k">Data</p><h1>Download the results</h1>
<p class="lede">Everything behind the ranking, as it was recorded on {scanned_on}. Free to reuse with a link back.</p>
<div class="card"><dl>
<dt><a href="{BASE}/data/results.csv">results.csv</a></dt><dd>One row per entity: identity, website, grade, score and the eight check scores.</dd>
<dt><a href="{BASE}/data/results.json">results.json</a></dt><dd>The full record per entity, including every accessibility rule that failed, broken links, timings and every address that was tried.</dd>
<dt><a href="{BASE}/data/entities.json">entities.json</a></dt><dd>The entity list with its candidate addresses and sources, before scanning.</dd>
</dl></div>
<p>Columns in the CSV: <span class="mono">id, type, kind, name, city, enrollment, population, site, outcome, grade, score, checks_ran, https, mobile, accessibility, freshness, links, contact, speed, required, a11y_issues, broken_links, ttfb_s, html_kb, requests, platform, newest_date, outcome_note</span>. Check columns hold the 0-1 score or are blank where the check could not run.</p>
<p class="small"><a href="{BASE}/">Back to the ranking</a> &middot; <a href="{BASE}/methodology/">Methodology</a></p>"""
    return shell("Data \u2014 Oklahoma Website Report Card", body, desc="Raw results of the Oklahoma Public-Entity Website Report Card as CSV and JSON.",
                 current="data", narrow=True, path=BASE + "/data/")


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", default=os.path.join(HERE, "data", "results.jsonl"))
    ap.add_argument("--entities", default=os.path.join(HERE, "data", "entities.json"))
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    ents = {e["id"]: e for e in json.load(open(a.entities, encoding="utf-8"))}
    results, seen = [], set()
    for l in open(a.results, encoding="utf-8"):
        if not l.strip():
            continue
        r = json.loads(l)
        if r["id"] in seen or r["id"] not in ents:
            continue
        seen.add(r["id"])
        rescore(r)
        results.append(r)
    # entities not yet scanned are omitted from the pages (partial renders while the scan runs)
    scanned_dates = sorted({r["scanned_at"][:10] for r in results})
    scanned_on = fmt_date(scanned_dates[0]) if len(scanned_dates) == 1 else f"{fmt_date(scanned_dates[0])} to {fmt_date(scanned_dates[-1])}"
    counts = Counter(r["type"] for r in results)
    out = a.out
    if os.path.isdir(out):
        for sub in ("district", "county", "city"):
            shutil.rmtree(os.path.join(out, sub), ignore_errors=True)
    write(os.path.join(out, "rc.css"), CSS.strip() + "\n")
    write(os.path.join(out, "index.html"), index_page(results, ents, scanned_on))
    write(os.path.join(out, "methodology", "index.html"), methodology_page(scanned_on, counts))
    write(os.path.join(out, "data", "index.html"), data_page(scanned_on, counts))
    n = 0
    for r in results:
        if r.get("outcome") == "no-site":
            continue
        write(os.path.join(out, r["type"], r["slug"], "index.html"), entity_page(r, ents[r["id"]], scanned_on))
        n += 1
    # data files
    json.dump(results, open(os.path.join(out, "data", "results.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    shutil.copyfile(a.entities, os.path.join(out, "data", "entities.json"))
    with open(os.path.join(out, "data", "results.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "type", "kind", "name", "city", "enrollment", "population", "site", "outcome", "grade", "score", "checks_ran",
                    *ORDER, "a11y_issues", "broken_links", "ttfb_s", "html_kb", "requests", "platform", "newest_date", "outcome_note"])
        for r in results:
            c = r.get("checks") or {}
            w.writerow([r["id"], r["type"], r["kind"], r["name"], ents[r["id"]].get("city") or "", r.get("enrollment") or "", r.get("population") or "",
                        r.get("site") or "", r.get("outcome"), r.get("grade"), r.get("score") if r.get("score") is not None else "", r.get("checks_ran", 0),
                        *[(c.get(k) or {}).get("score", "") if (c.get(k) or {}).get("status") == "ok" else "" for k in ORDER],
                        (c.get("accessibility") or {}).get("total", ""), (c.get("links") or {}).get("broken", ""),
                        (c.get("speed") or {}).get("ttfb_s", ""), (c.get("speed") or {}).get("html_kb", ""), (c.get("speed") or {}).get("requests", ""),
                        "; ".join(r.get("platform") or []), (c.get("freshness") or {}).get("date", ""), r.get("outcome_note") or r.get("grade_note") or ""])
    print(f"rendered {len(results)} results ({n} entity pages) to {out}; scanned {scanned_on}; counts {dict(counts)}")
    graded = [r for r in results if r.get("score") is not None]
    print("grades", Counter(r["grade"] for r in graded))
    print("outcomes", Counter(r.get("outcome") for r in results))


if __name__ == "__main__":
    main()
