/* Casa Molina — motion + scroll film. Vanilla, no dependencies.
   Everything here is enhancement: the pages read complete without it. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var base = doc.getAttribute("data-base") || "";
  var raf = window.requestAnimationFrame.bind(window);

  /* ---------- every call / email link follows the filled-in phone and email ---------- */
  var ph = document.querySelector('[data-slot="phone"]'), em = document.querySelector('[data-slot="email"]');
  if (ph) { var tel = "tel:" + ph.textContent.replace(/[^\d+]/g, ""); document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.setAttribute("href", tel); }); }
  if (em) { var mail = "mailto:" + em.textContent.trim(); document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { a.setAttribute("href", mail); }); }

  /* ---------- header: solid after the first screen ---------- */
  var hd = document.querySelector(".hd");
  var film = document.getElementById("film");
  function headerState() {
    if (!hd) return;
    var limit = film ? film.offsetHeight - window.innerHeight - 10 : 40;
    hd.classList.toggle("solid", window.scrollY > Math.max(limit, 40));
  }

  /* ---------- mobile nav (works without JS via :target) ---------- */
  var nav = document.getElementById("nav");
  var burger = document.querySelector(".burger");
  if (nav && burger) {
    burger.addEventListener("click", function (e) {
      e.preventDefault();
      nav.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
      var first = nav.querySelector("a:not(.nav-close)");
      if (first) first.focus();
    });
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      if (a.classList.contains("nav-close")) e.preventDefault();
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.focus();
      }
    });
  }

  /* ---------- today's hours ---------- */
  var day = new Date().getDay();
  document.querySelectorAll(".hours tr[data-d]").forEach(function (tr) {
    if (tr.getAttribute("data-d").split(",").indexOf(String(day)) > -1) tr.classList.add("today");
  });

  /* ---------- request form (demo) ---------- */
  document.querySelectorAll("form[data-demo]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = f.querySelector(".sent");
      if (s) { s.classList.add("show"); s.focus(); }
      f.querySelector("button[type=submit]").disabled = true;
    });
  });

  /* ---------- living menu on home: hover / focus swaps the photo ---------- */
  var view = document.querySelector(".carta-view");
  if (view) {
    var imgs = view.querySelectorAll("img"), tag = view.querySelector(".tag");
    var links = document.querySelectorAll(".carta-list a");
    var show = function (i) {
      imgs.forEach(function (im, k) { im.classList.toggle("on", k === i); });
      links.forEach(function (a, k) { a.classList.toggle("on", k === i); });
      if (tag && links[i]) tag.textContent = links[i].getAttribute("data-tag");
    };
    links.forEach(function (a, i) {
      a.addEventListener("mouseenter", function () { show(i); });
      a.addEventListener("focus", function () { show(i); });
    });
    show(0);
  }

  /* ---------- menu page: section scroll-spy ---------- */
  var spy = document.querySelectorAll(".mnav a");
  if (spy.length && "IntersectionObserver" in window) {
    var map = {};
    spy.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io2 = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          spy.forEach(function (a) { a.classList.remove("on"); });
          var a = map[en.target.id];
          if (a) {
            a.classList.add("on");
            var strip = a.parentElement;
            var left = a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2;
            if (strip.scrollTo) strip.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" }); else strip.scrollLeft = left;
          }
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".msec[id]").forEach(function (s) { io2.observe(s); });
  }

  /* ---------- ambient loops: play only on screen, never with reduced motion ---------- */
  document.querySelectorAll("video[data-loop]").forEach(function (v) {
    if (reduce) { v.removeAttribute("autoplay"); v.pause(); return; }
    v.muted = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
      }).observe(v);
    }
  });

  if (reduce) { headerState(); window.addEventListener("scroll", headerState, { passive: true }); return; }

  /* ---------- word-by-word headings ---------- */
  document.querySelectorAll(".words").forEach(function (h) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var s = document.createElement("span"); s.textContent = part;
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(h);
    h.querySelectorAll(".w>span").forEach(function (s, i) { s.style.transitionDelay = (i * 0.045) + "s"; });
  });

  /* ---------- reveals ---------- */
  var targets = document.querySelectorAll(".rv,.wipe,.words");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  } else targets.forEach(function (t) { t.classList.add("in"); });

  /* ---------- light parallax ---------- */
  var par = Array.prototype.slice.call(document.querySelectorAll("[data-par]"));
  function parallax() {
    var vh = window.innerHeight;
    par.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var k = parseFloat(el.getAttribute("data-par")) || 0.08;
      var c = (r.top + r.height / 2 - vh / 2);
      el.style.transform = "translate3d(0," + (-c * k).toFixed(1) + "px,0)";
    });
  }

  /* ---------- the scroll film ---------- */
  var F = null;
  if (film) {
    var canvas = film.querySelector("canvas"), ctx = canvas.getContext("2d");
    var beats = film.querySelectorAll(".beat");
    var bars = film.querySelectorAll(".chap i");
    var COUNT = 120, PER = 40;
    var portrait = window.innerWidth / window.innerHeight < 0.9;
    var set = portrait ? "p" : "l";
    var frames = new Array(COUNT), cur = 0, target = 0, drawn = -1;
    var src = function (i) { var n = String(i + 1); while (n.length < 3) n = "0" + n; return base + "film/" + set + "/" + n + ".webp"; };
    // load order: first frame of each clip, then every 4th, then every 2nd, then the rest
    var order = [], seen = {};
    [0, 40, 80].forEach(function (i) { order.push(i); seen[i] = 1; });
    [4, 2, 1].forEach(function (step) {
      for (var i = 0; i < COUNT; i += step) if (!seen[i]) { order.push(i); seen[i] = 1; }
    });
    var q = 0, inflight = 0;
    var pump = function () {
      while (inflight < 6 && q < order.length) {
        (function (i) {
          var im = new Image(); inflight++;
          im.decoding = "async";
          im.onload = function () { frames[i] = im; inflight--; if (i === 0) { canvas.classList.add("ready"); drawn = -1; } pump(); };
          im.onerror = function () { inflight--; pump(); };
          im.src = src(i);
        })(order[q++]);
      }
    };
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var size = function () {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      drawn = -1;
    };
    var nearest = function (i) {
      if (frames[i]) return frames[i];
      for (var d = 1; d < PER; d++) {
        var a = i - d, b = i + d;
        if (a >= 0 && Math.floor(a / PER) === Math.floor(i / PER) && frames[a]) return frames[a];
        if (b < COUNT && Math.floor(b / PER) === Math.floor(i / PER) && frames[b]) return frames[b];
      }
      return null;
    };
    var cover = function (im, alpha) {
      var cw = canvas.width, ch = canvas.height, iw = im.naturalWidth, ih = im.naturalHeight;
      var s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    };
    var draw = function (f) {
      var a = Math.floor(f), t = f - a;
      var key = Math.round(f * 8);
      if (key === drawn) return;
      var A = nearest(a), B = a + 1 < COUNT ? nearest(a + 1) : null;
      if (!A) return;
      drawn = key;
      cover(A, 1);
      if (B && B !== A && t > 0.02) cover(B, t);
      ctx.globalAlpha = 1;
    };
    var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    // where each beat lives on the 0..1 track: [in-start, in-end, out-start, out-end]
    var windows = [[-1, 0, 0.22, 0.30], [0.34, 0.40, 0.58, 0.64], [0.69, 0.76, 2, 2]];
    F = function () {
      var r = film.getBoundingClientRect();
      var span = film.offsetHeight - window.innerHeight;
      var p = span > 0 ? ease(-r.top / span) : 0;
      target = p * (COUNT - 1);
      beats.forEach(function (b, i) {
        var w = windows[i], o;
        if (p < w[0]) o = 0; else if (p < w[1]) o = (p - w[0]) / (w[1] - w[0]);
        else if (p < w[2]) o = 1; else if (p < w[3]) o = 1 - (p - w[2]) / (w[3] - w[2]); else o = 0;
        b.style.opacity = o.toFixed(3);
        b.style.transform = "translate3d(0," + ((1 - o) * (p > w[2] ? -24 : 24)).toFixed(1) + "px,0)";
        b.style.visibility = o < 0.01 ? "hidden" : "visible";
        if (bars[i]) {
          var seg = ease((p - i / 3) * 3);
          bars[i].style.setProperty("--p", seg.toFixed(3));
        }
      });
    };
    doc.classList.add("film-on");
    beats.forEach(function (b, i) { if (i === 0) b.classList.add("first"); });
    size(); pump();
    window.addEventListener("resize", function () {
      var nowP = window.innerWidth / window.innerHeight < 0.9;
      if (nowP !== portrait) { portrait = nowP; set = portrait ? "p" : "l"; frames = new Array(COUNT); q = 0; pump(); }
      size();
    });
    var loop = function () {
      cur += (target - cur) * 0.18;
      if (Math.abs(target - cur) < 0.01) cur = target;
      draw(cur);
      raf(loop);
    };
    F(); cur = target; raf(loop);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    raf(function () { ticking = false; headerState(); parallax(); if (F) F(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
