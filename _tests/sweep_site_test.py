#!/usr/bin/env python3
"""Static checks for the free website check on station.solutions (internally "Bug Sweeper").

Run from the repo root:  python3 _tests/sweep_site_test.py
Stdlib only. The directory starts with "_" so GitHub Pages (Jekyll) never publishes it.
The browser half (real rendering, real form posts, the unsubscribe click) is
_tests/sweep_browser.test.mjs.
"""
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVICE = "https://audit.station.solutions/sweep"
MICROCOPY = "We'll email your result to this address. No marketing unless you ask."


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def nav_pages():
    out = []
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if not d.startswith((".", "_"))]
        for f in fn:
            if f.endswith(".html"):
                p = os.path.join(dp, f)
                with open(p, encoding="utf-8", errors="replace") as fh:
                    if 'class="mega"' in fh.read():
                        out.append(os.path.relpath(p, ROOT))
    return sorted(out)


class Forms(HTMLParser):
    """Collects every <form> with its inputs, plus the page's visible text."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.forms, self._cur, self._skip, self.text, self.scripts = [], None, 0, [], []
        self._script = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "form":
            self._cur = {"attrs": a, "inputs": [], "buttons": []}
            self.forms.append(self._cur)
        elif tag == "input" and self._cur is not None:
            self._cur["inputs"].append(a)
        elif tag == "button" and self._cur is not None:
            self._cur["buttons"].append(a)
        if tag in ("script", "style", "noscript"):
            self._skip += 1
            if tag == "script":
                self._script = {"attrs": a, "src": a.get("src"), "body": []}

    def handle_endtag(self, tag):
        if tag == "form":
            self._cur = None
        if tag in ("script", "style", "noscript"):
            self._skip = max(0, self._skip - 1)
            if tag == "script" and self._script is not None:
                self.scripts.append(self._script)
                self._script = None

    def handle_data(self, data):
        if self._script is not None:
            self._script["body"].append(data)
        if not self._skip:
            self.text.append(data)


def parse(rel):
    p = Forms()
    p.feed(read(rel))
    p.visible = re.sub(r"\s+", " ", " ".join(p.text))
    return p


def between(s, start, end):
    i = s.index(start)
    return s[i:s.index(end, i) + len(end)]


# Spam vocabulary (CONTRACT §5.3 / §5.4): station-parasite engine/sweep.py @ f07744a STRONG and
# WEAK, copied verbatim, plus the contract's extra list. STRONG entries match as substrings (as
# the engine does); WEAK and extra entries match as whole words.
STRONG = ["viagra", "cialis", "levitra", "kamagra", "sildenafil", "tadalafil", "vardenafil",
          "onlinepharmacy", "online-pharmacy", "erectile", "xanax", "tramadol", "phentermine",
          "modafinil", "ivermectin-buy", "male-enhancement", "male enhancement", "male_enhancement",
          "sexual-enhancement", "sexual enhancement", "erection", "penis", "penus", "libido",
          "extenze", "vaiagra", "ed-pills", "ed pills", "ed_pills", "male_pill", "sexual-stimulant",
          "casino", "gambling", "sportsbook", "togel", "judi-online", "slotgacor", "slot-gacor",
          "pokies", "vulkan", "1xbet", "mostbet", "pin-up",
          "escort", "porn", "xxx", "hentai", "camgirl", "onlyfans-leak", "sexcam", "hookup",
          "datingstatus", "bstdating", "bstincontri", "bstrencontre", "rencontre", "incontri",
          "sugardaddy", "sugar-daddy",
          "essaywriter", "essay-writ", "writemyessay", "write-my-essay", "paperhelp", "homeworkhelp",
          "dissertation-writ", "buyessay", "buy-essay", "essayservice", "essay-service",
          "custom-essay", "customessay", "essaypro", "grademiners", "academic-writing-service",
          "domywriting", "customwriting", "payforessay", "pay-for-essay", "termpaper",
          "ghostwriting-service", "cloudmining", "cloud-mining", "minergate", "bitcoin-casino",
          "paydayloan", "payday-loan", "payday loan", "titleloan", "cash-advance-online",
          "replica-watch", "replicawatch", "cheap-jordans", "fake-rolex",
          "buy-backlinks", "buybacklinks", "link-building-service"]
WEAK = ["bet", "betting", "slots", "slot", "poker", "roulette", "blackjack", "baccarat",
        "sex", "dating", "escorts", "nude", "milf", "pills", "pharmacy", "rx", "cbd",
        "loans", "payday", "essay", "essays", "dissertation", "crypto", "bitcoin", "forex", "binance"]
EXTRA = ["casino", "viagra", "escort", "togel", "pills", "porn", "loan", "loans", "essay", "essays",
         "gambling", "betting", "pharmacy"]

# CONTRACT §0.1: never on any customer-facing page.
BANNED_CUSTOMER = [r"\bparasites?\b", r"\bprocedure\b", r"\bmedicine\b", r"\bprescription\b",
                   r"\binspection\b", r"\binfected\b", r"\bfull audit\b", r"\bnorman\b",
                   r"\boklahoma law\b", r"parasitesweep", r"\$500\b", r"\$49 a month", r"sweep50",
                   r"procedure79", r"\$19(?![\d,])", r"\$99(?![\d,])", r"\bpdf\b",
                   r"gohighlevel", r"highlevel", r"leadconnector", r"\bghl\b",
                   r"\(\d{3}\)\s*\d{3}-\d{4}", r"\b\d{3}[-.]\d{3}[-.]\d{4}\b", r"bug sweeper"]


# Autofill and password managers match fields by name, id and label. The honeypot's name is fixed by
# the contract (company_fax), so its id and label must give them nothing else to match.
AUTOFILL_WORDS = re.compile(r"company|organi[sz]ation|business|fax|phone|tel|name|email|mail|address|street|"
                            r"city|zip|postal|country|url|website|user|login|pass", re.I)
HP_IGNORE = ("data-1p-ignore", 'data-lpignore="true"', "data-bwignore", 'data-form-type="other"')


def honeypot_ok(test, src, prefix):
    m = re.search(r'<div class="sw-hp" aria-hidden="true"><label for="(%s[^"]*)">([^<]*)</label>(<input [^>]*>)</div>' % prefix, src)
    test.assertIsNotNone(m, "honeypot markup")
    hid, label, inp = m.groups()
    test.assertIn('id="%s"' % hid, inp)
    test.assertIn('name="company_fax"', inp)
    test.assertIn('tabindex="-1"', inp)
    test.assertIn('autocomplete="off"', inp)
    test.assertEqual(label, "Leave this empty")
    test.assertIsNone(AUTOFILL_WORDS.search(hid), hid)
    test.assertIsNone(AUTOFILL_WORDS.search(label), label)
    for a in HP_IGNORE:
        test.assertIn(a, inp)


def spam_hits(text):
    t = text.lower()
    hits = [w for w in STRONG if w in t]
    words = set(re.findall(r"[a-z0-9]+", t))
    hits += [w for w in WEAK + EXTRA if w in words]
    return sorted(set(hits))


def banned_hits(text):
    t = text.lower()
    return [p for p in BANNED_CUSTOMER if re.search(p, t)]


class SweepPage(unittest.TestCase):
    def setUp(self):
        self.src = read("sweep/index.html")
        self.p = parse("sweep/index.html")

    def form(self, kind):
        fs = [f for f in self.p.forms if f["attrs"].get("data-sweep") == kind]
        self.assertEqual(len(fs), 1, kind)
        return fs[0]

    def test_check_form_contract(self):
        f = self.form("check")
        self.assertEqual(f["attrs"]["action"], SERVICE + "/check")
        self.assertEqual(f["attrs"]["method"].lower(), "post")
        self.assertEqual(f["attrs"].get("id"), "check")
        names = {i.get("name"): i for i in f["inputs"]}
        self.assertEqual(set(names), {"website", "email", "company_fax", "src"})
        self.assertIn("required", names["website"])
        self.assertEqual(names["website"].get("type"), "text")  # type=url would refuse "yourbusiness.com"
        self.assertEqual(names["website"].get("maxlength"), "500")
        self.assertIn("required", names["email"])
        self.assertEqual(names["email"].get("type"), "email")
        self.assertEqual(names["email"].get("maxlength"), "254")
        hp = names["company_fax"]
        self.assertEqual(hp.get("tabindex"), "-1")
        self.assertEqual(hp.get("autocomplete"), "off")
        self.assertNotIn("required", hp)
        self.assertEqual(names["src"].get("type"), "hidden")
        self.assertEqual(names["src"].get("value"), "sweep_page")
        # the honeypot sits in an off-screen, aria-hidden wrapper, and nothing autofill matches
        honeypot_ok(self, self.src, "sw-")
        self.assertIn(MICROCOPY, self.p.visible)

    def test_code_form_contract(self):
        f = self.form("code")
        self.assertEqual(f["attrs"]["action"], SERVICE + "/code")
        self.assertEqual(f["attrs"]["method"].lower(), "get")
        self.assertEqual(f["attrs"].get("id"), "code")
        self.assertEqual(f["attrs"].get("data-label"), "sweep_page")
        self.assertEqual([i.get("name") for i in f["inputs"]], ["c"])
        self.assertEqual(f["inputs"][0].get("placeholder"), "8-character code")

    def test_prefill_leaves_the_address_first(self):
        # ?url= / ?code= are lifted out of the address by an inline <head> script that runs before
        # attribution.js, analytics.js (and so the Meta Pixel) or any other script file.
        i = self.src.index("window.__sweepPrefill=o")
        self.assertLess(i, self.src.index("</head>"))
        first_src = re.search(r"<script[^>]*\bsrc=", self.src).start()
        self.assertLess(i, first_src)
        blk = self.src[self.src.rfind("<script>", 0, i):self.src.index("</script>", i)]
        self.assertIn('["url","code"]', blk)
        self.assertIn("history.replaceState(", blk)
        self.assertIn("q.delete(k)", blk)
        js = read("v5.js")
        self.assertIn("pre = window.__sweepPrefill || {}", js)
        self.assertIn('String(pre.url || qs.get("url") || "")', js)
        self.assertIn('String(pre.code || qs.get("code") || "")', js)

    def test_cases_are_evidence_gate_keeps(self):
        # Each showcase card must be a case the N3 evidence gate KEEPS as "hidden links found" (the
        # `keep` rows of the lead session's evidence dry run): med spa, plumber, dental practice.
        # The agency card was removed on 2026-09-29: its specimen was a visible link (gate check b).
        # Swap a card only after re-checking the new case against the gate.
        tags = re.findall(r'<span class="sw-tag">([^<]*)</span>', self.src)
        self.assertEqual(tags, ["Med spa · Texas", "Plumbing company · Texas", "Dental practice · Texas"])
        self.assertNotIn("agency", self.p.visible.lower())
        self.assertIn("1, shown only to Google", self.p.visible)

    def test_promises_match_what_backs_them(self):
        v = self.p.visible
        # the verdict queue has no clock (WS1 result page: "usually within one business day")
        self.assertIn("emails you the answer, usually within one business day", v)
        self.assertNotIn("answer within one business day", v)
        # cleanup-authorization §7: the same kind of injected links, new problems excluded
        self.assertIn("if the same kind of hidden links come back in that time, we clean them again at no charge", v)
        self.assertIn("That doesn't cover a new problem", v)
        self.assertNotIn("if the links come back in that time we clean it again", v)

    def test_view_event_and_scripts(self):
        self.assertIn('<body data-range-view="sweep_view:sweep_page">', self.src)
        srcs = [s["src"] for s in self.p.scripts if s["src"]]
        self.assertIn("/analytics.js", srcs)
        self.assertTrue(any(s.startswith("/v5.js") for s in srcs))
        self.assertFalse(any("audit-popup" in s for s in srcs), "audit-popup.js must stay off /sweep/")
        self.assertNotIn("audit-popup", self.src.replace("audit-popup.js must never load on this page", ""))
        self.assertIn('<link rel="stylesheet" href="/v5.css?v=', self.src)
        self.assertIn('<link rel="canonical" href="https://station.solutions/sweep/">', self.src)

    def test_prices_and_products(self):
        v = self.p.visible
        for s in ["Full report", "$79", "Credited in full toward a cleanup within 90 days",
                  "Refundable within 7 days", "Cleanup", "$349", "$749", "Quoted",
                  "you only ever see your own price", "Free website check"]:
            self.assertIn(s, v)

    def test_legal_identity_and_links(self):
        v = self.p.visible
        self.assertIn("Station Automations Group LLC · 1856 Branard St, Houston, TX 77098", v)
        self.assertIn("main@station.solutions", v)
        self.assertIn("Texas law", v)
        for href in [SERVICE + "/legal/sweep-terms.html", SERVICE + "/legal/cleanup-authorization.html",
                     SERVICE + "/legal/scanning-disclosure.html", "/legal/privacy.html#website-check"]:
            self.assertIn('href="%s"' % href, self.src)
        # N4: developer involvement, own backup, backup restore, liability cap, no search promise
        for s in ["bring in your web developer", "keep your own backup", "put it back",
                  "Because Station didn't build your site or look after it",
                  "never goes beyond what you paid", "We can't promise how search engines"]:
            self.assertIn(s, v)

    def test_faq_jsonld_matches_visible_faq(self):
        m = re.search(r'<script type="application/ld\+json">(.*?)</script>', self.src, re.S)
        ld = json.loads(m.group(1))
        self.assertEqual(ld["@type"], "FAQPage")
        vis = [(html.unescape(q), re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", a))).strip())
               for q, a in re.findall(r"<details><summary>(.*?)</summary><p>(.*?)</p></details>", self.src, re.S)]
        got = [(e["name"], re.sub(r"\s+", " ", e["acceptedAnswer"]["text"]).strip()) for e in ld["mainEntity"]]
        self.assertEqual(vis, got)
        self.assertGreaterEqual(len(vis), 8)

    def test_customer_words(self):
        body = between(self.src, '<main id="main">', "</main>")
        p = Forms(); p.feed(body)
        vis = " ".join(p.text) + " " + " ".join(re.findall(r'(?:placeholder|aria-label|title|content)="([^"]*)"', self.src))
        self.assertEqual(banned_hits(vis), [])
        self.assertEqual(spam_hits(vis), [])
        # head text a search engine or a share card shows
        head = between(self.src, "<head>", "</head>")
        self.assertEqual(banned_hits(re.sub(r"<script.*?</script>|<!--.*?-->", "", head, flags=re.S)), [])
        ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', self.src, re.S).group(1)
        self.assertEqual(spam_hits(ld), [])
        self.assertEqual(banned_hits(ld), [])


class Homepage(unittest.TestCase):
    def setUp(self):
        self.src = read("index.html")
        self.p = parse("index.html")

    def test_hero_buttons_unchanged_and_quiet_line(self):
        ctas = between(self.src, '<div class="hf-ctas">', "</div>")
        self.assertEqual(ctas, '<div class="hf-ctas">\n'
                               '          <a class="btn amber-fill" href="/custom/">See your new website — free demo</a>\n'
                               '          <a class="hf-link" href="/audit/">Get a free audit</a>\n'
                               '        </div>')
        after = self.src[self.src.index(ctas) + len(ctas):]
        self.assertTrue(after.lstrip().startswith('<p class="hf-quiet">Worried your website has been hacked? <a href="#sweep-band">'))

    def test_band_sits_immediately_above_start_here(self):
        i_hero_end = self.src.index("</section>", self.src.index('<section class="parallax">'))
        i_band = self.src.index('<section id="sweep-band"')
        i_shop = self.src.index('<div id="shop">')
        self.assertEqual(self.src[i_hero_end:i_band].strip(), "</section>")
        band = self.src[i_band:i_shop]
        self.assertTrue(band.rstrip().endswith("</section>"))
        self.assertIn("Start here.", self.src[i_shop:i_shop + 200])

    def test_band_form(self):
        fs = [f for f in self.p.forms if f["attrs"].get("data-sweep") == "check"]
        self.assertEqual(len(fs), 1)
        f = fs[0]
        self.assertEqual(f["attrs"]["action"], SERVICE + "/check")
        self.assertEqual(f["attrs"]["method"].lower(), "post")
        names = {i.get("name"): i for i in f["inputs"]}
        self.assertEqual(set(names), {"website", "email", "company_fax", "src"})
        self.assertEqual(names["src"]["value"], "home_band")
        self.assertEqual(names["company_fax"].get("tabindex"), "-1")
        self.assertNotIn("data-audit", f["attrs"])  # never wired as the audit form
        band = between(self.src, '<section id="sweep-band"', "</section>")
        honeypot_ok(self, band, "swb-")
        # it asks for an email, so the terms and the privacy note sit right under it (as on /sweep/)
        self.assertIn('<p class="sw-micro">%s</p>\n    <p class="sw-fine"><a href="%s/legal/sweep-terms.html">Terms for the check</a>'
                      ' · <a href="/legal/privacy.html#website-check">How we use your email</a></p>'
                      % (MICROCOPY, SERVICE), band)
        bp = Forms(); bp.feed(band)
        bv = re.sub(r"\s+", " ", " ".join(bp.text))
        self.assertIn("Free website check · Result by email", bv)  # CSS uppercases it
        self.assertIn("Has your website been hacked without you knowing?", bv)
        self.assertIn(MICROCOPY, bv)
        self.assertIn('<a href="/sweep/#code" data-sweep-code-link="home_band">Got a code from our email?</a>', band)
        self.assertEqual(banned_hits(bv), [])
        self.assertEqual(spam_hits(bv), [])

    def test_audit_popup_still_on_home_only(self):
        self.assertIn('<script src="/audit-popup.js" defer></script>', self.src)


class SiteWide(unittest.TestCase):
    HELP = ('<span class="mhead">Help</span><a class="msmall" href="/audit/">Get a free audit — see what\'s broken</a>'
            '<a class="msmall" href="/sweep/">Website check — hacked or not?</a><a class="msmall" href="/book/">Book a call</a>')

    def test_every_inline_nav_has_the_entry_once(self):
        pages = nav_pages()
        self.assertGreaterEqual(len(pages), 23, pages)  # 22 existing + /sweep/
        for rel in pages:
            s = read(rel)
            store = between(s, '<a href="/storefront/" class="mtop">Storefront</a>', "</div></div></div></div>")
            self.assertEqual(store.count(self.HELP), 1, rel)
            self.assertEqual(s.count('href="/sweep/">Website check — hacked or not?</a>'), 1, rel)
            if 'class="ftcol">Start here</p>' in s:
                col = between(s, '<p class="ftcol">Start here</p>', "</div>")
                self.assertTrue(col.endswith('<a href="/sweep/">Website check</a></div>'), rel)
            self.assertNotIn("v5.css?v=20260925", s, rel)
            self.assertNotIn("v5.js?v=20260924c", s, rel)

    def test_drawer_and_search(self):
        js = read("v5.js")
        self.assertIn("'<a href=\"/sweep/\">Website check</a>'", js)
        self.assertRegex(js, r'\{ t: "Free website check", s: "[^"]+", u: "/sweep/", kw: "[^"]*hacked[^"]*" \}')
        # the concierge answers "is my site hacked?" with the check, ahead of its website pitch
        i_check = js.index("Run the free website check →</a>")
        i_site = js.index("if (/website|web site|site/.test(s))")
        self.assertLess(i_check, i_site)
        # a browser-autofilled honeypot is cleared before the post; anything else is left alone
        blk = js[js.index("FREE WEBSITE CHECK (2026-09-28)"):]
        self.assertIn('if (hp && hp.value && autofilled(hp)) hp.value = "";', blk)
        self.assertIn('[":autofill", ":-webkit-autofill"]', blk)

    def test_concierge_only_answers_hack_questions_with_the_check(self):
        js = read("v5.js")
        fn = js[js.index("function siteCheckQ(s) {"):js.index("} /* end siteCheckQ */") + 1]
        yes = ["is my site hacked?", "i think my website got hacked", "we have malware on our wordpress",
               "someone put hidden links on my site", "spam links on my website", "google shows cloaked pages",
               "is there a virus on my site?", "our site is infected", "what is the sweep?",
               "how does the free website check work?"]
        no = ["can you check my website speed?", "check the site pricing", "how much is a website?",
              "i run a chimney sweep business, what should i start with?", "street sweep company here",
              "do you do seo checks?", "what does frontdesk cost?", "our dental office has infection control rules",
              "we run a pizza shack"]
        prog = fn + "\nconst yes=%s, no=%s;\nconst bad=[...yes.filter(q=>!siteCheckQ(q)).map(q=>'missed: '+q), " \
                    "...no.filter(q=>siteCheckQ(q)).map(q=>'wrongly matched: '+q)];\n" \
                    "if(bad.length){console.log(bad.join('\\n'));process.exit(1);}" % (json.dumps(yes), json.dumps(no))
        r = subprocess.run(["node", "-e", prog], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        # and it still runs ahead of the website answer
        self.assertLess(js.index("if (siteCheckQ(s)) return"), js.index("if (/website|web site|site/.test(s))"))

    def test_sitemap_and_llms(self):
        self.assertIn("<loc>https://station.solutions/sweep/</loc>", read("sitemap.xml"))
        llms = read("llms.txt")
        line = [l for l in llms.splitlines() if "station.solutions/sweep/" in l]
        self.assertEqual(len(line), 1)
        self.assertEqual(banned_hits(line[0]), [])
        self.assertEqual(spam_hits(line[0]), [])

    def test_analytics_events(self):
        a = read("analytics.js")
        ev = between(a, "var EVENTS = {", "};")
        for name in ("sweep_view", "sweep_submit", "sweep_code_open"):
            self.assertRegex(ev, r"\b%s: 1\b" % name)
        self.assertIn('document.body.getAttribute("data-range-view")', a)
        js = read("v5.js")
        self.assertIn('track("sweep_submit", src ? src.value : "")', js)
        self.assertIn('track("sweep_code_open", label)', js)
        blk = js[js.index("FREE WEBSITE CHECK (2026-09-28)"):]
        code = re.sub(r"/\*.*?\*/|//[^\n]*", "", blk.split("*/", 1)[1], flags=re.S)
        self.assertNotIn("preventDefault", code)

    def test_audit_popup_guard(self):
        a = read("audit-popup.js")
        self.assertIn("if (/^\\/sweep(\\/|$)/.test(path)) return;", a)
        self.assertLess(a.index("if (/^\\/sweep(\\/|$)/.test(path)) return;"), a.index("if (PAGES.indexOf(path) < 0) return;"))
        self.assertIsNone(re.search(r"<script[^>]*audit-popup", read("sweep/index.html")))

    def test_new_css_stays_on_scale(self):
        css = read("v5.css")
        blk = css[css.index("/* ===================== FREE WEBSITE CHECK (2026-09-28)"):]
        sizes = set(re.findall(r"font(?:-size)?:\s*(?:[0-9]{3}\s+)?(?:italic\s+)?([0-9.]+)px", blk))
        self.assertTrue(sizes <= {"12", "13", "15", "17", "19", "20", "24", "31", "52"}, sizes)
        radii = set(re.findall(r"border-radius:([^;}]+)", blk))
        for r in radii:
            for part in r.split():
                self.assertIn(part, {"8px", "12px", "18px", "26px", "36px", "999px", "50%", "0"}, r)


class Unsubscribe(unittest.TestCase):
    def test_posts_only_inside_the_click(self):
        s = read("unsubscribe/index.html")
        script = s[s.index("<script>(function(){"):s.index("})();</script>")]
        click = script.index('go.addEventListener("click",function(){')
        self.assertGreater(script.index("fetch(N8N"), click)
        self.assertGreater(script.index("fetch(ENGINE"), click)
        self.assertEqual(script.count("fetch("), 2)
        self.assertIn("Stop all email from Station to this address?", script)
        self.assertIn("if(sent)return; sent=true;", script)
        # unchanged pieces
        self.assertIn('u=u.trim().replace(/[.,;:!?)\\]\'"]+$/,"");', script)
        self.assertIn("/^v1\\.[A-Za-z0-9]{2,40}\\.[A-Za-z0-9_-]{20,64}$/", script)
        self.assertIn('<meta name="robots" content="noindex,nofollow">', s)


class Privacy(unittest.TestCase):
    def test_website_check_paragraph(self):
        s = read("legal/privacy.html")
        i = s.index('<div class="card" id="website-check">')
        self.assertIn("<!-- draft pending attorney review -->", s[i - 60:i])
        para = between(s, '<div class="card" id="website-check">', "</div>")
        for w in ("website address", "email address", "IP address", "limit abuse", "no marketing unless you ask"):
            self.assertIn(w, para)
        self.assertIn('<a href="#retention">Retention</a>', para)
        self.assertIn('<h2 id="retention">', s)
        self.assertEqual(spam_hits(re.sub(r"<[^>]+>", " ", para)), [])

    def test_retention_line_promises_nothing_that_does_not_run(self):
        # Nothing deletes the check service's request/code/scan/evidence files on a timer yet, so the
        # policy may not name a period. When a purge job ships, change this test and the line together.
        s = read("legal/privacy.html")
        li = between(s, "<li><b>Free website checks:</b>", "</li>")
        before = s[:s.index("<li><b>Free website checks:</b>")]
        self.assertTrue(before.rstrip().endswith("-->"))
        self.assertIn("<!-- draft pending attorney review.", before[before.rfind("<!--"):])
        text = re.sub(r"<[^>]+>", "", li).lower()
        self.assertIsNone(re.search(r"\b\d+\s*(day|week|month|year)s?\b|\bthen deleted\b|\bautomatically\b", text), text)
        for w in ("kept while they are useful", "we will delete them", "contact records", "until you ask us to remove it"):
            self.assertIn(w, text)


class RepoHygiene(unittest.TestCase):
    """GitHub Pages publishes everything outside _-prefixed folders (a root .md is served as-is:
    station.solutions/STATE.md answers 200). Build notes must never land there."""

    def test_contract_notes_never_published(self):
        bad = []
        for dp, dn, fn in os.walk(ROOT):
            dn[:] = [d for d in dn if d != ".git"]
            rel = os.path.relpath(dp, ROOT)
            parts = [] if rel == "." else rel.split(os.sep)
            for f in fn:
                if re.match(r"(?i)contract-notes", f) and not any(x.startswith("_") for x in parts):
                    bad.append(os.path.join(rel, f))
        self.assertEqual(bad, [])
        self.assertTrue(os.path.exists(os.path.join(ROOT, "_notes", "CONTRACT-NOTES-sweepsite.md")))
        self.assertFalse(os.path.exists(os.path.join(ROOT, ".nojekyll")), "without Jekyll, _notes/ and _tests/ would publish")
        self.assertFalse(os.path.exists(os.path.join(ROOT, "_config.yml")), "a Jekyll config could include _ folders")

    def test_state_deploy_order_names_the_mail_switch(self):
        st = read("STATE.md")
        sec = st[st.index("## 2026-09-28 — free website check"):]
        order = [l for l in sec.split("\n- ") if l.startswith("⚠️ **Order:**")]
        self.assertEqual(len(order), 1)
        self.assertIn("MAIL_ENABLED", order[0])


class InlineScripts(unittest.TestCase):
    """node --check on every inline script of every HTML file this change touched."""
    FILES = ["index.html", "sweep/index.html", "unsubscribe/index.html", "legal/privacy.html"] + \
            [p for p in nav_pages() if p not in ("index.html", "sweep/index.html")]

    def test_node_check(self):
        n = 0
        for rel in self.FILES:
            s = re.sub(r"<!--.*?-->", "", read(rel), flags=re.S)
            for m in re.finditer(r"<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>", s, re.S):
                if "ld+json" in m.group(1):
                    json.loads(m.group(2))
                    continue
                with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as t:
                    t.write(m.group(2))
                r = subprocess.run(["node", "--check", t.name], capture_output=True, text=True)
                os.unlink(t.name)
                self.assertEqual(r.returncode, 0, "%s: %s" % (rel, r.stderr[:400]))
                n += 1
        for js in ("v5.js", "analytics.js", "audit-popup.js", "_tests/cdp.mjs", "_tests/sweep_browser.test.mjs"):
            r = subprocess.run(["node", "--check", os.path.join(ROOT, js)], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, "%s: %s" % (js, r.stderr[:400]))
        self.assertGreater(n, 20)


if __name__ == "__main__":
    unittest.main(verbosity=2)
