#!/usr/bin/env python3
"""
scan.py - deterministic website checks for the Oklahoma Public-Entity Website Report Card.

  python -I scan.py --entities data/entities.json --out data/results.jsonl [--only district] [--limit N] [--ids a,b] [--workers 8]

Every check is deterministic (no LLM anywhere). A check that could not run is recorded as
"couldn't check" with the reason and is EXCLUDED from the grade - never counted as a failure.

Browser: Playwright's own bundled Chromium (never the everyday Chrome). Politeness: robots.txt
honoured via protego, at most one deliberate request per second per host (more if robots.txt asks
for a crawl-delay), bounded concurrency across hosts, hard timeouts.
"""
import argparse, asyncio, json, os, re, sys, time, datetime as dt
from urllib.parse import urlsplit, urljoin
import httpx, protego
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from scoring import rescore  # noqa: E402
IIFE = open(os.path.join(HERE, "vendor", "accesslint-core-0.21.0.iife.js"), encoding="utf-8").read()
BOT = "StationReportCard/1.0 (+https://station.solutions/oklahoma-report-card/methodology/)"
UA = None  # filled from the browser's own UA at start
TODAY = dt.date.today()
HTTP_TIMEOUT = 20.0
NAV_TIMEOUT_MS = 35000
ENTITY_CAP_S = 240
LINK_CAP = 15
MIN_HOST_DELAY = 1.0
MAX_HOST_DELAY = 10.0

PLACEHOLDER_TITLE = re.compile(r"^(iis windows server|apache2 .* default page|welcome to nginx!?|index of /|test page|site not found|coming soon|web page under construction|under construction|default web site page|account suspended|website disabled|domain default page|future home of|this site is under development|page not found|404 |error 404|hello world!?|nexcess|hostgator|bluehost|godaddy|cpanel|plesk|siteground|hostinger|wp engine|namecheap|ionos|dreamhost|web hosting.*)\s*$", re.I)
SPAM_TEXT = re.compile(r"\b(slot|gacor|judi|togel|casino|poker|agen|situs|betting|viagra|cialis|kenzo\d+|rtp live|deposit pulsa|sbobet|bandar|pragmatic play|link alternatif)\b", re.I)
PARKING_HOSTS = re.compile(r"quickresultonline|sedoparking|parkingcrew|bodis\.com|above\.com|hugedomains|dan\.com|afternic|parklogic|undeveloped\.com|domainmarket", re.I)
NOT_GOVT_HOSTS = re.compile(r"chamber|tourism|visit[a-z]*\.|convention|\bcvb\b", re.I)
AUTHORITATIVE_HOST = re.compile(r"(\.gov|\.k12\.ok\.us|\.ok\.us|\.okcounties\.org|\.us)$", re.I)
STRONG_SCHOOL = re.compile(r"school|student|superintendent|elementary|k-12|k12|enroll|campus|classroom|pre-k|graduat|principal", re.I)
STRONG_CIVIC = re.compile(r"city hall|town hall|council|mayor|clerk|ordinance|agenda|minutes|commission|sheriff|courthouse|assessor|treasurer|utilit|municipal|city of|town of|county of|trustee|public works|code enforcement", re.I)
CIVIC_WORDS = re.compile(r"city hall|town hall|council|mayor|clerk|utilit|ordinance|agenda|minutes|permit|police|fire dep|public works|trash|sanitation|water bill|pay (your |a |my )?bill|municipal|court|code enforcement|zoning|planning|treasurer|city manager|town manager|city of|town of|trustee|commission|assessor|sheriff|courthouse|election|district attorney|emergency management|county of|county commission", re.I)
SCHOOL_WORDS = re.compile(r"school|student|district|superintendent|elementary|high school|staff|enroll|calendar|board|teacher|campus|parent|athletic|lunch|menu", re.I)
SOCIAL_HOSTS = {"facebook.com", "fb.com", "twitter.com", "x.com", "instagram.com", "youtube.com", "linkedin.com", "nextdoor.com", "tiktok.com"}
VENDOR_BARE = {"connectionsacademy.com", "k12.com", "insightschools.net", "stridelearning.com", "connectionseducation.com"}
BOTCHECK_URL = re.compile(r"sgcaptcha|/cdn-cgi/challenge|captcha|__cf_chl|/distil_|incapsula|/_Incapsula_Resource|bot-?check|challenge-platform", re.I)
BOTCHECK_TITLE = re.compile(r"^just a moment|attention required|access denied|checking your browser|are you a robot|robot challenge|bot verification|verify you are human|security check|one moment", re.I)
PARKED = re.compile(r"parked domain|buy it here|related searches|sponsored listings|this domain (is|may be) for sale|buy this domain|domain parking|parked free|hugedomains|sedo\.com|afternic|"
                    r"dan\.com|godaddy\.com/domainsearch|domain is parked|is for sale!|coming soon.{0,40}godaddy", re.I)
MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec"
MONTHS_FULL = "january|february|march|april|may|june|july|august|september|october|november|december"
DATE_PATTERNS = [
    re.compile(rf"\b({MONTHS_FULL}|{MONTHS})\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(20\d\d)\b", re.I),
    re.compile(rf"\b(\d{{1,2}})\s+({MONTHS_FULL}|{MONTHS})\.?,?\s+(20\d\d)\b", re.I),
    re.compile(r"\b(\d{1,2})/(\d{1,2})/(20\d\d|\d\d)\b"),
    re.compile(r"\b(20\d\d)-(\d\d)-(\d\d)\b"),
]
MONTH_NUM = {m: i % 12 + 1 for i, m in enumerate(MONTHS_FULL.split("|"))}
MONTH_NUM.update({m: i + 1 for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())})
MONTH_NUM["sept"] = 9
PHONE = re.compile(r"(?<!\d)\(?\b[2-9]\d{2}\)?[\s.\-]?\d{3}[\s.\-]\d{4}\b(?!\d)")
EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")
OK_ZIP = re.compile(r"\b(?:OK|Okla\.?|Oklahoma)\.?,?\s+7[34]\d{3}(?:-\d{4})?\b", re.I)
PO_BOX = re.compile(r"\bP\.?\s?O\.?\s+Box\s+\d+", re.I)
STREET = re.compile(r"\b\d{1,6}\s+(?:[NSEW]\.?\s+)?[A-Za-z0-9.'\-]+(?:\s+[A-Za-z0-9.'\-]+){0,3}\s+"
                    r"(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|highway|hwy|lane|ln|way|court|ct|place|pl|circle|cir|parkway|pkwy|trail|trl|loop)\b\.?", re.I)
A11Y_TEXT = re.compile(r"accessib", re.I)
A11Y_HREF = re.compile(r"accessib|/ada\b|ada-|ada_|section-?508", re.I)
RECORDS_TEXT = re.compile(r"open records|public records|records request|open meeting|meeting notice|agendas?\b|minutes\b|board meetings?|council meetings?|commission(ers)? meetings?|sunshine", re.I)
RECORDS_HREF = re.compile(r"agenda|minutes|records|open-?meeting|meetings", re.I)
CONTACT_LINK = re.compile(r"contact", re.I)
PLATFORMS = [
    ("Apptegy", r"apptegy|thrillshare|cmsv2\.apptegy|cdn\.schoolpointe\.com/thrillshare"), ("Finalsite", r"finalsite"),
    ("SchoolPointe", r"schoolpointe"), ("Edlio", r"edlio"), ("Blackboard Web Community Manager", r"schoolwires|blackboard"),
    ("SchoolBlocks", r"schoolblocks"), ("Campus Suite", r"campussuite"), ("SchoolInSites", r"schoolinsites"), ("eSchoolView", r"eschoolview"),
    ("CivicPlus", r"civicplus|civicengage|civicplus\.com|civiclive"), ("Revize", r"revize"), ("GovOffice", r"govoffice"), ("Municode", r"municode"),
    ("Town Web", r"townweb"), ("EvoGov", r"evogov"), ("OpenGov", r"opengov"), ("Granicus / govAccess", r"granicus|govaccess|visioninternet"),
    ("Streamline", r"getstreamline|streamline\.com"), ("Wix", r"wix\.com|wixstatic|wixsite"), ("Squarespace", r"squarespace"),
    ("Weebly", r"weebly"), ("GoDaddy Website Builder", r"godaddy|secureserver\.net|img1\.wsimg\.com"), ("WordPress", r"wp-content|wp-includes|wordpress"),
    ("Google Sites", r"sites\.google\.com"), ("Joomla", r"joomla"), ("Drupal", r"drupal"), ("Duda", r"duda\.co|dudaone|multiscreensite"),
    ("Webflow", r"webflow"), ("Weebly", r"weeblycloud"), ("SharpSchool", r"sharpschool"), ("Foxbright", r"foxbright"), ("Rschooltoday", r"rschooltoday"),
    ("okcounties.org portal", r"okcounties\.org"), ("ICS (Intermedia)", r"intermedia"), ("Edublogs", r"edublogs"), ("SOCS", r"socs\.net"),
]


def now_iso():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def host_of(u):
    try:
        return (urlsplit(u).hostname or "").lower()
    except Exception:
        return ""


def apex_of(host):
    return host[4:] if host.startswith("www.") else host


class Polite:
    """One deliberate request per second per host (or robots crawl-delay, capped)."""
    def __init__(self):
        self.locks, self.last, self.delay = {}, {}, {}

    async def wait(self, host):
        lock = self.locks.setdefault(host, asyncio.Lock())
        async with lock:
            d = self.delay.get(host, MIN_HOST_DELAY)
            gap = time.monotonic() - self.last.get(host, 0)
            if gap < d:
                await asyncio.sleep(d - gap)
            self.last[host] = time.monotonic()


polite = Polite()


def couldnt(reason):
    return {"status": "couldnt", "reason": reason}


