/* Radar hero: the lookout is scanning the valley.
   - Every few seconds a faint ring of cool light goes out from the foot of the tower across the
     valley floor. It is a circle on the ground seen in perspective: wide and deep in the foreground,
     flattening and thinning as it runs away toward the far hills, fading as it goes.
   - As the ring passes each lit house, that house pings: its windows flare warm for a moment and
     settle back. Near houses ping first, the village across the river after, the far farms last.
     That is the product: search an area, and the businesses in it light up one by one.
   - A small glint at the binoculars as each ring goes out.
   - Where the ring passes behind the headline and copy it runs fainter still.
   Every lit window was found on the painting at full size; positions are painting fractions.
   Reduced motion, and the AI-check page that borrows this painting behind its form: the painting as
   it is, nothing drawn on it. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  if (kit.reduce || kit.quiet) return;
  var hero = kit.hero;

  // lit windows: [x, y, size] (size = how much window is lit there)
  var HOUSES = [[.7578, .8692, 4901], [.8629, .8740, 4399], [.5066, .7918, 2883], [.6793, .7550, 2300], [.5915, .6971, 1433], [.8862, .8825, 801],
    [.8495, .6177, 402], [.8418, .8662, 381], [.7322, .8572, 381], [.7979, .8519, 277], [.5294, .7973, 200], [.7501, .7655, 171], [.4307, .7895, 159],
    [.9258, .8982, 146], [.5626, .6695, 119], [.7309, .8805, 115], [.5667, .8116, 107], [.6225, .7059, 87], [.9104, .8885, 85], [.6111, .7027, 78],
    [.7452, .8869, 78], [.6286, .7050, 71], [.7172, .7619, 71], [.5447, .7725, 70], [.5552, .6974, 68], [.8005, .6409, 61], [.7952, .6403, 59],
    [.8103, .6423, 55], [.7243, .7639, 54], [.8272, .8964, 53], [.6460, .5859, 50], [.7865, .5841, 49], [.7882, .8710, 49], [.7564, .7637, 45],
    [.5737, .6693, 40], [.6922, .7731, 36], [.7204, .7476, 32], [.7328, .7222, 30], [.5740, .5924, 29], [.7654, .6248, 29], [.5440, .6944, 29],
    [.7260, .7904, 28], [.5749, .8257, 28], [.9419, .9065, 27], [.6915, .5921, 26], [.6021, .5622, 25], [.7790, .5827, 25], [.7572, .6225, 21],
    [.6602, .5636, 20], [.6935, .6518, 19], [.5400, .6651, 19], [.7703, .6739, 19], [.6603, .6039, 16], [.7259, .5845, 15]];

  // a simple camera for the valley floor: horizon line, vanishing x, and the painting's aspect
  var YH = .405, XV = .5, AR = 3840 / 2171;
  function toWorld(fx, fy) { var z = 1 / (fy - YH); return [(fx - XV) * z * AR, z]; }
  function toPaint(X, Z) { return [XV + X / (Z * AR), YH + 1 / Z]; }
  var ORIGIN = toWorld(.115, .80);   // the foot of the tower, on the cliff
  var GLINT = [.193, .334];          // the binoculars
  HOUSES.forEach(function (h) {
    var w = toWorld(h[0], h[1]);
    h.d = Math.hypot(w[0] - ORIGIN[0], w[1] - ORIGIN[1]);
    h.r = Math.min(.03, .006 + Math.sqrt(h[2]) * .00035); // flare radius, painting widths
    h.k = 0;
  });

  var ctx = kit.canvas(2), copyR = null;
  kit.onLayout(function () {
    var copy = hero.querySelector(".copy"), hr = hero.getBoundingClientRect();
    copyR = null;
    if (copy) {
      // only the words people read: the headline and the paragraph under it (not the buttons)
      var h1 = copy.querySelector("h1"), para = copy.querySelector("h1 + p") || h1;
      if (h1) {
        var a = h1.getBoundingClientRect(), b = para.getBoundingClientRect();
        copyR = { l: Math.min(a.left, b.left) - hr.left - 8, r: Math.max(a.right, b.right) - hr.left + 8, t: a.top - hr.top - 8, b: b.bottom - hr.top + 8 };
      }
    }
  });
  function behind(x, y) { return copyR && x > copyR.l && x < copyR.r && y > copyR.t && y < copyR.b; }

  function blob(x, y, r, rgb, a) {
    if (a <= .004 || r <= .2) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")");
    g.addColorStop(.35, "rgba(" + rgb + "," + (a * .4).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }

  var SPEED = 1.15, MAXD = 7.5, EVERY = 4.2, N = 96;
  var rings = [], next = .6, glint = 0;
  function ring(D, a) {
    // the circle of radius D around the tower foot, on the ground, projected; drawn as short segments
    // so the line can be thicker near and thinner far
    var prev = null, dw = kit.dw;
    for (var i = 0; i <= N; i++) {
      var th = -.6 + 2.1 * i / N, taper = Math.min(1, (1.5 - th) / .45, (th + .6) / .3); // the front of the circle, out across the valley; it thins out where it turns back toward you
      var X = ORIGIN[0] + D * Math.sin(th), Z = ORIGIN[1] + D * Math.cos(th);
      if (Z < 1.4) { prev = null; continue; }        // below the bottom of the painting
      var p = toPaint(X, Z);
      if (p[1] < .44 || p[0] > 1.02) { prev = null; continue; }
      var x = kit.X(p[0]), y = kit.Y(p[1]);
      if (prev) {
        var w = dw * .012 / Z, aa = a * taper * (behind(x, y) ? .45 : 1);
        ctx.strokeStyle = "rgba(170,200,255," + (aa * .22).toFixed(3) + ")"; ctx.lineWidth = w * 6;
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = "rgba(205,224,255," + aa.toFixed(3) + ")"; ctx.lineWidth = Math.max(.6, w * .7);
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y); ctx.stroke();
      }
      prev = [x, y];
    }
  }

  kit.loop(function (t, dt) {
    if (t > next) { rings.push({ D: .4 }); next = t + EVERY; glint = 1; }
    ctx.clearRect(0, 0, kit.W, kit.H);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "butt";
    for (var i = rings.length - 1; i >= 0; i--) {
      var R = rings[i], D0 = R.D;
      R.D += SPEED * dt;
      if (R.D > MAXD) { rings.splice(i, 1); continue; }
      var a = .75 * Math.pow(Math.min(1, R.D / 2.4), 1.5) * Math.pow(1 - R.D / MAXD, 1.3);
      ring(R.D, a);
      HOUSES.forEach(function (h) { if (h.d > D0 && h.d <= R.D) h.k = 1; });
    }
    var dw = kit.dw;
    HOUSES.forEach(function (h) {
      if (h.k <= .003) return;
      var x = kit.X(h[0]), y = kit.Y(h[1]), k = h.k, r = h.r * dw * (1 + .3 * k);
      var dim = behind(x, y) ? .5 : 1;
      blob(x, y, r * 1.8, "255,170,95", .2 * k * dim);
      blob(x, y, r * .6, "255,214,160", .5 * k * dim);
      h.k = Math.max(0, h.k - dt * .55); // flares, then settles back to its usual glow
    });
    if (glint > .003) {
      blob(kit.X(GLINT[0]), kit.Y(GLINT[1]), .012 * dw, "215,230,255", .55 * glint);
      glint = Math.max(0, glint - dt * 1.6);
    }
    ctx.globalCompositeOperation = "source-over";
  });
})();
