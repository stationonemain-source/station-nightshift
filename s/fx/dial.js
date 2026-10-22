/* Dial hero: the calls come in down the wire.
   - Every few seconds (sometimes two close together, the way calls bunch up) a small bright pulse
     leaves the far town, runs up the line to the far pole and then down the long span to the pole
     beside her truck. It follows the wires' real sag, traced off the painting at full size.
   - Perspective is honest: the far pole is about twice as far away as the near one, so a pulse is
     small and slow out over the valley and grows and quickens as it comes toward you. Its speed is
     constant in the world; only the projection changes.
   - When it reaches her pole, her phone lights: a soft cool screen glow over the top of the phone and
     up onto her face. That is the product: the business line rings where she is, not at a desk.
   - Behind the headline and copy the pulse runs quieter, so the words stay easy to read.
   The painting has no pulse of its own; nothing is doubled. Positions are painting fractions.
   Reduced motion (and any page that borrows the painting behind a form): no pulse, her phone softly lit. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  var hero = kit.hero;

  // the line, far to near, in painting fractions. Two spans: [beyond the far pole -> far pole], [far pole -> near pole].
  // z is relative distance (near pole = 1; the far pole's crossarm is half the near one's width, so z = 2).
  var SPANS = [
    { z0: 3.2, z1: 2, pts: [[.733, .660], [.720, .656], [.710, .651], [.700, .645], [.690, .635], [.680, .625], [.670, .611], [.661, .597], [.655, .589], [.647, .5855]] },
    { z0: 2, z1: 1, pts: [[.647, .5855], [.635, .5854], [.620, .5795], [.605, .5735], [.590, .5675], [.575, .5606], [.560, .5527], [.545, .5444], [.530, .5357], [.515, .5258],
      [.500, .5159], [.485, .5051], [.470, .4938], [.455, .4827], [.440, .4705], [.425, .4583], [.410, .4456], [.395, .4325], [.380, .4192], [.365, .4053], [.350, .3915], [.335, .3775], [.318, .3635]] }
  ];
  var PHONE = [.270, .614], FACE = [.250, .548], ARRIVE = SPANS[1].pts[SPANS[1].pts.length - 1];
  var SPAN_T = 1.25; // seconds per span (equal world length between poles)

  // arc-length tables in painting space (x scaled to the painting's aspect so lengths are true on screen)
  var AR = 2171 / 3840;
  SPANS.forEach(function (sp) {
    var acc = [0], p = sp.pts;
    for (var i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], (p[i][1] - p[i - 1][1]) * AR));
    sp.acc = acc; sp.len = acc[acc.length - 1];
  });
  function at(sp, s) { // s = screen arc fraction 0..1
    var d = Math.max(0, Math.min(1, s)) * sp.len, a = sp.acc, i = 1;
    while (i < a.length - 1 && a[i] < d) i++;
    var f = (d - a[i - 1]) / ((a[i] - a[i - 1]) || 1), p = sp.pts;
    return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f];
  }
  // world fraction u along a span -> screen fraction and depth (perspective-correct)
  function proj(sp, u) {
    var a = (1 - u) / sp.z0, b = u / sp.z1;
    return { s: b / (a + b), z: 1 / (a + b) };
  }

  var ctx = kit.canvas(2), copyR = null;
  function layout() {
    var copy = hero.querySelector(".copy"), hr = hero.getBoundingClientRect();
    copyR = null;
    if (copy) {
      var h1 = copy.querySelector("h1"), last = copy.querySelector("h1 + p") || h1 || copy;
      var a = (h1 || copy).getBoundingClientRect(), b = last.getBoundingClientRect();
      copyR = { l: Math.min(a.left, b.left) - hr.left - 10, r: Math.max(a.right, b.right) - hr.left + 10, t: a.top - hr.top - 10, b: b.bottom - hr.top + 10 };
    }
    if (kit.reduce || kit.quiet) still();
  }
  kit.onLayout(layout);

  function blob(x, y, r, rgb, a, sy) {
    if (a <= .004 || r <= .2) return;
    ctx.save(); ctx.translate(x, y); if (sy) ctx.scale(1, sy);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")");
    g.addColorStop(.35, "rgba(" + rgb + "," + (a * .4).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  function behindCopy(x, y) { return copyR && x > copyR.l && x < copyR.r && y > copyR.t && y < copyR.b; }

  // the phone screen: light spilling over the top edge of the phone and up onto her face
  function phone(k) {
    if (k <= .003) return;
    var dw = kit.dw, px = kit.X(PHONE[0]), py = kit.Y(PHONE[1]);
    ctx.globalCompositeOperation = "lighter";
    blob(px, py - .002 * dw, .016 * dw, "205,225,255", .34 * k, .55);
    blob(px, py - .001 * dw, .006 * dw, "235,244,255", .55 * k, .5);
    blob(kit.X(FACE[0]), kit.Y(FACE[1]), .02 * dw, "200,220,255", .18 * k, .9);
    ctx.globalCompositeOperation = "source-over";
  }
  function still() {
    ctx.clearRect(0, 0, kit.W, kit.H);
    phone(.7);
  }
  if (kit.reduce || kit.quiet) { still(); return; }

  var pulses = [], glow = 0, glowHold = 0, flash = 0, next = 1.2;
  function launch(t) { pulses.push({ t0: t }); }

  kit.loop(function (t, dt) {
    if (t > next) {
      launch(t);
      if (Math.random() < .3) launch(t + .55 + Math.random() * .5); // a second call close behind
      next = t + 3.6 + Math.random() * 2.6;
    }
    ctx.clearRect(0, 0, kit.W, kit.H);
    var dw = kit.dw;
    ctx.globalCompositeOperation = "lighter";
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i], e = (t - p.t0) / SPAN_T;
      if (e < 0) continue;
      if (e >= 2) { // arrived at her pole: her phone lights
        pulses.splice(i, 1); flash = 1; glowHold = 1.7; continue;
      }
      var sp = SPANS[e < 1 ? 0 : 1], pr = proj(sp, e < 1 ? e : e - 1);
      // the wire itself lights up for a short stretch behind the pulse, like current you can see
      var u = e < 1 ? e : e - 1, a = Math.min(1, e / .3), tl = .22;
      var c = at(sp, pr.s), cx = kit.X(c[0]), cy = kit.Y(c[1]), dim = behindCopy(cx, cy) ? .6 : 1;
      var prev = null;
      for (var k = 0; k <= 8; k++) {
        var ub = u - tl * (1 - k / 8);
        if (ub < 0) { prev = null; continue; }
        var q = proj(sp, ub), pt = at(sp, q.s), x = kit.X(pt[0]), y = kit.Y(pt[1]);
        if (prev) {
          ctx.strokeStyle = "rgba(225,238,255," + (.75 * a * dim * k / 8).toFixed(3) + ")";
          ctx.lineWidth = Math.max(1.2, .0024 * dw / q.z); ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y); ctx.stroke();
        }
        prev = [x, y];
      }
      blob(cx, cy, .045 * dw / pr.z, "160,200,255", .38 * a * dim);
      blob(cx, cy, .013 * dw / pr.z, "225,240,255", .85 * a * dim);
      blob(cx, cy, .005 * dw / pr.z, "255,255,255", a * dim);
    }
    // the insulator at her pole sparks as a call lands
    if (flash > 0) {
      var ax = kit.X(ARRIVE[0]), ay = kit.Y(ARRIVE[1]);
      blob(ax, ay, .02 * dw * (1.2 - flash * .4), "200,222,255", .4 * flash * (behindCopy(ax, ay) ? .5 : 1));
      flash = Math.max(0, flash - dt * 2.2);
    }
    ctx.globalCompositeOperation = "source-over";
    // phone: quick on, holds while it rings, slow fade
    if (glowHold > 0) { glowHold -= dt; glow += (1 - glow) * Math.min(1, dt * 9); }
    else glow += (0 - glow) * Math.min(1, dt * 1.3);
    phone(glow * (.92 + .08 * Math.sin(t * 9)));
  });
})();
