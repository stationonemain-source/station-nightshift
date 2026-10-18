"""
scoring.py - turns raw check results into per-check scores (0..1) and a grade.

Kept separate from scan.py so a scoring change never needs a re-crawl: render.py re-scores every
entity from the raw fields recorded at scan time. The rules here are the methodology page.
"""
import math

WEIGHTS = {"https": 15, "mobile": 15, "accessibility": 20, "freshness": 10, "links": 10, "contact": 10, "speed": 10, "required": 10}
LABELS = {"https": "HTTPS", "mobile": "Works on a phone", "accessibility": "Accessibility", "freshness": "Kept up to date",
          "links": "Links that work", "contact": "Contact details", "speed": "Speed", "required": "Required notices"}


def score_https(c):
    return round((0.67 if c.get("https") else 0.0) + (0.33 if c.get("http_redirects") else 0.0), 3)


def has_viewport(c):
    vc = (c.get("viewport_content") or "").lower()
    return bool(c.get("viewport_meta")) or ("width" in vc) or ("initial-scale" in vc)


def score_mobile(c):
    return (0.5 if has_viewport(c) else 0.0) + (0.5 if not c.get("overflow_375") else 0.0)


def score_accessibility(c):
    dr = c.get("distinct_rules") or {}
    bi = c.get("by_impact") or {}
    pen = 0.15 * dr.get("critical", 0) + 0.09 * dr.get("serious", 0) + 0.04 * dr.get("moderate", 0) + 0.015 * dr.get("minor", 0)
    pen += min(0.25, 0.004 * (bi.get("critical", 0) + bi.get("serious", 0)))
    if pen <= 0.5:
        return round(1.0 - pen, 3)
    return round(0.5 * math.exp(-(pen - 0.5) * 2.0), 3)


def score_freshness(c):
    age = c.get("days")
    if age is None:
        return None
    return 1.0 if age <= 30 else 0.75 if age <= 90 else 0.5 if age <= 180 else 0.25 if age <= 365 else 0.0


def score_links(c):
    if not c.get("checked"):
        return None
    return round(1.0 - c["broken"] / c["checked"], 3)


def score_contact(c):
    return round((1 if c.get("phone") else 0) / 3 + (1 if c.get("address") else 0) / 3 + (1 if (c.get("email") or c.get("contact_form_or_link")) else 0) / 3, 3)


def score_speed(c):
    parts = []
    ttfb, kb, n = c.get("ttfb_s"), c.get("html_kb"), c.get("requests")
    if ttfb is not None:
        parts.append(1.0 if ttfb <= 0.5 else 0.75 if ttfb <= 1.0 else 0.5 if ttfb <= 2.0 else 0.25 if ttfb <= 4.0 else 0.0)
    if kb is not None:
        parts.append(1.0 if kb <= 100 else 0.75 if kb <= 300 else 0.5 if kb <= 600 else 0.25 if kb <= 1024 else 0.0)
    if n is not None:
        parts.append(1.0 if n <= 50 else 0.75 if n <= 100 else 0.5 if n <= 150 else 0.25 if n <= 250 else 0.0)
    return round(sum(parts) / len(parts), 3) if parts else None


def score_required(c):
    return (0.5 if c.get("accessibility_statement_link") else 0.0) + (0.5 if c.get("records_or_meetings_link") else 0.0)


SCORERS = {"https": score_https, "mobile": score_mobile, "accessibility": score_accessibility, "freshness": score_freshness,
           "links": score_links, "contact": score_contact, "speed": score_speed, "required": score_required}


def rescore(res):
    """Recompute every check score from raw fields, then the grade. Mutates and returns res."""
    checks = res.get("checks") or {}
    got, avail, ran = 0.0, 0, 0
    for k, w in WEIGHTS.items():
        c = checks.get(k)
        if not c or c.get("status") != "ok":
            continue
        s = SCORERS[k](c)
        if s is None:
            c["status"] = "couldnt"
            c["reason"] = c.get("reason") or "no measurement"
            continue
        c["score"] = s
        got += w * s
        avail += w
        ran += 1
    res["points_available"] = avail
    res["points"] = round(got, 1)
    res["checks_ran"] = ran
    if res.get("outcome") != "scanned" or ran < 4:
        res["score"] = None
        res["grade"] = "Not graded"
        res["grade_note"] = f"only {ran} of 8 checks could run" if res.get("outcome") == "scanned" else (res.get("outcome_note") or "not scanned")
        return res
    pct = 100.0 * got / avail
    res["score"] = round(pct, 1)
    res["grade"] = "A" if pct >= 90 else "B" if pct >= 80 else "C" if pct >= 70 else "D" if pct >= 60 else "F"
    res["grade_note"] = f"{ran} of 8 checks ran" + ("" if ran == 8 else "; the others could not run and are left out of the score")
    return res
