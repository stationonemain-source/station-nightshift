/* analytics.js — THE RANGE AT DAWN
   Cookie consent banner + consent-gated analytics AND advertising.

   Two choices on the banner:
     • "Accept"          → first-party analytics + advertising/retargeting.
                            Loads the Meta (Facebook) Pixel so we can build
                            retargeting audiences and run Meta ads to visitors
                            who showed interest. label = "accepted".
     • "Essentials only" → strictly-necessary storage only. No analytics events,
                            no Pixel, no ad tracking. label = "essentials".

   First-party events beacon to the Station World server (:8790), which stores
   them for the Circle Command Center analytics board (per-session, incl. which
   sessions accepted retargeting). Meta retargeting itself is handled by the
   Pixel — Meta builds the audience on their side; we never store a visitor's
   name/email here (that only arrives when someone submits the audit form → GHL).

   >>> ONE THING TO SET: paste your Meta Pixel ID below (META_PIXEL_ID). Until
       it's set, everything else works and the Pixel simply stays dormant. <<<

   When this site deploys publicly, point ENDPOINT at the public collector. */
(function () {
  "use strict";

  /* ============================ CONFIG ============================ */
  var ENDPOINT = "http://127.0.0.1:8790/api/range-analytics";
  var LS_KEY = "rangeConsent"; // "all" (analytics + ads) | "essential"
  // Paste the numeric Pixel ID from Meta Events Manager, e.g. "1234567890".
  // Leave "" to keep the Pixel off (analytics still works).
  var META_PIXEL_ID = "";
  /* =============================================================== */

  function consent() {
    try { return localStorage.getItem(LS_KEY); } catch (e) { return null; }
  }

  function sid() {
    try {
      var s = sessionStorage.getItem("rangeSid");
      if (!s) {
        s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        sessionStorage.setItem("rangeSid", s);
      }
      return s;
    } catch (e) { return "anon"; }
  }

  // First-party beacons target the local Station World collector (:8790), which
  // only runs on the operator's machine. In production (any non-localhost host)
  // there is no public collector yet, so we no-op instead of firing a blocked
  // mixed-content request from every visitor's browser. Meta Pixel retargeting
  // is independent of this and still runs when the visitor consents.
  var IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname);

  // Blob with no content-type keeps sendBeacon CORS-safelisted (no preflight)
  function post(obj) {
    if (!IS_LOCAL) return;
    var data = JSON.stringify(obj);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([data]))) return;
    } catch (e) {}
    try {
      fetch(ENDPOINT, { method: "POST", body: data, keepalive: true, mode: "cors" }).catch(function () {});
    } catch (e) {}
  }

  function track(ev, label) {
    if (consent() !== "all") return;
    post({ ev: ev, label: label || "", sid: sid(), path: location.pathname,
           ref: new URLSearchParams(location.search).get("ref") || "" });
  }
  window.__rangeTrack = track;

  /* ---------------- Meta (Facebook) Pixel — ad retargeting ----------------
     Only loads when the visitor accepted ("all") AND a Pixel ID is set.
     Loads once per page. Safe no-op if either condition isn't met. */
  var pixelLoaded = false;
  function loadMetaPixel() {
    if (pixelLoaded || !META_PIXEL_ID || consent() !== "all") return;
    pixelLoaded = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    try {
      window.fbq("init", META_PIXEL_ID);
      window.fbq("track", "PageView");
    } catch (e) {}
  }
  // Fire a Meta event (standard or custom) only when the Pixel is live.
  function fbTrack(kind, event, params) {
    if (!window.fbq) return;
    try { window.fbq(kind, event, params || {}); } catch (e) {}
  }

  /* ---------------- consent banner ---------------- */
  function showBanner() {
    var el = document.createElement("div");
    el.id = "ck";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Cookie and advertising choices");
    el.innerHTML =
      '<div class="ck-txt"><b>Cookies &amp; ads.</b> Essentials keep the site working. ' +
      'Accept and we also turn on first-party analytics <b>and advertising</b> — that means the ' +
      'Meta&nbsp;Pixel, so we can show you Station ads on Facebook &amp; Instagram after your visit. ' +
      'Your choice, and you can pick essentials only. ' +
      '<a href="/legal/cookies.html" target="_blank" rel="noopener">Cookie notice</a> · ' +
      '<a href="/legal/privacy.html" target="_blank" rel="noopener">Privacy</a></div>' +
      '<div class="ck-actions">' +
      '<button class="ck-accept" id="ck-accept">Accept analytics &amp; ads</button>' +
      '<button class="ck-min" id="ck-min">Essentials only</button></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("up"); });
    });
    function choose(val) {
      try { localStorage.setItem(LS_KEY, val); } catch (e) {}
      // Consent choice is logged WITH the session id now, so the Command Center
      // can show which sessions accepted retargeting (still anonymous — a random
      // per-visit id, no name/email). "accepted" = analytics + ads.
      post({ ev: "consent", label: val === "all" ? "accepted" : "essentials",
             sid: sid(), path: location.pathname,
             ref: new URLSearchParams(location.search).get("ref") || "" });
      el.classList.remove("up");
      setTimeout(function () { el.remove(); }, 400);
      if (val === "all") boot();
    }
    document.getElementById("ck-accept").addEventListener("click", function () { choose("all"); });
    document.getElementById("ck-min").addEventListener("click", function () { choose("essential"); });
  }

  /* ---------------- consent-gated wiring ---------------- */
  var booted = false;
  function boot() {
    if (booted || consent() !== "all") return;
    booted = true;

    loadMetaPixel();     // ad retargeting (only if a Pixel ID is set)
    track("pageview");

    // film watched to the end = the content landing scrolled into view
    if ("IntersectionObserver" in window) {
      var landing = document.getElementById("landing");
      if (landing) {
        var seen = false;
        var io = new IntersectionObserver(function (en) {
          if (!seen && en[0].isIntersecting) {
            seen = true; track("film_complete");
            fbTrack("track", "ViewContent", { content_name: "intro film complete" });
            io.disconnect();
          }
        }, { threshold: 0.1 });
        io.observe(landing);
      }
    }

    // CTA clicks (booking links, amber buttons, audit jumps)
    document.addEventListener("click", function (e) {
      var b = e.target.closest(".btn-primary,.btn-audit,.js-book,.btn-ghost");
      if (b) {
        var label = (b.textContent || "").trim().slice(0, 40);
        track("cta_click", label);
        fbTrack("trackCustom", "CTAClick", { label: label });
      }
    });

    // audit form submit — strongest intent signal; a Meta "Lead" for retargeting
    var af = document.querySelector("#audit form");
    if (af) af.addEventListener("submit", function () {
      track("audit_submit");
      fbTrack("track", "Lead", { content_name: "audit request" });
    });

    // demo usage — first message per surface per visit
    var used = {};
    function demoUse(which) {
      if (used[which]) return;
      used[which] = true;
      track("demo_use", which);
    }
    var pf = document.getElementById("p-form"), pc = document.getElementById("p-chips");
    if (pf) pf.addEventListener("submit", function () { demoUse("phone"); });
    if (pc) pc.addEventListener("click", function (e) { if (e.target.closest(".chip-btn")) demoUse("phone"); });
    var wf = document.getElementById("aiw-form"), wc = document.getElementById("aiw-chips");
    if (wf) wf.addEventListener("submit", function () { demoUse("faq"); });
    if (wc) wc.addEventListener("click", function (e) { if (e.target.closest(".chip-btn")) demoUse("faq"); });

    // popup lifecycle (dispatched by the inline script)
    document.addEventListener("range:popup", function (e) {
      track("popup", (e.detail && e.detail.action) || "shown");
    });
  }

  var QS = new URLSearchParams(location.search);
  if (QS.get("demo") === "cookies") {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    setTimeout(showBanner, 300);
  } else {
    var c = consent();
    if (c === "all") boot();
    else if (c === null && !QS.has("jump")) {
      // banner stays out of the QA harness unless explicitly demoed
      setTimeout(showBanner, 1400);
    }
  }
})();
