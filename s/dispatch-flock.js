/* Dispatch hero: the mail flies out of the bag like a flock.
   - Envelopes leave the carrier's satchel and flutter like wings (beat, then glide),
     ride the painted stream toward the valley as one loose, breathing flock, then peel off
     one by one and dive to a house in the village. A small warm glint marks each delivery.
   - Sizes follow the painting's perspective: big near the bag, small over the far village,
     a little bigger again when one dives to a near house.
   - The pointer is a hawk: envelopes swerve around it and spring back into the flock.
     Hovering "Start Dispatch free" makes the carrier toss a fresh handful.
   - All positions are fractions of the painting, mapped through object-fit:cover exactly as
     hero.js maps its glows, so the bag stays the bag at every screen size.
   The painting has no envelopes in the sky (only the bundle in her hands): all the mail you see is live.
   Reduced motion: nothing moves; the carrier stands with her bundle under an empty sky. */
(function () {
  var hero = document.querySelector(".phero");
  var img = hero && hero.querySelector(".art img");
  if (!img || !window.requestAnimationFrame) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // the stream, in painting fractions: out of the bag, up over the hedge, across the sky, down to the valley
  var PATH = [[.236, .676], [.262, .628], [.300, .565], [.352, .505], [.420, .470], [.500, .487], [.580, .515], [.660, .548], [.735, .590], [.800, .632]];
  // houses that receive mail: [x, y] in painting fractions (windows / doors)
  var HOUSES = [[.792, .703], [.846, .690], [.905, .699], [.962, .686], [.703, .712], [.640, .762], [.865, .772], [.745, .862], [.585, .875]];

  var parent = hero.querySelector(".hero-fx") || hero;
  var cv = document.createElement("canvas");
  cv.className = "flock"; cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1";
  parent.appendChild(cv);
  var ctx = cv.getContext("2d");

  // Catmull-Rom through PATH, resampled evenly by length so speed reads constant
  var LUT = (function () {
    var raw = [], i, j;
    for (i = 0; i < PATH.length - 1; i++) {
      var p0 = PATH[Math.max(0, i - 1)], p1 = PATH[i], p2 = PATH[i + 1], p3 = PATH[Math.min(PATH.length - 1, i + 2)];
      for (j = 0; j < 40; j++) {
        var t = j / 40, t2 = t * t, t3 = t2 * t;
        raw.push([
          .5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    raw.push(PATH[PATH.length - 1]);
    var acc = [0];
    for (i = 1; i < raw.length; i++) acc.push(acc[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], (raw[i][1] - raw[i - 1][1]) * .566));
    var out = [], k = 0, N = 240, L = acc[acc.length - 1];
    for (i = 0; i <= N; i++) {
      var d = L * i / N;
      while (k < acc.length - 2 && acc[k + 1] < d) k++;
      var f = (d - acc[k]) / ((acc[k + 1] - acc[k]) || 1);
      out.push([raw[k][0] + (raw[k + 1][0] - raw[k][0]) * f, raw[k][1] + (raw[k + 1][1] - raw[k][1]) * f]);
    }
    return out;
  })();
  function along(s) {
    var f = Math.max(0, Math.min(1, s)) * (LUT.length - 1), i = Math.min(LUT.length - 2, Math.floor(f)), r = f - i;
    var a = LUT[i], b = LUT[i + 1];
    return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r, Math.atan2((b[1] - a[1]) * .566, b[0] - a[0])];
  }

  // painting -> hero pixels (object-fit:cover with the computed object-position)
  var W = 0, H = 0, dpr = 1, dw = 1, dh = 1, ox = 0, oy = 0, copyR = null, small = false;
  function layout() {
    W = hero.clientWidth; H = hero.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var nw = img.naturalWidth || 3840, nh = img.naturalHeight || 2172;
    var s = Math.max(W / nw, H / nh); dw = nw * s; dh = nh * s;
    var pos = getComputedStyle(img).objectPosition.split(" ");
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || "50") / 100;
    if (isNaN(px)) px = .5; if (isNaN(py)) py = .5;
    ox = (W - dw) * px; oy = (H - dh) * py;
    small = W < 700;
    // the words: envelopes passing behind the headline and copy go quieter so the text stays easy to read
    var copy = hero.querySelector(".copy"), hr = hero.getBoundingClientRect();
    if (copy) {
      var h1 = copy.querySelector("h1"), last = copy.querySelector(".lines") || copy;
      var a = (h1 || copy).getBoundingClientRect(), b = last.getBoundingClientRect();
      copyR = { l: Math.min(a.left, b.left) - hr.left, r: Math.max(a.right, b.right) - hr.left, t: a.top - hr.top, b: b.bottom - hr.top };
    }
  }
  function X(fx) { return ox + fx * dw; }
  function Y(fy) { return oy + fy * dh; }
  function depth(fy) { return fy < .66 ? .0062 : .0062 + (fy - .66) * .055; } // envelope width at a house, painting fractions

  var flock = [], glints = [], mouse = { x: -9999, y: -9999 }, clock = 0, nextPuff = 0, lastToss = -9;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function spawn(delay) {
    if (flock.length >= (small ? 45 : 110)) return;
    var tgt = HOUSES[(Math.random() * HOUSES.length) | 0];
    flock.push({
      s: -delay * .16, v: rnd(.12, .17), off: rnd(-1, 1), offB: rnd(0, 6.28), ph: rnd(0, 6.28), flapF: rnd(9, 13),
      roll: rnd(-.6, .6), rollV: rnd(-1.4, 1.4), size: rnd(.78, 1.22), peel: tgt[1] > .74 ? rnd(.62, .8) : rnd(.82, 1),
      tgt: tgt, stage: 0, dt: 0, from: null, px: 0, py: 0, vx: 0, vy: 0
    });
  }
  function toss(n, over) { for (var i = 0; i < n; i++) spawn(over * i / n + rnd(0, .15)); }

  function envelope(x, y, w, ang, roll, flap, alpha) {
    // flap (-1..1) is the wing beat: the sheet tips toward and away from us, so it reads as
    // paper fluttering, and when it tips past edge-on you see the plain back of the envelope
    var h = w * .64, sx = Math.cos(roll), sy = Math.cos(flap * 2), back = sy < 0;
    if (Math.abs(sx) < .14) sx = sx < 0 ? -.14 : .14;
    sy = Math.max(.16, Math.abs(sy));
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sx, sy);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = back ? "#E4E3DE" : "#F8F6F1";
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill();
    ctx.lineWidth = Math.max(.7, w * .03) / sy; ctx.strokeStyle = "rgba(48,62,88,.34)"; ctx.stroke();
    if (!back) { // the face: flap V over the two lower folds, like the painted ones
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, h * .1); ctx.lineTo(w / 2, -h / 2);
      ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w * .1, h * .02); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w * .1, h * .02);
      ctx.strokeStyle = "rgba(48,62,88,.24)"; ctx.stroke();
    }
    ctx.restore();
  }

  function step(dt) {
    clock += dt;
    if (clock > nextPuff) { toss(small ? 3 : rnd(5, 8), .8); nextPuff = clock + rnd(.75, 1.15); }
    var wave = .016 * Math.sin(clock * .55); // the whole flock breathes up and down together
    for (var i = flock.length - 1; i >= 0; i--) {
      var e = flock[i], x, y, ang, w, a = 1, flap;
      var beat = Math.sin(clock * e.flapF + e.ph), glide = .5 + .5 * Math.sin(clock * .9 + e.ph * 1.7);
      e.roll += e.rollV * dt;
      if (e.stage === 0) {
        e.s += e.v * dt * (1.55 - .65 * Math.min(1, Math.max(0, e.s))); // tossed hard, then gliding
        if (e.s < 0) continue;
        var p = along(e.s), spread = .006 + .068 * Math.sin(Math.PI * Math.min(1, e.s * 1.15));
        var nx = -Math.sin(p[2]), ny = Math.cos(p[2]);
        var o = e.off * spread + .01 * Math.sin(clock * .8 + e.offB) * Math.min(1, e.s * 3);
        var fx = p[0] + nx * o * .9, fy = p[1] + ny * o * 1.6 + wave * Math.min(1, e.s * 2.5) + .004 * Math.sin(clock * 1.9 + e.ph);
        x = X(fx); y = Y(fy);
        w = dw * (.03 + (.0068 - .03) * Math.pow(Math.min(1, e.s), 1.35)) * e.size;
        w *= Math.min(1, .35 + e.s * 14); // grows as it clears the bag
        ang = p[2] * .45 + .35 * Math.sin(e.roll * .7);
        flap = beat * (.25 + .75 * glide);
        a = 1 - .12 * e.s;
        if (e.s >= e.peel) { e.stage = 1; e.dt = 0; e.from = [fx, fy, w / dw, ang]; e.dur = rnd(1.5, 2.2); }
      } else {
        e.dt += dt;
        var k = Math.min(1, e.dt / e.dur), q = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var f0 = e.from, t = e.tgt, lift = .05 * Math.sin(Math.PI * k) * (1 - k * .4);
        var gx = f0[0] + (t[0] - f0[0]) * q, gy = f0[1] + (t[1] - f0[1]) * q - lift;
        x = X(gx); y = Y(gy);
        w = dw * (f0[2] + (depth(t[1]) * e.size * .75 - f0[2]) * q);
        ang = f0[3] * (1 - q) + Math.atan2(t[1] - f0[1], (t[0] - f0[0]) || .001) * .25 * q;
        flap = beat * (1 - q) * .8; // wings tucked for the dive
        a = (.8 - .1 * q) * (k > .78 ? 1 - (k - .78) / .22 : 1);
        if (k >= 1) { glints.push({ x: t[0], y: t[1], life: 0 }); flock.splice(i, 1); continue; }
      }
      // the hawk: swerve away from the pointer, spring back into place
      var dx = x + e.px - mouse.x, dy = y + e.py - mouse.y, d2 = dx * dx + dy * dy, R = 120;
      var ax = -14 * e.px - 5 * e.vx, ay = -14 * e.py - 5 * e.vy;
      if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = Math.pow(1 - d / R, 2) * 2600; ax += dx / d * f; ay += dy / d * f; }
      e.vx += ax * dt; e.vy += ay * dt; e.px += e.vx * dt; e.py += e.vy * dt;
      x += e.px; y += e.py;
      if (copyR && x > copyR.l && x < copyR.r && y > copyR.t && y < copyR.b) a *= .86;
      e.draw = [x, y, w, ang, e.roll, flap, a];
    }
    for (var g = glints.length - 1; g >= 0; g--) { glints[g].life += dt; if (glints[g].life > 1.8) glints.splice(g, 1); }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "screen";
    glints.forEach(function (gl) {
      var k = gl.life / 1.8, a = k < .15 ? k / .15 : 1 - (k - .15) / .85, r = dw * (.007 + .012 * k);
      var gr = ctx.createRadialGradient(X(gl.x), Y(gl.y), 0, X(gl.x), Y(gl.y), r);
      gr.addColorStop(0, "rgba(255,226,190," + (.75 * a).toFixed(3) + ")");
      gr.addColorStop(.35, "rgba(255,214,170," + (.28 * a).toFixed(3) + ")");
      gr.addColorStop(1, "rgba(255,214,170,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X(gl.x), Y(gl.y), r, 0, 6.2832); ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
    // far ones first, so near envelopes pass in front
    flock.filter(function (e) { return e.draw && e.s >= 0; }).sort(function (a, b) { return a.draw[2] - b.draw[2]; })
      .forEach(function (e) { envelope.apply(null, e.draw); });
  }

  var visible = true, last = 0, running = false;
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    step(dt); draw();
    requestAnimationFrame(frame);
  }
  function go() { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } }

  hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
  var cta = hero.querySelector(".btn.fill");
  if (cta) cta.addEventListener("pointerenter", function () { if (clock - lastToss > 2.5) { lastToss = clock; toss(small ? 6 : 12, .7); } });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) go(); }).observe(hero);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) go(); });
  window.addEventListener("resize", layout);
  function start() { layout(); toss(small ? 18 : 40, 1.8); nextPuff = 1.6; go(); }
  if (img.complete && img.naturalWidth) start(); else img.addEventListener("load", start);
})();