def parse_dates(text, time_attrs):
    found = []
    cur_yy = TODAY.year % 100
    for pat in DATE_PATTERNS:
        for m in pat.finditer(text):
            g = m.groups()
            try:
                if pat is DATE_PATTERNS[0]:
                    y, mo, d = int(g[2]), MONTH_NUM[g[0].lower().rstrip(".")], int(g[1])
                elif pat is DATE_PATTERNS[1]:
                    y, mo, d = int(g[2]), MONTH_NUM[g[1].lower().rstrip(".")], int(g[0])
                elif pat is DATE_PATTERNS[2]:
                    mo, d, y = int(g[0]), int(g[1]), int(g[2])
                    if y < 100:
                        if y > cur_yy:
                            continue
                        y += 2000
                else:
                    y, mo, d = int(g[0]), int(g[1]), int(g[2])
                found.append(dt.date(y, mo, d))
            except (ValueError, KeyError):
                continue
    for a in time_attrs or []:
        m = re.match(r"(20\d\d)-(\d\d)-(\d\d)", a or "")
        if m:
            try:
                found.append(dt.date(int(m[1]), int(m[2]), int(m[3])))
            except ValueError:
                pass
    found = [f for f in found if dt.date(1995, 1, 1) <= f <= TODAY + dt.timedelta(days=1)]
    return max(found) if found else None


def internal(link_host, site_host):
    a, b = apex_of(link_host), apex_of(site_host)
    return a == b or a.endswith("." + b)


async def fetch_robots(client, url):
    """(protego or None, note). A robots.txt that cannot be fetched is not a refusal."""
    h = host_of(url)
    for scheme in ("https", "http"):
        try:
            await polite.wait(h)
            r = await client.get(f"{scheme}://{h}/robots.txt", follow_redirects=True)
            if r.status_code == 200 and "text/html" not in r.headers.get("content-type", "").lower():
                return protego.Protego.parse(r.text), f"robots.txt read over {scheme}"
            if r.status_code in (401, 403):
                return None, f"robots.txt answered {r.status_code}"
            if r.status_code == 404:
                return None, "no robots.txt (404)"
        except Exception as e:
            continue
    return None, "robots.txt could not be fetched (treated as no restrictions)"


async def http_probe(client, url):
    """HTTPS reachability with verification, HTTP->HTTPS redirect, TTFB, HTML weight, Last-Modified."""
    out = {"https": None, "http_redirect": None, "ttfb_s": None, "html_bytes": None, "last_modified": None,
           "final_url": None, "status": None, "server": None, "https_error": None, "http_error": None}
    h = host_of(url)
    # 1. https with certificate verification
    try:
        await polite.wait(h)
        t0 = time.monotonic()
        async with client.stream("GET", f"https://{h}/", follow_redirects=True) as r:
            ttfb = time.monotonic() - t0
            body = await r.aread()
        out["https"] = r.status_code < 400
        out["status"] = r.status_code
        out["final_url"] = str(r.url)
        out["ttfb_s"] = round(ttfb, 3)
        out["html_bytes"] = r.num_bytes_downloaded or len(body)
        out["last_modified"] = r.headers.get("last-modified")
        out["server"] = r.headers.get("server")
        if r.status_code >= 400:
            out["https_error"] = f"HTTP {r.status_code}"
    except httpx.ConnectError as e:
        msg = str(e)
        out["https"] = False
        out["https_error"] = "certificate not valid" if "CERTIFICATE" in msg.upper() or "SSL" in msg.upper() else f"connection failed ({msg[:80]})"
    except httpx.TimeoutException:
        out["https"] = None
        out["https_error"] = "timed out"
    except Exception as e:
        out["https"] = None
        out["https_error"] = f"{type(e).__name__}: {str(e)[:80]}"
    # 2. does plain http redirect to https?
    try:
        await polite.wait(h)
        r = await client.get(f"http://{h}/", follow_redirects=True)
        out["http_redirect"] = str(r.url).lower().startswith("https://")
        if out["final_url"] is None and r.status_code < 400:
            out["final_url"] = str(r.url)
            out["status"] = r.status_code
            out["last_modified"] = r.headers.get("last-modified")
            out["server"] = r.headers.get("server")
            out["html_bytes"] = r.num_bytes_downloaded
    except httpx.TimeoutException:
        out["http_redirect"] = None
        out["http_error"] = "timed out"
    except Exception as e:
        out["http_redirect"] = None
        out["http_error"] = f"{type(e).__name__}: {str(e)[:80]}"
    # 3. clean TTFB on the final URL (the first request may have paid for redirects)
    if out["final_url"]:
        try:
            await polite.wait(host_of(out["final_url"]))
            t0 = time.monotonic()
            async with client.stream("GET", out["final_url"], follow_redirects=False) as r:
                ttfb = time.monotonic() - t0
                body = await r.aread()
            if 200 <= r.status_code < 300:
                out["ttfb_s"] = round(ttfb, 3)
                out["html_bytes"] = r.num_bytes_downloaded or len(body)
                out["last_modified"] = r.headers.get("last-modified") or out["last_modified"]
        except Exception:
            pass
    return out


