/* STATION v5 runtime · round 3 — cart, shimmer, upgraded demos, FAQ, mobile nav */
(function () {
  "use strict";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var f$ = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn); }

  /* ---------- ref capture -> stripe ---------- */
  var REF = null;
  try {
    var q = new URLSearchParams(location.search);
    REF = q.get("ref") || sessionStorage.getItem("station_ref");
    if (REF) sessionStorage.setItem("station_ref", REF);
  } catch (e) {}
  function stripeUrl(u){
    if (REF && u && u.indexOf("client_reference_id") === -1)
      return u + (u.indexOf("?") > -1 ? "&" : "?") + "client_reference_id=" + encodeURIComponent(REF);
    return u;
  }
  ready(function () {
    document.querySelectorAll('a[href*="buy.stripe.com"]').forEach(function (a) {
      a.href = stripeUrl(a.getAttribute("href")); a.target = "_blank"; a.rel = "noopener";
    });
  });

  /* ---------- reveals ---------- */
  ready(function () {
    var els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window) || RM) { els.forEach(function (e) { e.classList.add("on"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
  });

  /* ---------- catalog (shared by cart + configurator) ---------- */
  var CATALOG = window.STATION_CATALOG || [];
  function prod(k){ return CATALOG.find(function(p){ return p.k === k; }); }

  /* ---------- CART ---------- */
  function cartGet(){ try { return JSON.parse(localStorage.getItem("station_cart") || "[]"); } catch(e){ return []; } }
  function cartSet(c){ try { localStorage.setItem("station_cart", JSON.stringify(c)); } catch(e){} renderCartBadge(); renderCartBody(); }
  function cartAdd(k){ var c = cartGet(); if (c.indexOf(k) === -1) c.push(k); cartSet(c); openCart(); }
  function cartRemove(k){ cartSet(cartGet().filter(function(x){ return x !== k; })); }
  function renderCartBadge(){
    var n = cartGet().length;
    document.querySelectorAll(".cartbtn .n").forEach(function(b){
      b.textContent = n; b.classList.toggle("on", n > 0);
    });
    document.querySelectorAll(".addcart[data-add]").forEach(function(b){
      var inCart = cartGet().indexOf(b.getAttribute("data-add")) > -1;
      b.classList.toggle("in", inCart);
      b.textContent = inCart ? "In cart ✓" : (b.getAttribute("data-label") || "Add to cart");
    });
  }
  var drawer, scrim;
  function openCart(){ if (drawer){ drawer.classList.add("open"); scrim.classList.add("open"); } }
  function closeCart(){ if (drawer){ drawer.classList.remove("open"); scrim.classList.remove("open"); } }
  function renderCartBody(){
    if (!drawer) return;
    var body = drawer.querySelector(".c-body"), foot = drawer.querySelector(".c-foot");
    var c = cartGet();
    if (!c.length){
      body.innerHTML = '<div class="c-empty">Your cart is empty.<br>Every product page has an Add-to-cart.</div>';
      foot.style.display = "none"; return;
    }
    foot.style.display = "";
    var mo = 0, once = 0;
    body.innerHTML = c.map(function(k){
      var p = prod(k); if (!p) return "";
      mo += p.mo || 0; once += p.once || 0;
      return '<div class="c-item">' + (p.img ? '<img src="' + p.img + '" alt="">' : "") +
        '<div><div class="ci-n">' + p.n + '</div><div class="ci-p">' + p.pricelab + ' · ' + p.ttl + '</div></div>' +
        '<button class="ci-x" data-rm="' + k + '" aria-label="Remove">×</button></div>';
    }).join("");
    var tot = drawer.querySelector(".c-tot b");
    tot.textContent = f$(mo) + "/mo" + (once ? " + " + f$(once) + " once" : "");
    drawer.querySelector(".c-nudge").classList.toggle("on", mo >= 800);
    drawer.querySelector(".co-list").innerHTML = c.map(function(k){
      var p = prod(k); if (!p || !p.link) return "";
      return '<a href="' + stripeUrl(p.link) + '" target="_blank" rel="noopener"><span>Check out ' + p.n + '</span><span>' + p.pricelab + '</span></a>';
    }).join("");
  }
  ready(function () {
    scrim = document.createElement("div"); scrim.className = "cart-scrim"; scrim.addEventListener("click", closeCart);
    drawer = document.createElement("aside"); drawer.className = "cart";
    drawer.innerHTML = '<div class="c-h"><b>Your cart</b><button class="c-x" aria-label="Close">×</button></div>' +
      '<div class="c-body"></div>' +
      '<div class="c-foot"><div class="c-tot"><span>Total</span><b>$0</b></div>' +
      '<div class="c-nudge"><b>This stack is bundle territory.</b> A line pass covers it for less — <a href="/#bundles" style="color:inherit;font-weight:700">see the bundles</a>.</div>' +
      '<div class="co-list"></div>' +
      '<p class="c-note">Each product checks out on its own secure page (about 20 seconds each) — subscriptions stay independently cancellable that way. Prefer one bill? That\'s exactly what bundles are.</p></div>';
    document.body.appendChild(scrim); document.body.appendChild(drawer);
    drawer.querySelector(".c-x").addEventListener("click", closeCart);
    drawer.addEventListener("click", function(e){
      var rm = e.target.getAttribute && e.target.getAttribute("data-rm");
      if (rm) cartRemove(rm);
    });
    document.addEventListener("click", function(e){
      var add = e.target.closest && e.target.closest("[data-add]");
      if (add){ e.preventDefault(); cartAdd(add.getAttribute("data-add")); return; }
      var cb = e.target.closest && e.target.closest(".cartbtn");
      if (cb){ e.preventDefault(); renderCartBody(); openCart(); }
    });
    renderCartBadge(); renderCartBody();
  });

  /* ---------- mobile nav sheet ---------- */
  ready(function () {
    var h = document.querySelector(".hamb"); if (!h) return;
    var sheet = document.createElement("div"); sheet.className = "msheet";
    sheet.innerHTML = '<a href="/lines/">Shop all products</a><a href="/frontdesk/">Frontdesk</a>' +
      '<a href="/storefront/">Storefront</a><a href="/#bundles">Bundles</a><a href="/audit/">Free audit</a>' +
      '<a href="/book/">Book a call</a><a href="/#help">Build your line</a>';
    document.body.appendChild(sheet);
    h.addEventListener("click", function(e){ e.stopPropagation(); sheet.classList.toggle("open"); });
    document.addEventListener("click", function(){ sheet.classList.remove("open"); });
  });

  /* ---------- shimmer (gradient-shimmer vanilla port) ---------- */
  ready(function () {
    var el = document.querySelector(".shimmer"); if (!el) return;
    var stops = ["#1D1D1F 0%","#6E5A2E 38%","#C9973B 46%","#EFC26A 50%","#C9973B 54%","#6E5A2E 62%","#1D1D1F 100%"];
    el.style.backgroundColor = "#1D1D1F"; /* base ink under the band — text never disappears */
    el.style.backgroundImage = "linear-gradient(105deg," + stops.join(",") + ")";
    if (RM || typeof el.animate !== "function") { el.style.backgroundSize = "200% 100%"; return; }
    function sweep(){
      var w = el.getBoundingClientRect().width || 600, band = w * 1.6;
      el.style.backgroundSize = band + "px 100%";
      var a = el.animate(
        [{ backgroundPosition: (-band) + "px 0" }, { backgroundPosition: w + "px 0" }],
        { duration: 1900, easing: "cubic-bezier(0.45,0,0.55,1)", fill: "forwards" });
      a.onfinish = function(){ setTimeout(sweep, 1400); };
    }
    sweep();
  });

  /* ---------- pp sticky bar ---------- */
  ready(function () {
    var b = document.getElementById("ppBar"); if (!b) return;
    addEventListener("scroll", function () { b.classList.toggle("on", scrollY > 520); }, { passive: true });
  });

  /* ---------- calculator (unchanged contract) ---------- */
  ready(function () {
    var C = window.CALC, host = document.getElementById("calc");
    if (!C || !host) return;
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
      if (r.loss >= C.price * (C.clearAt || 2)) { verEl.className = "verdict yes";
        verEl.innerHTML = "<b>The math clears easily.</b> You're losing " + f$(r.loss) + " a month; this costs " + f$(C.price) + ". Keeping the problem is the expensive option.";
      } else if (r.loss >= C.price) { verEl.className = "verdict yes";
        verEl.innerHTML = "<b>It pays for itself.</b> " + f$(r.loss) + " lost vs " + f$(C.price) + " — tight but positive. Start on Standard and watch the first month's report.";
      } else { verEl.className = "verdict no";
        verEl.innerHTML = "<b>Honestly? Keep your money for now.</b> At your numbers this loses less than it costs. " + (C.refer || "");
      }
    }
    host.addEventListener("input", run); run();
  });

  /* ---------- configurator ---------- */
  ready(function () {
    var tilesEl = document.getElementById("tiles"); if (!tilesEl || !CATALOG.length) return;
    var on = {}, TICKET = 425;
    var PAIN = { calls: ["lineback","frontdesk","dial","pursuit"], noshows: ["slate","frontdesk","pursuit"],
      reviews: ["repute","map"], invisible: ["map","storefront","marquee","repute"],
      quiet: ["revive","dispatch","pursuit"], slow: ["radar","dispatch","marquee"] };
    var order = CATALOG.map(function (p) { return p.k; });
    function render() {
      tilesEl.innerHTML = "";
      order.forEach(function (k) {
        var p = prod(k); if (!p) return;
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
      CATALOG.forEach(function (p) {
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
      else if (mo >= 800) { hit = true; t = "<b>Bundle territory:</b> a line pass covers this for less. <a href='#bundles' style='color:inherit;font-weight:700'>See the bundles ↓</a>"; }
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
        order = pref.concat(CATALOG.map(function (p) { return p.k; }).filter(function (k) { return pref.indexOf(k) === -1; }));
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

  /* ---------- FAQ tabs ---------- */
  ready(function () {
    var host = document.getElementById("faq"); if (!host || !window.STATION_FAQ) return;
    var cats = Object.keys(window.STATION_FAQ);
    var tabs = host.querySelector(".faq-tabs"), list = host.querySelector(".faq-list");
    function show(cat){
      tabs.querySelectorAll(".faq-tab").forEach(function(t){ t.classList.toggle("on", t.getAttribute("data-cat") === cat); });
      list.innerHTML = window.STATION_FAQ[cat].map(function(f){
        return '<div class="faq-item"><button class="faq-q" type="button"><span>' + f[0] + '</span><span class="pl">+</span></button>' +
          '<div class="faq-a"><p>' + f[1] + '</p></div></div>';
      }).join("");
    }
    cats.forEach(function(c, i){
      var b = document.createElement("button"); b.type = "button";
      b.className = "faq-tab" + (i === 0 ? " on" : ""); b.setAttribute("data-cat", c); b.textContent = c;
      b.addEventListener("click", function(){ show(c); });
      tabs.appendChild(b);
    });
    list.addEventListener("click", function(e){
      var q = e.target.closest(".faq-q"); if (!q) return;
      q.parentElement.classList.toggle("open");
    });
    show(cats[0]);
  });

  /* ---------- forms (n8n contract) + ?biz= prefill ---------- */
  var AUDIT_URL = "https://n8n.srv1748596.hstgr.cloud/webhook/free-audit";
  var AFF_URL = "https://n8n.srv1748596.hstgr.cloud/webhook/station-affiliates";
  ready(function () {
    try {
      var biz = new URLSearchParams(location.search).get("biz");
      if (biz) document.querySelectorAll('form[data-audit] input[name="business"]').forEach(function(i){ i.value = biz; });
    } catch(e){}
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

  /* ================= DEMOS ================= */

  /* iPhone thread helper — interactive */
  function iphoneThread(hostId, cfg) {
    var host = document.getElementById(hostId); if (!host) return;
    host.innerHTML = '<div class="notch"></div><div class="scr">' +
      '<div class="thead">' + cfg.title + '<small>' + (cfg.sub || "") + '</small></div>' +
      '<div class="tbody"></div>' +
      '<div class="chips"></div>' +
      '<div class="tin"><input type="text" placeholder="' + (cfg.placeholder || "Text something…") + '" maxlength="120"><button aria-label="Send">↑</button></div></div>';
    var body = host.querySelector(".tbody"), chips = host.querySelector(".chips");
    var input = host.querySelector(".tin input"), send = host.querySelector(".tin button");
    function bubble(who, text, delay){
      setTimeout(function(){
        var b = document.createElement("div"); b.className = "pm-b " + who; b.textContent = text;
        body.appendChild(b); body.scrollTop = body.scrollHeight;
      }, delay || 0);
    }
    function setChips(arr){
      chips.innerHTML = "";
      (arr || []).forEach(function(c){
        var b = document.createElement("button"); b.type = "button"; b.textContent = c;
        b.addEventListener("click", function(){ userSend(c); });
        chips.appendChild(b);
      });
    }
    function userSend(text){
      if (!text) return;
      bubble("me", text);
      input.value = "";
      var r = cfg.reply(text);
      if (r) { bubble("biz", r.text, 700 + Math.random() * 500); if (r.chips) setTimeout(function(){ setChips(r.chips); }, 900); }
    }
    send.addEventListener("click", function(){ userSend(input.value.trim()); });
    input.addEventListener("keydown", function(e){ if (e.key === "Enter") userSend(input.value.trim()); });
    (cfg.opening || []).forEach(function(m, i){ bubble(m.who, m.t, 300 + i * 800); });
    setTimeout(function(){ setChips(cfg.chips); }, (cfg.opening || []).length * 800 + 500);
  }

  ready(function () {
    /* DIAL — interactive business texting */
    if (document.getElementById("dialSim")) iphoneThread("dialSim", {
      title: "Demo Plumbing Co.", sub: "your business line", placeholder: "Text as the customer…",
      opening: [{ who: "biz", t: "Thanks for reaching out — this is Demo Plumbing. How can we help?" }],
      chips: ["Do y'all do gutter guards?", "How much for a drain clear?", "Can someone come Thursday?"],
      reply: function (t) {
        var s = t.toLowerCase();
        if (/price|much|cost|\$/.test(s)) return { text: "Most jobs like that run a fixed quote after a quick look — want us to swing by? Address is all we need.", chips: ["3114 Maple Ct", "What times do you have?"] };
        if (/thursday|come|when|time|schedule/.test(s)) return { text: "We've got Thursday 9–11 AM or 1–3 PM open. Which works?", chips: ["9–11 works", "1–3 works"] };
        if (/9|1–3|works|yes/.test(s)) return { text: "Booked ✓ You'll get a reminder the night before. Anything else?" };
        if (/gutter|drain|heater|leak|install|repair/.test(s)) return { text: "We do — that's one of our most common calls. Want a quick quote? Just need the address.", chips: ["3114 Maple Ct"] };
        if (/maple|street|ave|dr|ct|rd/.test(s)) return { text: "Got it. We can come Thursday between 9 and 11 — work for you?", chips: ["Perfect", "Later that day?"] };
        return { text: "Absolutely — and notice this whole thread is happening on a business line, not somebody's personal cell. What else can I answer?" };
      }
    });

    /* PURSUIT — sequence plays, user reply stops it */
    if (document.getElementById("pursuitSim")) iphoneThread("pursuitSim", {
      title: "Demo Plumbing Co.", sub: "day 1 → day 10, compressed", placeholder: "Reply as the lead…",
      opening: [
        { who: "biz", t: "Hi Sarah — got your request about the water heater. When works for a look, tomorrow or Thursday?" },
        { who: "biz", t: "(next morning) Morning! Still happy to help with that water heater — mornings or afternoons better?" },
        { who: "biz", t: "(day 4) No rush at all — want me to pencil you in for early next week?" }
      ],
      chips: ["Yes sorry! Thursday works", "Who is this?", "Stop"],
      reply: function (t) {
        var s = t.toLowerCase();
        if (/stop/.test(s)) return { text: "You're opted out — no more messages. (And that's automatic, always.)" };
        if (/who/.test(s)) return { text: "It's Demo Plumbing — you asked about a water heater on our site. Want that quote?" };
        return { text: "SEQUENCE STOPPED ✓ — the moment you replied, the automation ended and a human took over. That's the whole product." };
      }
    });

    /* REPUTE — sentiment-aware reply drafter */
    var rbtn = document.querySelector("[data-rep-run]");
    if (rbtn) rbtn.addEventListener("click", function () {
      var txt = (document.getElementById("repDemoIn").value || "").trim();
      var tone = (document.querySelector('input[name="repTone"]:checked') || {}).value || "warm";
      var out = document.getElementById("repDemoOut");
      if (!txt) { out.textContent = "Paste a review first — good or bad, any review."; return; }
      var s = " " + txt.toLowerCase() + " ";
      var NEG = ["shit","crap","terrible","awful","bad","worst","rude","late","never","slow","dirty","broken","refund","scam","horrible","poor","overpriced","disappoint","unprofessional","no show","noshow","damage","waste","avoid","don't use","dont use","sucks","mess","wrong","cancel"];
      var POS = ["great","amazing","excellent","fantastic","love","perfect","awesome","best","professional","friendly","fast","clean","recommend","wonderful","happy","thank","incredible","fair","honest","on time"];
      var negHit = NEG.filter(function(w){ return s.indexOf(w) > -1; });
      var posHit = POS.filter(function(w){ return s.indexOf(w) > -1; });
      var neg = negHit.length > posHit.length;
      var mixed = negHit.length && posHit.length;
      var name = (txt.match(/^[A-Z][a-z]{2,}/) || ["there"])[0];
      var topic = "";
      var topics = { "wait|late|slow|no show|noshow": "the wait", "price|overpriced|charge|expensive|\\$": "the pricing",
        "rude|unprofessional|attitude": "how you were treated", "dirty|mess|damage": "the state we left things in",
        "broken|wrong|fix|redo": "the work itself", "call|phone|answer|response": "how hard we were to reach" };
      for (var pat in topics) { if (new RegExp(pat).test(s)) { topic = topics[pat]; break; } }
      var r;
      if (neg) {
        r = (tone === "warm")
          ? "Hi " + name + " — thank you for being straight with us" + (topic ? " about " + topic : "") + ". That's not the standard we run this shop on, and I'm not going to make excuses for it. I'd like to make it right personally — call us and ask for the owner, and we'll fix it this week."
          : "Thank you for the candid feedback" + (topic ? " regarding " + topic : "") + ". This falls short of our standard and we take it seriously. Please contact us directly so we can resolve it promptly.";
      } else if (mixed) {
        r = "Thank you for the honest review, " + name + " — glad the good parts landed, and we hear you" + (topic ? " on " + topic : " on the rest") + ". We're on it, and we'd love another shot at five stars.";
      } else {
        r = (tone === "warm")
          ? "Thank you, " + name + " — this genuinely made our week. It was a pleasure doing the work, and we're a call away whenever you need us again."
          : "Thank you for the kind words and for trusting us with the work. We appreciate the review and look forward to serving you again.";
      }
      out.textContent = ""; var i = 0;
      var iv = setInterval(function () { out.textContent = r.slice(0, i += 3); if (i >= r.length) clearInterval(iv); }, 16);
    });

    /* SLATE — month calendar */
    var cs = document.getElementById("slateSim");
    if (cs) {
      var dows = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      var htmlCal = '<div class="mcal"><div class="mh"><span>August 2026</span><span style="color:var(--faint);font-weight:500;font-size:12px">Demo Plumbing Co.</span></div>' +
        '<div class="dow">' + dows.map(function(d){ return "<span>" + d + "</span>"; }).join("") + '</div><div class="days">';
      /* Aug 2026 starts Saturday */
      for (var pad = 0; pad < 5; pad++) htmlCal += "<button disabled></button>";
      for (var d = 1; d <= 31; d++) {
        var dow = (5 + (d - 1)) % 7;
        var closed = (dow === 6) || d < 3;
        htmlCal += '<button ' + (closed ? "disabled" : 'data-day="' + d + '"') + '>' + d + "</button>";
      }
      htmlCal += '</div><div class="slots"></div></div>';
      cs.innerHTML = htmlCal;
      var slotsEl = cs.querySelector(".slots");
      cs.querySelector(".days").addEventListener("click", function(e){
        var day = e.target.getAttribute && e.target.getAttribute("data-day"); if (!day) return;
        cs.querySelectorAll(".days button").forEach(function(b){ b.classList.remove("on"); });
        e.target.classList.add("on");
        slotsEl.classList.add("show");
        slotsEl.innerHTML = ["8:00 AM","9:30 AM","11:00 AM","1:00 PM","2:30 PM","4:00 PM"].map(function(t){
          return '<button data-slot="' + t + '" data-day="' + day + '">' + t + "</button>";
        }).join("");
        document.getElementById("slateOut").textContent = "";
      });
      slotsEl.addEventListener("click", function(e){
        var t = e.target.getAttribute && e.target.getAttribute("data-slot"); if (!t) return;
        slotsEl.querySelectorAll("button").forEach(function(b){ b.classList.remove("on"); });
        e.target.classList.add("on");
        document.getElementById("slateOut").textContent =
          "Booked ✓ Aug " + e.target.getAttribute("data-day") + " at " + t +
          '.\n\nAnd at 8 PM the night before, they get:\n"Reminder — ' + t + " tomorrow with Demo Plumbing Co. Reply C to confirm or R to reschedule.\"";
      });
    }

    /* MAP — teaser scan + prefilled audit CTA */
    var mbtn = document.querySelector("[data-map-run]");
    if (mbtn) mbtn.addEventListener("click", function () {
      var v = (document.getElementById("mapDemoIn").value || "").trim();
      var out = document.getElementById("mapDemoOut");
      if (!v) { out.textContent = "Type your business name first."; return; }
      out.innerHTML = "";
      var lines = [
        "Queueing “" + v + "” for the real scan…",
        "Check 1 · PRIMARY CATEGORY — the single biggest ranking lever. 6 in 10 listings we scan have the wrong one. Yours gets pulled and verified in the full audit.",
        "Check 2 · HOURS DRIFT — Google accepts public \"corrections\" to your hours. We diff what Google shows against what you actually run.",
        "Check 3 · PUBLIC EDITS & DUPLICATES — competitor edits, stale duplicate listings, spam rivals. We pull your listing's actual edit exposure.",
        "…checks 4–11 (reviews vs your top 3 competitors, citations, site speed, response time and more) run against your real listing in the free audit."
      ];
      var i = 0;
      (function step() {
        if (i < lines.length) { out.textContent += (i ? "\n\n" : "") + lines[i++]; setTimeout(step, 700); }
        else {
          var a = document.createElement("a");
          a.className = "btn dark sm"; a.style.marginTop = "12px"; a.style.display = "inline-flex";
          a.href = "/audit/?biz=" + encodeURIComponent(v);
          a.textContent = "Run the full 11-check audit on " + v + " — free →";
          out.appendChild(document.createElement("br")); out.appendChild(a);
        }
      })();
    });

    /* DISPATCH — editable templates */
    var dsm = document.getElementById("dispatchSim");
    if (dsm) {
      [["Spring tune-up week", "Subject: A/C ready for the first 95° day?\n\nWe're doing tune-ups in your area next week — $89, takes an hour, and it's the difference between June working and June waiting on parts. Book by Friday and we'll bump you to the front."],
       ["We-miss-you", "Subject: It's been a while\n\nWe did your place two summers ago — want us to take a look before the season hits? Past customers get first pick of the schedule."],
       ["Review thank-you", "Subject: Thank you (really)\n\nYour review means the world to a local shop. Here's $25 off your next visit — no expiry, no fine print."]].forEach(function (t, i) {
        var d = document.createElement("div"); d.className = "tpl" + (i === 0 ? " open" : "");
        d.innerHTML = '<div class="t-h">' + t[0] + ' <span style="color:var(--faint);font-weight:500;font-size:11px">· click text to edit</span></div><div class="t-b" contenteditable="true" spellcheck="false"></div>';
        d.querySelector(".t-b").textContent = t[1];
        d.addEventListener("click", function (e) {
          if (e.target.closest(".t-b")) return;
          dsm.querySelectorAll(".tpl").forEach(function (x) { x.classList.remove("open"); });
          d.classList.add("open");
        });
        dsm.appendChild(d);
      });
    }

    /* REVIVE — editable touches + play */
    var rs = document.getElementById("reviveSim");
    if (rs) {
      var touches = [["Day 1", "It's been a while — want us to take a look before summer?"],
        ["Day 4", "Quick nudge — our schedule's filling for the season."],
        ["Day 8", "Past customers get priority booking this month."],
        ["Day 12", "Anything we did last time you'd like re-checked?"],
        ["Day 16", "Last one from us — we'll leave you be after this, promise."],
        ["Day 21", "Text leg (consent-gated): Hi — it's Demo Plumbing. Want your spring check?"]];
      touches.forEach(function (t) {
        var d = document.createElement("div"); d.className = "touch";
        d.innerHTML = "<b>" + t[0] + "</b><span contenteditable='true' spellcheck='false'>" + t[1] + "</span>";
        rs.appendChild(d);
      });
      var hint = document.createElement("p");
      hint.style.cssText = "font-size:12px;color:var(--faint);margin:10px 0 0";
      hint.innerHTML = "Every line is editable — click any message and rewrite it. That's exactly how it works in your account (Settings → Your Words).";
      rs.appendChild(hint);
      var play = document.createElement("button");
      play.className = "btn lite sm"; play.style.marginTop = "12px"; play.textContent = "▶ Play the 3-week campaign";
      play.addEventListener("click", function () {
        var items = rs.querySelectorAll(".touch");
        items.forEach(function (it) { it.classList.remove("sent"); });
        items.forEach(function (it, i) { setTimeout(function () { it.classList.add("sent"); }, 400 + i * 550); });
      });
      rs.appendChild(play);
    }

    /* TAP — amount → estimate → invoice → tap → receipt */
    var ts = document.getElementById("tapSim");
    if (ts) {
      ts.className = "tapsim";
      var amt = 425, step = 0;
      function render() {
        var el = ts.querySelector(".stage");
        if (step === 0) el.innerHTML = '<div><p style="margin:0 0 10px;color:var(--muted)">What would you charge for a typical job?</p>' +
          '<input id="tapAmt" type="number" value="' + amt + '" min="20" max="20000"> ' +
          '<button class="btn dark sm" data-next style="margin-left:8px">Send the estimate →</button></div>';
        if (step === 1) el.innerHTML = '<div><p class="k" style="margin-bottom:6px">Estimate · sent by text</p>' +
          '<div class="amt">' + f$(amt) + '</div><p style="color:var(--muted);font-size:13px;margin:6px 0 12px">Your customer opens it on their phone and taps…</p>' +
          '<button class="btn dark sm" data-next>Accept estimate ✓</button></div>';
        if (step === 2) el.innerHTML = '<div><p class="k" style="margin-bottom:6px">Invoice · auto-created from the estimate</p>' +
          '<div class="amt">' + f$(amt) + '</div><p style="color:var(--muted);font-size:13px;margin:6px 0 12px">Job\'s done. Time to get paid — tap their card on your phone:</p>' +
          '<div class="tapring go" data-next role="button" tabindex="0"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="14" height="10.5" rx="2.4"/><path d="M2 9.6h14M18.4 8.2a5.4 5.4 0 010 7.6"/></svg></div></div>';
        if (step === 3) el.innerHTML = '<div style="display:grid;place-items:center;gap:10px">' +
          '<div class="receiptcard">DEMO PLUMBING CO.<br>—————————————<br>Service&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + f$(amt) +
          '<br>Card tap&nbsp;&nbsp;&nbsp;&nbsp;APPROVED<br>—————————————<br>Receipt texted ✓<br>Job marked won ✓<br>Review ask queued ✓</div>' +
          '<p style="color:var(--good);font-weight:600;font-size:14px;margin:0">Paid on the driveway — not "when I get to it."</p>' +
          '<button class="btn lite sm" data-reset>Run it again</button></div>';
      }
      ts.innerHTML = '<div class="stage"></div>'; render();
      ts.addEventListener("click", function (e) {
        if (e.target.closest("[data-next]")) {
          var inp = document.getElementById("tapAmt");
          if (inp) amt = Math.max(20, +inp.value || 425);
          step = Math.min(3, step + 1); render();
        }
        if (e.target.closest("[data-reset]")) { step = 0; render(); }
      });
    }

    /* STOREFRONT before/after slider */
    var ba = document.getElementById("baSlider");
    if (ba) {
      var img = "/media/v5/storefront.jpg";
      ba.querySelector(".ba-after").style.backgroundImage = "url('" + img + "')";
      ba.querySelector("input").addEventListener("input", function () {
        ba.querySelector(".ba-after").style.clipPath = "inset(0 0 0 " + (100 - this.value) + "%)";
      });
    }

    /* MARQUEE — live board */
    function mqRender() {
      var tradeEl = document.getElementById("mqTrade"), palEl = document.getElementById("mqPal");
      if (!tradeEl) return;
      var trade = tradeEl.value, pal = palEl.value;
      var PALS = { ink: ["#1D1D1F", "#8A5A00", "#F5F4F1", "#6E6E73"], pine: ["#1E3D2F", "#C86A3A", "#F4F1E8", "#7A8B80"], slate: ["#2A3440", "#7FA8C9", "#F2F4F6", "#8E99A6"] };
      var POSTS = { Plumbing: "Before your water heater quits mid-shower: 5 signs it's on the way out.",
        HVAC: "The $89 tune-up that keeps July from costing you $4,000.",
        Landscaping: "Three beds, one weekend — the fall cleanup that pays off in April.",
        Cleaning: "What a deep clean actually includes (and what \"deep clean\" usually means).",
        Roofing: "Hail season checklist: 4 things to photograph before you call anyone." };
      var b = document.getElementById("mqBoard"); b.classList.add("on");
      b.innerHTML = '<div class="mq-name">' + trade + ' Co.</div>' +
        '<div class="mq-logo" style="background:' + PALS[pal][0] + '">' + trade[0] + '</div>' +
        '<div class="mq-post"><b>Sample post, written for you</b>' + (POSTS[trade] || "") + '</div>' +
        PALS[pal].map(function (c) { return '<div class="mq-sw" style="background:' + c + '" title="' + c + '"></div>'; }).join("") +
        '<div class="mq-sw" style="background:#fff;border:1px solid var(--line);display:grid;place-items:center;font:700 10px var(--fm);color:var(--faint)">Aa</div>' +
        '<div class="mq-sw" style="background:' + PALS[pal][1] + ';display:grid;place-items:center;color:#fff;font:700 10px var(--fm)">CTA</div>' +
        '<div class="mq-tag">Inter · plainspoken, outcome-first · posts to 9 platforms from one desk. The real board is a full deliverable in week one.</div>';
    }
    var mqb = document.querySelector("[data-mq-run]");
    if (mqb) {
      mqb.addEventListener("click", mqRender);
      document.getElementById("mqTrade").addEventListener("change", mqRender);
      document.getElementById("mqPal").addEventListener("change", mqRender);
      mqRender();
    }
  });

  /* ---------- chat launcher ---------- */
  ready(function () {
    var fab = document.createElement("button");
    fab.className = "chat-fab"; fab.setAttribute("aria-label", "Chat with Station");
    fab.innerHTML = '<svg viewBox="0 0 100 100" fill="currentColor"><g transform="rotate(45 50 50)"><rect x="29.5" y="3" width="18" height="36" rx="8.5"/><rect x="52.5" y="3" width="18" height="36" rx="8.5"/><rect x="29.5" y="61" width="18" height="36" rx="8.5"/><rect x="52.5" y="61" width="18" height="36" rx="8.5"/><rect x="3" y="29.5" width="36" height="18" rx="8.5"/><rect x="3" y="52.5" width="36" height="18" rx="8.5"/><rect x="61" y="29.5" width="36" height="18" rx="8.5"/><rect x="61" y="52.5" width="36" height="18" rx="8.5"/></g><circle cx="50" cy="50" r="16.5" fill="#1D1D1F"/></svg>';
    var panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.innerHTML = '<div class="ch-h">Station</div>' +
      '<p>Fastest ways to get an answer right now:</p>' +
      '<a href="/audit/">Get the free audit →</a>' +
      '<a href="/book/">Book the 15-min intro call →</a>' +
      '<a href="tel:+18444936381">Call us — (844) 493-6381 →</a>' +
      '<a href="mailto:main@station.solutions">Email a human →</a>' +
      '<p style="margin:10px 0 0;font-size:11.5px;color:#A9A9AE">Live chat (our Greet product) connects here shortly.</p>';
    document.body.appendChild(fab); document.body.appendChild(panel);
    function toggle() { panel.classList.toggle("open"); }
    fab.addEventListener("click", toggle);
    document.querySelectorAll("[data-open-chat]").forEach(function (b) { b.addEventListener("click", toggle); });
  });

  /* ---------- cookie bar (Accept / Deny · bottom-left) ---------- */
  ready(function () {
    try {
      if (!localStorage.getItem("station_cookies")) {
        var cb = document.createElement("div"); cb.className = "cookiebar open";
        cb.innerHTML = '<p>We use essential cookies to make the site work — nothing that follows you around. <a href="/legal/cookies.html">Details</a>.</p>' +
          '<div style="display:flex;gap:8px"><button class="btn dark sm" data-ck="accept">Accept</button>' +
          '<button class="btn lite sm" data-ck="deny">Deny</button></div>';
        cb.addEventListener("click", function (e) {
          var v = e.target.getAttribute && e.target.getAttribute("data-ck");
          if (v) { localStorage.setItem("station_cookies", v); cb.remove(); }
        });
        document.body.appendChild(cb);
      }
      if (!localStorage.getItem("station_news") && !localStorage.getItem("station_lead_done")) {
        setTimeout(function () {
          if (localStorage.getItem("station_news")) return;
          var scr = document.createElement("div"); scr.className = "pop-scrim open";
          var pop = document.createElement("div"); pop.className = "pop open";
          pop.innerHTML = '<button class="x" aria-label="Close">×</button>' +
            '<h3 style="font-family:var(--fd);font-weight:700">10% off your first month.</h3>' +
            '<p>Join the list and we\'ll send the discount code, plus one useful note a month. No noise.</p>' +
            '<form data-audit data-variant="newsletter" class="audit-form" style="border:0;padding:0;margin-top:14px">' +
            '<div class="af-grid"><input name="email" type="email" placeholder="Email" required style="grid-column:1/-1">' +
            '<input name="phone" type="tel" placeholder="Phone (optional)" style="grid-column:1/-1"></div>' +
            '<input name="leak" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">' +
            '<input type="hidden" name="_t" value=""><input type="hidden" name="variant" value="newsletter">' +
            '<label class="consent"><input type="checkbox" name="consent_email" value="yes" required><span>Email me the code + the monthly note. Unsubscribe anytime.</span></label>' +
            '<label class="consent"><input type="checkbox" name="consent_sms" value="yes"><span>Texts are OK too. Msg &amp; data rates may apply; reply STOP to opt out. <a href="/legal/sms-terms.html" target="_blank">SMS terms</a>.</span></label>' +
            '<button class="btn dark" type="submit" style="width:100%">Send my code</button>' +
            '<p class="af-done" hidden><b>Check your inbox.</b> The code is on its way.</p></form>';
          function close() { scr.remove(); pop.remove(); localStorage.setItem("station_news", "dismissed"); }
          pop.querySelector(".x").addEventListener("click", close);
          scr.addEventListener("click", close);
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
          document.body.appendChild(scr); document.body.appendChild(pop);
        }, 22000);
      }
    } catch (e) {}
  });

  /* ---------- version pill (top-right, desktop only) ---------- */
  ready(function () {
    if (document.querySelector("[data-vswitch]")) return;
    var path = location.pathname, active = 5, sub = path;
    if (path.indexOf("/v2/") === 0) { active = 2; sub = path.slice(3); }
    else if (path.indexOf("/v3/") === 0) { active = 3; sub = path.slice(3); }
    else if (path.indexOf("/v4/") === 0) { active = 4; sub = "/"; }
    if (!/^\/([a-z]+\/)?$/.test(sub)) sub = "/";
    var d = document.createElement("div");
    d.setAttribute("data-vswitch", "1");
    d.style.cssText = "position:fixed;z-index:80;display:flex;gap:2px;background:rgba(20,20,22,.85);backdrop-filter:blur(10px);border-radius:999px;padding:4px;font:600 11px Inter,'Segoe UI',sans-serif";
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
