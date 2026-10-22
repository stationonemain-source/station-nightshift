/* Storefront hero: new glass, wet paint.
   - The windows are brand new. Every few seconds the sun slides a soft diagonal glint along the
     front, pane by pane, left to right, the way new glass flashes as you walk past it: through the
     left window, across the open door's glass, then the big window behind the painter. The glint
     lives only on the glass: it passes behind the olive tree, the painter, his paint can and the
     ladder, never over them.
   - Up at the cornice, the stroke under the painter's brush is still wet: a small highlight sits in
     it and shifts a little as the light moves.
   That is the product: a front that has just been made, clean and ready to open.
   Where the glint crosses the headline and copy it is held back, so the words stay easy to read.
   All shapes are fractions of the painting (kit.X / kit.Y), so they fit the glass at every size.
   Reduced motion: nothing moves; the paint keeps its small wet shine. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  var ctx = kit.canvas(1);

  // glass, as quads in painting fractions (left window: three panes; door glass; big window: three panes)
  var GLASS = [
    [[.4705, .481], [.5105, .479], [.5105, .536], [.4705, .540]],
    [[.5135, .478], [.5555, .474], [.5555, .532], [.5135, .535]],
    [[.4705, .545], [.5555, .537], [.5555, .748], [.4705, .749]],
    [[.6305, .5565], [.6545, .5625], [.654, .7855], [.630, .7885]],
    [[.7393, .4319], [.7927, .4247], [.7927, .4977], [.7393, .5057]],
    [[.796, .4234], [.8833, .4128], [.8833, .4898], [.796, .4969]],
    [[.7398, .5123], [.8842, .503], [.8842, .7631], [.7398, .7631]]
  ];
  // what stands in front of the glass
  var PAINTER = [[.823, .3902], [.8335, .3637], [.85, .3637], [.8665, .3889], [.8687, .3398], [.88, .3398], [.8807, .4062], [.8822, .4858], [.8822, .5402], [.862, .5455], [.8582, .6171], [.832, .6171], [.8327, .5402], [.829, .5335], [.8233, .4592]];
  var TREE = [[.4698, .5858], [.4855, .578], [.4995, .595], [.5196, .6353], [.5188, .6786], [.5118, .7127], [.4995, .7529], [.468, .7529]];
  var LADDER = [[[.8305, .5402], [.8035, .80], .0055], [[.8627, .5402], [.8477, .80], .0055], [[.8657, .5428], [.8917, .80], .0048], [[.8425, .5455], [.8447, .80], .004],
    [[.829, .6185], [.865, .6185], .0035], [[.823, .6623], [.871, .6623], .0035], [[.8177, .71], [.877, .71], .0035], [[.8125, .7565], [.883, .7565], .0035]];
  var WET = [.8715, .356], PERIOD = 8.5, SWEEP = 2.6, X0 = .43, X1 = .93;

  var copyR = null;
  kit.onLayout(function () {
    var copy = kit.hero.querySelector(".copy"), hr = kit.hero.getBoundingClientRect();
    if (copy) {
      var a = (copy.querySelector("h1") || copy).getBoundingClientRect(), b = copy.getBoundingClientRect();
      copyR = { l: Math.min(a.left, b.left) - hr.left, r: Math.max(a.right, b.right) - hr.left, t: a.top - hr.top, b: b.bottom - hr.top };
    }
    if (kit.reduce) draw(0, true);
  });

  function poly(P) {
    ctx.moveTo(kit.X(P[0][0]), kit.Y(P[0][1]));
    for (var i = 1; i < P.length; i++) ctx.lineTo(kit.X(P[i][0]), kit.Y(P[i][1]));
    ctx.closePath();
  }
  function blob(x, y, rx, ry, rgb, a) {
    if (a <= .003) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")");
    g.addColorStop(.5, "rgba(" + rgb + "," + (a * .3).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
  }

  function draw(t, still) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    var dw = kit.dw, i;
    var p = (t + PERIOD - 1.5) % PERIOD;
    if (!still && p < SWEEP) {
      var q = p / SWEEP, e = q * q * (3 - 2 * q);
      var cx = kit.X(X0 + (X1 - X0) * e), cy = kit.Y(.6), bw = .05 * dw, k = .55; // band leans like "/"
      ctx.save();
      ctx.beginPath(); for (i = 0; i < GLASS.length; i++) poly(GLASS[i]); ctx.clip();
      ctx.translate(cx, cy); ctx.transform(1, 0, -k, 1, 0, 0);
      var g = ctx.createLinearGradient(-bw, 0, bw, 0);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.38, "rgba(255,255,255,.16)");
      g.addColorStop(.5, "rgba(255,255,255,.5)"); g.addColorStop(.6, "rgba(255,255,255,.16)");
      g.addColorStop(.72, "rgba(255,255,255,0)"); g.addColorStop(.8, "rgba(255,255,255,.12)"); g.addColorStop(.86, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.globalCompositeOperation = "lighter";
      ctx.fillRect(-bw, -.3 * dw, bw * 2, .6 * dw);
      ctx.restore();
      // things in front of the glass take the glint away
      ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "#000";
      ctx.beginPath(); poly(PAINTER); poly(TREE); ctx.fill();
      ctx.lineCap = "round"; ctx.strokeStyle = "#000";
      for (i = 0; i < LADDER.length; i++) {
        var L = LADDER[i]; ctx.lineWidth = L[2] * dw;
        ctx.beginPath(); ctx.moveTo(kit.X(L[0][0]), kit.Y(L[0][1])); ctx.lineTo(kit.X(L[1][0]), kit.Y(L[1][1])); ctx.stroke();
      }
      if (copyR) { ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(copyR.l - 20, copyR.t - 10, copyR.r - copyR.l + 40, copyR.b - copyR.t + 20); }
      ctx.restore();
    }
    // the wet stroke under the brush: a small shine that drifts a little along the stroke
    var s = still ? 0 : Math.sin(t * .9), wx = kit.X(WET[0]), wy = kit.Y(WET[1] + .006 * s);
    ctx.globalCompositeOperation = "lighter";
    blob(wx, wy, .0042 * dw, .009 * dw, "225,238,255", .26 + (still ? 0 : .1 * Math.sin(t * 2.3)));
    blob(wx + .0005 * dw, wy - .002 * dw, .0012 * dw, .003 * dw, "255,255,255", .55 + (still ? 0 : .25 * Math.max(0, Math.sin(t * 1.7))));
    ctx.globalCompositeOperation = "source-over";
  }

  if (kit.reduce) { draw(0, true); return; }
  kit.loop(function (t) { draw(t, false); });
})();
