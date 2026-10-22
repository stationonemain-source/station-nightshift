/* Security hero: the watchman checks every door.
   - His torch is live. From the lens in his hand a handheld cone of cool light works the shopfront in
     front of him: down the glass of the door, onto the handle (he holds it there a moment: is it
     locked?), then across to the next shop's window and the panel deep inside it. It never points
     behind him; a man holding a torch out to his right can only check what is ahead of him.
   - Each thing he checks gets its small teal "checked" light, which comes on and stays. The teal
     lights further down the street are already lit: those doors were checked earlier on his round.
     When the last one is done he lowers the torch, the new lights quietly go out, and he starts over.
     That is the product: every door, every night, and a light that says so.
   - The pool of light is bigger the further it lands from the lens, and it shakes a little, the way
     a torch in a hand does. A faint smear of it shows on the wet pavement below.
   The painting's own beam and the two teal lights in the far window were taken out of the painting
   (a clean plate), so nothing is doubled. Positions are painting fractions.
   Reduced motion, and the free website check page that borrows this painting: one still frame, the
   torch on the door handle and every light lit, as the painting had it. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;

  var LENS = [.7497, .7135], PAVE = .846;
  // the checked lights: one inside the door he is at, two inside the next shop's window (where the painting had them)
  var LIGHTS = [[.7655, .668, .8], [.8735, .6295, 1.15], [.9505, .7465, 1]];
  // the round: aim points, hold seconds, and which light comes on at the end of the hold
  var ROUND = [
    { p: [.763, .672], hold: .5 },              // top of the door glass
    { p: [.766, .765], hold: .35 },             // down the glass
    { p: [.7765, .723], hold: 1.3, on: 0 },     // the handle: tried, locked
    { p: [.872, .645], hold: 1.2, on: 1 },      // into the next shop's window
    { p: [.948, .748], hold: 1.3, on: 2 },      // the panel at the back
    { p: [.80, .80], hold: 1.6, reset: true }   // torch lowered to the pavement, lights go out quietly
  ];
  var MOVE = .95; // seconds between aim points

  var ctx = kit.canvas(2);
  var lit = [0, 0, 0], want = [0, 0, 0];

  function blob(x, y, rx, ry, rgb, a) {
    if (a <= .004 || rx <= .2) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")");
    g.addColorStop(.4, "rgba(" + rgb + "," + (a * .38).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  function cone(x, y, ex, ey, r0, r1, a) {
    var dx = ex - x, dy = ey - y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    var g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, "rgba(225,236,255," + a.toFixed(3) + ")");
    g.addColorStop(.5, "rgba(210,226,255," + (a * .45).toFixed(3) + ")");
    g.addColorStop(1, "rgba(200,220,255," + (a * .3).toFixed(3) + ")");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + nx * r0, y + ny * r0); ctx.lineTo(ex + nx * r1, ey + ny * r1);
    ctx.lineTo(ex - nx * r1, ey - ny * r1); ctx.lineTo(x - nx * r0, y - ny * r0);
    ctx.closePath(); ctx.fill();
  }
  function teal(f, k) {
    if (k <= .004) return;
    var dw = kit.dw, x = kit.X(f[0]), y = kit.Y(f[1]), s = f[2];
    blob(x, y, .016 * dw * s, .016 * dw * s, "40,200,200", .3 * k);
    blob(x, y, .006 * dw * s, .006 * dw * s, "120,240,235", .7 * k);
    blob(x, y, .0028 * dw * s, .0028 * dw * s, "235,255,252", k);
  }
  function draw(aim, power) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    var dw = kit.dw;
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < 3; i++) teal(LIGHTS[i], lit[i]);
    var lx = kit.X(LENS[0]), ly = kit.Y(LENS[1]), ax = kit.X(aim[0]), ay = kit.Y(aim[1]);
    var dist = Math.hypot(ax - lx, ay - ly), r = Math.max(.016 * dw, dist * .24);
    // the cone, then the pool where it lands (wider than tall: it strikes the shopfront at a slant)
    // a torch beam in rain haze is soft: several faint layers, wide to narrow
    cone(lx, ly, ax, ay, .004 * dw, r * 1.0, .045 * power);
    cone(lx, ly, ax, ay, .003 * dw, r * .7, .05 * power);
    cone(lx, ly, ax, ay, .0022 * dw, r * .45, .06 * power);
    cone(lx, ly, ax, ay, .0014 * dw, r * .22, .07 * power);
    var fall = Math.max(.45, Math.min(1, .03 * dw / (dist + 1) + .5)); // a pool far away is dimmer
    blob(ax, ay, r * 1.7, r * 1.3, "200,218,255", .3 * power * fall);
    blob(ax, ay, r * .8, r * .65, "222,234,255", .38 * power * fall);
    blob(ax, ay, r * .3, r * .26, "240,245,255", .16 * power * fall);
    // its smear on the wet pavement under the shopfront
    var py = kit.Y(PAVE);
    if (ay < py) blob(ax, py, r * .5, .02 * dw, "190,210,255", .1 * power * fall);
    // the lens itself
    blob(lx, ly, .009 * dw, .009 * dw, "235,242,255", .55 * power);
    ctx.globalCompositeOperation = "source-over";
  }

  function still() { lit = [1, 1, 1]; draw(ROUND[2].p, 1); }
  kit.onLayout(function () { if (kit.reduce || kit.quiet) still(); });
  if (kit.reduce || kit.quiet) { still(); return; }

  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  var step = 0, phase = 0, clock = 0, from = ROUND[ROUND.length - 1].p, power = 0;
  kit.loop(function (t, dt) {
    clock += dt;
    var cur = ROUND[step], aim;
    if (clock < MOVE) { // swinging to the next aim
      var q = ease(clock / MOVE);
      aim = [from[0] + (cur.p[0] - from[0]) * q, from[1] + (cur.p[1] - from[1]) * q];
    } else {
      aim = cur.p.slice();
      if (cur.on != null && clock > MOVE + cur.hold * .55) want[cur.on] = 1;
      if (cur.reset && clock > MOVE + .3) want = [0, 0, 0];
      if (clock > MOVE + cur.hold) { from = cur.p; step = (step + 1) % ROUND.length; clock = 0; }
    }
    // a hand, not a tripod
    aim[0] += .0016 * Math.sin(t * 2.3) + .0009 * Math.sin(t * 5.1 + 1);
    aim[1] += .0016 * Math.sin(t * 1.9 + 2) + .0008 * Math.sin(t * 6.3);
    // the torch dims a touch while lowered between rounds
    power += ((cur.reset && clock > MOVE * .5 ? .7 : 1) - power) * Math.min(1, dt * 3);
    for (var i = 0; i < 3; i++) {
      if (want[i] > lit[i]) lit[i] = Math.min(1, lit[i] + dt * 5);          // comes on quickly
      else if (want[i] < lit[i]) lit[i] = Math.max(0, lit[i] - dt * .9);    // goes out quietly
    }
    draw(aim, power);
  });
})();
