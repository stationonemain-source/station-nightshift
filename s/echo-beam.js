/* Echo hero: the lighthouse keeps turning.
   - Two beams back to back, like a real rotating lens seen from the side: each sweeps out across
     the fields to the right, swings toward you (shortening, widening, flooding the foreground, a
     flash at the lamp when it faces you), carries on to the left and fades behind the tower.
     One turn every 14 seconds, so a beam comes round every 7.
   - Where the beam meets the land it leaves a soft pool of light, and each time it passes the
     shop the shop is found: its front washes bright for a moment.
   - The painting has no beam of its own; these are the only ones. Positions are fractions of the
     painting, mapped through object-fit:cover exactly as hero.js maps its glows.
   Reduced motion, and the free-audit page: one still beam resting on the shop, as the old painting had it. */
(function () {
  var hero = document.querySelector(".phero");
  var img = hero && hero.querySelector(".art img");
  if (!img || !window.requestAnimationFrame) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // the free-audit page borrows this painting, but its lamp sits behind the checklist above the form:
  // there the beam holds still, so nothing moves behind text people are reading
  var quiet = hero.classList.contains("skin-hero");
  if (quiet) reduce = true;

  var LAMP = [.352, .338], SHOP = [.718, .676], HORIZON = .522, PERIOD = 14;
  var parent = hero.querySelector(".hero-fx") || hero;
  var cv = document.createElement("canvas");
  cv.className = "beam"; cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1";
  parent.appendChild(cv);
  var ctx = cv.getContext("2d");

  var W = 0, H = 0, dpr = 1, dw = 1, dh = 1, ox = 0, oy = 0;
  function layout() {
    W = hero.clientWidth; H = hero.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var nw = img.naturalWidth || 3840, nh = img.naturalHeight || 2171;
    var s = Math.max(W / nw, H / nh); dw = nw * s; dh = nh * s;
    var pos = getComputedStyle(img).objectPosition.split(" ");
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || "50") / 100;
    if (isNaN(px)) px = .5; if (isNaN(py)) py = .5;
    ox = (W - dw) * px; oy = (H - dh) * py;
    if (reduce) draw(.45, 0);
  }
  function X(f) { return ox + f * dw; }
  function Y(f) { return oy + f * dh; }

  // one soft cone from (x,y) to (ex,ey): root half-width r0, end half-width r1, alpha a at the lamp
  function cone(x, y, ex, ey, r0, r1, a) {
    var dx = ex - x, dy = ey - y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    var g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, "rgba(226,236,255," + a.toFixed(3) + ")");
    g.addColorStop(.45, "rgba(214,228,255," + (a * .5).toFixed(3) + ")");
    g.addColorStop(1, "rgba(206,222,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + nx * r0, y + ny * r0); ctx.lineTo(ex + nx * r1, ey + ny * r1);
    ctx.lineTo(ex - nx * r1, ey - ny * r1); ctx.lineTo(x - nx * r0, y - ny * r0);
    ctx.closePath(); ctx.fill();
  }
  function blob(x, y, rx, ry, rgb, a) {
    if (a <= .003) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")");
    g.addColorStop(.4, "rgba(" + rgb + "," + (a * .35).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
  }

  var found = 0;
  // one beam's geometry: far end on screen, strength, end width, and whether it is on the shop.
  // Sideways it reaches across the fields; turned toward you it drops into the foreground;
  // turned away it shrinks to almost nothing behind the lamp.
  function beam(th, lx, ly) {
    var c = Math.cos(th), s = Math.sin(th), front = Math.max(0, s);
    var ex = lx + c * .52 * dw, ey = ly + (.15 + .23 * s) * dw;
    var I = s >= 0 ? .55 + .45 * Math.pow(s, .8) : .55 * (1 + s * .85);
    I *= .96 + .04 * Math.sin(th * 23); // a little haze shimmer
    var r1 = (.042 + .07 * front) * dw;
    var sx = X(SHOP[0]), sy = Y(SHOP[1]);
    var aB = Math.atan2(ey - ly, ex - lx), aS = Math.atan2(sy - ly, sx - lx);
    var lenB = Math.hypot(ex - lx, ey - ly), lenS = Math.hypot(sx - lx, sy - ly);
    var half = Math.atan2(r1, lenB) * 1.15, d = Math.abs(Math.atan2(Math.sin(aB - aS), Math.cos(aB - aS)));
    return { ex: ex, ey: ey, I: I, r1: r1, front: front, hit: d < half && lenB > lenS * .9 ? 1 - d / half : 0 };
  }
  function draw(th, dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    var lx = X(LAMP[0]), ly = Y(LAMP[1]), hy = Y(HORIZON);
    // two lenses back to back, like most real lights: one beam is always on its way round to you
    var bs = [beam(th, lx, ly), beam(th + Math.PI, lx, ly)], hit = 0, f = 0;
    bs.forEach(function (b) {
      if (quiet) b.I *= .55;
      cone(lx, ly, b.ex, b.ey, .007 * dw, b.r1, .3 * b.I);
      cone(lx, ly, b.ex, b.ey, .004 * dw, b.r1 * .55, .34 * b.I);
      cone(lx, ly, b.ex, b.ey, .002 * dw, b.r1 * .22, .4 * b.I);
      if (b.ey > hy) blob(b.ex, b.ey, b.r1 * 1.5, b.r1 * .5, "214,228,255", .3 * b.I * Math.min(1, (b.ey - hy) / (.04 * dw)));
      hit = Math.max(hit, b.hit); f = Math.max(f, Math.pow(b.front, 14));
    });
    // the shop is found when a beam passes over it
    var sx = X(SHOP[0]), sy = Y(SHOP[1]);
    found = dt ? found + (hit - found) * Math.min(1, dt * (hit > found ? 9 : 1.4)) : hit;
    blob(sx, sy, .1 * dw, .06 * dw, "255,236,205", .55 * found);
    blob(sx, sy + .012 * dw, .06 * dw, .022 * dw, "255,226,180", .4 * found);
    // the lamp: always lit, and a flash when a beam faces you
    if (quiet) { ctx.globalCompositeOperation = "source-over"; return; } // the painted lamp glows on its own
    blob(lx, ly, .02 * dw, .02 * dw, "255,244,226", .8);
    blob(lx, ly, (.05 + .18 * f) * dw, (.05 + .18 * f) * dw, "230,238,255", .16 + .6 * f);
    if (f > .01) { ctx.fillStyle = "rgba(200,215,255," + (.08 * f).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = "source-over";
  }

  function start() {
    layout();
    window.addEventListener("resize", layout);
    if (reduce) return;
    var t0 = performance.now(), last = 0, visible = true, running = false;
    function frame(now) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      // starts just before the shop, so the first thing a visitor sees is the light finding it
      draw(.2 + (now - t0) / 1000 / PERIOD * 6.2832, dt);
      requestAnimationFrame(frame);
    }
    function go() { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) go(); }).observe(hero);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) go(); });
    go();
  }
  if (img.complete && img.naturalWidth) start(); else img.addEventListener("load", start);
})();
