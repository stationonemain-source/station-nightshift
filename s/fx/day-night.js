/* Frontdesk hero: a wet night on Main Street, and the one lit office still answers.
   - It is raining: fine, fast streaks falling a little slanted on the wind. Far rain is many short,
     faint, slower streaks; a few near drops are long and quick. Drops that fall through the office
     light catch it and turn warm. Behind the headline the rain thins, so the words stay clear.
   - Where the rain lands on the road it rings: small ripples, small and flat in the distance, wider
     near you, and only as bright as the light they reflect, so they show in the window's golden
     reflection and the moon's, and almost vanish on the dark tarmac. Only on the road, never on the
     pavement or the cars.
   - The reflections of the lit window, the door and the moonlight shimmer in the wet road: the
     painted reflection itself is redrawn in thin rows that sway, as rain-pocked water does.
   - Every nine seconds the office takes a call: one soft ring pulses out from the phone on the desk,
     then the window's light warms and steadies, and so does its reflection. Answered, at 2 AM too.
   All positions are painting fractions (mapped on the 4K painting), placed through
   window.StationHeroFx exactly as hero.js places its glows.
   Reduced motion, and any page that borrows this painting behind a form: one still frame of rain
   against the street and the office answered, warm; nothing moves. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;

  var PHONE = [.4844, .7232], WIN = [.461, .697], ROAD = [.868, .998];
  var SHIMMER = [[.355, .655], [.735, .84]];     // x-ranges of road under lit things (window + door, moon)
  var CALL = 9, WIND = .15;                      // seconds between calls; horizontal drift per unit fall

  var ctx = kit.canvas(2), still = kit.reduce || kit.quiet;
  var drops = [], ripples = [], refl = [], copyR = null, warmS, sample = null, sw = 0, sh = 0, spawn = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function blobSprite(rgb) {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(" + rgb + ",.9)"); gr.addColorStop(.4, "rgba(" + rgb + ",.35)"); gr.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
  }
  function blob(x, y, rx, ry, a) {
    if (a <= .004) return;
    ctx.globalAlpha = Math.min(1, a); ctx.drawImage(warmS, x - rx, y - ry, rx * 2, ry * 2);
  }
  // the painting, small, so a ripple knows how much light is on the water where it lands
  function lum(fx, fy) {
    if (!sample) return [.1, 120, 140, 180];
    var x = Math.max(0, Math.min(sw - 1, Math.round(fx * sw))), y = Math.max(0, Math.min(sh - 1, Math.round(fy * sh)));
    var i = (y * sw + x) * 4, r = sample[i], g = sample[i + 1], b = sample[i + 2];
    return [(r * .3 + g * .55 + b * .15) / 255, r, g, b];
  }

  function drop(layer, anyY) {
    var near = layer === 1;
    return { near: near, x: rnd(-.1 * kit.W, kit.W), y: anyY ? rnd(-.1 * kit.H, kit.H) : rnd(-.25 * kit.H, -.02 * kit.H),
      len: near ? rnd(44, 80) : rnd(12, 22), v: near ? rnd(1500, 1900) : rnd(620, 820) };
  }

  function build() {
    if (!warmS) warmS = blobSprite("255,214,160");
    var area = kit.W * kit.H / (1440 * 860), nFar = Math.round(560 * area), nNear = Math.max(8, Math.round(40 * area));
    drops = [];
    for (var i = 0; i < nFar; i++) drops.push(drop(0, true));
    for (i = 0; i < nNear; i++) drops.push(drop(1, true));
    ripples = [];
    var hr = kit.hero.getBoundingClientRect(), c = kit.hero.querySelector(".copy");
    copyR = null;
    if (c) { var b = c.getBoundingClientRect(); copyR = [b.left - hr.left - 20, b.top - hr.top - 20, b.right - hr.left + 20, b.bottom - hr.top + 10]; }
    try {
      var sc = document.createElement("canvas"); sw = 240; sh = Math.round(240 * kit.img.naturalHeight / kit.img.naturalWidth);
      sc.width = sw; sc.height = sh; var sg = sc.getContext("2d"); sg.drawImage(kit.img, 0, 0, sw, sh);
      sample = sg.getImageData(0, 0, sw, sh).data;
    } catch (e) { sample = null; }
    // the painted reflections, copied once with feathered edges, to be redrawn in swaying rows
    refl = [];
    var d = kit.dpr;
    SHIMMER.forEach(function (s) {
      var x0 = kit.X(s[0]), x1 = kit.X(s[1]), y0 = kit.Y(ROAD[0]), y1 = Math.min(kit.H, kit.Y(ROAD[1]));
      if (x1 < 0 || x0 > kit.W || y1 <= y0) return;
      var w = Math.ceil((x1 - x0) * d), h = Math.ceil((y1 - y0) * d);
      var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      var g = cv.getContext("2d");
      // whole painting, offset so only this strip lands (a srcset image's natural size is density-corrected,
      // so source rectangles in natural px would point at the wrong place)
      g.drawImage(kit.img, -s[0] * kit.dw * d, -ROAD[0] * kit.dh * d, kit.dw * d, kit.dh * d);
      g.globalCompositeOperation = "destination-in";
      var gx = g.createLinearGradient(0, 0, w, 0);
      gx.addColorStop(0, "rgba(0,0,0,0)"); gx.addColorStop(.12, "rgba(0,0,0,1)"); gx.addColorStop(.88, "rgba(0,0,0,1)"); gx.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gx; g.fillRect(0, 0, w, h);
      var gy = g.createLinearGradient(0, 0, 0, h);
      gy.addColorStop(0, "rgba(0,0,0,0)"); gy.addColorStop(.12, "rgba(0,0,0,1)"); gy.addColorStop(1, "rgba(0,0,0,1)");
      g.fillStyle = gy; g.fillRect(0, 0, w, h);
      refl.push({ cv: cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    });
  }

  function inCopy(x, y) { return copyR && x > copyR[0] && x < copyR[2] && y > copyR[1] && y < copyR[3]; }
  function warmAt(x, y) { // how much of the office light a drop is falling through
    var dx = (x - kit.X(WIN[0])) / (.16 * kit.dw), dy = (y - kit.Y(WIN[1] + .03)) / (.12 * kit.dw);
    return dx * dx + dy * dy < 1;
  }

  // the call: 0 ring, ~1.2 answered (light warms), holds, eases back before the next one
  function call(t) {
    var c = t % CALL, ring = c < 1.6 ? c / 1.6 : -1;
    var warm = c < 1.1 ? 0 : c < 1.7 ? (c - 1.1) / .6 : c < 6 ? 1 : c < 8.2 ? 1 - (c - 6) / 2.2 : 0;
    return { ring: ring, warm: warm * warm * (3 - 2 * warm) };
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    var dw = kit.dw, i, r;

    // 1. the reflections shimmer: thin rows of the painted reflection, each swayed a little
    if (!still) for (r = 0; r < refl.length; r++) {
      var R = refl[r], rows = Math.ceil(R.h / 2), sy = R.cv.height / R.h;
      for (i = 0; i < rows; i++) {
        var y = i * 2, p = y / R.h, amp = (.8 + 3.2 * p) * dw / 1500;
        var dx = amp * (Math.sin(t * 2.3 + y * .37 + r) + .6 * Math.sin(t * 3.9 - y * .91));
        ctx.drawImage(R.cv, 0, y * sy, R.cv.width, 2 * sy, R.x + dx, R.y + y, R.w, 2);
      }
    }

    // 2. the call: a ring from the phone, then the office light warms and steadies
    var c = still ? { ring: -1, warm: 1 } : call(t);
    ctx.globalCompositeOperation = "lighter";
    var wx = kit.X(WIN[0]), wy = kit.Y(WIN[1]);
    blob(wx, wy, .12 * dw, .07 * dw, .34 * c.warm);
    blob(kit.X(.522), kit.Y(.695), .025 * dw, .025 * dw, .22 * c.warm); // the lamp
    blob(wx + .01 * dw, kit.Y(.93), .13 * dw, .04 * dw, .2 * c.warm);   // and its reflection in the road
    if (c.ring >= 0) {
      var e = 1 - Math.pow(1 - c.ring, 3), px = kit.X(PHONE[0]), py = kit.Y(PHONE[1]);
      blob(px, py, .012 * dw, .012 * dw, .55 * (1 - c.ring));
      var ra = (1 - c.ring) * (1 - c.ring), rad = (.006 + .07 * e) * dw, lw = dw / 1500;
      ctx.strokeStyle = "rgb(255,214,160)";
      ctx.globalAlpha = .16 * ra; ctx.lineWidth = Math.max(3, 9 * lw);  // a soft halo of light round the ring
      ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = .5 * ra; ctx.lineWidth = Math.max(1, (2 - c.ring) * lw);
      ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.2832); ctx.stroke();
    }

    // 3. ripples on the road, as bright as the light they catch
    ctx.globalCompositeOperation = "source-over";
    if (!still) {
      spawn += dt * 70 * kit.W / 1440;
      while (spawn >= 1) {
        spawn -= 1;
        var fy = ROAD[0] + Math.pow(Math.random(), .8) * (ROAD[1] - ROAD[0]), fx = (Math.random() * kit.W - kit.ox) / kit.dw; // only where you can see
        var X = kit.X(fx), Y = kit.Y(fy);
        if (X < -10 || X > kit.W + 10 || Y > kit.H) continue;
        var L = lum(fx, fy), pp = (fy - ROAD[0]) / (ROAD[1] - ROAD[0]);
        ripples.push({ x: X, y: Y, age: 0, life: rnd(.45, .7), rm: (.0045 + .012 * pp) * dw * rnd(.7, 1.2), fl: .2 + .14 * pp,
          a: Math.min(.9, .3 + 3 * L[0] * L[0]), col: "rgb(" + Math.min(255, L[1] * 1.3 + 90 | 0) + "," + Math.min(255, L[2] * 1.3 + 90 | 0) + "," + Math.min(255, L[3] * 1.2 + 90 | 0) + ")" });
      }
      ctx.lineWidth = Math.max(1, kit.dw / 1500);
      for (i = ripples.length - 1; i >= 0; i--) {
        var q = ripples[i]; q.age += dt;
        if (q.age >= q.life) { ripples.splice(i, 1); continue; }
        var k = q.age / q.life, rr = q.rm * (1 - Math.pow(1 - k, 2));
        ctx.globalAlpha = q.a * (1 - k); ctx.strokeStyle = q.col;
        ctx.beginPath(); ctx.ellipse(q.x, q.y, rr + .5, (rr + .5) * q.fl, 0, 0, 6.2832); ctx.stroke();
        if (k > .25) { // the second, smaller ring a real drop leaves behind the first
          var r2 = rr * .55; ctx.globalAlpha = q.a * .6 * (1 - k);
          ctx.beginPath(); ctx.ellipse(q.x, q.y, r2 + .5, (r2 + .5) * q.fl, 0, 0, 6.2832); ctx.stroke();
        }
        if (k < .15) { ctx.globalAlpha = q.a * (1 - k / .15); ctx.fillStyle = q.col; ctx.fillRect(q.x - 1, q.y - 1, 2, 1.5); } // the splash
      }
    }

    // 4. the rain, in front of everything: batched by depth, tone, and whether it is behind the headline
    var paths = [[], [], [], []], fall = still ? 0 : 1; // far cool, far warm, near cool, near warm
    for (i = 0; i < drops.length; i++) {
      var D = drops[i];
      if (fall) {
        D.y += D.v * dt; D.x += D.v * dt * WIND;
        if (D.y - D.len > kit.H || D.x > kit.W + 40) { var n = drop(D.near ? 1 : 0, false); D.x = n.x; D.y = n.y; D.len = n.len; D.v = n.v; }
      }
      var b = (D.near ? 2 : 0) + (warmAt(D.x, D.y) ? 1 : 0);
      paths[b].push(D, inCopy(D.x, D.y));
    }
    var styles = [["rgb(196,212,240)", .3, 1.1], ["rgb(255,214,165)", .34, 1], ["rgb(206,220,244)", .36, 1.4], ["rgb(255,218,172)", .4, 1.3]];
    for (var s = 0; s < 4; s++) for (var quiet = 0; quiet < 2; quiet++) {
      var P = paths[s], any = false;
      ctx.beginPath();
      for (i = 0; i < P.length; i += 2) {
        if (P[i + 1] !== !!quiet) continue;
        var d = P[i]; any = true;
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * WIND, d.y - d.len);
      }
      if (!any) continue;
      ctx.strokeStyle = styles[s][0]; ctx.lineWidth = styles[s][2]; ctx.globalAlpha = styles[s][1] * (quiet ? .4 : 1) * (still ? .8 : 1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  kit.onLayout(function () { build(); if (still) draw(0, 0); });
  build();
  if (still) { draw(0, 0); return; }
  kit.loop(draw);
})();
