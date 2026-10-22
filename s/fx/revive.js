/* Revive hero: old trees, new bloom.
   - A breeze comes through the orchard from the left. Blossom petals let go of the old trees and
     drift across the scene: a few dozen at a time, tumbling and flipping so they catch the light,
     falling slowly and settling into the grass. Petals near you are bigger and faster, petals by the
     far rows are specks; the breeze swells and eases, and the petals with it.
   - The same wind leans the thin curl of smoke from the cottage chimney: it rises, wavers and bends
     away to the right, thinning as it goes. Someone is home.
   That is the product: the customers you already had, coming back into bloom.
   The painted smoke was lifted out of the painting (sky repainted behind it), so the only smoke is this one.
   All positions are fractions of the painting (kit.X / kit.Y), so the chimney stays the chimney at every size.
   Reduced motion: one still frame, a few petals in the air and the smoke standing as it was painted. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  var ctx = kit.canvas(1);

  var CHIMNEY = [.8305, .4535];
  // where petals let go: blossom canopy, [x0, y0, x1, y1, depth]  (depth 1 = nearest trees)
  var CANOPY = [[.00, .40, .22, .66, 1], [.10, .44, .36, .66, .85], [.28, .48, .48, .68, .65], [.44, .52, .60, .70, .45], [.58, .60, .69, .72, .3]];
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // cached sprites: one petal (soft pink-white, a darker heart), one puff of smoke
  var petal = document.createElement("canvas"), puff = document.createElement("canvas");
  (function () {
    petal.width = 32; petal.height = 20;
    var c = petal.getContext("2d"), g = c.createRadialGradient(13, 10, 1, 16, 10, 15);
    g.addColorStop(0, "rgba(255,246,248,1)"); g.addColorStop(.6, "rgba(250,222,232,1)"); g.addColorStop(1, "rgba(236,180,200,.0)");
    c.fillStyle = g; c.beginPath(); c.ellipse(16, 10, 14.5, 8.5, 0, 0, 6.2832); c.fill();
    c.fillStyle = "rgba(214,140,165,.45)"; c.beginPath(); c.ellipse(5, 10, 3, 2.2, 0, 0, 6.2832); c.fill();
    puff.width = puff.height = 64;
    c = puff.getContext("2d"); g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(246,248,250,1)"); g.addColorStop(.45, "rgba(240,243,248,.55)"); g.addColorStop(1, "rgba(235,240,248,0)");
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  })();

  var copyR = null;
  function layout() {
    var copy = kit.hero.querySelector(".copy"), hr = kit.hero.getBoundingClientRect();
    if (copy) {
      var h1 = copy.querySelector("h1") || copy, a = h1.getBoundingClientRect(), b = copy.getBoundingClientRect();
      copyR = { l: Math.min(a.left, b.left) - hr.left, r: Math.max(a.right, b.right) - hr.left, t: a.top - hr.top, b: b.bottom - hr.top };
    }
  }

  // petals, in painting fractions; vx/vy in painting widths per second
  var P = [], N = 60;
  function spawn(p, anywhere) {
    var b = CANOPY[Math.floor(rnd() * CANOPY.length)], z = b[4] * (.8 + .4 * rnd());
    p.x = b[0] + (b[2] - b[0]) * rnd(); p.y = b[1] + (b[3] - b[1]) * rnd();
    p.z = z; p.ground = Math.min(.98, b[3] + .1 + .22 * z * (.4 + .6 * rnd()));
    p.spin = (rnd() - .5) * 5; p.a = rnd() * 6.28; p.flip = rnd() * 6.28; p.fr = 2 + rnd() * 3;
    p.ph = rnd() * 6.28; p.life = 0; p.fade = 1;
    if (anywhere) { var k = rnd() * 4; p.x += .02 * z * k; p.y += .04 * z * k; p.life = k; }
  }
  for (var i = 0; i < N; i++) { P.push({}); spawn(P[i], true); }

  // smoke puffs
  var S = [], sAcc = 0;
  function puffNew(age) { return { age: age || 0, life: 6 + rnd() * 2.5, ph: rnd() * 6.28, dx: (rnd() - .5) * .002 }; }

  function wind(t) { return .55 + .3 * Math.sin(t * .23) + .15 * Math.sin(t * .61 + 2); }

  function step(t, dt) {
    var w = wind(t);
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      p.life += dt;
      // a slow fall (petals are light: about 0.6 m/s), carried sideways by the breeze, with a flutter
      p.x += dt * p.z * (.032 * w + .01 * Math.sin(p.life * 1.3 + p.ph));
      p.y += dt * p.z * (.042 + .02 * Math.sin(p.life * 2.1 + p.ph));
      p.a += p.spin * dt; p.flip += p.fr * dt;
      if (p.y > p.ground) p.fade -= dt * .8;
      if (p.fade <= 0 || p.x > 1.03) spawn(p, false);
    }
    sAcc += dt;
    while (sAcc > .14) { sAcc -= .14; S.push(puffNew(0)); }
    for (var k = S.length - 1; k >= 0; k--) { S[k].age += dt; if (S[k].age > S[k].life) S.splice(k, 1); }
  }

  function draw(t) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    var dw = kit.dw, w = wind(t), i;
    // smoke: rises, wavers, then the wind takes it to the right
    var cx = kit.X(CHIMNEY[0]), cy = kit.Y(CHIMNEY[1]);
    for (i = 0; i < S.length; i++) {
      var s = S[i], q = s.age / s.life, rise = .0115 * s.age * (1 - .25 * q);
      var lean = (.004 + .0062 * w) * s.age * s.age * .14 + s.dx * s.age;
      var wob = .0035 * Math.sin(s.age * 1.6 + s.ph) * Math.min(1, s.age / 1.5);
      var x = cx + (lean + wob) * dw, y = cy - rise * dw;
      var r = (.0035 + .011 * q) * dw, a = .5 * Math.min(1, s.age / .35) * Math.pow(1 - q, 1.6);
      ctx.globalAlpha = a;
      ctx.drawImage(puff, x - r, y - r, r * 2, r * 2);
    }
    // petals
    for (i = 0; i < P.length; i++) {
      var p = P[i], px = kit.X(p.x), py = kit.Y(p.y);
      if (px < -20 || px > kit.W + 20 || py < -20 || py > kit.H + 20) continue;
      var sz = (.0016 + .0042 * p.z * p.z) * dw, fl = Math.cos(p.flip);
      var al = Math.min(1, p.life / .6) * Math.max(0, p.fade) * (.65 + .35 * p.z);
      if (copyR && px > copyR.l && px < copyR.r && py > copyR.t && py < copyR.b) al *= .45;
      ctx.globalAlpha = al * (.75 + .25 * Math.abs(fl)) ;
      ctx.save(); ctx.translate(px, py); ctx.rotate(p.a);
      ctx.scale(Math.max(.15, Math.abs(fl)), 1);
      ctx.drawImage(petal, -sz, -sz * .62, sz * 2, sz * 1.25);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // start with smoke already standing and petals already in the air
  for (var n = 0; n < 70; n++) step(n * .1, .1);
  layout();
  kit.onLayout(function () { layout(); if (kit.reduce) draw(7); });
  if (kit.reduce) { draw(7); return; }
  kit.loop(function (t, dt) { step(t + 7, dt); draw(t + 7); });
})();