PAGE_JS = r"""
() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const vp = document.querySelector('meta[name="viewport" i]');
  const text = (document.body ? document.body.innerText : '') || '';
  const navText = q('a, nav, li, button, h1, h2, h3, h4, h5, h6, footer, label, option').map(e => (e.textContent || '').trim()).filter(Boolean).join(' | ').slice(0, 120000);
  const links = q('a[href]').map(a => ({href: a.href, text: (a.innerText || a.getAttribute('aria-label') || a.title || '').trim().slice(0,120)}));
  const forms = q('form').map(f => ({hasTextarea: !!f.querySelector('textarea'), hasEmail: !!f.querySelector('input[type="email"],input[name*="email" i]'), action: f.getAttribute('action') || ''}));
  const times = q('time[datetime]').map(t => t.getAttribute('datetime'));
  const gen = document.querySelector('meta[name="generator" i]');
  let res = [], bytes = 0;
  try { res = performance.getEntriesByType('resource'); bytes = res.reduce((s,r)=>s+(r.transferSize||0),0); } catch(e){}
  return {
    title: document.title || '',
    lang: document.documentElement.getAttribute('lang') || '',
    viewport: vp ? (vp.getAttribute('content') || '') : null,
    innerWidth: window.innerWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0),
    text: text.slice(0, 400000), navText,
    links, forms, times,
    generator: gen ? gen.getAttribute('content') : null,
    resourceCount: res.length, resourceBytes: bytes,
    h1: q('h1').map(h => h.innerText.trim().slice(0,120)).slice(0,5)
  };
}
"""

A11Y_JS = r"""
() => {
  const r = window.AccessLint.runAudit(document);
  const byImpact = {critical:0, serious:0, moderate:0, minor:0};
  const rules = {};
  for (const v of r.violations) {
    byImpact[v.impact] = (byImpact[v.impact]||0) + 1;
    const k = v.ruleId;
    if (!rules[k]) rules[k] = {ruleId:k, impact:v.impact, count:0, message:(v.message||'').slice(0,200)};
    rules[k].count++;
  }
  return {byImpact, rules:Object.values(rules), ruleCount:r.ruleCount, skipped:(r.skippedRules||[]).length, total:r.violations.length};
}
"""


async def load_page(browser, url):
    """Load the home page at phone width in a fresh context. Returns (data, requests, error)."""
    ctx = await browser.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2, is_mobile=True,
                                    has_touch=True, user_agent=UA, ignore_https_errors=True, locale="en-US")
    page = await ctx.new_page()
    page.set_default_timeout(NAV_TIMEOUT_MS)
    reqs = {"count": 0, "failed": 0}
    page.on("request", lambda r: reqs.__setitem__("count", reqs["count"] + 1))
    page.on("requestfailed", lambda r: reqs.__setitem__("failed", reqs["failed"] + 1))
    data, err, a11y = None, None, None
    try:
        try:
            resp = await page.goto(url, wait_until="load", timeout=NAV_TIMEOUT_MS)
        except PWTimeout:
            # the load event never fired; the DOM may still be usable
            resp = None
            err = "load event did not fire within 35 s"
        await page.wait_for_timeout(2000)
        status = resp.status if resp else None
        data = await asyncio.wait_for(page.evaluate(PAGE_JS), 30)
        data["status"] = status
        data["final_url"] = page.url
        data["html"] = (await page.content())[:600000]
        try:
            await page.add_script_tag(content=IIFE)
            a11y = await asyncio.wait_for(page.evaluate(A11Y_JS), 60)
        except Exception as e:
            a11y = {"error": f"{type(e).__name__}: {str(e)[:120]}"}
    except Exception as e:
        err = f"{type(e).__name__}: {str(e)[:160]}"
    finally:
        try:
            await ctx.close()
        except Exception:
            pass
    return data, reqs, a11y, err


