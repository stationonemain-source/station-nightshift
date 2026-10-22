/* Lineback hero: the missed call answers itself.
   - The roofer's hands are full (hammer, shingle), so he can't pick up. A moment later a folded
     paper plane leaves his side on its own: that plane is the text Lineback sends back.
   - It flies like a real paper dart thrown off a roof: a little toss up, a nose-down dip as it
     picks up speed, a pull-out and a long flat glide over the meadow (a small lift, gentle banks
     into its turns), then it flares, slows and settles into the hands of the woman at the gate,
     who is already looking up for it. One plane, then a pause, then the next missed call's text.
   - The plane is drawn in 3D: two wings with a slight dihedral and a folded keel, lit by the
     painting's sun (lit tops paper-white, the keel and undersides in cool sky shadow), and sized by
     its distance (smaller out over the field, closer again at the gate).
   - The glide runs under the headline, buttons and price line, so nothing crosses the copy.
   The painting's own paper plane was painted out (clean plate): the only plane is the live one.
   Reduced motion / quiet pages: one plane held mid-glide over the meadow, as the painting had it. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  var ctx = kit.canvas(2);
  var ASP = 2171 / 3840, HZ = .60;        // painting aspect; horizon (distant hills)
  // world axes: x right, d away from us, z up. The sun is high, to the right, on our side
  var SUN = norm([.35, -.45, .82]);
  // we see the plane a little from above, the way the painter drew the original one
  var CE = Math.cos(.36), SE = Math.sin(.36);
  // the flight, painting fractions [x, y, plane length as a fraction of painting width]
  var KEYS = [[.838, .274, .028], [.810, .258, .034], [.786, .270, .033], [.768, .330, .032], [.748, .410, .031],
    [.718, .490, .030], [.686, .563, .029], [.652, .630, .027], [.590, .662, .026], [.505, .669, .025], [.420, .661, .025],
    [.338, .672, .025], [.268, .698, .026], [.215, .734, .027], [.186, .763, .027], [.174, .776, .026]];
  var HANDS = [.168, .786], GAP = 1.9, FLIGHT = 5.4; // seconds in the air

  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // dense Catmull-Rom through KEYS, with each point placed in the world (depth = 1 / size)
  var P = (function () {
    var out = [], i, j, k;
    for (i = 0; i < KEYS.length - 1; i++) {
      var p0 = KEYS[Math.max(0, i - 1)], p1 = KEYS[i], p2 = KEYS[i + 1], p3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
      for (j = 0; j < 24; j++) {
        var t = j / 24, t2 = t * t, t3 = t2 * t, q = [];
        for (k = 0; k < 3; k++) q.push(.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
        out.push(q);
      }
    }
    out.push(KEYS[KEYS.length - 1].slice());
    var d = 0;
    out.forEach(function (q, n) {
      var D = 1 / q[2]; q.w = [(q[0] - .5) * D, D, -(q[1] - HZ) * ASP * D];
      if (n) { var a = out[n - 1].w; d += Math.hypot(q.w[0] - a[0], q.w[1] - a[1], q.w[2] - a[2]); }
      q.dist = d;
    });
    // heading at each point, and how fast it turns (for the bank)
    out.forEach(function (q, n) {
      var a = out[Math.max(0, n - 2)].w, b = out[Math.min(out.length - 1, n + 2)].w;
      q.f = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
      q.yaw = Math.atan2(q.f[1], q.f[0]);
    });
    out.forEach(function (q, n) {
      var a = out[Math.max(0, n - 3)], b = out[Math.min(out.length - 1, n + 3)], dy = b.yaw - a.yaw;
      while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
      q.turn = dy / ((b.dist - a.dist) || 1);
    });
    return out;
  })();
  var LEN = P[P.length - 1].dist, SPEED = LEN / FLIGHT * .82;
  function at(d) {
    d = Math.max(0, Math.min(LEN, d));
    var lo = 0, hi = P.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (P[m].dist < d) lo = m; else hi = m; }
    var a = P[lo], b = P[hi], r = (d - a.dist) / ((b.dist - a.dist) || 1);
    return { x: a[0] + (b[0] - a[0]) * r, y: a[1] + (b[1] - a[1]) * r, s: a[2] + (b[2] - a[2]) * r,
      f: norm([a.f[0] + (b.f[0] - a.f[0]) * r, a.f[1] + (b.f[1] - a.f[1]) * r, a.f[2] + (b.f[2] - a.f[2]) * r]),
      turn: a.turn + (b.turn - a.turn) * r };
  }

  // a folded paper dart, body coords [forward, right, up], length 1
  var V = { N: [.5, 0, 0], T: [-.5, 0, .01], L: [-.5, -.29, .07], R: [-.5, .29, .07], CL: [-.5, -.14, .04], CR: [-.5, .14, .04],
    KL: [-.44, -.018, -.13], KR: [-.44, .018, -.13] };
  var FACES = [["N", "T", "KL", 1], ["N", "T", "KR", 1], ["N", "T", "L", 0], ["N", "T", "R", 0]];
  function dart(x, y, len, f, roll, alpha) {
    if (len < 1.2 || alpha <= .01) return;
    var up = [0, 0, 1], r = cross(f, up), rl = Math.hypot(r[0], r[1], r[2]);
    r = rl < .05 ? [0, -1, 0] : [r[0] / rl, r[1] / rl, r[2] / rl];
    var u = cross(r, f), c = Math.cos(roll), s = Math.sin(roll);
    var r2 = [r[0] * c + u[0] * s, r[1] * c + u[1] * s, r[2] * c + u[2] * s];
    var u2 = [u[0] * c - r[0] * s, u[1] * c - r[1] * s, u[2] * c - r[2] * s];
    var W = {}, k;
    for (k in V) { var v = V[k]; W[k] = [f[0] * v[0] + r2[0] * v[1] + u2[0] * v[2], f[1] * v[0] + r2[1] * v[1] + u2[1] * v[2], f[2] * v[0] + r2[2] * v[1] + u2[2] * v[2]]; }
    function sy(q) { return y - (q[2] * CE + q[1] * SE) * len; }
    var faces = FACES.map(function (F) {
      var a = W[F[0]], b = W[F[1]], cc = W[F[2]];
      var n = norm(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]]));
      if (n[1] * CE - n[2] * SE > 0) n = [-n[0], -n[1], -n[2]]; // the side that faces us
      var lit = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]);
      return { p: [a, b, cc], d: ((a[1] + b[1] + cc[1]) * CE - (a[2] + b[2] + cc[2]) * SE) / 3, lit: lit, keel: F[3] };
    }).sort(function (p, q) { return q.d - p.d; });
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(.6, len * .022);
    faces.forEach(function (F) {
      var b = F.keel ? .52 + .4 * F.lit : .66 + .34 * F.lit;            // paper: never black, shadow is cool sky
      var R = Math.round(150 + 103 * b), G = Math.round(158 + 93 * b), B = Math.round(176 + 70 * b);
      ctx.fillStyle = "rgb(" + Math.min(253, R) + "," + Math.min(251, G) + "," + Math.min(246, B) + ")";
      ctx.beginPath();
      F.p.forEach(function (q, i) { var px = x + q[0] * len, py = y - (q[2] * CE + q[1] * SE) * len; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(64,74,96,.32)"; ctx.stroke();
    });
    // the fold creases along each wing
    ctx.strokeStyle = "rgba(90,100,124,.28)"; ctx.lineWidth = Math.max(.5, len * .014);
    ctx.beginPath(); ctx.moveTo(x + W.N[0] * len, sy(W.N)); ctx.lineTo(x + W.CL[0] * len, sy(W.CL));
    ctx.moveTo(x + W.N[0] * len, sy(W.N)); ctx.lineTo(x + W.CR[0] * len, sy(W.CR)); ctx.stroke();
    ctx.restore();
  }

  function soft(x, y, r, a) { // a small soft light where the text lands
    if (a <= .005) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,250,236," + a.toFixed(3) + ")"); g.addColorStop(.4, "rgba(255,246,228," + (a * .3).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,246,228,0)");
    ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  // one flight: distance flown, age, bank (smoothed), then a fade in her hands
  var fl = null, wait = 1.2, landed = -1, bank = 0;
  function render(q, alpha, roll, pitchUp) {
    var f = q.f;
    if (pitchUp) { var h = Math.hypot(f[0], f[1]) || 1, pz = Math.atan2(f[2], h) + pitchUp; f = [f[0] / h * Math.cos(pz), f[1] / h * Math.cos(pz), Math.sin(pz)]; }
    dart(kit.X(q.x), kit.Y(q.y), q.s * kit.dw, f, roll, alpha);
  }
  function still() {
    ctx.clearRect(0, 0, kit.W, kit.H);
    var q = at(LEN * .6); render(q, 1, .12, 0);
  }

  if (kit.reduce || kit.quiet) { kit.onLayout(still); still(); return; }

  kit.loop(function (t, dt) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    if (!fl) { wait -= dt; if (wait <= 0) { fl = { d: 0, age: 0 }; bank = 0; } }
    if (fl) {
      fl.age += dt;
      var rem = LEN - fl.d;
      // thrown hard, eases into the glide; slows for the flare at the end
      var v = SPEED * (1 + .9 * Math.exp(-fl.age * 2.2)) * Math.min(1, .3 + rem / (LEN * .12));
      fl.d = Math.min(LEN, fl.d + v * dt);
      var q = at(fl.d), k = fl.d / LEN;
      var want = Math.max(-.75, Math.min(.75, -q.turn * 9)) + .16 * Math.sin(fl.age * 1.7) + .06 * Math.sin(fl.age * 3.1);
      bank += (want - bank) * Math.min(1, dt * 3);
      var flare = k > .9 ? (k - .9) / .1 : 0;
      var a = Math.min(1, fl.age / .3);
      render(q, a, bank * (1 - flare), .55 * flare * flare);
      if (fl.d >= LEN - .01) { fl = null; landed = 0; wait = GAP + 1.0; }
    }
    if (landed >= 0) {
      landed += dt;
      var e = at(LEN);
      if (landed < .55) render(e, 1 - landed / .55, 0, .55); // settles into her hands
      var g = landed < .25 ? landed / .25 : Math.max(0, 1 - (landed - .25) / 1.1);
      soft(kit.X(HANDS[0]), kit.Y(HANDS[1] - .006), kit.dw * .016, .55 * g);
      if (landed > 1.4) landed = -1;
    }
  });
})();
