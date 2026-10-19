/* Station pricing cards. The 21st.dev "pricing-section" (React + motion + NumberFlow) rebuilt
   without a framework: blur-in stagger as the cards arrive, a Monthly / Yearly switch whose blue
   pill springs between the options, and prices that roll digit by digit.
   Checkout stays in v5.js: the switch carries the .bterm class, so v5 swaps each button's
   Stripe price id (data-m-id / data-y-id) and words the "billed today" note. This file only
   animates. */
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COL = "<b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b>";

  function roll(el, txt, instant) {
    var old = (el.getAttribute("data-v") || "").replace(/\D/g, "").split("").reverse();
    el.setAttribute("data-v", txt);
    var total = txt.replace(/\D/g, "").length, seen = 0, html = '<span class="sr">' + txt + "</span>";
    txt.split("").forEach(function (c) {
      if (/\d/.test(c)) {
        var fromRight = total - 1 - seen; seen++;
        var start = instant ? c : (old[fromRight] !== undefined ? old[fromRight] : "0");
        html += '<span class="dg" aria-hidden="true"><span data-to="' + c + '" style="transform:translateY(-' + start + 'em)">' + COL + "</span></span>";
      } else {
        html += '<span class="dc" aria-hidden="true">' + c + "</span>";
      }
    });
    el.innerHTML = html;
    var cols = el.querySelectorAll(".dg>span");
    function settle() { cols.forEach(function (s) { s.style.transform = "translateY(-" + s.getAttribute("data-to") + "em)"; }); }
    if (instant || reduce) { settle(); return; }
    void el.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(settle); });
  }

  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  ready(function () {
    document.querySelectorAll(".pz").forEach(function (pz) {
      pz.querySelectorAll("[data-roll]").forEach(function (n) { roll(n, n.getAttribute("data-m"), true); });

      var sw = pz.querySelector(".pz-switch");
      if (sw) {
        var ind = sw.querySelector(".pz-ind");
        var place = function (btn, instant) {
          if (!ind || !btn) return;
          if (instant) ind.style.transition = "none";
          ind.style.width = btn.offsetWidth + "px";
          ind.style.transform = "translateX(" + (btn.offsetLeft - 4) + "px)";
          if (instant) { void ind.offsetWidth; ind.style.transition = ""; }
        };
        place(sw.querySelector("button.on"), true);
        window.addEventListener("resize", function () { place(sw.querySelector("button.on"), true); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(sw.querySelector("button.on"), true); });
        sw.addEventListener("click", function (e) {
          var b = e.target.closest && e.target.closest("button[data-term]");
          if (!b) return;
          var y = b.getAttribute("data-term") === "y";
          sw.querySelectorAll("button[data-term]").forEach(function (x) {
            x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b));
          });
          place(b);
          pz.querySelectorAll("[data-roll]").forEach(function (n) { roll(n, n.getAttribute(y ? "data-y" : "data-m")); });
          pz.querySelectorAll("[data-per]").forEach(function (n) { n.textContent = n.getAttribute(y ? "data-per-y" : "data-per"); });
          /* yearly bills today, so a trial button must stop promising "free for 14 days".
             Runs after v5's own .bterm handler, which can restore an armed button's old label. */
          setTimeout(function () {
            pz.querySelectorAll('.bbtn[data-trial="1"]').forEach(function (btn) {
              if (!btn.getAttribute("data-label-m")) btn.setAttribute("data-label-m", btn.textContent);
              var t = y ? "Pay yearly" : btn.getAttribute("data-label-m");
              btn.textContent = t;
              if (btn.getAttribute("data-was")) btn.setAttribute("data-was", t);
            });
          }, 0);
        });
      }

      var items = pz.querySelectorAll(".pz-rv");
      var show = function () { items.forEach(function (it, i) { setTimeout(function () { it.classList.add("in"); }, reduce ? 0 : i * 110); }); };
      if (reduce || !("IntersectionObserver" in window)) { show(); return; }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { show(); io.disconnect(); } });
      }, { threshold: 0.12 });
      io.observe(pz);
      /* in-app browsers that never fire the observer still get the cards */
      var done = false, check = function () {
        if (done) return; var r = pz.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9 && r.bottom > 0) { done = true; show(); window.removeEventListener("scroll", check); }
      };
      setTimeout(function () { check(); window.addEventListener("scroll", check, { passive: true }); }, 1500);
    });
  });
})();