def gate(ent, data, final_url):
    """Does this page answer to the entity's name? Returns (ok, why)."""
    hay = ((data.get("title") or "") + "\n" + (data.get("text") or "")[:200000]).lower()
    hay = re.sub(r"\s+", " ", hay)
    fu = (final_url or "").lower()
    fh = host_of(fu)
    fh = fh[4:] if fh.startswith("www.") else fh
    if PARKING_HOSTS.search(fh) or re.search(r"[?&]dn=", fu):
        return False, "the address on record now lands on a domain-parking page, so the domain may have lapsed"
    if NOT_GOVT_HOSTS.search(fh):
        return False, "the address on record belongs to a chamber of commerce or tourism body, which is a separate organisation"
    title_raw = (data.get("title") or "").strip()
    if PLACEHOLDER_TITLE.search(title_raw):
        return False, "the address serves a placeholder page (" + title_raw[:40] + "), not a website"
    text_head = (data.get("text") or "")[:1500]
    lang = (data.get("lang") or "").strip().lower()
    nonascii = sum(1 for ch in (title_raw + text_head) if ord(ch) > 127 and ch.isalpha())
    if SPAM_TEXT.search(title_raw) or SPAM_TEXT.search(text_head[:400]) or (lang and not lang.startswith("en")) or nonascii > 20:
        return False, "the address on record now serves unrelated content (another language or spam), so the domain may have lapsed or changed hands"
    if re.sub(r"^(m|web)\.", "", fh) in SOCIAL_HOSTS:
        return False, "the address on record is a social-media page, not a website of the entity's own"
    if fh in VENDOR_BARE and not (urlsplit(fu).path or "/").strip("/"):
        return False, "it redirects to the vendor's national site, which is not this entity's own pages"
    if "accounts.google.com" in fu or re.search(r"/(login|signin|sign-in|sign_in|auth)\b", urlsplit(fu).path or ""):
        return False, "the site asks for a sign-in, so it is not publicly reachable"
    title = (data.get("title") or "").lower()
    if BOTCHECK_URL.search(fu) or BOTCHECK_TITLE.search(title):
        return False, "the site put a bot check in front of our scanner, so its real home page could not be read"
    if PARKED.search(hay):
        return False, "parked domain page"
    urlflat = re.sub(r"[^a-z0-9]", "", final_url.lower())
    text_all = (data.get("text") or "")
    words = SCHOOL_WORDS if ent["type"] == "district" else CIVIC_WORDS
    pool = text_all[:200000] + " | " + (data.get("navText") or "")
    hits = sorted({m.group(0).lower() for m in words.finditer(pool)})
    authoritative = bool(AUTHORITATIVE_HOST.search(host_of(final_url)))
    matched = None
    for t in ent["tokens"]:
        tt = t.lower()
        if tt in hay:
            matched = f"page mentions “{t}”"
            break
        if len(tt) >= 5 and re.sub(r"[^a-z0-9]", "", tt) in urlflat:
            if len(text_all.strip()) < 200:
                return False, "the page has almost no content and does not mention the entity (a placeholder)"
            matched = f"the site's own address contains “{t}”"
            break
    if not matched:
        for t in ent.get("city_tokens") or []:
            if t.lower() in hay and ent["type"] == "district":
                matched = f"page mentions the district's town “{t}”"
                break
    if not matched:
        return False, "the page does not mention the entity's name"
    strong = STRONG_SCHOOL if ent["type"] == "district" else STRONG_CIVIC
    kind = "school" if ent["type"] == "district" else "government"
    if (len(hits) < 2 or not any(strong.search(h) for h in hits)) and not authoritative:
        return False, f"the page mentions the name but not the usual {kind} words (found {', '.join(hits) if hits else 'none'}), so it does not look like the entity's own site"
    body = re.sub(r"skip to (main )?(content|navigation)", "", text_all[:600], flags=re.I).strip()
    if len(text_all.strip()) < 600 and re.search(r"under construction|coming soon|site is being (built|updated)|check back soon", body, re.I):
        return False, "the address serves a page that says it is under construction, so there is nothing to grade yet"
    data["identity_words"] = hits[:12]
    return True, matched


async def check_links(client, site_url, links):
    sh = host_of(site_url)
    seen, todo = set(), []
    base = site_url.split("#")[0].rstrip("/")
    for l in links:
        href = (l.get("href") or "").split("#")[0]
        if not href.startswith(("http://", "https://")):
            continue
        if href.rstrip("/") == base or not internal(host_of(href), sh):
            continue
        if href in seen:
            continue
        seen.add(href)
        todo.append((href, l.get("text") or ""))
        if len(todo) >= LINK_CAP:
            break
    results = []
    for href, text in todo:
        h = host_of(href)
        st, note = None, None
        try:
            await polite.wait(h)
            r = await client.head(href, follow_redirects=True, timeout=httpx.Timeout(10.0, connect=8.0))
            st = r.status_code
            if st in (403, 405, 501, 400, 404, 500):
                await polite.wait(h)
                async with client.stream("GET", href, follow_redirects=True, timeout=httpx.Timeout(10.0, connect=8.0)) as r2:
                    st = r2.status_code
        except httpx.TimeoutException:
            note = "timed out"
        except Exception as e:
            note = f"{type(e).__name__}"
            st = 0
        results.append({"url": href, "text": text[:80], "status": st, "note": note})
    checked = [r for r in results if r["note"] != "timed out"]
    broken = [r for r in checked if (r["status"] or 0) >= 400 or r["status"] == 0]
    return {"found": len(seen), "checked": len(checked), "broken": len(broken), "timed_out": len(results) - len(checked),
            "broken_list": [{"url": b["url"], "text": b["text"], "status": b["status"], "note": b["note"]} for b in broken][:10]}


def detect_platform(html, final_url):
    # Only what the page LOADS (script/stylesheet/image/iframe sources), its generator meta and its
    # own address count - a link to municode.com in the body is not evidence the site runs on it.
    h = (html or "")[:600000]
    srcs = re.findall(r"""\b(?:src|href)\s*=\s*["']([^"']+)["']""", h, re.I)
    keep = []
    for m in re.finditer(r"<(script|link|img|iframe)\b[^>]*>", h, re.I):
        tag = m.group(0)
        if m.group(1).lower() == "link" and not re.search(r"""rel\s*=\s*["'][^"']*stylesheet""", tag, re.I):
            continue
        mm = re.search(r"""\b(?:src|href)\s*=\s*["']([^"']+)["']""", tag, re.I)
        if mm:
            keep.append(mm.group(1))
    gen = re.search(r"""<meta[^>]+name\s*=\s*["']generator["'][^>]*content\s*=\s*["']([^"']+)""", h, re.I)
    hay = (" ".join(keep) + " " + (gen.group(1) if gen else "") + " " + final_url).lower()
    hay += " " + " ".join(re.findall(r"""<body[^>]*class\s*=\s*["']([^"']+)""", h, re.I)).lower()
    hits = []
    for name, pat in PLATFORMS:
        if re.search(pat, hay):
            if name not in hits:
                hits.append(name)
    return hits[:3]


