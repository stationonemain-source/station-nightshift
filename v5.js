/* STATION v5 runtime — ref capture, reveals, calc, configurator, rails,
   mega-nav a11y, demos, forms, chat launcher, popups, version pill. */
(function () {
  "use strict";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ref capture -> stripe */
  var REF = null;
  try {
    var q = new URLSearchParams(location.search);
    REF = q.get("ref") || sessionStorage.getItem("station_ref");
    if (REF) sessionStorage.setItem("station_ref", REF);
  } catch (e) {}
  function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn); }
  ready(function () {
    document.querySelectorAll('a[href*="buy.stripe.com"]').forEach(function (a) {
      var u = a.getAttribute("href");
      if (REF && u.indexOf("client_reference_id") === -1)
        a.href = u + (u.indexOf("?") > -1 ? "&" : "?") + "client_reference_id=" + encodeURIComponent(REF);
      a.target = "_blank"; a.rel = "noopener";
    });
  });

  /* reveals */
  ready(function () {
    var els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window) || RM) { els.forEach(function (e) { e.classList.add("on"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
  });

  /* rails: arrow paddles */
  ready(function () {
    document.querySelectorAll(".rail-h").forEach(function (h) {
      var railWrap = h.nextElementSibling;
      var rail = railWrap && railWrap.querySelector("[data-rail]");
      if (!rail) return;
      var prev = h.querySelector("[data-rail-prev]"), next = h.querySelector("[data-rail-next]");
      function step() { var c = rail.querySelector("a"); return c ? c.getBoundingClientRect().width + 16 : 320; }
      if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step() * 2 }); });
      if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step() * 2 }); });
    });
    /* drag-scroll for mouse users */
    document.querySelectorAll("[data-rail]").forEach(function (rail) {
      var down = false, sx = 0, sl = 0, moved = false;
      rail.addEventListener("pointerdown", function (e) { down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
      rail.addEventListener("pointermove", function (e) {
        if (!down) return;
        if (Math.abs(e.clientX - sx) > 6) { moved = true; rail.style.scrollBehavior = "auto"; rail.scrollLeft = sl - (e.clientX - sx); }
      });
      ["pointerup", "pointerleave"].forEach(function (ev) {
        rail.addEventListener(ev, function () { down = false; rail.style.scrollBehavior = ""; });
      });
      rail.addEventListener("click", function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    });
  });

  /* pp sticky buy bar */
  ready(function () {
    var b = document.getElementById("ppBar"); if (!b) return;
    addEventListener("scroll", function () { b.classList.toggle("on", scrollY > 520); }, { passive: true });
  });

  /* calculator (shared contract with V1) */
  ready(function () {
    var C = window.CALC, host = document.getElementById("calc");
    if (!C || !host) return;
    var f$ = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    var sl = host.querySelector(".sliders");
    C.sliders.forEach(function (s) {
      var d = document.createElement("div"); d.className = "srow";
      d.innerHTML = '<label>' + s.label + ' <output id="o_' + s.id + '"></output></label>' +
        '<input type="range" id="s_' + s.id + '" min="' + s.min + '" max="' + s.max + '" step="' + (s.step || 1) + '" value="' + s.val + '">';
      sl.appendChild(d);
    });
    var lossEl = document.getElementById("calcLoss"), verEl = document.getElementById("calcVerdict");
    function run() {
      var vals = {};
      C.sliders.forEach(function (s) {
        var el = document.getElementById("s_" + s.id); vals[s.id] = +el.value;
        document.getElementById("o_" + s.id).textContent = (s.fmt ? s.fmt(+el.value) : el.value);
      });
      var r = C.compute(vals);
      lossEl.textContent = f$(r.loss) + "/mo";
      if (r.loss >= C.price * (C.clearAt || 2)) {
        verEl.className = "verdict yes";
        verEl.innerHTML = "<b>The math clears easily.</b> You're losing " + f$(r.loss) + " a month; this costs " + f$(C.price) + ". Keeping the problem is the expensive option.";
      } else if (r.loss >= C.price) {
        verEl.className = "verdict yes";
        verEl.innerHTML = "<b>It pays for itself.</b> " + f$(r.loss) + " lost vs " + f$(C.price) + " — tight but positive. Start on Standard and watch the first month's report.";
      } else {
        verEl.className = "verdict no";
        verEl.innerHTML = "<b>Honestly? Keep your money for now.</b> At your numbers this loses less than it costs. " + (C.refer || "");
      }
    }
    host.addEventListener("input", run); run();
  });

  /* configurator */
  var PRODUCTS = [
    { k: "storefront", n: "Storefront", sub: "Website, built to book", pricelab: "$500 + $49/mo", ttl: "48 hours", mo: 49, once: 500 },
    { k: "greet", n: "Greet", sub: "Website chat assistant", pricelab: "$79/mo", ttl: "minutes", mo: 79 },
    { k: "slate", n: "Slate", sub: "Booking + reminders", pricelab: "$97/mo", ttl: "today", mo: 97 },
    { k: "lineback", n: "Lineback", sub: "Missed-call text-back", pricelab: "$197/mo", ttl: "~2 days", mo: 197 },
    { k: "frontdesk", n: "Frontdesk", sub: "AI receptionist · Slate incl.", pricelab: "$397/mo", ttl: "same day", mo: 397 },
    { k: "pursuit", n: "Pursuit", sub: "Automatic follow-up", pricelab: "$247/mo", ttl: "instant", mo: 247 },
    { k: "repute", n: "Repute", sub: "Review engine", pricelab: "$197/mo", ttl: "same day", mo: 197 },
    { k: "map", n: "Map", sub: "Google listing, managed", pricelab: "$147/mo + $297", ttl: "2–3 days", mo: 147, once: 297 },
    { k: "dispatch", n: "Dispatch", sub: "Email campaigns", pricelab: "$94/mo", ttl: "instant", mo: 94 },
    { k: "revive", n: "Revive", sub: "Reactivation campaign", pricelab: "$497 once", ttl: "1–2 days", mo: 0, once: 497 },
    { k: "radar", n: "Radar", sub: "Prospecting engine", pricelab: "$197/mo", ttl: "same day", mo: 197 },
    { k: "dial", n: "Dial", sub: "Number + texting", pricelab: "$47/mo", ttl: "~2 days", mo: 47 },
    { k: "tap", n: "Tap", sub: "Payments + POS + app", pricelab: "$147/mo", ttl: "1–2 days", mo: 147 },
    { k: "marquee", n: "Marquee", sub: "Social + ads + brand board", pricelab: "$197 / $597", ttl: "5–7 days", mo: 197 }
  ];
  ready(function () {
    var tilesEl = document.getElementById("tiles"); if (!tilesEl) return;
    var f$ = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    var on = {}, TICKET = 425;
    var PAIN = { calls: ["lineback", "frontdesk", "dial", "pursuit"], noshows: ["slate", "frontdesk", "pursuit"],
      reviews: ["repute", "map"], invisible: ["map", "storefront", "marquee", "repute"],
      quiet: ["revive", "dispatch", "pursuit"], slow: ["radar", "dispatch", "marquee"] };
    var order = PRODUCTS.map(function (p) { return p.k; });
    function render() {
      tilesEl.innerHTML = "";
      order.forEach(function (k) {
        var p = PRODUCTS.find(function (x) { return x.k === k; }); if (!p) return;
        var l = document.createElement("label");
        l.className = "tile" + (on[k] ? " on" : "");
        l.innerHTML = '<span class="t-hit"><input type="checkbox" data-k="' + k + '"' + (on[k] ? " checked" : "") + '>' +
          '<span><span class="t-name">' + p.n + '</span><br><span class="t-sub">' + p.sub + '</span></span>' +
          '<span class="t-price">' + p.pricelab + '<span class="t-ttl">' + p.ttl + ' · <a href="/' + p.k + '/" style="color:inherit;text-decoration:underline">learn</a></span></span></span>';
        tilesEl.appendChild(l);
      });
    }
    function recalc() {
      var mo = 0, once = 0, names = [], count = 0;
      PRODUCTS.forEach(function (p) {
        if (!on[p.k]) return; count++;
        var m = p.mo;
        if (p.k === "slate" && on.frontdesk) m = 0;
        mo += m; once += (p.once || 0);
        names.push({ n: p.n, m: m, o: p.once || 0, inc: (p.k === "slate" && on.frontdesk) });
      });
      document.getElementById("rTotal").innerHTML = f$(mo) + '<small>/month</small>';
      document.getElementById("rDay").textContent = "$" + (mo / 30.4).toFixed(2);
      document.getElementById("rJobs").textContent = mo ? (mo / TICKET).toFixed(1) : "0";
      document.getElementById("rOnce").textContent = f$(once);
      var rows = document.getElementById("rRows");
      rows.innerHTML = count ? names.map(function (x) {
        return '<div class="r-row"><span>' + x.n + (x.inc ? ' <span class="inc">included</span>' : "") + '</span><b>' +
          (x.inc ? "$0" : (x.m ? f$(x.m) : f$(x.o) + " once")) + "</b></div>";
      }).join("") : '<div class="r-row"><span style="color:var(--faint)">Nothing yet — tick a product.</span></div>';
      var v = document.getElementById("rVerdict"), hit = false, t;
      if (!count) t = "Pick the one that fixes what hurt this week.";
      else if (mo >= 800) { hit = true; t = "<b>Worth a call:</b> at this size a flat line pass beats the stack — <a href='/book/'>book 15 minutes</a>."; }
      else t = f$(mo) + "/mo is " + (mo / TICKET).toFixed(1) + " average jobs. Everything after that is yours.";
      v.className = "r-verdict" + (hit ? " hit" : ""); v.innerHTML = t;
    }
    tilesEl.addEventListener("change", function (e) {
      var k = e.target.getAttribute("data-k"); if (!k) return;
      on[k] = e.target.checked; e.target.closest(".tile").classList.toggle("on", e.target.checked); recalc();
    });
    document.querySelectorAll(".q-chip[data-pain]").forEach(function (c) {
      c.addEventListener("click", function () {
        document.querySelectorAll(".q-chip[data-pain]").forEach(function (x) { x.classList.remove("on"); });
        c.classList.add("on");
        var pref = PAIN[c.getAttribute("data-pain")] || [];
        order = pref.concat(PRODUCTS.map(function (p) { return p.k; }).filter(function (k) { return pref.indexOf(k) === -1; }));
        render();
        Object.keys(on).forEach(function (k) {
          var el = tilesEl.querySelector('input[data-k="' + k + '"]');
          if (el) { el.checked = !!on[k]; el.closest(".tile").classList.toggle("on", !!on[k]); }
        });
        var first = pref[0];
        if (first && !on[first]) { var el2 = tilesEl.querySelector('input[data-k="' + first + '"]'); if (el2) { el2.checked = true; on[first] = true; el2.closest(".tile").classList.add("on"); } }
        recalc();
      });
    });
    render(); recalc();
  });

  /* audit / contact forms — exact n8n contract (honeypots + _t + variant) */
  var AUDIT_URL = "https://n8n.srv1748596.hstgr.cloud/webhook/free-audit";
  var AFF_URL = "https://n8n.srv1748596.hstgr.cloud/webhook/station-affiliates";
  ready(function () {
    var t0 = Date.now();
    document.querySelectorAll("form[data-audit]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        var fd = new FormData(form);
        fd.set("_t", String(Date.now() - t0));
        try { fetch(AUDIT_URL, { method: "POST", mode: "no-cors", body: fd }); } catch (err) {}
        try {
          if (navigator.sendBeacon && REF) {
            navigator.sendBeacon(AFF_URL, new Blob([JSON.stringify({
              action: "attribute", pub: "station", code: REF, kind: "audit-submit",
              label: "v5-" + (form.getAttribute("data-variant") || "form")
            })], { type: "application/json" }));
          }
        } catch (err) {}
        form.querySelectorAll("input,textarea,button,select").forEach(function (el) { el.disabled = true; });
        var done = form.querySelector(".af-done"); if (done) done.hidden = false;
        try { localStorage.setItem("station_lead_done", "1"); } catch (e2) {}
      });
    });
  });

  /* ---------- demos ---------- */
  function playThread(host, msgs) {
    var scr = host.querySelector(".pm-screen"); scr.innerHTML = "";
    msgs.forEach(function (m, i) {
      var b = document.createElement("div");
      b.className = m.day ? "pm-day" : ("pm-b " + m.who);
      b.textContent = m.t;
      scr.appendChild(b);
      if (!m.day) setTimeout(function () { b.classList.add("show"); }, 350 + i * 900);
      else b.style.opacity = 1;
    });
  }
  ready(function () {
    var ps = document.getElementById("pursuitSim");
    var pbtn = document.querySelector("[data-pursuit-run]");
    if (ps && pbtn) pbtn.addEventListener("click", function () {
      playThread(ps, [
        { day: 1, t: "MINUTE 0", day: true },
        { who: "biz", t: "Hi Sarah — got your request about the water heater. When works for a look, tomorrow or Thursday?" },
        { t: "NEXT MORNING", day: true },
        { who: "biz", t: "Morning! Still happy to help with that water heater — mornings or afternoons better?" },
        { t: "DAY 4", day: true },
        { who: "biz", t: "No rush at all — want me to pencil you in for early next week?" },
        { who: "me", t: "Yes sorry! Thursday morning works." },
        { t: "SEQUENCE STOPPED — YOU TAKE OVER", day: true }
      ]);
    });
    var ds = document.getElementById("dialSim");
    var dbtn = document.querySelector("[data-dial-run]");
    if (ds && dbtn) dbtn.addEventListener("click", function () {
      playThread(ds, [
        { who: "me", t: "Hey do y'all do gutter guards?" },
        { who: "biz", t: "We do — most homes run $8–12/ft installed. Want a quick quote? Address is all we need." },
        { who: "me", t: "3114 Maple Ct" },
        { who: "biz", t: "Perfect — we can swing by Thursday between 9 and 11. Work for you?" }
      ]);
    });
    /* repute reply drafter */
    var rbtn = document.querySelector("[data-rep-run]");
    if (rbtn) rbtn.addEventListener("click", function () {
      var txt = (document.getElementById("repDemoIn").value || "").trim();
      var tone = (document.querySelector('input[name="repTone"]:checked') || {}).value || "warm";
      var out = document.getElementById("repDemoOut");
      if (!txt) { out.textContent = "Paste a review first — any review."; return; }
      var neg = /(bad|terrible|late|rude|never|worst|refund|broken|awful|disappoint)/i.test(txt);
      var name = (txt.match(/^[A-Z][a-z]+/) || ["there"])[0];
      var r;
      if (neg) r = (tone === "warm"
        ? "Hi " + name + " — thank you for telling us straight. This isn't the experience we run our shop on, and I'd like to make it right personally. Call us and ask for the owner; we'll fix it this week."
        : "Thank you for the candid feedback. This falls short of our standard. Please contact us directly — we would like to resolve it promptly and make it right.");
      else r = (tone === "warm"
        ? "Thank you, " + name + " — this made our week. It was a pleasure working on your place, and we're a call away whenever you need us again."
        : "Thank you for the kind words and for trusting us with the work. We appreciate the review and look forward to serving you again.");
      out.textContent = ""; var i = 0;
      var iv = setInterval(function () { out.textContent = r.slice(0, i += 3); if (i >= r.length) clearInterval(iv); }, 18);
    });
    /* slate calendar */
    var cs = document.getElementById("slateSim");
    if (cs) {
      ["Tue 9:00", "Tue 11:00", "Tue 2:00", "Wed 8:00", "Wed 10:00", "Wed 1:00", "Thu 9:00", "Thu 3:00"].forEach(function (s) {
        var b = document.createElement("button"); b.type = "button"; b.className = "cal-slot"; b.textContent = s;
        b.addEventListener("click", function () {
          cs.querySelectorAll(".cal-slot").forEach(function (x) { x.classList.remove("on"); });
          b.classList.add("on");
          document.getElementById("slateOut").textContent =
            'Booked ✓  And at 8 PM the night before, they get:\n\n"Reminder — ' + s +
            ' tomorrow with Demo Plumbing Co. Reply C to confirm or R to reschedule."';
        });
        cs.appendChild(b);
      });
    }
    /* map teaser */
    var mbtn = document.querySelector("[data-map-run]");
    if (mbtn) mbtn.addEventListener("click", function () {
      var v = (document.getElementById("mapDemoIn").value || "your business").trim();
      var out = document.getElementById("mapDemoOut"); out.textContent = "";
      var lines = ["Scanning “" + v + "”…",
        "✓ Check 1 — primary category: 61% of listings we scan have the wrong one",
        "✓ Check 2 — hours drift: is Google showing your 2022 hours?",
        "✓ Check 3 — public edits: anyone can “suggest” changes to your listing. Someone usually has.",
        "… the other 8 checks run in the full audit — it's free → /audit/"];
      var i = 0;
      (function step() { if (i < lines.length) { out.textContent += (i ? "\n" : "") + lines[i++]; setTimeout(step, 650); } })();
    });
    /* dispatch templates */
    var dsm = document.getElementById("dispatchSim");
    if (dsm) {
      [["Spring tune-up week", "Subject: A/C ready for the first 95° day?\n\nWe're doing tune-ups in your area next week — $89, takes an hour, and it's the difference between June working and June waiting on parts. Book by Friday and we'll bump you to the front."],
       ["We-miss-you", "Subject: It's been a while\n\nWe did your place two summers ago — want us to take a look before the season hits? Past customers get first pick of the schedule."],
       ["Review thank-you", "Subject: Thank you (really)\n\nYour review means the world to a local shop. Here's $25 off your next visit — no expiry, no fine print."]].forEach(function (t, i) {
        var d = document.createElement("div"); d.className = "tpl" + (i === 0 ? " open" : "");
        d.innerHTML = '<div class="t-h">' + t[0] + '</div><div class="t-b"></div>';
        d.querySelector(".t-b").textContent = t[1];
        d.addEventListener("click", function () {
          dsm.querySelectorAll(".tpl").forEach(function (x) { x.classList.remove("open"); });
          d.classList.add("open");
        });
        dsm.appendChild(d);
      });
    }
    /* revive touches */
    var rs = document.getElementById("reviveSim");
    if (rs) [["Day 1", "It's been a while — want us to take a look before summer? (email)"],
      ["Day 4", "Quick nudge — our schedule's filling for the season. (email)"],
      ["Day 8", "Past customers get priority booking this month. (email)"],
      ["Day 12", "Anything we did last time you'd like re-checked? (email)"],
      ["Day 16", "Last one from us — we'll leave you be after this, promise. (email)"],
      ["Day 21", "Text leg (only with documented consent): “Hi — it's Demo Plumbing. Want your spring check?”"]].forEach(function (t) {
        var d = document.createElement("div"); d.className = "touch";
        d.innerHTML = "<b>" + t[0] + "</b><span>" + t[1] + "</span>"; rs.appendChild(d);
      });
    /* tap steps */
    var ts = document.getElementById("tapSim");
    if (ts) {
      var steps = ["1 · Estimate sent from the driveway", "2 · Accepted with one tap", "3 · Card taps your phone", "4 · Receipt texts itself — paid"];
      steps.forEach(function (s, i) {
        var d = document.createElement("div"); d.className = "tstep" + (i === 0 ? " on" : ""); d.textContent = s;
        d.addEventListener("click", function () {
          ts.querySelectorAll(".tstep").forEach(function (x, j) { x.classList.toggle("on", j <= i); });
        });
        ts.appendChild(d);
      });
    }
    /* before/after slider */
    var ba = document.getElementById("baSlider");
    if (ba) {
      var img = "/media/light/storefront.jpg";
      ba.querySelector(".ba-after").style.backgroundImage = "url('" + img + "')";
      ba.querySelector("input").addEventListener("input", function () {
        ba.querySelector(".ba-after").style.clipPath = "inset(0 0 0 " + (100 - this.value) + "%)";
      });
    }
    /* marquee board */
    var mqb = document.querySelector("[data-mq-run]");
    if (mqb) mqb.addEventListener("click", function () {
      var trade = document.getElementById("mqTrade").value;
      var pal = document.getElementById("mqPal").value;
      var PALS = { ink: ["#1D1D1F", "#8A5A00", "#F5F4F1", "#6E6E73"], pine: ["#1E3D2F", "#C86A3A", "#F4F1E8", "#7A8B80"], slate: ["#2A3440", "#7FA8C9", "#F2F4F6", "#8E99A6"] };
      var b = document.getElementById("mqBoard"); b.classList.add("on");
      b.innerHTML = '<div class="mq-name">' + trade + ' Co.</div>' +
        PALS[pal].map(function (c) { return '<div class="mq-sw" style="background:' + c + '"></div>'; }).join("") +
        '<div class="mq-tag">Display: Fraunces · Body: Inter · Voice: plainspoken, outcome-first — the full board is a real deliverable in week one.</div>';
    });
  });

  /* ---------- chat launcher (Greet) ---------- */
  ready(function () {
    var fab = document.createElement("button");
    fab.className = "chat-fab"; fab.setAttribute("aria-label", "Chat with Station");
    fab.innerHTML = '<svg viewBox="0 0 100 100" fill="currentColor"><g transform="rotate(45 50 50)"><rect x="29.5" y="3" width="18" height="36" rx="8.5"/><rect x="52.5" y="3" width="18" height="36" rx="8.5"/><rect x="29.5" y="61" width="18" height="36" rx="8.5"/><rect x="52.5" y="61" width="18" height="36" rx="8.5"/><rect x="3" y="29.5" width="36" height="18" rx="8.5"/><rect x="3" y="52.5" width="36" height="18" rx="8.5"/><rect x="61" y="29.5" width="36" height="18" rx="8.5"/><rect x="61" y="52.5" width="36" height="18" rx="8.5"/></g><circle cx="50" cy="50" r="16.5" fill="#1D1D1F"/></svg>';
    var panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.innerHTML = '<div class="ch-h">' + fab.innerHTML.replace('fill="#1D1D1F"', 'fill="#fff"') + 'Station</div>' +
      '<p>Fastest ways to get an answer right now:</p>' +
      '<a href="/audit/">Get the free audit →</a>' +
      '<a href="/book/">Book the 15-min intro call →</a>' +
      '<a href="mailto:main@station.solutions">Email a human →</a>' +
      '<p style="margin:10px 0 0;font-size:11.5px;color:#A9A9AE">Live chat (this is our Greet product) connects here shortly.</p>';
    document.body.appendChild(fab); document.body.appendChild(panel);
    function toggle() { panel.classList.toggle("open"); }
    fab.addEventListener("click", toggle);
    document.querySelectorAll("[data-open-chat]").forEach(function (b) { b.addEventListener("click", toggle); });
  });

  /* ---------- popups: cookie bar + newsletter ---------- */
  ready(function () {
    try {
      /* cookie bar */
      if (!localStorage.getItem("station_cookies")) {
        var cb = document.createElement("div"); cb.className = "cookiebar open";
        cb.innerHTML = '<p>We use essential cookies to make the site work, and nothing that follows you around. <a href="/legal/cookies.html">Details</a>.</p>' +
          '<button class="btn dark sm" data-ck="essential">Accept essential</button>';
        cb.querySelector("[data-ck]").addEventListener("click", function () {
          localStorage.setItem("station_cookies", "essential"); cb.remove();
        });
        document.body.appendChild(cb);
      }
      /* newsletter popup — once, after 22s, not if already led */
      if (!localStorage.getItem("station_news") && !localStorage.getItem("station_lead_done")) {
        setTimeout(function () {
          if (localStorage.getItem("station_news")) return;
          var scrim = document.createElement("div"); scrim.className = "pop-scrim open";
          var pop = document.createElement("div"); pop.className = "pop open";
          pop.innerHTML = '<button class="x" aria-label="Close">×</button>' +
            '<h3>10% off your first month.</h3>' +
            '<p>Join the list and we’ll send the discount code, plus one useful note a month. No noise.</p>' +
            '<form data-audit data-variant="newsletter" class="audit-form">' +
            '<div class="af-grid"><input name="email" type="email" placeholder="Email" required style="grid-column:1/-1">' +
            '<input name="phone" type="tel" placeholder="Phone (optional)" style="grid-column:1/-1"></div>' +
            '<input name="leak" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">' +
            '<input type="hidden" name="_t" value=""><input type="hidden" name="variant" value="newsletter">' +
            '<label class="consent"><input type="checkbox" name="consent_email" value="yes" required><span>Email me the code + the monthly note. Unsubscribe anytime.</span></label>' +
            '<label class="consent"><input type="checkbox" name="consent_sms" value="yes"><span>Texts are OK too. Msg &amp; data rates may apply; reply STOP to opt out. <a href="/legal/sms-terms.html" target="_blank">SMS terms</a>.</span></label>' +
            '<button class="btn dark" type="submit">Send my code</button>' +
            '<p class="af-done" hidden><b>Check your inbox.</b> The code is on its way.</p></form>';
          function close() { scrim.remove(); pop.remove(); localStorage.setItem("station_news", "dismissed"); }
          pop.querySelector(".x").addEventListener("click", close);
          scrim.addEventListener("click", close);
          pop.querySelector("form").addEventListener("submit", function (e) {
            e.preventDefault();
            var form = e.target; if (!form.reportValidity()) return;
            var fd = new FormData(form); fd.set("_t", "9999");
            try { fetch("https://n8n.srv1748596.hstgr.cloud/webhook/free-audit", { method: "POST", mode: "no-cors", body: fd }); } catch (err) {}
            form.querySelectorAll("input,button").forEach(function (el) { el.disabled = true; });
            form.querySelector(".af-done").hidden = false;
            localStorage.setItem("station_news", "joined");
            setTimeout(close, 2600);
          });
          document.body.appendChild(scrim); document.body.appendChild(pop);
        }, 22000);
      }
    } catch (e) {}
  });

  /* version pill */
  ready(function () {
    if (document.querySelector("[data-vswitch]")) return;
    var path = location.pathname, active = 5, sub = path;
    if (path.indexOf("/v2/") === 0) { active = 2; sub = path.slice(3); }
    else if (path.indexOf("/v3/") === 0) { active = 3; sub = path.slice(3); }
    else if (path.indexOf("/v4/") === 0) { active = 4; sub = "/"; }
    if (!/^\/([a-z]+\/)?$/.test(sub)) sub = "/";
    var d = document.createElement("div");
    d.setAttribute("data-vswitch", "1");
    d.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:80;display:flex;gap:2px;background:rgba(20,20,22,.85);backdrop-filter:blur(10px);border-radius:999px;padding:4px;font:600 11px Inter,'Segoe UI',sans-serif";
    [["", 5, "V5"], ["/v2", 2, "V2"], ["/v3", 3, "V3"], ["/v4", 4, "V4"]].forEach(function (v) {
      var a = document.createElement("a");
      a.href = (v[0] || "") + (v[1] === 4 ? "/" : sub);
      a.textContent = v[2];
      a.style.cssText = "text-decoration:none;padding:5px 11px;border-radius:999px;" +
        (active === v[1] ? "background:#fff;color:#111" : "color:#bbb");
      d.appendChild(a);
    });
    document.body.appendChild(d);
  });

  window.__ready = true;
})();
