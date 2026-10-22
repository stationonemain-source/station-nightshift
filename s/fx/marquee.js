/* Marquee hero: the bulbs chase, the way a real theatre marquee calls the street.
   - Every bulb on the board and on the tall sign is mapped onto the painted bulb beneath it. They run a
     classic three-phase chase: one bulb in three burns bright while the other two cool to clear glass,
     stepping five times a second, so the light travels clockwise round the board, up one leg of the
     sign, over the top and down the other, and down the two inner rails.
   - Incandescent filaments do not switch, they warm up and cool down: each bulb eases on and off.
     One bulb on the board and one on the sign are tired and stutter now and then, like real ones do.
   - Every dozen seconds the board stops chasing and flashes all-on, twice, then holds: the showtime
     call. While it does, the light spills a little further onto the brick, the pavement and the crowd.
   - That is the product: the name on the street that everyone turns to look at.
   - Where a bulb sits behind the paragraph or the price line, it chases faintly, so the copy stays calm.
   All positions are painting fractions (mapped from the 4K painting at 100% crop), placed through
   window.StationHeroFx exactly as hero.js places its glows.
   Reduced motion, and any page that borrows this painting behind a form: the board as painted, all
   bulbs burning, with its soft spill; nothing moves. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;

  // bulb strings in painting fractions, each in the order the chase travels
  var STRINGS = {
    sign: [[.5982,.4694],[.5982,.4542],[.5979,.439],[.5982,.4242],[.5979,.4086],[.5977,.3915],[.5979,.3749],[.5977,.3588],[.5979,.3432],[.5977,.3307],[.5977,.3169],[.5977,.3017],[.6021,.2893],[.6068,.2851],[.6107,.286],[.6128,.2985],[.613,.3141],[.613,.3284],[.6133,.3404],[.613,.3551],[.6128,.3717],[.613,.3888],[.613,.4053],[.6133,.421],[.6133,.4362],[.6133,.4505],[.6133,.4671]],
    sign3: [[.6297,.3105],[.6297,.3252],[.6299,.339],[.6297,.3542],[.6299,.3708],[.6297,.3883],[.6299,.4049],[.6299,.4201],[.6299,.4353],[.6302,.4496],[.6299,.4634]],
    loop: [[.3964,.5403],[.4005,.5357],[.4062,.5311],[.413,.5256],[.4201,.5205],[.4294,.5177],[.4404,.5159],[.4513,.5131],[.4617,.5117],[.4732,.5094],[.4841,.5071],[.4964,.5053],[.5086,.5021],[.5219,.4998],[.5344,.497],[.5458,.4947],[.5576,.4924],[.5685,.4906],[.5794,.4887],[.5914,.4869],[.6039,.4836],[.6174,.4813],[.632,.4795],[.6456,.4763],[.6586,.4731],[.6714,.4717],[.6841,.468],[.6969,.4671],[.7096,.4652],[.7221,.4625],[.7341,.4597],[.7461,.4625],[.7589,.4638],[.7719,.4694],[.782,.474],[.7917,.4786],[.7992,.4841],[.8086,.4896],[.8169,.4965],[.8232,.5007],[.8242,.52],[.824,.5371],[.8242,.5555],[.8242,.5725],[.8242,.591],[.8232,.608],[.8169,.6053],[.8089,.6025],[.8005,.5974],[.7919,.5947],[.782,.5905],[.7711,.5877],[.7589,.585],[.7461,.5813],[.7349,.5808],[.7221,.5818],[.7099,.5818],[.6964,.5841],[.6841,.5845],[.6716,.5868],[.6583,.5887],[.6464,.5891],[.6333,.5914],[.6216,.5933],[.6099,.5942],[.5977,.5951],[.5854,.5974],[.5737,.5988],[.5625,.5997],[.551,.6025],[.5398,.6025],[.5284,.6043],[.5174,.6057],[.5057,.6076],[.4956,.6089],[.4841,.6108],[.4734,.6112],[.4628,.6135],[.4516,.6149],[.4409,.6154],[.4294,.6177],[.4198,.6191],[.4138,.6223],[.4065,.6264],[.401,.6292],[.3964,.6324]],
    inL: [[.4214,.538],[.4214,.556],[.4216,.5767],[.4214,.5882],[.4216,.6011]],
    inR: [[.7339,.4804],[.7339,.5012],[.7339,.5131],[.7341,.5279],[.7341,.5417],[.7341,.5587]]
  };
  var STEP = 0.2, CYCLE = 12.6, CHASE = 9.4;   // seconds per chase step; one full cycle; chase part of it
  var R = 0.0024;                             // a bulb's radius, as a fraction of the painting's width
  var TIRED = [["loop", 23], ["sign", 7]];    // the two bulbs that stutter

  var ctx = kit.canvas(2), still = kit.reduce || kit.quiet;
  var bulbs = [], sprCore, sprGlow, sprCap, sprSpill, quietRects = [];

  // one soft round sprite, rendered once per layout (never per frame)
  function sprite(rad, stops) {
    var c = document.createElement("canvas"), s = Math.max(2, Math.ceil(rad * 2 * kit.dpr));
    c.width = c.height = s;
    var g = c.getContext("2d"), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach(function (st) { gr.addColorStop(st[0], st[1]); });
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return c;
  }
  function build() {
    var r = Math.max(1.6, R * kit.dw);
    sprCore = sprite(r * 1.5, [[0, "rgba(255,252,240,1)"], [.45, "rgba(255,246,226,.9)"], [1, "rgba(255,240,215,0)"]]);
    sprGlow = sprite(r * 5, [[0, "rgba(255,238,210,.55)"], [.3, "rgba(255,232,200,.2)"], [1, "rgba(255,228,190,0)"]]);
    // an unlit bulb: cool clear glass, darker than the painted lit one but not a hole
    sprCap = sprite(r * 1.6, [[0, "rgba(96,106,136,.95)"], [.45, "rgba(80,90,122,.85)"], [1, "rgba(70,80,112,0)"]]);
    sprSpill = sprite(100, [[0, "rgba(255,232,196,.5)"], [.45, "rgba(255,226,186,.18)"], [1, "rgba(255,220,180,0)"]]);
    // bulbs behind body copy chase faintly
    quietRects = [];
    var hr = kit.hero.getBoundingClientRect();
    Array.prototype.forEach.call(kit.hero.querySelectorAll(".copy p, .copy .lines, .copy .ctas"), function (el) {
      var b = el.getBoundingClientRect(); if (!b.width) return;
      quietRects.push([b.left - hr.left - 10, b.top - hr.top - 8, b.right - hr.left + 10, b.bottom - hr.top + 8]);
    });
    bulbs = [];
    Object.keys(STRINGS).forEach(function (k) {
      STRINGS[k].forEach(function (p, i) {
        var x = kit.X(p[0]), y = kit.Y(p[1]), soft = 1;
        quietRects.forEach(function (q) { if (x > q[0] && x < q[2] && y > q[1] && y < q[3]) soft = .35; });
        var tired = 0;
        TIRED.forEach(function (t, n) { if (t[0] === k && t[1] === i) tired = n + 1; });
        bulbs.push({ x: x, y: y, i: i, soft: soft, tired: tired, on: 1 });
      });
    });
  }

  function spill(x, y, rx, ry, a) {
    if (a <= .004) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(sprSpill, x - rx, y - ry, rx * 2, ry * 2);
  }

  // what the board is doing at time t: per-bulb target 0..1 from its index, and how "all on" it is
  function show(t) {
    var c = t % CYCLE;
    if (c < CHASE) return { step: Math.floor(t / STEP), all: 0 };
    var f = c - CHASE; // showtime: on .45, off .3, on .45, off .3, then hold on
    var on = f < .45 || (f > .75 && f < 1.2) || f > 1.5;
    return { step: -1, all: on ? 1 : 0 };
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, kit.W, kit.H);
    var s = still ? { step: -1, all: 1 } : show(t), k = dt ? Math.min(1, dt * 22) : 1, kOff = dt ? Math.min(1, dt * 12) : 1;
    var lit = 0;
    for (var n = 0; n < bulbs.length; n++) {
      var b = bulbs[n], tgt = s.step < 0 ? s.all : ((b.i - s.step) % 3 + 3) % 3 === 0 ? 1 : 0;
      if (b.tired && !still) { // a tired filament: now and then it browns out for a moment
        var q = Math.sin(t * (b.tired === 1 ? 7.3 : 5.1)) * Math.sin(t * (b.tired === 1 ? 2.9 : 3.7) + b.tired);
        if (q > .62) tgt *= .25 + .3 * Math.abs(Math.sin(t * 41));
      }
      b.on += (tgt - b.on) * (tgt > b.on ? k : kOff); // filaments warm fast, cool a touch slower
      lit += b.on;
    }
    var allness = lit / bulbs.length; // ~.33 while chasing, 1 when all on
    // the spill on the brick, the pavement and the crowd: a touch stronger when the whole board burns
    ctx.globalCompositeOperation = "lighter";
    var sp = still ? .55 : .25 + .75 * Math.max(0, (allness - .33) / .67);
    spill(kit.X(.60), kit.Y(.67), .30 * kit.dw, .085 * kit.dw, .16 * sp);
    spill(kit.X(.60), kit.Y(.79), .26 * kit.dw, .05 * kit.dw, .12 * sp);
    spill(kit.X(.605), kit.Y(.40), .045 * kit.dw, .14 * kit.dw, .07 * sp);
    if (still) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; return; } // the painted bulbs already burn
    // unlit glass first (over the painted lit bulb), then the burning ones on top
    ctx.globalCompositeOperation = "source-over";
    var r = Math.max(1.6, R * kit.dw), rc = r * 1.6, rg = r * 5, rk = r * 1.5;
    for (n = 0; n < bulbs.length; n++) {
      b = bulbs[n];
      var off = (1 - b.on) * (.25 + .5 * b.soft);
      if (off > .01) { ctx.globalAlpha = off; ctx.drawImage(sprCap, b.x - rc, b.y - rc, rc * 2, rc * 2); }
    }
    ctx.globalCompositeOperation = "lighter";
    for (n = 0; n < bulbs.length; n++) {
      b = bulbs[n];
      if (b.on < .02) continue;
      var a = b.on * (b.soft < 1 ? .45 : 1);
      ctx.globalAlpha = a * .85; ctx.drawImage(sprGlow, b.x - rg, b.y - rg, rg * 2, rg * 2);
      ctx.globalAlpha = a; ctx.drawImage(sprCore, b.x - rk, b.y - rk, rk * 2, rk * 2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  kit.onLayout(function () { build(); if (still) draw(0, 0); });
  build();
  if (still) { draw(0, 0); return; }
  kit.loop(draw);
})();