def score_entity(res):
    """Fill res['checks'][*]['score'] (0..1) where status == 'ok', and the overall grade."""
    W = {"https": 15, "mobile": 15, "accessibility": 20, "freshness": 10, "links": 10, "contact": 10, "speed": 10, "required": 10}
    got, avail = 0.0, 0
    for k, w in W.items():
        c = res["checks"].get(k) or couldnt("not run")
        if c.get("status") == "ok" and c.get("score") is not None:
            got += w * c["score"]
            avail += w
    res["points_available"] = avail
    res["points"] = round(got, 1)
    ran = sum(1 for k in W if (res["checks"].get(k) or {}).get("status") == "ok")
    res["checks_ran"] = ran
    if ran < 4:
        res["score"] = None
        res["grade"] = "Not graded"
        res["grade_note"] = f"only {ran} of 8 checks could run"
        return
    pct = 100.0 * got / avail
    res["score"] = round(pct, 1)
    res["grade"] = "A" if pct >= 90 else "B" if pct >= 80 else "C" if pct >= 70 else "D" if pct >= 60 else "F"
    res["grade_note"] = f"{ran} of 8 checks ran" + ("" if ran == 8 else "; the others are excluded from the score")


async def scan_entity(ent, client, browser):
    res = {"id": ent["id"], "type": ent["type"], "kind": ent["kind"], "name": ent["name"], "slug": ent["slug"],
           "scanned_at": now_iso(), "site": None, "site_source": None, "tried": [], "checks": {}, "notes": [],
           "population": ent.get("population"), "enrollment": ent.get("enrollment"), "city": ent.get("city")}
    cands = [c for c in ent["candidates"] if not c.get("excluded")]
    for c in ent["candidates"]:
        if c.get("excluded"):
            res["tried"].append({"url": c["url"], "source": c["source"], "outcome": "not tried: " + c["excluded"]})
    if not cands:
        res["outcome"] = "no-site"
        res["outcome_note"] = "no official website on record in the registries used"
        return res
    chosen = None
    for c in cands:
        url = c["url"]
        h = host_of(url)
        if not h:
            res["tried"].append({"url": url, "source": c["source"], "outcome": "not a usable URL"})
            continue
        rp, rnote = await fetch_robots(client, url)
        if rp is not None:
            try:
                if not rp.can_fetch(url, BOT) and not rp.can_fetch(url, "*"):
                    res["tried"].append({"url": url, "source": c["source"], "outcome": "robots.txt disallows crawling the home page"})
                    continue
                cd = rp.crawl_delay(BOT) or rp.crawl_delay("*")
                if cd:
                    polite.delay[h] = min(max(float(cd), MIN_HOST_DELAY), MAX_HOST_DELAY)
            except Exception:
                pass
        probe = await http_probe(client, url)
        load_url = probe["final_url"] or url
        data, reqs, a11y, err = await load_page(browser, load_url)
        if data is None:
            res["tried"].append({"url": url, "source": c["source"], "outcome": f"could not load: {err or probe.get('https_error') or probe.get('http_error') or 'unknown'}"})
            continue
        if data.get("status") and data["status"] >= 400:
            res["tried"].append({"url": url, "source": c["source"], "outcome": f"home page answered HTTP {data['status']}"})
            continue
        ok, why = gate(ent, data, data["final_url"])
        if not ok:
            res["tried"].append({"url": url, "source": c["source"], "outcome": f"not accepted: {why}", "final": data["final_url"],
                                 "title": (data.get("title") or "")[:120]})
            continue
        res["tried"].append({"url": url, "source": c["source"], "outcome": "accepted: " + why, "final": data["final_url"]})
        chosen = (c, probe, data, reqs, a11y, err, rnote)
        break
    if not chosen:
        res["outcome"] = "unreachable"
        res["outcome_note"] = "no candidate site could be confirmed as this entity's own site (see what was tried)"
        return res

    c, probe, data, reqs, a11y, err, rnote = chosen
    res["outcome"] = "scanned"
    res["site"] = data["final_url"]
    res["site_source"] = c["source"]
    res["robots"] = rnote
    res["title"] = data.get("title", "")[:160]
    res["identity_words"] = data.get("identity_words")
    res["lang"] = data.get("lang")
    res["platform"] = detect_platform(data.get("html"), data["final_url"])
    if data.get("generator"):
        res["generator"] = data["generator"][:80]
    if err:
        res["notes"].append(err)
    ch = res["checks"]

    # HTTPS
    if probe["https"] is None and probe["http_redirect"] is None:
        ch["https"] = couldnt(f"the site did not answer our HTTPS probe ({probe.get('https_error')})")
    else:
        https_ok = bool(probe["https"])
        redir = probe["http_redirect"]
        s = (0.67 if https_ok else 0.0) + (0.33 if redir else 0.0)
        ch["https"] = {"status": "ok", "score": round(s, 3), "https": https_ok, "https_error": probe.get("https_error"),
                       "http_redirects": redir, "http_error": probe.get("http_error")}

    # Mobile
    vp = data.get("viewport")
    has_vp = bool(vp) and ("width" in vp.lower())
    overflow = (data.get("scrollWidth") or 0) > (data.get("innerWidth") or 375) + 4
    ch["mobile"] = {"status": "ok", "score": (0.5 if has_vp else 0) + (0.5 if not overflow else 0),
                    "viewport_meta": has_vp, "viewport_content": (vp or "")[:80], "overflow_375": overflow,
                    "scroll_width": data.get("scrollWidth"), "inner_width": data.get("innerWidth")}

    # Accessibility
    if not a11y or a11y.get("error"):
        ch["accessibility"] = couldnt("the accessibility engine could not run on this page" + (f" ({a11y['error']})" if a11y else ""))
    else:
        bi = a11y["byImpact"]
        rules = sorted(a11y["rules"], key=lambda r: ({"critical": 0, "serious": 1, "moderate": 2, "minor": 3}[r["impact"]], -r["count"]))
        dr = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
        for r in rules:
            dr[r["impact"]] += 1
        pen = 0.15 * dr["critical"] + 0.09 * dr["serious"] + 0.04 * dr["moderate"] + 0.015 * dr["minor"]
        pen += min(0.25, 0.004 * (bi.get("critical", 0) + bi.get("serious", 0)))
        ch["accessibility"] = {"status": "ok", "score": round(max(0.0, 1.0 - pen), 3), "by_impact": bi, "distinct_rules": dr,
                               "rules": rules[:12], "total": a11y["total"], "rule_count": a11y["ruleCount"], "engine": "accesslint core 0.21.0"}

    # Freshness
    newest = parse_dates(data.get("text") or "", data.get("times"))
    lm = None
    if probe.get("last_modified"):
        try:
            from email.utils import parsedate_to_datetime
            lmd = parsedate_to_datetime(probe["last_modified"])
            if abs((dt.datetime.now(dt.timezone.utc) - lmd).total_seconds()) > 600:
                lm = lmd.date()
        except Exception:
            lm = None
    basis, d = None, None
    if newest:
        basis, d = "newest date printed on the home page", newest
    elif lm:
        basis, d = "Last-Modified header", lm
    if d is None:
        ch["freshness"] = couldnt("no dated item on the home page and no usable Last-Modified header")
    else:
        age = (TODAY - d).days
        s = 1.0 if age <= 30 else 0.75 if age <= 90 else 0.5 if age <= 180 else 0.25 if age <= 365 else 0.0
        ch["freshness"] = {"status": "ok", "score": s, "date": d.isoformat(), "days": age, "basis": basis}

    # Broken links
    try:
        lk = await asyncio.wait_for(check_links(client, data["final_url"], data.get("links") or []), 150)
        if lk["checked"] == 0:
            ch["links"] = couldnt("no internal links on the home page could be checked" if lk["found"] else "no internal links found on the home page")
        else:
            lk.update({"status": "ok", "score": round(1.0 - lk["broken"] / lk["checked"], 3)})
            ch["links"] = lk
    except asyncio.TimeoutError:
        ch["links"] = couldnt("link checks ran out of time")

    # Contact
    text = data.get("text") or ""
    links = data.get("links") or []
    phone = bool(PHONE.search(text)) or any((l.get("href") or "").startswith("tel:") for l in links)
    email = bool(EMAIL.search(text)) or any((l.get("href") or "").startswith("mailto:") for l in links)
    address = bool(OK_ZIP.search(text)) or bool(PO_BOX.search(text)) or bool(STREET.search(text))
    form = any(f.get("hasTextarea") or f.get("hasEmail") for f in data.get("forms") or []) or \
        any(CONTACT_LINK.search(l.get("text") or "") or CONTACT_LINK.search(l.get("href") or "") for l in links)
    ch["contact"] = {"status": "ok", "score": round((1 if phone else 0) / 3 + (1 if address else 0) / 3 + (1 if (email or form) else 0) / 3, 3),
                     "phone": phone, "address": address, "email": email, "contact_form_or_link": form}

    # Speed
    ttfb, kb, n = probe.get("ttfb_s"), probe.get("html_bytes"), reqs.get("count")
    parts = []
    if ttfb is not None:
        parts.append(1.0 if ttfb <= 0.5 else 0.75 if ttfb <= 1.0 else 0.5 if ttfb <= 2.0 else 0.25 if ttfb <= 4.0 else 0.0)
    if kb is not None:
        k = kb / 1024
        parts.append(1.0 if k <= 100 else 0.75 if k <= 300 else 0.5 if k <= 600 else 0.25 if k <= 1024 else 0.0)
    if n is not None:
        parts.append(1.0 if n <= 50 else 0.75 if n <= 100 else 0.5 if n <= 150 else 0.25 if n <= 250 else 0.0)
    if not parts:
        ch["speed"] = couldnt("no timing could be measured")
    else:
        ch["speed"] = {"status": "ok", "score": round(sum(parts) / len(parts), 3), "ttfb_s": ttfb, "html_kb": round(kb / 1024, 1) if kb is not None else None,
                       "requests": n, "failed_requests": reqs.get("failed"), "resource_bytes": data.get("resourceBytes")}

    # Required items (home-page links only)
    a11y_link = any(A11Y_TEXT.search(l.get("text") or "") or A11Y_HREF.search(urlsplit(l.get("href") or "").path) for l in links)
    rec_link = any(RECORDS_TEXT.search(l.get("text") or "") or RECORDS_HREF.search(urlsplit(l.get("href") or "").path) for l in links)
    ch["required"] = {"status": "ok", "score": (0.5 if a11y_link else 0) + (0.5 if rec_link else 0),
                      "accessibility_statement_link": a11y_link, "records_or_meetings_link": rec_link,
                      "note": "looked for these among the home page's links only"}

    rescore(res)
    return res


