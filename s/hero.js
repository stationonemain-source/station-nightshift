/* Station painted heroes, brought to life quietly.
   - The painting settles on load, then breathes and drifts very slowly; a little depth on scroll,
     and on desktop it leans a few pixels away from the pointer.
   - Night and dusk paintings: only the lights that are already painted (a window, a star, a lamp)
     glow softly, each on its own slow rhythm. Positions are fractions of the painting and are mapped
     through object-fit:cover, so they stay on their window at every screen size.
   - Day paintings: a soft cloud shadow passes over the land.
   Config: <section class="phero" data-fx='{"mood":"night","g":[[x,y,r,"warm"],...]}'>
   Reduced motion: no movement at all; the glows stay as still light. */
(function () {
  var hero = document.querySelector(".phero[data-fx]");
  if (!hero) return;
  var cfg; try { cfg = JSON.parse(hero.getAttribute("data-fx")); } catch (e) { return; }
  var img = hero.querySelector(".art img");
  if (!img) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var COL = { warm: "255,205,170", cool: "200,222,255", teal: "130,235,210", white: "245,247,255" };

  var fx = document.createElement("div");
  fx.className = "hero-fx"; fx.setAttribute("aria-hidden", "true");
  img.parentNode.parentNode.insertBefore(fx, img.parentNode.nextSibling);
  var glows = (cfg.g || []).map(function (g, i) {
    var el = document.createElement("i");
    el.className = "hg";
    el.style.setProperty("--c", COL[g[3]] || COL.warm);
    el.style.setProperty("--d", (5.5 + (i * 1.7) % 4).toFixed(1) + "s");
    el.style.setProperty("--dl", (-(i * 2.3) % 6).toFixed(1) + "s");
    if (g[4]) el.style.setProperty("--peak", g[4]);
    fx.appendChild(el);
    return { el: el, x: g[0], y: g[1], r: g[2] };
  });
  if (cfg.mood === "day" && !reduce) {
    ["cs1", "cs2"].forEach(function (k) { var c = document.createElement("i"); c.className = "cs " + k; fx.appendChild(c); });
  }

  function place() {
    var W = hero.clientWidth, H = hero.clientHeight;
    var nw = img.naturalWidth || 2400, nh = img.naturalHeight || 1357;
    var s = Math.max(W / nw, H / nh), dw = nw * s, dh = nh * s;
    var pos = getComputedStyle(img).objectPosition.split(" ");
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || "50") / 100;
    if (isNaN(px)) px = .5; if (isNaN(py)) py = .5;
    var ox = (W - dw) * px, oy = (H - dh) * py;
    glows.forEach(function (g) {
      var size = Math.max(18, g.r * dw);
      g.el.style.width = g.el.style.height = size + "px";
      g.el.style.left = (ox + g.x * dw - size / 2) + "px";
      g.el.style.top = (oy + g.y * dh - size / 2) + "px";
    });
  }
  if (img.complete) place(); else img.addEventListener("load", place);
  window.addEventListener("resize", place);
  hero.classList.add("fx-on");

  /* Painting effects. A painting listed in EFFECTS gets /s/fx/<painting>.js wherever it hangs, so a
     page that borrows a product's painting gets that product's motion too. The effect builds on
     window.StationHeroFx: painting fractions -> pixels (same object-fit:cover maths as the glows),
     a DPR-sized canvas inside .hero-fx (so it drifts with the painting), and a loop that sleeps when
     the hero is off screen or the tab is hidden. kit.quiet is true on pages where the hero sits
     behind a form or checklist (.skin-hero): effects hold still or stay faint there. kit.reduce is
     the visitor's reduced-motion setting: draw one still frame, never loop. */
  var EFFECTS = ["agency-studio", "day-night", "repute", "marquee", "slate", "dial", "radar", "security", "revive", "tap", "storefront", "greet"];
  var art = (img.getAttribute("src") || "").split("/").pop().split("?")[0].replace(/(-1600|-4k|-m)?\.webp$/, "");
  if (EFFECTS.indexOf(art) >= 0) {
    var kit = window.StationHeroFx = { hero: hero, img: img, fx: fx, art: art, reduce: reduce, quiet: hero.classList.contains("skin-hero"),
      W: 0, H: 0, dw: 1, dh: 1, ox: 0, oy: 0, dpr: 1, _lay: [], _cvs: [] };
    kit.X = function (f) { return kit.ox + f * kit.dw; };
    kit.Y = function (f) { return kit.oy + f * kit.dh; };
    kit.layout = function () {
      kit.W = hero.clientWidth; kit.H = hero.clientHeight; kit.dpr = Math.min(2, window.devicePixelRatio || 1);
      var nw = img.naturalWidth || 3840, nh = img.naturalHeight || 2172, s = Math.max(kit.W / nw, kit.H / nh);
      kit.dw = nw * s; kit.dh = nh * s;
      var pos = getComputedStyle(img).objectPosition.split(" "), px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || "50") / 100;
      if (isNaN(px)) px = .5; if (isNaN(py)) py = .5;
      kit.ox = (kit.W - kit.dw) * px; kit.oy = (kit.H - kit.dh) * py;
      kit._cvs.forEach(function (c) { c.width = Math.round(kit.W * kit.dpr); c.height = Math.round(kit.H * kit.dpr); c.getContext("2d").setTransform(kit.dpr, 0, 0, kit.dpr, 0, 0); });
      kit._lay.forEach(function (f) { f(); });
    };
    kit.onLayout = function (f) { kit._lay.push(f); };
    kit.canvas = function (z) { // a full-hero canvas; draw in CSS pixels, it is already DPR-scaled
      var c = document.createElement("canvas"); c.setAttribute("aria-hidden", "true");
      c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:" + (z || 1);
      fx.appendChild(c); kit._cvs.push(c); kit.layout(); return c.getContext("2d");
    };
    kit.loop = function (fn) { // fn(t seconds since start, dt seconds); never runs under reduced motion
      if (reduce) return;
      var t0 = performance.now(), last = 0, on = true, running = false;
      function f(now) { if (!on || document.hidden) { running = false; return; } var dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; fn((now - t0) / 1000, dt); requestAnimationFrame(f); }
      function go() { if (!running) { running = true; last = 0; requestAnimationFrame(f); } }
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) go(); }).observe(hero);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) go(); });
      go();
    };
    window.addEventListener("resize", function () { kit.layout(); });
    // wait for real pixel sizes; a srcset swap can leave complete=true with no size yet, so poll as well
    var loaded = false, tries = 0, load = function () {
      if (loaded || !img.naturalWidth) { if (!loaded && tries++ < 40) setTimeout(load, 250); return; }
      loaded = true; kit.layout();
      var s = document.createElement("script"); s.src = "/s/fx/" + art + ".js?v=20261022a"; document.body.appendChild(s);
    };
    img.addEventListener("load", load); load();
  }
  if (reduce) return;

  var t0 = performance.now(), mx = 0, my = 0, tx = 0, ty = 0, visible = true;
  if (finePointer) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * -2;
      ty = ((e.clientY - r.top) / r.height - .5) * -2;
    });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; });
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(hero);
  }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function frame(now) {
    if (!visible) return;
    var t = (now - t0) / 1000;
    var settle = Math.min(1, t / 2.6);
    var scale = 1.055 - .03 * ease(settle) + .008 * Math.sin(t / 9);
    var drift = 6 * Math.sin(t / 13);
    mx += (tx - mx) * .04; my += (ty - my) * .04;
    var sy = Math.min(window.scrollY, hero.offsetHeight) * .16;
    var tr = "translate3d(" + (drift + mx * 8).toFixed(2) + "px," + (sy + my * 6).toFixed(2) + "px,0) scale(" + scale.toFixed(4) + ")";
    img.style.transform = tr; fx.style.transform = tr;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
