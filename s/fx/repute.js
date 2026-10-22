/* Repute hero: the reviews come in.
   - The sky over the diner starts empty. Then the five stars arrive one at a time, left to right,
     like reviews landing: each one ignites out of nothing with a small bloom of light and a
     twinkle, then settles to the steady glow the family is looking up at.
   - When the fifth lands, the diner warms a touch, the way a full row of stars warms a business.
   - After that they simply hold, breathing very gently, and every so often one gives a soft extra
     twinkle, as real starlight does. Nothing else in the sky moves.
   - The painted stars were taken out of the painting (clean plate), so these are the only stars.
     They are drawn to the painted ones' exact size, shape and place: a slightly full five-point
     star, warm white, with a cool halo. Positions are painting fractions via StationHeroFx.
   On a phone the row sits behind the body copy, so there the twinkles are small and the later ones stop.
   Reduced motion: all five lit and still. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;

  // fitted to the painted stars on the 3840 painting: centre x, centre y, outer radius (fraction of
  // painting width), rotation in degrees. Inner radius is .42 of outer (a little fuller than geometric)
  var STARS = [[.3491, .3423, .0263, 1], [.4288, .3495, .0258, 0], [.5063, .3516, .0258, 0], [.5832, .3510, .0258, -1], [.6558, .3460, .0258, -1]];
  var INNER = .42, FIRST = 1.1, GAP = .8, DINER = [.59, .64];
  var ctx = kit.canvas(2);
  var still = kit.reduce || kit.quiet;

  // a seeded random, so the brush texture in each star is the same on every visit
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function starPath(c, x, y, R, rot, k) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? R * INNER * k : R * k, a = -Math.PI / 2 + rot + i * Math.PI / 5;
      if (i) c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); else c.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    c.closePath();
  }

  // sprites, rebuilt on layout at device resolution: one per star (halo + painted body), one twinkle
  var sprites = [], flare = null, bloomS = null, warm = null;
  function build() {
    var dpr = kit.dpr; sprites = []; seed = 7;
    STARS.forEach(function (s) {
      var R = s[2] * kit.dw * dpr, half = Math.ceil(R * 2.9), c = document.createElement("canvas");
      c.width = c.height = half * 2;
      var g = c.getContext("2d"), rot = s[3] * Math.PI / 180;
      // cool halo, as the painting's: the sky around each star is lifted toward pale blue
      var h = g.createRadialGradient(half, half, R * .3, half, half, half);
      h.addColorStop(0, "rgba(206,220,255,.45)"); h.addColorStop(.35, "rgba(170,195,250,.16)");
      h.addColorStop(.7, "rgba(140,170,240,.06)"); h.addColorStop(1, "rgba(140,170,240,0)");
      g.fillStyle = h; g.fillRect(0, 0, half * 2, half * 2);
      // soft edge: the painted stars have a slightly feathered, glowing rim
      [[1.16, .10], [1.09, .18], [1.04, .32]].forEach(function (e) {
        starPath(g, half, half, R, rot, e[0]); g.fillStyle = "rgba(235,240,255," + e[1] + ")"; g.fill();
      });
      // the body: warm white, brightest at the heart
      var b = g.createRadialGradient(half, half, 0, half, half, R);
      b.addColorStop(0, "rgb(255,253,249)"); b.addColorStop(.6, "rgb(248,245,240)"); b.addColorStop(1, "rgb(236,234,236)");
      starPath(g, half, half, R, rot, 1); g.fillStyle = b; g.fill();
      // a few dry brush strokes inside, like the painting's
      g.save(); starPath(g, half, half, R, rot, 1); g.clip();
      g.lineCap = "round";
      for (var i = 0; i < 14; i++) {
        var a = rnd() * 6.283, d = rnd() * R * .75, x = half + d * Math.cos(a), y = half + d * Math.sin(a), L = R * (.15 + rnd() * .3), t = -1.1 + rnd() * .5;
        g.strokeStyle = rnd() < .5 ? "rgba(222,220,228,.16)" : "rgba(255,255,255,.22)";
        g.lineWidth = Math.max(1, R * (.03 + rnd() * .04));
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * Math.cos(t), y + L * Math.sin(t)); g.stroke();
      }
      g.restore();
      sprites.push({ c: c, half: half / dpr });
    });
    // twinkle: two crossed soft spikes of light (cached; drawn rotated and faded per frame)
    var R0 = STARS[2][2] * kit.dw * dpr, fh = Math.ceil(R0 * 3.2), f = document.createElement("canvas");
    f.width = f.height = fh * 2;
    var fg = f.getContext("2d");
    [0, Math.PI / 2].forEach(function (a) {
      fg.save(); fg.translate(fh, fh); fg.rotate(a); fg.scale(1, .06);
      var sg = fg.createRadialGradient(0, 0, 0, 0, 0, fh);
      sg.addColorStop(0, "rgba(255,255,255,.95)"); sg.addColorStop(.25, "rgba(230,238,255,.45)"); sg.addColorStop(1, "rgba(220,232,255,0)");
      fg.fillStyle = sg; fg.beginPath(); fg.arc(0, 0, fh, 0, 6.2832); fg.fill(); fg.restore();
    });
    flare = { c: f, half: fh / dpr };
    // the bloom when a star ignites: a round wash of pale light
    var bh = Math.ceil(R0 * 4.5), bc = document.createElement("canvas"); bc.width = bc.height = bh * 2;
    var bg = bc.getContext("2d"), gg = bg.createRadialGradient(bh, bh, 0, bh, bh, bh);
    gg.addColorStop(0, "rgba(235,242,255,.7)"); gg.addColorStop(.3, "rgba(200,218,255,.25)"); gg.addColorStop(1, "rgba(190,210,255,0)");
    bg.fillStyle = gg; bg.fillRect(0, 0, bh * 2, bh * 2);
    bloomS = { c: bc, half: bh / dpr };
    // the diner's lift when the row is complete
    var wh = Math.ceil(kit.dw * .3 * dpr), wc = document.createElement("canvas"); wc.width = wh * 2; wc.height = Math.ceil(wh * .6);
    var wg = wc.getContext("2d"); wg.translate(wh, wh * .3); wg.scale(1, .3);
    var w2 = wg.createRadialGradient(0, 0, 0, 0, 0, wh);
    w2.addColorStop(0, "rgba(255,206,160,.5)"); w2.addColorStop(.5, "rgba(255,190,140,.16)"); w2.addColorStop(1, "rgba(255,190,140,0)");
    wg.fillStyle = w2; wg.beginPath(); wg.arc(0, 0, wh, 0, 6.2832); wg.fill();
    warm = { c: wc, hw: wh / dpr, hh: wh * .3 / dpr };
  }

  function put(sp, x, y, k, a) {
    if (a <= .004 || k <= .01) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(sp.c, x - sp.half * k, y - sp.half * k, sp.half * 2 * k, sp.half * 2 * k);
  }
  function ease(p) { p = Math.max(0, Math.min(1, p)); return 1 - Math.pow(1 - p, 3); }
  // overshoot then settle: the star pops in a little large and eases back to its painted size
  function pop(p) { if (p <= 0) return 0; if (p >= 1) return 1; var s = 1.9; p -= 1; return 1 + p * p * ((s + 1) * p + s); }

  var tw = [0, 0, 0, 0, 0], twAt = [-9, -9, -9, -9, -9], nextTw = 0;
  function draw(t) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    ctx.globalCompositeOperation = "lighter";
    var done = 0;
    for (var i = 0; i < 5; i++) {
      var s = STARS[i], x = kit.X(s[0]), y = kit.Y(s[1]), sp = sprites[i];
      var age = still ? 9 : t - FIRST - i * GAP;
      if (age <= 0) continue;
      done++;
      var k = pop(age / .55), a = ease(age / .22);
      var breathe = still ? 1 : .93 + .07 * Math.sin(t * 1.15 + i * 1.7);
      // the arrival bloom and its twinkle, fading over about a second
      var b = still ? 0 : Math.exp(-age * 2.6) * Math.min(1, age / .08);
      // later twinkles
      var e = still ? 0 : Math.max(0, t - twAt[i]), tk = e < 1.2 ? Math.sin(Math.PI * Math.min(1, e / 1.2)) * .55 : 0;
      put(bloomS, x, y, .7 + .6 * (1 - b), b * .9);
      put(sp, x, y, k * (1 + .03 * tk), a * breathe);
      // on a phone the row sits behind the body copy: the twinkles stay small and rare there
      var fl = (b + tk) * (kit.W < 760 ? .35 : 1);
      if (fl > .01) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(.12 + (still ? 0 : (age * .12)));
        put(flare, 0, 0, .55 + .5 * fl, fl * .85); ctx.restore();
      }
    }
    // the row is complete: the diner warms a touch, then holds a gentle extra glow
    if (!still && done === 5) {
      var w5 = t - FIRST - 4 * GAP - .2, lift = w5 > 0 ? .08 + .22 * Math.exp(-w5 * .9) * Math.min(1, w5 / .5) : 0;
      if (lift > .005) {
        ctx.globalAlpha = lift;
        var cx = kit.X(DINER[0]), cy = kit.Y(DINER[1]);
        ctx.drawImage(warm.c, cx - warm.hw, cy - warm.hh, warm.hw * 2, warm.hh * 2);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    // once all five are in, now and then one star twinkles again (never two at once)
    if (!still && done === 5 && t > nextTw && kit.W >= 760) {
      var j = Math.floor(Math.random() * 5);
      twAt[j] = t; nextTw = t + 3.5 + Math.random() * 3.5;
    }
  }

  var lastT = 0;
  kit.onLayout(function () { build(); if (still) draw(0); else draw(lastT); });
  build();
  if (still) { draw(0); return; }
  nextTw = FIRST + 4 * GAP + 3;
  kit.loop(function (t) { lastT = t; draw(t); });
})();
