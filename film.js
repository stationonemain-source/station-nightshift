/* THE RANGE AT DAWN — Station scroll-film engine
   Canvas scrub over pre-extracted frames. No frameworks, no deps.
   Dev contract: ?jump=<scrollY> lands pre-scrolled + settled; window.__ready gates capture. */
(function () {
  "use strict";

  var FRAME_COUNT = 301; /* PATCH_FRAME_COUNT — set by assemble step */
  var frameSrc = function (i) {
    var n = String(i + 1); while (n.length < 4) n = "0" + n;
    return "frames/f_" + n + ".jpg";
  };
  var AUDIT_URL = "https://n8n.srv1748596.hstgr.cloud/webhook/free-audit";
  var AFF_URL = "https://n8n.srv1748596.hstgr.cloud/webhook/station-affiliates";
  var AFF_PUB = "stnpub-84cc5c8bdf9168da20e4923921d8743c";
  var BOOKING_URL = "https://station.solutions/call";

  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var JUMP = new URLSearchParams(location.search).get("jump");
  if (JUMP !== null) history.scrollRestoration = "manual";

  /* ---------------- ref attribution (mirrors the live funnel script) ---------------- */
  try {
    var ref = new URLSearchParams(location.search).get("ref");
    if (ref) localStorage.setItem("station_ref", ref);
  } catch (e) {}

  /* ---------------- canvas + frames ---------------- */
  var film = document.getElementById("film");
  var stage = document.getElementById("stage");
  var canvas = document.getElementById("screen");
  var ctx = canvas.getContext("2d");
  var DPR = Math.min(devicePixelRatio || 1, 1.5);

  var images = new Array(FRAME_COUNT);
  var loaded = 0, loaderDone = false;

  function sizeCanvas(c) {
    c.width = Math.round(innerWidth * DPR);
    c.height = Math.round(innerHeight * DPR);
    c.style.width = innerWidth + "px";
    c.style.height = innerHeight + "px";
  }
  sizeCanvas(canvas);

  /* concurrency-capped pump */
  var nextIdx = 0, inFlight = 0, PUMP = 10;
  function pump() {
    while (inFlight < PUMP && nextIdx < FRAME_COUNT) {
      (function (i) {
        var im = new Image();
        inFlight++;
        im.onload = im.onerror = function () {
          inFlight--; loaded++;
          if (im.width) images[i] = im;
          onLoadProgress(i);
          pump();
        };
        im.src = frameSrc(i);
      })(nextIdx++);
    }
  }

  var loadbar = document.getElementById("loadbar");
  var loadpct = document.getElementById("loadpct");
  var loader = document.getElementById("loader");
  function onLoadProgress(i) {
    var p = Math.round((loaded / FRAME_COUNT) * 100);
    if (loadbar) loadbar.style.width = p + "%";
    if (loadpct) loadpct.textContent = p + "%";
    if (!loaderDone && (loaded >= Math.min(56, FRAME_COUNT))) {
      loaderDone = true;
      loader.classList.add("done");
      drawFrame(displayed, true);
    }
    if (i === 0) drawFrame(0, true);
    if (loaded >= FRAME_COUNT) allLoaded = true;
  }
  var allLoaded = false;

  /* ---------------- decode warming (anti-jank, no retained GPU surfaces) ----------------
     The original build kept a sliding window of ~57 createImageBitmap() surfaces (~200 MB
     of GPU-backed memory) and churned decode→upload→close on every scroll frame. On
     integrated GPUs that rapid churn crashed the tab renderer (STATUS_ACCESS_VIOLATION).
     We now draw the HTMLImageElements straight to the canvas and only WARM the decode
     cache a little ahead of the playhead with img.decode(). Chromium owns and evicts that
     cache itself, so nothing is pinned and there are no ImageBitmap surfaces to exhaust
     the GPU — the scrub stays smooth without the crash. */
  var warmed = new Set(), W_BEHIND = 4, W_AHEAD = 14, warmCenter = -999;
  function warmDecodes(center) {
    if (Math.abs(center - warmCenter) < 4) return;
    warmCenter = center;
    var lo = Math.max(0, center - W_BEHIND), hi = Math.min(FRAME_COUNT - 1, center + W_AHEAD);
    for (var i = lo; i <= hi; i++) {
      if (warmed.has(i) || !images[i]) continue;
      warmed.add(i);
      if (!images[i].decode) continue;
      (function (k) {
        images[k].decode().then(function () {
          if (k === displayed) drawFrame(k, true);
        }).catch(function () { warmed.delete(k); });
      })(i);
    }
  }

  function nearestFrame(idx) {
    if (images[idx]) return idx;
    for (var d = 1; d < FRAME_COUNT; d++) {
      if (idx - d >= 0 && images[idx - d]) return idx - d;
      if (idx + d < FRAME_COUNT && images[idx + d]) return idx + d;
    }
    return -1;
  }

  var displayed = 0;
  function drawFrame(idx, force) {
    var use = nearestFrame(idx);
    if (use < 0) return;
    if (!force && use === displayed) return;
    displayed = use;
    var src = images[use];
    var iw = src.width, ih = src.height;
    var cw = canvas.width, chh = canvas.height;
    var s = Math.max(cw / iw, chh / ih);
    var dw = iw * s, dh = ih * s;
    ctx.drawImage(src, (cw - dw) / 2, (chh - dh) / 2, dw, dh);
  }

  /* ---------------- scroll → progress ---------------- */
  var progress = 0;
  function computeProgress() {
    var r = film.getBoundingClientRect();
    var denom = r.height - innerHeight;
    progress = denom > 0 ? Math.max(0, Math.min(1, -r.top / denom)) : 0;
    return progress;
  }

  /* ---------------- beats ---------------- */
  var beats = [];
  Array.prototype.forEach.call(document.querySelectorAll(".beat"), function (el) {
    beats.push({
      el: el,
      in_: parseFloat(el.dataset.in),
      peak: parseFloat(el.dataset.peak),
      out: parseFloat(el.dataset.out),
      center: el.classList.contains("center")
    });
  });
  function beatAlpha(b, p) {
    if (p < b.in_ || p > b.out) return 0;
    if (p < b.peak) return (p - b.in_) / Math.max(1e-4, b.peak - b.in_);
    if (b.out > 1.5) return 1;
    return 1 - (p - b.peak) / Math.max(1e-4, b.out - b.peak);
  }
  var lastP = 0;
  function renderBeats(p) {
    var dir = p >= lastP ? 1 : -1;
    for (var i = 0; i < beats.length; i++) {
      var b = beats[i], a = beatAlpha(b, p);
      /* 0.012 floor keeps the backdrop-filter surface alive — first paint of a
         blur layer mid-scroll costs ~50ms. Desktop only: on mobile the cards share
         one bottom anchor and stacked floors would ghost. */
      var floor = innerWidth > 700 ? 0.012 : 0;
      b.el.style.opacity = Math.max(a, floor).toFixed(3);
      b.el.style.pointerEvents = a > 0.5 ? "auto" : "none";
      var ty = (1 - a) * 14 * dir;
      b.el.style.setProperty("--ty", ty.toFixed(1) + "px");
    }
    lastP = p;
  }

  /* ---------------- altimeter ---------------- */
  var altiEl = document.getElementById("alti");
  var altiCh = document.getElementById("alti-ch");
  var altiM = document.getElementById("alti-m");
  var altiBar = document.getElementById("alti-bar");
  var CHAPTERS = [
    [0.00, "Above"], [0.30, "The Peaks"], [0.47, "The Veil"],
    [0.61, "The Break"], [0.77, "The Valley"]
  ];
  var ALT_TOP = 4120, ALT_BOT = 840;
  function renderAlti(p) {
    var name = CHAPTERS[0][1];
    for (var i = 0; i < CHAPTERS.length; i++) if (p >= CHAPTERS[i][0]) name = CHAPTERS[i][1];
    if (altiCh.textContent !== name) altiCh.textContent = name;
    var alt = Math.round((ALT_TOP + (ALT_BOT - ALT_TOP) * p) / 5) * 5;
    altiM.textContent = alt.toLocaleString("en-US") + " M";
    altiBar.style.width = (p * 100).toFixed(1) + "%";
    // fade out with the handoff so it never collides with the header over content
    var altiRamp = Math.max(0, Math.min(1, (p - 0.9) / 0.07));
    altiEl.style.opacity = loaderDone ? (1 - altiRamp).toFixed(3) : "0";
  }

  /* ---------------- adaptive header (top-strip luminance) ---------------- */
  var hdr = document.getElementById("hdr");
  var lumaC = document.createElement("canvas");
  lumaC.width = 16; lumaC.height = 4;
  var lumaX = lumaC.getContext("2d", { willReadFrequently: true });
  var lastLuma = 0;
  function sampleLuma() {
    var src = images[displayed];
    if (!src) return;
    try {
      lumaX.drawImage(src, 0, 0, src.width, src.height * 0.16, 0, 0, 16, 4);
      var d = lumaX.getImageData(0, 0, 16, 4).data, sum = 0;
      for (var i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      var luma = sum / (d.length / 4);
      var contentTop = film.getBoundingClientRect().bottom <= innerHeight * 0.5;
      // content below the film is forest-green (dark) — header stays light there
      var onLight = !contentTop && luma > 138;
      hdr.classList.toggle("on-light", onLight);
      stage.classList.toggle("on-light", luma > 138);
      lastLuma = luma;
    } catch (e) {}
  }
  setInterval(sampleLuma, 180);

  /* ---------------- grain (pre-baked tiles, small backing store, CSS-stretched) -- */
  var grainC = document.getElementById("grain");
  var grainX = grainC.getContext("2d");
  grainC.width = 320; grainC.height = 192;
  grainC.style.width = "100%"; grainC.style.height = "100%";
  var grainTiles = [], GT = 5;
  (function () {
    for (var t = 0; t < GT; t++) {
      var c = document.createElement("canvas");
      c.width = 320; c.height = 192;
      var x = c.getContext("2d");
      var id = x.createImageData(320, 192), d = id.data;
      for (var i = 0; i < d.length; i += 4) {
        var v = 118 + Math.random() * 20 | 0;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 26;
      }
      x.putImageData(id, 0, 0);
      grainTiles.push(c);
    }
  })();
  var grainIdx = 0;
  function drawGrain() {
    grainX.clearRect(0, 0, 320, 192);
    grainX.drawImage(grainTiles[grainIdx], 0, 0);
  }
  drawGrain();
  if (!reduceMotion) setInterval(function () {
    if (grainC.style.opacity === "0") return;
    grainIdx = (grainIdx + 1) % GT;
    drawGrain();
  }, 140);

  /* ---------------- ambient dawn motes (first 7% of scroll) ---------------- */
  var amb = document.getElementById("ambient");
  var ambX = amb.getContext("2d");
  sizeCanvas(amb);
  var sprite = document.createElement("canvas");
  sprite.width = sprite.height = 32;
  (function () {
    var sx = sprite.getContext("2d");
    var g = sx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,244,220,0.9)");
    g.addColorStop(0.4, "rgba(255,240,210,0.35)");
    g.addColorStop(1, "rgba(255,240,210,0)");
    sx.fillStyle = g; sx.fillRect(0, 0, 32, 32);
  })();
  var motes = [];
  for (var mi = 0; mi < 64; mi++) {
    motes.push({
      x: Math.random(), y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      ph: Math.random() * Math.PI * 2,
      sp: 0.006 + Math.random() * 0.014
    });
  }
  var ambAlive = !reduceMotion;
  function renderAmbient(p, t) {
    if (!ambAlive) return;
    var fade = Math.max(0, 1 - p / 0.07);
    if (fade <= 0 || !loaderDone) { ambX.clearRect(0, 0, amb.width, amb.height); if (p > 0.1) ambAlive = false; return; }
    ambX.clearRect(0, 0, amb.width, amb.height);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.x += m.sp * m.z * 0.016; m.y += m.sp * 0.45 * m.z * 0.016;
      if (m.x > 1.05) m.x = -0.05;
      if (m.y > 1.05) m.y = -0.05;
      var tw = 0.55 + 0.45 * Math.sin(t * 0.0011 + m.ph);
      var s = 5 + m.z * 13;
      ambX.globalAlpha = fade * tw * 0.5 * m.z;
      ambX.drawImage(sprite, m.x * amb.width, m.y * amb.height, s * DPR, s * DPR);
    }
    ambX.globalAlpha = 1;
  }

  /* ---------------- handoff ramp ---------------- */
  var bottomfade = document.getElementById("bottomfade");
  var vignette = document.getElementById("vignette");
  var scrollcue = document.getElementById("scrollcue");
  var hdrEl = document.getElementById("hdr");
  function renderRamp(p) {
    var ramp = Math.max(0, Math.min(1, (p - 0.86) / 0.14));
    ramp = ramp * ramp * (3 - 2 * ramp); // smoothstep — eases both ends of the handoff
    bottomfade.style.opacity = ramp.toFixed(3);
    vignette.style.opacity = (1 - ramp).toFixed(3);
    grainC.style.opacity = ((1 - ramp) * 0.5).toFixed(3);
    var cue = loaderDone ? Math.max(0, 1 - p / 0.04) : 0;
    scrollcue.style.opacity = cue.toFixed(3);
    // chrome-less first view: header arrives as the hero lockup hands off
    var hv = Math.max(0, Math.min(1, (p - 0.055) / 0.05));
    hdrEl.style.opacity = hv.toFixed(3);
    hdrEl.style.pointerEvents = hv < 0.5 ? "none" : "auto";
    // landing lockup bows out before it reaches the fixed header (no doubled wordmark)
    if (landLock) {
      var lr = landLock.getBoundingClientRect();
      landLock.style.opacity = Math.max(0, Math.min(1, (lr.top - 64) / 120)).toFixed(3);
    }
  }
  var landLock = document.querySelector(".land-lock");

  /* ---------------- main tick ---------------- */
  var currentFrame = 0, ticking = true;
  var jankMax = 0, jankSamples = [], lastT = 0;
  window.__jank = { max: 0, p95: 0 };
  function tick(t) {
    if (lastT) {
      var dt = t - lastT;
      if (dt > jankMax) { jankMax = dt; window.__jank.max = Math.round(dt * 10) / 10; }
      jankSamples.push(dt);
      if (jankSamples.length > 240) {
        var s = jankSamples.slice().sort(function (a, b) { return a - b; });
        window.__jank.p95 = Math.round(s[Math.floor(s.length * 0.95)] * 10) / 10;
        jankSamples.length = 0;
      }
    }
    lastT = t;
    var p = computeProgress();
    var target = p * (FRAME_COUNT - 1);
    if (reduceMotion) currentFrame = target;
    else currentFrame += (target - currentFrame) * 0.14;
    if (Math.abs(target - currentFrame) < 0.4) currentFrame = target;
    var idx = Math.round(currentFrame);
    warmDecodes(idx);
    drawFrame(idx);
    renderBeats(p);
    renderAlti(p);
    renderRamp(p);
    renderAmbient(p, t);
    if (ticking) requestAnimationFrame(tick);
  }

  /* ---------------- resize ---------------- */
  addEventListener("resize", function () {
    sizeCanvas(canvas); sizeCanvas(amb);
    drawFrame(displayed, true);
  });

  /* ---------------- content wiring ---------------- */
  var savedRef = null;
  try { savedRef = localStorage.getItem("station_ref"); } catch (e) {}
  Array.prototype.forEach.call(document.querySelectorAll(".js-book"), function (el) {
    var url = BOOKING_URL + (savedRef ? "?ref=" + encodeURIComponent(savedRef) : "");
    if (el.tagName === "A") { el.href = url; }
    else el.addEventListener("click", function () { window.open(url, "_blank", "noopener"); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-goto]"), function (el) {
    el.addEventListener("click", function () {
      var target = document.querySelector(el.getAttribute("data-goto"));
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* reveals */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) { el.classList.add("in"); });
  }

  /* audit form */
  var form = document.getElementById("audit-form");
  /* render timestamp: bots that submit within ~2s of load get flagged server-side */
  var formT0 = Date.now();
  if (form) {
    var tField = form.querySelector('input[name="_t"]');
    if (tField) tField.value = String(formT0);
  }

  /* ---------------- consent-proof helpers ----------------
     Fallback disclosure version, used only if the markup names none. The form owns the verbatim
     consent text, so the version id has to come from the markup that renders it — a version id
     that disagrees with the paragraph it labels is worse evidence than no version at all. */
  var CONSENT_VERSION = "sms-consent-v1.0.0";
  /* Scoped to the block that actually wraps the SMS checkbox. There is a second
     data-disclosure-version on the email block, so a bare document.querySelector would silently
     depend on DOM order and could start labelling SMS consent with the email version. */
  function disclosureVersion() {
    try {
      var box = document.querySelector('input[name="sms_consent"]');
      var block = box && box.closest ? box.closest("[data-disclosure-version]") : null;
      var v = block && block.getAttribute("data-disclosure-version");
      if (v) return v;
    } catch (e) {}
    return CONSENT_VERSION;
  }

  /* A disabled consent box means the disclosure itself is not live yet (§6.3 — unresolved
     {{LEGAL_ENTITY}} et al). .checked can still be set programmatically on a disabled input, so
     reading it alone would let an extension, a replayed DOM or a half-finished go-live edit
     manufacture "consent" against a placeholder disclosure. Disabled therefore always means no. */
  function smsConsentGranted(box) {
    if (!box || box.disabled) return false;
    return !!box.checked;
  }

  /* The verbatim disclosure, read out of the rendered DOM (§2.1). It is deliberately NOT a
     constant in this file: a hardcoded copy would silently drift from the paragraph on screen,
     and the whole point of the snapshot is that it is what the lead actually saw. Whitespace is
     collapsed because the markup wraps the sentence across many lines, and 4000 is the narrowest
     downstream cap (§7.4) — clipping further up the chain would destroy the evidence. */
  function disclosureText(id) {
    try {
      var el = document.getElementById(id);
      if (!el) return "";
      return String(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    } catch (e) { return ""; }
  }

  /* attribution.js is optional: the page must keep working if the script tag is missing or the
     file 404s, so every read is feature-detected rather than assumed. */
  function attr() {
    return (typeof window !== "undefined" && window.__stationAttr) ? window.__stationAttr : null;
  }

  /* Read (and if necessary mint) the SAME session id analytics.js uses. film.js's submit
     handler runs first, so if we only read it we'd send "" while analytics.js generated its own
     — and the CRM row would never join the analytics session. Algorithm copied verbatim from
     analytics.js sid(); it reads whatever we write here. */
  function readSid() {
    try {
      var s = sessionStorage.getItem("rangeSid");
      if (!s) {
        s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        sessionStorage.setItem("rangeSid", s);
      }
      return s;
    } catch (e) { return "anon"; }
  }

  function cookieConsent() {
    try { return localStorage.getItem("rangeConsent") || "unset"; } catch (e) { return "unset"; }
  }

  /* Writes a value into the form's hidden input when the input exists AND is still empty, and
     mirrors it onto the FormData either way. Two reasons for both halves: the DOM write is what
     analytics.js's own submit handler picks up when it builds its FormData a moment later, and
     the FormData write means a hidden input the form agent hasn't added yet still reaches the
     GHL intake webhook instead of vanishing. */
  function put(fd, name, value) {
    if (value === null || value === undefined) return;
    value = String(value);
    if (!value) return;
    try {
      var el = form.querySelector('[name="' + name + '"]');
      if (el && !String(el.value || "").trim()) el.value = value;
      if (el && String(el.value || "").trim()) value = el.value;
    } catch (e) {}
    try { fd.set(name, value); } catch (e) {}
  }
  if (form) form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    /* honeypot: humans never fill the hidden company_url field — any value = bot, drop silently */
    var hp = form.querySelector('input[name="company_url"]');
    if (hp && hp.value.trim() !== "") { form.classList.add("form-done"); return; }
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (f) {
      if (!f.value.trim()) { ok = false; f.style.borderColor = "#D2402E"; }
      else f.style.borderColor = "";
    });
    if (!ok) return;
    var fd = new FormData(form);
    fd.set("ref", savedRef || "");
    fd.set("source", "the-range");
    // An unchecked checkbox is simply absent from FormData, which downstream
    // reads as "unknown". Consent has to be recorded as an explicit yes/no with
    // a timestamp — that record IS the proof if a carrier or the FCC ever asks.
    var smsBox = form.querySelector('input[name="sms_consent"]');
    var smsGranted = smsConsentGranted(smsBox);
    /* wire value stays "yes"/"no" — the intake node and the relay already read those strings.
       The checkbox's own value attribute is NOT what ships. */
    fd.set("sms_consent", smsGranted ? "yes" : "no");
    if (smsGranted) fd.set("sms_consent_at", new Date().toISOString());
    /* Same absent-checkbox trap as sms_consent: the optional marketing-email box vanishes from
       FormData when unchecked, and "absent" downstream is indistinguishable from "never asked".
       A declined marketing opt-in has to be recorded as an explicit no. */
    var emailBox = form.querySelector('input[name="email_consent"]');
    if (emailBox) fd.set("email_consent", (!emailBox.disabled && emailBox.checked) ? "yes" : "no");
    if (!fd.get("_t")) fd.set("_t", String(formT0));

    /* ---- consent proof + attribution ----
       "Checkbox was true" proves nothing in a carrier audit. What proves it is the evidence
       around the click: when, from what URL, in what browser, against which disclosure version,
       and the ordered trail showing the box was toggled by hand rather than pre-filled. */
    put(fd, "consent_ts", new Date().toISOString());
    put(fd, "consent_url", location.href);
    put(fd, "consent_version", disclosureVersion());
    /* The verbatim text beats the version id as evidence, so both ship: the id groups leads,
       the snapshot is what a carrier or the FCC actually reads. */
    put(fd, "consent_text_sms", disclosureText("sms-consent-text"));
    put(fd, "consent_text_email", disclosureText("email-consent-text"));
    try { put(fd, "consent_ua", navigator.userAgent); } catch (e3) {}
    /* one clock only: the render timestamp is already formT0, the same value _t carries */
    put(fd, "form_rendered_at", new Date(formT0).toISOString());
    put(fd, "cookie_consent", cookieConsent());
    put(fd, "sid", readSid());

    var A = attr();
    if (A) {
      try { put(fd, "interaction_trail", JSON.stringify(A.trail())); } catch (e3) {}
      try { put(fd, "ft_attr", JSON.stringify(A.first())); } catch (e3) {}
      try { put(fd, "lt_attr", JSON.stringify(A.last())); } catch (e3) {}
      /* The FLAT ft_/lt_ columns, IN ADDITION to the blobs above (§7.1). The intake node reads
         individual columns (b.ft_utm_source, …) and cannot index into a JSON string, so posting
         only the blobs left most of the provisioned GHL fields empty on every paid lead. The
         blobs stay because the dashboard's touch comparison falls back to them. Only ft_/lt_
         spellings are emitted — one vocabulary, per §7.1. */
      try {
        var flat = A.flat();
        for (var fk in flat) {
          if (!Object.prototype.hasOwnProperty.call(flat, fk)) continue;
          if (fk.indexOf("ft_") !== 0 && fk.indexOf("lt_") !== 0) continue;
          var fv = flat[fk];
          if (fv === null || fv === undefined || fv === "") continue;
          if (typeof fv === "object" || typeof fv === "function") continue;
          put(fd, fk, String(fv).slice(0, 300));
        }
        /* These four are top-level plain by contract (§7.6 names them by these exact
           spellings, and the CAPI relay reads shallow keys) — they are identity and
           environment, not ft_/lt_ attribution columns. Last touch wins: it is the click
           that actually brought this visit. */
        put(fd, "fbclid", flat.lt_fbclid || flat.ft_fbclid || "");
        put(fd, "landing_path", flat.lt_landing_path || flat.ft_landing_path || location.pathname || "/");
        put(fd, "referrer", flat.lt_referrer || flat.ft_referrer || "");
        put(fd, "device", flat.lt_device || flat.ft_device || "");
      } catch (e3) {}
      try { put(fd, "fbp", A.fbp()); } catch (e3) {}
      try { put(fd, "fbc", A.fbc()); } catch (e3) {}
      /* Shared with the Pixel's Lead event for CAPI dedup — deliberately NOT minted locally
         when attribution.js is absent: a key only one side of the pair knows is no better than
         no key, and a wrong one would look like it was deduping when it wasn't. */
      try { put(fd, "event_id", A.eventId()); } catch (e3) {}
      try { put(fd, "time_to_lead_s", A.timeToLeadS()); } catch (e3) {}
    }
    try { fetch(AUDIT_URL, { method: "POST", mode: "no-cors", body: fd }); } catch (err) {}
    try {
      if (navigator.sendBeacon && savedRef) {
        navigator.sendBeacon(AFF_URL, new Blob([JSON.stringify({
          action: "attribute", pub: AFF_PUB, code: savedRef, kind: "audit-submit", label: "the-range"
        })], { type: "application/json" }));
      }
    } catch (err) {}
    try { localStorage.setItem("station_audit_done", "1"); } catch (e2) {}
    form.classList.add("form-done");
  });

  /* ---------------- boot + dev contract ---------------- */
  pump();
  requestAnimationFrame(tick);
  warmDecodes(0);

  function settleAndReady() {
    if (JUMP !== null) {
      scrollTo(0, +JUMP || 0);
      var p = computeProgress();
      currentFrame = p * (FRAME_COUNT - 1);
      warmDecodes(Math.round(currentFrame));
      drawFrame(Math.round(currentFrame), true);
      renderBeats(p); renderAlti(p); renderRamp(p);
      sampleLuma();
      loader.classList.add("done"); loaderDone = true;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { window.__ready = true; });
    });
  }
  var readyPoll = setInterval(function () {
    if (allLoaded) { clearInterval(readyPoll); settleAndReady(); }
  }, 120);
})();
