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
