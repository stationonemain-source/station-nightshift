/* GABLE — the film engine. Canvas scrub over pre-extracted frames with an
 * ImageBitmap sliding window; every draw is a GPU blit, never a sync JPEG decode.
 * Dev contract: ?jump=<y> lands pre-scrolled + settled, window.__ready gates shots. */
(function () {
  'use strict';
  const F = window.GABLE_FRAMES;
  const C = window.GABLE_CONTENT;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const JUMP = new URLSearchParams(location.search).get('jump');

  const driver = document.querySelector('.film-driver');
  const canvas = document.getElementById('filmCanvas');
  const ambient = document.getElementById('ambientCanvas');
  const stage = document.querySelector('.film-stage');
  const seamEl = document.querySelector('.film-seamfade');
  const loader = document.getElementById('filmLoader');
  const head = document.getElementById('siteHead');
  const gDepth = document.getElementById('gDepth');
  const gFill = document.getElementById('gFill');
  const gCh = document.getElementById('gCh');
  const beats = Array.from(document.querySelectorAll('.beat'));
  const beatDefs = beats.map((el) => {
    const d = C.beats.find((b) => b.id === el.dataset.id);
    return { el, in: d.in, peak: d.peak, out: d.out };
  });

  if (JUMP !== null) {
    history.scrollRestoration = 'manual';
    document.documentElement.classList.add('no-smooth');
  }

  /* ---------- static mode: reduced motion or frames not extracted yet ---------- */
  if (reduced || !F.count) {
    document.body.classList.add('film-static');
    stage.querySelector('.film-poster').style.backgroundImage = "url('" + document.body.dataset.poster + "')";
    if (loader) loader.classList.add('done');
    if (JUMP !== null) {
      /* __ready only after the jump has landed, fonts are in, and reveals/header settled. */
      requestAnimationFrame(() => {
        window.scrollTo(0, +JUMP || 0);
        if (window.__settleReveals) window.__settleReveals();
        const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        fonts.then(() => requestAnimationFrame(() => {
          window.scrollTo(0, +JUMP || 0);
          if (window.__settleReveals) window.__settleReveals();
          window.__ready = true;
        }));
      });
    } else {
      window.__ready = true;
    }
    return;
  }

  /* ---------- frame store + priority-queue pump ---------- */
  const COUNT = F.count;
  const images = new Array(COUNT).fill(null);
  const src = (i) => F.base + 'f_' + String(i + 1).padStart(F.pad, '0') + F.ext;
  let loaded = 0;
  let inflight = 0;
  const INFLIGHT = 10;
  const queue = Array.from({ length: COUNT }, (_, i) => i);
  function prioritize(center) {
    queue.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  }
  function pump() {
    while (queue.length && inflight < INFLIGHT) {
      const i = queue.shift();
      if (images[i]) continue;
      inflight++;
      const im = new Image();
      im.decoding = 'async';
      im.onload = im.onerror = () => {
        inflight--;
        if (im.naturalWidth) { images[i] = im; loaded++; onLoadTick(); }
        pump();
      };
      im.src = src(i);
    }
  }

  /* ---------- ImageBitmap sliding window (the anti-jank core) ---------- */
  const bitmaps = new Map(), decoding = new Set();
  const B_AHEAD = 18, B_KEEP = 28;
  let bmpCenter = -999;
  function ensureBitmaps(center) {
    if (Math.abs(center - bmpCenter) < 3 && bitmaps.has(center)) return;
    bmpCenter = center;
    const lo = Math.max(0, center - B_AHEAD), hi = Math.min(COUNT - 1, center + B_AHEAD);
    let budget = 5; // stagger decode kickoffs — a wide burst is a visible hitch on weak GPUs
    for (let i = lo; i <= hi; i++) {
      if (bitmaps.has(i) || decoding.has(i) || !images[i]) continue;
      if (--budget < 0) { bmpCenter = -999; break; }
      decoding.add(i);
      createImageBitmap(images[i]).then((b) => {
        decoding.delete(i);
        if (Math.abs(i - bmpCenter) > B_KEEP) { b.close(); return; }
        bitmaps.set(i, b);
        if (i === displayed) draw(i, true);
      }).catch(() => decoding.delete(i));
    }
    for (const k of Array.from(bitmaps.keys()))
      if (k < center - B_KEEP || k > center + B_KEEP) { bitmaps.get(k).close(); bitmaps.delete(k); }
  }

  /* ---------- canvas ---------- */
  const ctx = canvas.getContext('2d');
  let cw = 0, ch = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cw = stage.clientWidth; ch = stage.clientHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    if (ambient) { ambient.width = Math.round(cw * dpr); ambient.height = Math.round(ch * dpr); }
    draw(displayed, true);
  }
  function nearestFrame(i) {
    if (images[i]) return i;
    for (let d = 1; d < COUNT; d++) {
      if (images[i - d]) return i - d;
      if (images[i + d]) return i + d;
    }
    return -1;
  }
  let displayed = 0, displayedExact = false, drawnOnce = false;
  function draw(i, force) {
    if (!force && i === displayed && displayedExact && drawnOnce) return;
    const idx = nearestFrame(i);
    if (idx < 0) return;
    const source = bitmaps.get(idx) || images[idx];
    const iw = source.width, ih = source.height;
    const s = Math.max((cw * dpr) / iw, (ch * dpr) / ih);
    const dw = iw * s, dh = ih * s;
    ctx.drawImage(source, (cw * dpr - dw) / 2, (ch * dpr - dh) / 2, dw, dh);
    displayed = i; displayedExact = idx === i; drawnOnce = true;
  }

  /* ---------- progress + lerped playhead ---------- */
  let p = 0, currentFrame = 0, lastP = 0, driverBottom = 1e9;
  function progress() {
    const r = driver.getBoundingClientRect();
    driverBottom = r.bottom;
    return Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
  }

  /* ---------- beats ---------- */
  function beatAlpha(b, pp) {
    if (pp < b.in || pp > b.out) return 0;
    if (pp < b.peak) return (pp - b.in) / Math.max(1e-4, b.peak - b.in);
    if (b.out > 1.5) return 1;
    return 1 - (pp - b.peak) / Math.max(1e-4, b.out - b.peak);
  }
  function updateBeats(pp, dir) {
    for (const b of beatDefs) {
      const a = beatAlpha(b, pp);
      b.el.style.opacity = a.toFixed(3);
      b.el.style.transform = 'translateY(' + ((1 - a) * 26 * dir).toFixed(1) + 'px)';
      b.el.classList.toggle('live', a > 0.55);
    }
  }

  /* ---------- altitude gauge ---------- */
  function elevAt(pp) {
    const E = C.elevation;
    for (let i = 1; i < E.length; i++) {
      if (pp <= E[i][0]) {
        const [x0, y0] = E[i - 1], [x1, y1] = E[i];
        return y0 + (y1 - y0) * ((pp - x0) / (x1 - x0));
      }
    }
    return E[E.length - 1][1];
  }
  function updateGauge(pp) {
    if (!gDepth) return;
    gDepth.textContent = pp > 0.86 ? 'AERIAL' : Math.round(elevAt(pp)) + ' ft';
    let start = 0;
    for (const chp of C.chapters) {
      if (pp <= chp.until) {
        gCh.textContent = chp.label;
        gFill.style.width = (((pp - start) / (chp.until - start)) * 100).toFixed(1) + '%';
        break;
      }
      start = chp.until;
    }
  }

  /* ---------- adaptive header (top-strip luminance, film zone only) ---------- */
  const lumCv = document.createElement('canvas');
  lumCv.width = 16; lumCv.height = 4;
  const lumCx = lumCv.getContext('2d', { willReadFrequently: true });
  let lastLum = 0;
  function sampleHeader(now) {
    if (now - lastLum < 360) return;
    lastLum = now;
    const idx = nearestFrame(displayed);
    if (idx < 0) return;
    const source = bitmaps.get(idx) || images[idx];
    lumCx.drawImage(source, 0, 0, source.width, source.height * 0.14, 0, 0, 16, 4);
    const d = lumCx.getImageData(0, 0, 16, 4).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    head.classList.toggle('on-light', sum / (d.length / 4) > 138);
  }

  /* ---------- ambient golden dust over the opening ---------- */
  let parts = null, sprite = null, ambCx = null;
  function initAmbient() {
    if (!ambient) return;
    ambCx = ambient.getContext('2d');
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext('2d');
    const g = sctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    g.addColorStop(0, 'rgba(229,190,130,.8)');
    g.addColorStop(1, 'rgba(229,190,130,0)');
    sctx.fillStyle = g; sctx.fillRect(0, 0, 32, 32);
    parts = Array.from({ length: 34 }, (_, i) => ({
      x: Math.sin(i * 127.3) * 0.5 + 0.5, y: Math.sin(i * 91.7) * 0.5 + 0.5,
      z: Math.sin(i * 53.1) * 0.5 + 0.5, ph: i * 1.7
    }));
  }
  function drawAmbient(pp, t) {
    if (!ambCx) return;
    const a = Math.max(0, 1 - pp / 0.07);
    ambCx.clearRect(0, 0, ambient.width, ambient.height);
    if (a === 0) return;
    for (const q of parts) {
      const sz = (5 + q.z * 14) * dpr;
      const driftX = ((t * 0.000012 * (0.3 + q.z)) + q.x) % 1.1;
      const driftY = (q.y + Math.sin(t * 0.0004 + q.ph) * 0.02) % 1.05;
      ambCx.globalAlpha = a * (0.12 + q.z * 0.3) * (0.6 + 0.4 * Math.sin(t * 0.0011 + q.ph));
      ambCx.drawImage(sprite, driftX * ambient.width - sz / 2, driftY * ambient.height - sz / 2, sz, sz);
    }
    ambCx.globalAlpha = 1;
  }

  /* ---------- main tick ---------- */
  let rafLast = performance.now();
  window.__jankMax = 0; window.__jankOver50 = 0;
  function tick(t) {
    const dt = t - rafLast; rafLast = t;
    if (dt > window.__jankMax) window.__jankMax = dt;
    if (dt > 50) window.__jankOver50++;

    p = progress();
    const dir = p >= lastP ? 1 : -1; lastP = p;
    const target = p * (COUNT - 1);
    currentFrame += (target - currentFrame) * 0.14;
    if (Math.abs(target - currentFrame) < 0.4) currentFrame = target;
    const fi = Math.round(currentFrame);
    ensureBitmaps(fi);
    draw(fi);
    updateBeats(p, dir);
    updateGauge(p);
    if (driverBottom > 88) sampleHeader(t); // past the film, site.js's DOM probe owns the header
    drawAmbient(p, t);

    const ramp = Math.max(0, Math.min(1, (p - 0.92) / 0.08));
    stage.style.setProperty('--filmfade', (1 - ramp).toFixed(3));
    seamEl.style.opacity = ramp.toFixed(3);

    requestAnimationFrame(tick);
  }

  /* ---------- boot / loader / dev contract ---------- */
  const READY_AT = Math.min(36, COUNT);
  let bootDone = false;
  function onLoadTick() {
    const pct = Math.round((loaded / COUNT) * 100);
    const bar = loader.querySelector('.loader-bar i');
    const pctEl = loader.querySelector('.loader-pct');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = 'Raising the ladder · ' + pct + '%';
    if (!bootDone && loaded >= READY_AT) boot();
    if (loaded === COUNT && !window.__allFrames) window.__allFrames = true;
  }
  function boot() {
    bootDone = true;
    resize();
    if (JUMP !== null) {
      window.scrollTo(0, +JUMP || 0);
      p = progress(); lastP = p;
      currentFrame = p * (COUNT - 1);
      const fi = Math.round(currentFrame);
      prioritize(fi);
      ensureBitmaps(fi);
      draw(fi, true);
      updateBeats(p, 1);
      updateGauge(p);
      stage.style.setProperty('--filmfade', (1 - Math.max(0, Math.min(1, (p - 0.92) / 0.08))).toFixed(3));
      if (window.__settleReveals) window.__settleReveals();
    }
    loader.classList.add('done');
    requestAnimationFrame(tick);
    setTimeout(() => { window.__ready = true; }, JUMP !== null ? 700 : 250);
  }

  addEventListener('resize', resize, { passive: true });
  initAmbient();
  resize();
  pump();
  /* Safety: if the network stalls below READY_AT, boot anyway with what we have. */
  setTimeout(() => { if (!bootDone && loaded > 4) boot(); }, 9000);
})();