async def worker(name, q, client, browser, outf, stats):
    while True:
        ent = await q.get()
        if ent is None:
            q.task_done()
            return
        t0 = time.monotonic()
        try:
            res = await asyncio.wait_for(scan_entity(ent, client, browser), ENTITY_CAP_S)
        except asyncio.TimeoutError:
            res = {"id": ent["id"], "type": ent["type"], "kind": ent["kind"], "name": ent["name"], "slug": ent["slug"],
                   "scanned_at": now_iso(), "site": None, "tried": [], "checks": {}, "notes": [], "outcome": "timeout",
                   "outcome_note": f"the scan of this entity ran out of time ({ENTITY_CAP_S} s)", "population": ent.get("population"),
                   "enrollment": ent.get("enrollment"), "city": ent.get("city")}
        except Exception as e:
            res = {"id": ent["id"], "type": ent["type"], "kind": ent["kind"], "name": ent["name"], "slug": ent["slug"],
                   "scanned_at": now_iso(), "site": None, "tried": [], "checks": {}, "notes": [], "outcome": "error",
                   "outcome_note": f"scanner error: {type(e).__name__}: {str(e)[:200]}", "population": ent.get("population"),
                   "enrollment": ent.get("enrollment"), "city": ent.get("city")}
        res["seconds"] = round(time.monotonic() - t0, 1)
        outf.write(json.dumps(res, ensure_ascii=False) + "\n")
        outf.flush()
        stats["done"] += 1
        g = res.get("grade") or res.get("outcome")
        print(f"[{stats['done']}/{stats['total']}] {ent['type']:8} {ent['name'][:40]:40} {g:12} {res.get('site') or ''} ({res['seconds']}s)", flush=True)
        q.task_done()


