/* Pursuit hero: every lead gets chased.
   - The woman at the cottage keeps sending paper planes, a steady easy rhythm, and each one goes
     to a different door in the village: the farmhouse up the hill, the girl in blue at the little
     cottage, the cottage door by the road, the man reaching up at the stone cottage, the woman at
     the white cottage. Nobody is skipped, nobody gets two in a row: that is the follow-up, one
     polite message after another, to every lead, until each one is answered.
   - Each plane flies like a real paper dart: tossed up out of her hands, it settles into a long
     glide, banks gently into its turn toward its house, shrinks as it goes out over the valley
     (the far farmhouse gets a small plane, the near cottage a big one), then flares and is
     caught, or slips in at the door, with a small soft light: answered.
   - Drawn in 3D (two wings with a slight dihedral and a folded keel) and lit by the painting's sun,
     seen a little from above the way the painter drew the original ones. Flights stay under the
     price line so nothing crosses the copy.
   The painting's own paper planes were painted out (clean plate): every plane is live.
   Reduced motion / quiet pages: three planes held mid-flight on their way to three doors. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  var ctx = kit.canvas(2);
  var ASP = 2171 / 3840, HZ = .50;          // painting aspect; horizon (the sea line)
  // world axes: x right, d away from us, z up. The sun is high, to the left, on our side
  var SUN = norm([-.35, -.45, .82]);
  var CE = Math.cos(.36), SE = Math.sin(.36); // we see the planes a little from above
  var HANDS = [.126, .628];                   // where she lets go
  // the doors, painting fractions: [x, y, plane length on arrival, arc height, caught by someone?]
  var DOORS = [
    [.240, .539, .0080, .018, 0],   // the white farmhouse up the hill (its door)
    [.353, .653, .0115, .030, 1],   // the girl in blue at the little cottage, arms up
    [.492, .718, .0135, .020, 0],   // the cottage door down by the road
    [.652, .736, .0180, .024, 1],   // the man at the stone cottage, arms up
    [.917, .774, .0215, .022, 1]    // the woman at the white cottage, arms up
  ];
  var EVERY = .9;                             // a plane leaves her hands about every 0.9 s

  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // one route per door: out of her hands, up a little, a long glide with a gentle S, down to the door.
  // Size follows depth (harmonic, so it shrinks fast at first and slowly far away). Kept below the
  // price line (y >= .645) wherever the copy sits.
  function route(T, seed) {
    var keys = [[HANDS[0], HANDS[1], .040], [.150, .606, .044]], s1 = .044, n = 9, i;
    for (i = 1; i <= n; i++) {
      var u = i / n, e = u * u * (3 - 2 * u) * .35 + u * .65;
      var x = .150 + (T[0] - .150) * e + .010 * Math.sin(u * 6.2832 + seed) * (1 - u);
      var y = .606 + (T[1] - .606) * e - T[3] * Math.sin(Math.PI * u) * (1 - .3 * u);
      if (x > .31 && x < .69) y = Math.max(y, .645 + .01 * Math.sin(u * 3 + seed));
      if (i === n) { x = T[0]; y = T[1]; }
      keys.push([x, y, .35 / ((1 - u) / s1 + u / T[2]) + .65 * (s1 + (T[2] - s1) * u)]);
    }
    return build(keys);
  }
  function build(KEYS) { // dense Catmull-Rom, each point placed in the world (depth = 1 / size)
    var out = [], i, j, k;
    for (i = 0; i < KEYS.length - 1; i++) {
      var p0 = KEYS[Math.max(0, i - 1)], p1 = KEYS[i], p2 = KEYS[i + 1], p3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
      for (j = 0; j < 16; j++) {
        var t = j / 16, t2 = t * t, t3 = t2 * t, q = [];
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
    out.forEach(function (q, n) {
      var a = out[Math.max(0, n - 2)].w, b = out[Math.min(out.length - 1, n + 2)].w;
      q.f = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]); q.yaw = Math.atan2(q.f[1], q.f[0]);
    });
    out.forEach(function (q, n) {
      var a = out[Math.max(0, n - 3)], b = out[Math.min(out.length - 1, n + 3)], dy = b.yaw - a.yaw;
      while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
      q.turn = dy / ((b.dist - a.dist) || 1);
    });
    out.len = d;
    return out;
  }
  function at(P, d) {
    d = Math.max(0, Math.min(P.len, d));
    var lo = 0, hi = P.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (P[m].dist < d) lo = m; else hi = m; }
    var a = P[lo], b = P[hi], r = (d - a.dist) / ((b.dist - a.dist) || 1);
    return { x: a[0] + (b[0] - a[0]) * r, y: a[1] + (b[1] - a[1]) * r, s: a[2] + (b[2] - a[2]) * r,
      f: norm([a.f[0] + (b.f[0] - a.f[0]) * r, a.f[1] + (b.f[1] - a.f[1]) * r, a.f[2] + (b.f[2] - a.f[2]) * r]),
      turn: a.turn + (b.turn - a.turn) * r };
  }
  // two routes per door (slightly different S), so the stream never looks copied
  var ROUTES = DOORS.map(function (T, i) { return [route(T, i * 1.7), route(T, i * 1.7 + 2.4)]; });

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
    faces.forEach(function (F) {
      var b = F.keel ? .52 + .4 * F.lit : .66 + .34 * F.lit;            // paper: never black, shadow is cool sky
      var R = Math.round(150 + 103 * b), G = Math.round(158 + 93 * b), B = Math.round(176 + 70 * b);
      ctx.fillStyle = "rgb(" + Math.min(253, R) + "," + Math.min(251, G) + "," + Math.min(246, B) + ")";
      ctx.beginPath();
      F.p.forEach(function (q, i) { var px = x + q[0] * len, py = sy(q); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.closePath(); ctx.fill();
      if (len > 7) { ctx.lineWidth = Math.max(.6, len * .022); ctx.strokeStyle = "rgba(64,74,96,.32)"; ctx.stroke(); }
    });
    if (len > 10) { // the fold creases along each wing
      ctx.strokeStyle = "rgba(90,100,124,.28)"; ctx.lineWidth = Math.max(.5, len * .014);
      ctx.beginPath(); ctx.moveTo(x + W.N[0] * len, sy(W.N)); ctx.lineTo(x + W.CL[0] * len, sy(W.CL));
      ctx.moveTo(x + W.N[0] * len, sy(W.N)); ctx.lineTo(x + W.CR[0] * len, sy(W.CR)); ctx.stroke();
    }
    ctx.restore();
  }
  function soft(x, y, r, a) { // the small soft light of an answered message
    if (a <= .005) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,250,236," + a.toFixed(3) + ")"); g.addColorStop(.4, "rgba(255,246,228," + (a * .3).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,246,228,0)");
    ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  function render(q, alpha, roll, pitchUp) {
    var f = q.f;
    if (pitchUp) { var h = Math.hypot(f[0], f[1]) || 1, pz = Math.atan2(f[2], h) + pitchUp; f = [f[0] / h * Math.cos(pz), f[1] / h * Math.cos(pz), Math.sin(pz)]; }
    dart(kit.X(q.x), kit.Y(q.y), q.s * kit.dw, f, roll, alpha);
  }

  function still() {
    ctx.clearRect(0, 0, kit.W, kit.H);
    [[0, .7], [3, .45], [4, .25]].forEach(function (p) { var P = ROUTES[p[0]][0]; render(at(P, P.len * p[1]), 1, .1, 0); });
  }
  if (kit.reduce || kit.quiet) { kit.onLayout(still); still(); return; }

  // the order: every door once, shuffled, and never the same door twice in a row
  var order = [], last = -1;
  function nextDoor() {
    if (!order.length) {
      order = [0, 1, 2, 3, 4];
      for (var i = order.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, x = order[i]; order[i] = order[j]; order[j] = x; }
      if (order[order.length - 1] === last) order.unshift(order.pop());
    }
    return (last = order.pop());
  }
  var planes = [], glows = [], clock = 0, next = .4;
  function launch() {
    var i = nextDoor(), P = ROUTES[i][(Math.random() * 2) | 0];
    // about 3.5 s to the near cottage, up to ~5 s to the far farmhouse
    planes.push({ P: P, door: i, d: 0, age: 0, bank: 0, ph: Math.random() * 6.28, v: P.len / (3.3 + 2.6 * (1 - DOORS[i][2] / .023)) * .82 });
  }

  kit.loop(function (t, dt) {
    clock += dt;
    if (clock >= next) { launch(); next = clock + EVERY * (.85 + Math.random() * .3); }
    ctx.clearRect(0, 0, kit.W, kit.H);
    for (var g = glows.length - 1; g >= 0; g--) {
      var G = glows[g]; G.life += dt;
      var a = G.life < .2 ? G.life / .2 : Math.max(0, 1 - (G.life - .2) / 1.1);
      soft(kit.X(G.x), kit.Y(G.y), kit.dw * G.r, .5 * a);
      if (G.life > 1.3) glows.splice(g, 1);
    }
    var draw = [];
    for (var i = planes.length - 1; i >= 0; i--) {
      var p = planes[i], P = p.P, T = DOORS[p.door];
      p.age += dt;
      if (p.d < P.len) {
        var rem = P.len - p.d;
        p.d = Math.min(P.len, p.d + p.v * (1 + .9 * Math.exp(-p.age * 2.4)) * Math.min(1, .3 + rem / (P.len * .12)) * dt);
        var q = at(P, p.d), k = p.d / P.len;
        var want = Math.max(-.7, Math.min(.7, -q.turn * 9)) + .14 * Math.sin(p.age * 1.8 + p.ph);
        p.bank += (want - p.bank) * Math.min(1, dt * 3);
        var fl = k > .9 ? (k - .9) / .1 : 0;
        draw.push([q, Math.min(1, p.age / .2), p.bank * (1 - fl), (T[4] ? .55 : .3) * fl * fl]);
        if (p.d >= P.len) { p.end = 0; glows.push({ x: T[0], y: T[1] - .004, r: .004 + T[2] * .9, life: 0 }); }
      } else {
        p.end += dt; // caught, or slipped in at the door
        if (p.end > .45) { planes.splice(i, 1); continue; }
        draw.push([at(P, P.len), 1 - p.end / .45, 0, T[4] ? .55 : .3]);
      }
    }
    draw.sort(function (a, b) { return a[0].s - b[0].s; }); // far planes first
    draw.forEach(function (d) { render(d[0], d[1], d[2], d[3]); });
  });
})();
