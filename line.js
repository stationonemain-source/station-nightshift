/* STATION — The Line · shared runtime
   Vanilla only: reveals, spine draw, nav dropdown, ?ref capture,
   calculator + configurator engines. No dependencies. */
(function () {
  "use strict";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ?ref capture → Stripe client_reference_id ---------- */
  var REF = null;
  try {
    var q = new URLSearchParams(location.search);
    REF = q.get("ref") || sessionStorage.getItem("station_ref");
    if (REF) sessionStorage.setItem("station_ref", REF);
  } catch (e) {}
  function decorate(url) {
    if (!REF || !url || url.indexOf("buy.stripe.com") === -1) return url;
    return url + (url.indexOf("?") > -1 ? "&" : "?") + "client_reference_id=" + encodeURIComponent(REF);
  }
  function decorateAll(root) {
    (root || document).querySelectorAll('a[href*="buy.stripe.com"]').forEach(function (a) {
      a.href = decorate(a.getAttribute("href"));
      a.target = "_blank"; a.rel = "noopener";
    });
  }
  document.addEventListener("DOMContentLoaded", function () { decorateAll(); });

  /* ---------- reveals ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window) || RM) { els.forEach(function (e) { e.classList.add("on"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
  });

  /* ---------- the spine (amber line drawing down the page) ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var spines = document.querySelectorAll(".spine");
    if (!spines.length) return;
    function tick() {
      spines.forEach(function (sp) {
        var r = sp.getBoundingClientRect();
        var vh = innerHeight;
        var total = r.height + vh * 0.4;
        var done = Math.min(Math.max(vh * 0.7 - r.top, 0), total);
        sp.style.setProperty("--spine-fill", (done / total * 100).toFixed(2) + "%");
      });
    }
    addEventListener("scroll", tick, { passive: true });
    addEventListener("resize", tick); tick();
  });

  /* ---------- nav dropdown ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".dd > button").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation(); b.parentElement.classList.toggle("open");
      });
    });
    document.addEventListener("click", function () {
      document.querySelectorAll(".dd.open").forEach(function (d) { d.classList.remove("open"); });
    });
  });

  /* ---------- product-page calculator ---------- */
  /* Config via window.CALC = {sliders:[{id,label,min,max,step,val,fmt}], compute(vals)->{loss,note}, price, refuseBelow} */
  document.addEventListener("DOMContentLoaded", function () {
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
        verEl.innerHTML = "<b>The math clears easily.</b> " + (r.note || "") +
          " You're losing " + f$(r.loss) + " a month; this costs " + f$(C.price) + ". Keeping the problem is the expensive option.";
      } else if (r.loss >= C.price) {
        verEl.className = "verdict yes";
        verEl.innerHTML = "<b>It pays for itself.</b> " + f$(r.loss) + " lost vs " + f$(C.price) + " — tight but positive. Start on Standard and watch the first month's report.";
      } else {
        verEl.className = "verdict no";
        verEl.innerHTML = "<b>Honestly? Keep your money for now.</b> At your numbers this loses less than it costs. " +
          (C.refer || "Start with a cheaper stop and come back when volume grows.");
      }
    }
    host.addEventListener("input", run); run();
  });

  /* ---------- homepage configurator ---------- */
  var PRODUCTS = window.LINE_PRODUCTS;
  document.addEventListener("DOMContentLoaded", function () {
    if (!PRODUCTS) return;
    var tilesEl = document.getElementById("tiles"); if (!tilesEl) return;
    var f$ = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    var on = {}, TICKET = 425;

    /* pain chips reorder the shelf */
    var PAIN = {
      calls: ["lineback", "frontdesk", "dial", "pursuit"],
      noshows: ["slate", "frontdesk", "pursuit"],
      reviews: ["repute", "map"],
      invisible: ["map", "storefront", "marquee", "repute"],
      quiet: ["revive", "dispatch", "pursuit"],
      slow: ["radar", "dispatch", "marquee"]
    };
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
        var m = p.mo, o = p.once || 0;
        if (p.k === "slate" && on.frontdesk) m = 0;
        mo += m; once += o; names.push({ n: p.n, m: m, o: o, inc: (p.k === "slate" && on.frontdesk) });
      });
      document.getElementById("rTotal").innerHTML = f$(mo) + '<small>/month</small>';
      document.getElementById("rDay").textContent = "$" + (mo / 30.4).toFixed(2);
      document.getElementById("rJobs").textContent = mo ? (mo / TICKET).toFixed(1) : "0";
      document.getElementById("rOnce").textContent = f$(once);
      var rows = document.getElementById("rRows");
      rows.innerHTML = count ? names.map(function (x) {
        return '<div class="r-row"><span>' + x.n + (x.inc ? ' <span class="inc">included</span>' : "") + '</span><b>' +
          (x.inc ? "$0" : (x.m ? f$(x.m) : f$(x.o) + " once")) + "</b></div>";
      }).join("") : '<div class="r-row"><span style="color:var(--dim)">Nothing aboard yet — tick a stop.</span></div>';
      var v = document.getElementById("rVerdict"), hit = false, t;
      if (!count) t = "Pick the stop that fixes what hurt this week. One is enough to start.";
      else if (mo >= 2300) { hit = true; t = "<b>This is the whole network.</b> At this size you want the Custom line pass — talk to us and we'll price it as one."; }
      else if (mo >= 1550) { hit = true; t = "<b>Worth a call:</b> the Pro line pass covers this for less as one flat plan."; }
      else if (mo >= 800) { hit = true; t = "<b>Worth a call:</b> six stops together is the Core line pass — one plan, one number, less than this stack."; }
      else t = f$(mo) + "/mo is " + (mo / TICKET).toFixed(1) + " average jobs. Everything after that is yours.";
      v.className = "r-verdict" + (hit ? " hit" : ""); v.innerHTML = t;
    }
    tilesEl.addEventListener("change", function (e) {
      var k = e.target.getAttribute("data-k"); if (!k) return;
      on[k] = e.target.checked; e.target.closest(".tile").classList.toggle("on", e.target.checked);
      recalc();
    });
    document.querySelectorAll(".q-chip[data-pain]").forEach(function (c) {
      c.addEventListener("click", function () {
        document.querySelectorAll(".q-chip[data-pain]").forEach(function (x) { x.classList.remove("on"); });
        c.classList.add("on");
        var pref = PAIN[c.getAttribute("data-pain")] || [];
        order = pref.concat(PRODUCTS.map(function (p) { return p.k; }).filter(function (k) { return pref.indexOf(k) === -1; }));
        render();
        /* re-tick boxes */
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

  window.__ready = true;
})();
