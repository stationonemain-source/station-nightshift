/* Greet hero: the shop says hello.
   - The open door breathes: its warm light swells and reaches a little further out across the
     pavement toward the woman and her dog, then settles, like someone at the door saying "come in".
     That is the product: a website that notices a visitor and greets them before they walk on.
   - The lamps inside burn like real old filament bulbs: steady, with the faintest slow waver.
   - A few fireflies drift in the dusk plants (the pots by the lamp post, the bench planters, the
     climbing vine, the tree on the left). They behave like real ones: slow, low, wandering, and they
     flash in short soft pulses a few seconds apart, dark in between. Never many, never behind the words.
   All positions are fractions of the painting (kit.X / kit.Y), so they stay on their plant at every size.
   Reduced motion, and the contact page (which borrows this painting behind its form): one still frame,
   the door's light resting on the pavement, the lamps lit, no fireflies. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  var ctx = kit.canvas(1);
  var still = kit.reduce || kit.quiet;

  var DOOR = [.556, .846];                      // middle of the threshold
  var LAMPS = [[.530, .548, .022], [.715, .486, .028], [.800, .492, .03]]; // [x, y, glow radius] pendant + back lamp
  // where fireflies live: [x0, y0, x1, y1] in painting fractions, and how many
  var BEDS = [[.17, .67, .27, .77, 3], [.40, .71, .47, .77, 2], [.02, .36, .11, .62, 2], [.87, .18, .97, .58, 3], [.76, .71, .86, .79, 2], [.62, .74, .68, .80, 1]];

  function blob(x, y, rx, ry, rgb, a) {
    if (a <= .003) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")");
    g.addColorStop(.45, "rgba(" + rgb + "," + (a * .35).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
  }

  // one small cached sprite per firefly look (core + halo), drawn once per layout
  var fly = document.createElement("canvas"), FS = 64;
  function makeFly() {
    fly.width = fly.height = FS;
    var c = fly.getContext("2d"), g = c.createRadialGradient(FS / 2, FS / 2, 0, FS / 2, FS / 2, FS / 2);
    g.addColorStop(0, "rgba(250,255,215,1)");
    g.addColorStop(.09, "rgba(232,255,160,1)");
    g.addColorStop(.2, "rgba(200,245,120,.5)");
    g.addColorStop(.5, "rgba(170,230,95,.14)");
    g.addColorStop(1, "rgba(150,210,80,0)");
    c.fillStyle = g; c.fillRect(0, 0, FS, FS);
  }
  makeFly();

  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var flies = [];
  BEDS.forEach(function (b) {
    for (var i = 0; i < b[4]; i++) flies.push({
      b: b, u: rnd(), v: rnd(),                      // home inside the bed
      p1: rnd() * 6.28, p2: rnd() * 6.28, f1: .05 + rnd() * .05, f2: .07 + rnd() * .06,
      next: .3 + rnd() * 3, on: -1, dur: .45 + rnd() * .35
    });
  });

  // the spill of light out of the doorway: a soft trapezoid on the pavement, widening toward us.
  // Rendered once per layout (blurred), then each frame only its strength and reach change.
  var spill = document.createElement("canvas"), SP = { x: 0, y: 0, w: 1, h: 1 };
  function makeSpill() {
    var dw = kit.dw, x0 = kit.X(.43), x1 = kit.X(.70), y0 = kit.Y(.832), y1 = kit.Y(1.0), pad = .02 * dw;
    SP = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
    var r = Math.min(2, kit.dpr);
    spill.width = Math.max(1, Math.round(SP.w * r)); spill.height = Math.max(1, Math.round(SP.h * r));
    var c = spill.getContext("2d"); c.setTransform(r, 0, 0, r, -SP.x * r, -SP.y * r);
    c.filter = "blur(" + Math.round(.008 * dw) + "px)";
    var g = c.createLinearGradient(0, kit.Y(.842), 0, y1);
    g.addColorStop(0, "rgba(255,196,128,.95)"); g.addColorStop(.25, "rgba(255,186,118,.55)");
    g.addColorStop(.6, "rgba(255,178,110,.18)"); g.addColorStop(1, "rgba(255,170,100,0)");
    c.fillStyle = g; c.beginPath();
    c.moveTo(kit.X(.498), kit.Y(.842)); c.lineTo(kit.X(.585), kit.Y(.842));
    c.lineTo(kit.X(.68), y1); c.lineTo(kit.X(.44), y1); c.closePath(); c.fill();
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    var dw = kit.dw;
    ctx.globalCompositeOperation = "lighter";

    // the door: a slow breath (about 7 s), the light swelling out over the pavement and back
    var br = still ? .45 : .5 + .5 * Math.sin(t * .9 - 1.4);
    br = br * br * (3 - 2 * br);
    var ty = kit.Y(.842), reach = .55 + .45 * br;
    ctx.globalAlpha = .38 + .5 * br;
    ctx.drawImage(spill, SP.x, ty - (ty - SP.y) * reach, SP.w, SP.h * reach);
    ctx.globalAlpha = 1;
    // the threshold itself, where the light is strongest
    blob(kit.X(.545), kit.Y(.846), (.05 + .015 * br) * dw, .012 * dw, "255,210,150", .22 + .25 * br);
    // and the room brightening a touch behind him
    blob(kit.X(.553), kit.Y(.70), .07 * dw, .1 * dw, "255,200,140", .05 + .09 * br);

    // filament lamps: steady, with a very small slow waver of their own
    for (var i = 0; i < LAMPS.length; i++) {
      var L = LAMPS[i], w = still ? 0 : .5 * Math.sin(t * (1.3 + i * .37) + i * 2) + .3 * Math.sin(t * (3.1 + i * .9) + i) + .2 * Math.sin(t * 7.3 + i * 4);
      var a = .22 + .05 * w;
      blob(kit.X(L[0]), kit.Y(L[1]), L[2] * dw, L[2] * dw * .8, "255,214,160", a);
      blob(kit.X(L[0]), kit.Y(L[1]) + .002 * dw, L[2] * .3 * dw, L[2] * .22 * dw, "255,240,214", a * 1.6);
    }

    if (!still) {
      // fireflies: wander slowly about home, flash a soft pulse every few seconds
      for (var k = 0; k < flies.length; k++) {
        var f = flies[k], b = f.b;
        f.next -= dt;
        if (f.on < 0 && f.next <= 0) { f.on = 0; }
        var lum = 0;
        if (f.on >= 0) {
          f.on += dt;
          var q = f.on / f.dur;
          if (q >= 1) { f.on = -1; f.next = 1.6 + rnd() * 3.6; }
          else { lum = Math.sin(q * Math.PI); lum = Math.sqrt(lum); }
        }
        // drift even while dark, so each flash shows up somewhere a little new
        var u = f.u + .32 * Math.sin(t * f.f1 + f.p1) + .12 * Math.sin(t * f.f2 * 2.3 + f.p2);
        var v = f.v + .28 * Math.sin(t * f.f2 + f.p2) + .1 * Math.sin(t * f.f1 * 3.1 + f.p1);
        u = Math.max(-.1, Math.min(1.1, u)); v = Math.max(-.1, Math.min(1.1, v));
        if (lum < .01) continue;
        var fx = kit.X(b[0] + (b[2] - b[0]) * u), fy = kit.Y(b[1] + (b[3] - b[1]) * v);
        var s = (.016 + .006 * ((b[1] + b[3]) / 2 - .4)) * dw * (.7 + .3 * lum); // a touch bigger nearer the street
        ctx.globalAlpha = lum;
        ctx.drawImage(fly, fx - s, fy - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
  }

  makeSpill();
  kit.onLayout(function () { makeSpill(); if (still) draw(0, 0); });
  if (still) { draw(0, 0); return; }
  kit.loop(draw);
})();
