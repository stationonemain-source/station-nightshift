/* Front page, Halloween (17 Oct - 1 Nov, the visitor's own date): the same corner studio, gone quietly autumnal.
   - The Halloween painting (agency-studio-halloween*.webp: jack-o'-lanterns at the door and in the window, a
     rust-red tree, fallen leaves, a thin moon) fades in over the everyday one, so the page loads as usual and
     the season settles over it. Outside the window nothing loads and the everyday painting stays.
   - The jack-o'-lanterns and the door candle flicker like real candlelight (each its own uneven rhythm).
   - Now and then a leaf lets go of the corner tree and tumbles down onto the pavement.
   - Every so often two or three small bats cross the far sky on the right, well away from the headline.
   Subtle on purpose: nothing crosses the words, nothing is cartoonish, it is still Station's street.
   Testing: ?season=halloween forces it on, ?season=off forces it off.
   Reduced motion: the Halloween painting, lit pumpkins, nothing moving. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;
  if (location.pathname !== "/" && location.pathname !== "/index.html") return;
  var q = (location.search.match(/[?&]season=([a-z]+)/) || [])[1];
  var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  var on = q ? q === "halloween" : (m === 10 && day >= 17) || (m === 11 && day <= 1);
  if (!on) return;

  // the Halloween painting, laid over the everyday one in the same <picture> (so the headline's shading stays
  // on top of it); it copies the everyday painting's slow pan and zoom every frame
  var src = kit.img.getAttribute("src").replace("agency-studio", "agency-studio-halloween");
  var set = (kit.img.getAttribute("srcset") || "").replace(/agency-studio/g, "agency-studio-halloween");
  var over = document.createElement("img");
  over.alt = ""; over.setAttribute("aria-hidden", "true"); over.decoding = "async";
  over.sizes = kit.img.getAttribute("sizes") || "100vw";
  if (set) over.srcset = set;
  over.src = src;
  over.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;opacity:0;pointer-events:none;transition:opacity " + (kit.reduce ? "0s" : "1.6s") + " ease";
  function pos() { over.style.objectPosition = getComputedStyle(kit.img).objectPosition; }
  pos(); kit.onLayout(pos);
  kit.img.parentNode.appendChild(over);
  kit.loop(function () { over.style.transform = kit.img.style.transform; });

  var ctx = kit.canvas(1), lit = 0;
  // candle points, painting fractions: [x, y, glow radius (of dw), base strength]
  var FLAMES = [[.317, .758, .022, .55], [.370, .826, .03, .7], [.393, .815, .014, .85], [.441, .813, .026, .62]];
  var leaves = [], bats = [], nextLeaf = 1.5, nextBats = 4;

  function flicker(t, i) { // uneven candlelight: two slow waves and a fast shiver, never fully dark
    return .78 + .12 * Math.sin(t * 2.3 + i * 1.7) + .07 * Math.sin(t * 5.9 + i * 3.1) + .05 * Math.sin(t * 13.7 + i * 5.3);
  }
  function glow(x, y, r, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,190,120," + (a * .55).toFixed(3) + ")");
    g.addColorStop(.35, "rgba(255,160,90," + (a * .22).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,150,80,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
  function leaf(l) {
    ctx.save(); ctx.translate(kit.X(l.x), kit.Y(l.y)); ctx.rotate(l.rot); ctx.scale(Math.cos(l.flip), 1);
    var s = l.s * kit.dw;
    ctx.fillStyle = l.c; ctx.globalAlpha = l.a;
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(-s * .2, -s * .62, s, 0); ctx.quadraticCurveTo(-s * .2, s * .62, -s, 0); ctx.fill();
    ctx.restore();
  }
  function bat(b, t) {
    var x = kit.X(b.x), y = kit.Y(b.y + .006 * Math.sin(t * 2.2 + b.ph)), s = b.s * kit.dw;
    var w = Math.sin(t * b.f + b.ph); // wingbeat
    ctx.fillStyle = "rgba(28,30,44,.82)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - s * .5, y - s * (.15 + .55 * w), x - s, y - s * .1 * w);
    ctx.quadraticCurveTo(x - s * .55, y + s * .05, x, y + s * .18);
    ctx.quadraticCurveTo(x + s * .55, y + s * .05, x + s, y - s * .1 * w);
    ctx.quadraticCurveTo(x + s * .5, y - s * (.15 + .55 * w), x, y);
    ctx.fill();
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    ctx.globalCompositeOperation = "lighter";
    FLAMES.forEach(function (f, i) { glow(kit.X(f[0]), kit.Y(f[1]), f[2] * kit.dw, f[3] * lit * (kit.reduce ? .85 : flicker(t, i))); });
    ctx.globalCompositeOperation = "source-over";
    if (kit.reduce) return;
    // leaves: let go of the corner tree, flutter down, settle on the pavement and fade
    if (t > nextLeaf) {
      nextLeaf = t + 1.2 + Math.random() * 2.6;
      if (leaves.length < 9) leaves.push({ x: .02 + Math.random() * .13, y: .18 + Math.random() * .3, vx: .012 + Math.random() * .014,
        vy: .026 + Math.random() * .016, rot: Math.random() * 6, vr: (Math.random() - .5) * 3, flip: Math.random() * 6, vf: 2 + Math.random() * 3,
        s: .0045 + Math.random() * .0025, a: 0, life: 0, c: ["#8E2F1C", "#A5442A", "#7A2A1E", "#B4572F"][(Math.random() * 4) | 0],
        floor: .84 + Math.random() * .06 });
    }
    leaves = leaves.filter(function (l) {
      l.life += dt;
      var landed = l.y >= l.floor;
      if (!landed) { l.x += (l.vx + .01 * Math.sin(l.life * 1.7)) * dt; l.y += l.vy * dt * (.8 + .4 * Math.sin(l.life * 2.6)); l.rot += l.vr * dt; l.flip += l.vf * dt; }
      else { l.land = (l.land || 0) + dt; l.flip = 0; }
      l.a = Math.min(1, l.life * 2) * (landed ? Math.max(0, 1 - l.land / 3) : 1) * .95;
      leaf(l);
      return !landed || l.land < 3;
    });
    // bats: a small group now and then, far off in the right-hand sky
    if (t > nextBats) {
      nextBats = t + 7 + Math.random() * 7;
      var n = 2 + ((Math.random() * 2) | 0), y0 = .1 + Math.random() * .16, dir = Math.random() < .5 ? 1 : -1;
      for (var i = 0; i < n; i++) bats.push({ x: dir > 0 ? .64 - i * .025 : 1.02 + i * .025, y: y0 + (Math.random() - .5) * .04, vx: dir * (.045 + Math.random() * .012),
        s: .0055 + Math.random() * .002, f: 15 + Math.random() * 5, ph: Math.random() * 6 });
    }
    bats = bats.filter(function (b) { b.x += b.vx * dt; bat(b, t); return b.x > .56 && b.x < 1.05; });
  }

  function reveal() { over.style.opacity = "1"; var t0 = performance.now(); (function ramp() { lit = Math.min(1, (performance.now() - t0) / 1600); if (kit.reduce) draw(0, 0); if (lit < 1) requestAnimationFrame(ramp); })(); }
  if (over.complete && over.naturalWidth) reveal(); else over.addEventListener("load", reveal);
  kit.onLayout(function () { if (kit.reduce) draw(0, 0); });
  kit.loop(draw);
})();