async def main():
    global UA
    ap = argparse.ArgumentParser()
    ap.add_argument("--entities", default=os.path.join(HERE, "data", "entities.json"))
    ap.add_argument("--out", default=os.path.join(HERE, "data", "results.jsonl"))
    ap.add_argument("--only", default=None, help="district|county|city")
    ap.add_argument("--ids", default=None)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--redo", action="store_true")
    a = ap.parse_args()
    ents = json.load(open(a.entities, encoding="utf-8"))
    if a.only:
        ents = [e for e in ents if e["type"] in a.only.split(",")]
    if a.ids:
        want = set(a.ids.split(","))
        ents = [e for e in ents if e["id"] in want or e["slug"] in want]
    done = set()
    if os.path.exists(a.out) and not a.redo:
        for l in open(a.out, encoding="utf-8"):
            try:
                done.add(json.loads(l)["id"])
            except Exception:
                pass
    ents = [e for e in ents if e["id"] not in done]
    if a.limit:
        ents = ents[:a.limit]
    print(f"{len(ents)} entities to scan ({len(done)} already done)", flush=True)
    # Playwright's own bundled Chromium headless shell - never the everyday Chrome. The venv's
    # Playwright expects a newer build than the one on disk, so the path is given explicitly.
    exe = os.path.join(os.environ.get("LOCALAPPDATA", ""), "ms-playwright", "chromium_headless_shell-1228",
                       "chrome-headless-shell-win64", "chrome-headless-shell.exe")
    launch_kw = {"headless": True}
    if os.path.exists(exe):
        launch_kw["executable_path"] = exe
    async with async_playwright() as p:
        browser = await p.chromium.launch(**launch_kw)
        ctx = await browser.new_context()
        pg = await ctx.new_page()
        ua = await pg.evaluate("navigator.userAgent")
        await ctx.close()
        UA = ua.replace("HeadlessChrome", "Chrome") + " " + BOT
        limits = httpx.Limits(max_connections=40, max_keepalive_connections=20)
        async with httpx.AsyncClient(headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                                              "Accept-Language": "en-US,en;q=0.8"},
                                     timeout=httpx.Timeout(HTTP_TIMEOUT, connect=12.0), limits=limits, verify=True) as client:
            q = asyncio.Queue()
            for e in ents:
                q.put_nowait(e)
            for _ in range(a.workers):
                q.put_nowait(None)
            stats = {"done": 0, "total": len(ents)}
            with open(a.out, "a", encoding="utf-8") as outf:
                await asyncio.gather(*[worker(i, q, client, browser, outf, stats) for i in range(a.workers)])
        await browser.close()
    print("done", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
