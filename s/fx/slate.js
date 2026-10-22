/* Slate hero: the street clock keeps your time.
   - The tall green clock in front of the shops tells the visitor's real local time. Its hour and
     minute hands are drawn the way the painted ones were (dark green-black, a small lozenge partway
     out, a fine pin to the minute track, the sun catching their upper edge and a soft shadow on the
     face below), and the minute hand creeps round as a real one does: you would only notice it move
     if you watched.
   - The point is quiet: whatever time you happen to look, the shop is open to you. Booking with
     Slate does not wait for opening hours; the clock is simply right, and the door is open.
   - The painted hands were taken off the face (clean plate); the face, its ticks and the minute
     dots are the painting's own. The clock faces us square on, so the face is a true circle.
     Positions are painting fractions via StationHeroFx.
   Reduced motion, and the pages that borrow this painting behind a form (book): the same correct
   clock, redrawn once a minute, nothing else. */
(function () {
  var kit = window.StationHeroFx; if (!kit) return;

  // measured on the 3840 painting: the hub of the hands, in painting fractions; sizes below are in
  // 3840-painting pixels (face radius about 103, the minute track about 96)
  var HUB = [1253 / 3840, 983 / 2171];
  var ctx = kit.canvas(2);
  var still = kit.reduce || kit.quiet;

  // one hand, pointing up, as a closed outline: [y, half-width] pairs from tail to tip
  var MIN = [[6, 2.4], [-8, 3.0], [-47, 3.0], [-56, 4.6], [-65, 1.7], [-90, 1.3], [-99, .5]];
  var HOUR = [[6, 2.6], [-8, 2.8], [-41, 2.8], [-49, 5.2], [-56, 2.4], [-64, .4]];
  function handPath(prof, s) {
    ctx.beginPath();
    var i;
    for (i = 0; i < prof.length; i++) ctx.lineTo(prof[i][1] * s, prof[i][0] * s);
    for (i = prof.length - 1; i >= 0; i--) ctx.lineTo(-prof[i][1] * s, prof[i][0] * s);
    ctx.closePath();
  }
  function hand(prof, ang, s, x, y) {
    // shadow on the face (sun from the upper left), then the lit edge, then the hand itself
    ctx.save(); ctx.translate(x + 2.2 * s, y + 3 * s); ctx.rotate(ang);
    handPath(prof, s); ctx.fillStyle = "rgba(70,78,88,.2)"; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(x - .7 * s, y - .7 * s); ctx.rotate(ang);
    handPath(prof, s); ctx.fillStyle = "rgba(246,246,240,.6)"; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    handPath(prof, s); ctx.fillStyle = "rgb(46,68,78)"; ctx.fill(); ctx.restore();
  }

  var shown = -1;
  function draw(force) {
    var d = new Date(), h = d.getHours() % 12, m = d.getMinutes(), sec = d.getSeconds() + d.getMilliseconds() / 1000;
    // the minute hand moves continuously, so it is redrawn a few times a minute (each step is a
    // fraction of a pixel); a still clock is redrawn only when the minute changes
    var key = still ? h * 60 + m : Math.floor((m * 60 + sec) / 4);
    if (!force && key === shown) return;
    shown = key;
    var mm = still ? m : m + sec / 60;
    var am = mm / 60 * 6.2832, ah = (h + mm / 60) / 12 * 6.2832;
    var s = kit.dw / 3840, x = kit.X(HUB[0]), y = kit.Y(HUB[1]);
    ctx.clearRect(0, 0, kit.W, kit.H);
    hand(HOUR, ah, s, x, y);
    hand(MIN, am, s, x, y);
    // the hub: a dark boss with its little bright pin
    ctx.fillStyle = "rgba(70,78,88,.2)"; ctx.beginPath(); ctx.arc(x + 2.2 * s, y + 3 * s, 8.5 * s, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "rgb(40,62,72)"; ctx.beginPath(); ctx.arc(x, y, 8.5 * s, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "rgba(235,238,236,.85)"; ctx.beginPath(); ctx.arc(x - .6 * s, y - .6 * s, 1.6 * s, 0, 6.2832); ctx.fill();
  }

  kit.onLayout(function () { draw(true); });
  draw(true);
  if (still) {
    // like a real clock that is not being watched: correct, and it moves on at each new minute
    var tick = function () { draw(true); setTimeout(tick, 60000 - (Date.now() % 60000) + 50); };
    setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) draw(true); });
    return;
  }
  kit.loop(function () { draw(false); });
})();
