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
  var BOOKING_URL = "https://api.leadconnectorhq.com/widget/bookings/station-intro-call";

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

  /* ---------------- ImageBitmap sliding window (anti-jank core) ---------------- */
  var bitmaps = new Map(), decoding = new Set();
  var B_AHEAD = 18, B_KEEP = 28, bmpCenter = -999;
  function ensureBitmaps(center) {
    if (Math.abs(center - bmpCenter) < 3) return;
    bmpCenter = center;
    var lo = Math.max(0, center - B_AHEAD), hi = Math.min(FRAME_COUNT - 1, center + B_AHEAD);
    for (var i = lo; i <= hi; i++) {
      if (bitmaps.has(i) || decoding.has(i) || !images[i]) continue;
      (function (k) {
        decoding.add(k);
        createImageBitmap(images[k]).then(function (b) {
          decoding.delete(k);
          if (Math.abs(k - bmpCenter) > B_KEEP) { b.close(); return; }
          bitmaps.set(k, b);
          if (k === displayed) drawFrame(k, true);
        }).catch(function () { decoding.delete(k); });
      })(i);
    }
    bitmaps.forEach(function (b, k) {
      if (k < center - B_KEEP || k > center + B_KEEP) { b.close(); bitmaps.delete(k); }
    });
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
    var src = bitmaps.get(use) || images[use];
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
    var src = bitmaps.get(displayed) || images[displayed];
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
    ensureBitmaps(idx);
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
  if (form) form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (f) {
      if (!f.value.trim()) { ok = false; f.style.borderColor = "#D2402E"; }
      else f.style.borderColor = "";
    });
    if (!ok) return;
    var fd = new FormData(form);
    fd.set("ref", savedRef || "");
    fd.set("source", "the-range");
    try { fetch(AUDIT_URL, { method: "POST", mode: "no-cors", body: fd }); } catch (err) {}
    try {
      if (navigator.sendBeacon && savedRef) {
        navigator.sendBeacon(AFF_URL, new Blob([JSON.stringify({
          action: "attribute", code: savedRef, kind: "audit-submit", label: "the-range"
        })], { type: "application/json" }));
      }
    } catch (err) {}
    try { localStorage.setItem("station_audit_done", "1"); } catch (e2) {}
    form.classList.add("form-done");
  });

  /* ---------------- boot + dev contract ---------------- */
  pump();
  requestAnimationFrame(tick);
  ensureBitmaps(0);

  function settleAndReady() {
    if (JUMP !== null) {
      scrollTo(0, +JUMP || 0);
      var p = computeProgress();
      currentFrame = p * (FRAME_COUNT - 1);
      ensureBitmaps(Math.round(currentFrame));
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
