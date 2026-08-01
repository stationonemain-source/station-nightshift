/* GABLE — shared renderer. Reads window.GABLE_CONTENT, renders header,
 * after-film sections and footer on both tiers. Premium film logic lives in film.js. */
(function () {
  'use strict';
  const C = window.GABLE_CONTENT;
  const tier = document.body.dataset.tier || 'premium';
  const root = tier === 'simple' ? '../' : '';

  const MARK_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 14.6 12 5l9.2 9.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 12.4V20h12v-7.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const SOCIAL = {
    instagram:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.4" y="2.4" width="19.2" height="19.2" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.1" cy="6.9" r="1.35"/></svg>',
    facebook:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21.5v-7h2.4l.4-2.9h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.4-3.7 3.9v2.4H8v2.9h2.5v7h3z"/></svg>',
    youtube:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.6s-.2-1.5-.9-2.2c-.8-.9-1.8-.9-2.2-1C16.8 4.2 12 4.2 12 4.2s-4.8 0-7.9.2c-.4.1-1.4.1-2.2 1-.7.7-.9 2.2-.9 2.2S.8 9.4.8 11.2v1.6c0 1.8.2 3.6.2 3.6s.2 1.5.9 2.2c.8.9 1.9.8 2.4.9 1.7.2 7.7.3 7.7.3s4.8 0 7.9-.3c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.2.9-2.2s.2-1.8.2-3.6v-1.6c0-1.8-.2-3.6-.2-3.6zM9.9 14.9V8.9l6.1 3-6.1 3z"/></svg>'
  };

  const wordmark = (tag) =>
    '<' + tag + ' class="wordmark" aria-label="' + C.brand.legal + '">' +
    (C.brand.mark || MARK_SVG) +
    (C.brand.markOnly ? '' :
      ('<span class="wm-name">' + C.brand.name + '</span>' +
       '<span class="wm-co">Roof Co.</span>')) +
    '</' + tag + '>';

  /* ---------- header ---------- */
  function renderHeader() {
    const nav = C.nav
      .map((n) => '<a href="' + n.href + '">' + n.label + '</a>')
      .join('');
    const gauge =
      tier === 'premium'
        ? '<div class="gauge" aria-hidden="true">' +
          '<span class="g-label">Elev</span><span class="g-depth" id="gDepth">0 ft</span>' +
          '<span class="g-bar"><i class="g-fill" id="gFill"></i></span>' +
          '<span class="g-ch" id="gCh">01 · The Ground</span></div>'
        : '';
    document.getElementById('siteHead').innerHTML =
      '<div class="head-inner">' +
      '<a href="' + (tier === 'simple' ? '../' : '#top') + '">' + wordmark('span') + '</a>' +
      '<nav class="head-nav" aria-label="Main navigation">' + nav + '</nav>' +
      gauge +
      '<a class="head-cta" href="' + C.cta.href + '">' + C.cta.label + '</a>' +
      '</div>';
  }

  /* ---------- premium film beats (film.js drives their opacity) ---------- */
  function renderBeats() {
    const layer = document.getElementById('beatLayer');
    if (!layer) return;
    layer.innerHTML = C.beats
      .map((b) => {
        const h = b.id === 'hero' ? '<h1>' + b.title + '</h1>' : '<h2>' + b.title + '</h2>';
        const ctas = (b.ctas || [])
          .map((c) => '<a class="btn btn-' + c.kind + '" href="' + c.href + '">' + c.label + '</a>')
          .join('');
        return (
          '<div class="beat tone-' + b.tone + ' anchor-' + (b.anchor || 'center') +
          '" data-id="' + b.id + '"><div class="beat-inner">' +
          '<p class="kicker">' + b.kicker + '</p>' + h +
          '<p>' + b.body + '</p>' +
          (ctas ? '<div class="beat-ctas">' + ctas + '</div>' : '') +
          (b.id === 'hero' ? '<span class="scroll-cue">Scroll</span>' : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  /* ---------- after-film sections ---------- */
  const sec = [];
  function build() {
    const lede = C.manifesto.lede.replace(C.manifesto.accent, '<em>' + C.manifesto.accent + '</em>');
    sec.push(
      '<div class="landing" id="about" data-hdr="dark"><div class="landing-inner">' +
        '<p class="lede display rv">' + lede + '</p>' +
        '<p class="body rv rv-d1">' + C.manifesto.body + '</p>' +
      '</div>' +
      '<div class="stats" data-hdr="light"><div class="stats-grid">' +
        C.stats.map((s, i) =>
          '<div class="stat rv rv-d' + Math.min(i, 3) + '"><b><span class="count" data-n="' + s.n + '">0</span>' +
          '<span class="suffix">' + s.suffix + '</span></b><span>' + s.label + '</span></div>'
        ).join('') +
      '</div></div></div>'
    );

    sec.push(
      '<section class="section" id="work" data-hdr="light" aria-labelledby="work-h">' +
        '<div class="section-head"><p class="kicker rv">' + C.work.kicker + '</p>' +
        '<h2 id="work-h" class="display rv rv-d1">' + C.work.title + '</h2></div>' +
        C.work.items.map((b) =>
          '<article class="work rv">' +
            '<div class="work-media"><span class="tag">' + b.place + '</span>' +
            '<img src="' + root + b.img + '" alt="' + b.name + ' — ' + b.spec + '" loading="lazy" width="1248" height="936"></div>' +
            '<div class="work-copy"><h3>' + b.name + '</h3>' +
            '<p class="spec">' + b.spec + '</p><p>' + b.blurb + '</p></div>' +
          '</article>'
        ).join('') +
      '</section>'
    );

    sec.push(
      '<section class="section on-dark" id="system" data-hdr="dark" aria-labelledby="system-h">' +
        '<div class="section-head"><p class="kicker rv">' + C.system.kicker + '</p>' +
        '<h2 id="system-h" class="display rv rv-d1">' + C.system.title + '</h2></div>' +
        '<div class="system-grid">' +
          '<figure class="system-media rv"><img src="' + root + C.system.detailImg + '" alt="' +
            C.system.detailCaption + '" loading="lazy" width="1248" height="936">' +
            '<figcaption>' + C.system.detailCaption + '</figcaption></figure>' +
          '<ol class="steps">' +
            C.system.steps.map((s) =>
              '<li class="step rv"><h3>' + s.title + '<span class="weeks">' + s.weeks + '</span></h3>' +
              '<p>' + s.body + '</p></li>'
            ).join('') +
          '</ol>' +
        '</div>' +
      '</section>'
    );

    sec.push(
      '<section class="section" id="storm" data-hdr="light" aria-labelledby="storm-h">' +
        '<div class="section-head"><p class="kicker rv">' + C.services.kicker + '</p>' +
        '<h2 id="storm-h" class="display rv rv-d1">' + C.services.title + '</h2></div>' +
        '<div class="service-rows">' +
          C.services.items.map((s, i) =>
            '<div class="service rv"><span class="n">0' + (i + 1) + '</span>' +
            '<h3>' + s.title + '</h3><p>' + s.body + '</p></div>'
          ).join('') +
        '</div>' +
      '</section>'
    );

    sec.push(
      '<section class="financing" id="financing" data-hdr="dark" aria-labelledby="financing-h">' +
        '<div class="financing-inner"><div>' +
          '<p class="kicker rv">' + C.financing.kicker + '</p>' +
          '<h2 id="financing-h" class="rv rv-d1">' + C.financing.title + '</h2>' +
          '<p class="rv rv-d2">' + C.financing.body + '</p></div>' +
          '<a class="btn btn-primary rv rv-d2" href="' + C.financing.cta.href + '">' + C.financing.cta.label + '</a>' +
      '</div></section>'
    );

    sec.push(
      '<section class="section" data-hdr="light" aria-label="Homeowner words">' +
        '<div class="quotes">' +
          C.testimonials.map((t) =>
            '<blockquote class="quote rv"><p>&ldquo;' + t.quote + '&rdquo;</p>' +
            '<cite>' + t.name + '</cite></blockquote>'
          ).join('') +
        '</div>' +
      '</section>'
    );

    sec.push(
      '<section class="section contact" id="inspection" data-hdr="dark" aria-labelledby="inspection-h">' +
        '<div class="contact-grid">' +
          '<div class="contact-copy"><p class="kicker rv">' + C.contact.kicker + '</p>' +
          '<h2 id="inspection-h" class="display rv rv-d1">' + C.contact.title + '</h2>' +
          '<p class="rv rv-d2">' + C.contact.body + '</p>' +
          '<div class="contact-meta rv rv-d2"><a href="tel:' + C.brand.phone.replace(/[^\d+]/g, '') + '">' +
            C.brand.phone + '</a><a href="mailto:' + C.brand.email + '">' + C.brand.email + '</a></div>' +
          '<p class="areas-label rv rv-d3">' + C.areasLabel + '</p>' +
          '<ul class="areas rv rv-d3" aria-label="' + C.areasLabel + '">' +
            C.areas.map((a) => '<li>' + a + '</li>').join('') + '</ul></div>' +
          '<form class="lead rv rv-d1" novalidate>' +
            '<div class="field-row">' +
              '<div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>' +
              '<div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>' +
            '</div>' +
            '<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>' +
            '<div class="field"><label for="f-addr">Street address</label><input id="f-addr" name="address" autocomplete="street-address" required></div>' +
            '<div class="field"><label for="f-concern">What is going on up there?</label><select id="f-concern" name="concern">' +
              C.contact.concerns.map((g) => '<option>' + g + '</option>').join('') + '</select></div>' +
            '<div class="field"><label for="f-note">Anything else</label><textarea id="f-note" name="note" rows="3"></textarea></div>' +
            '<input class="hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<button class="btn btn-primary" type="submit">Book the free inspection</button>' +
            '<p class="form-ok" role="status">Thank you — we will call within one business day.</p>' +
            '<p class="form-note">No pressure, no storm-chaser games. ' + C.brand.license + '.</p>' +
          '</form>' +
        '</div>' +
      '</section>'
    );

    document.getElementById('afterFilm').innerHTML = sec.join('');

    document.getElementById('siteFoot').innerHTML =
      '<div class="foot">' +
        wordmark('span') +
        '<div class="foot-meta"><span>' + C.brand.phone + ' · ' + C.brand.email + '</span>' +
        '<span>' + C.brand.city + ', Texas · Since ' + C.brand.founded + '</span></div>' +
        '<div class="foot-social">' +
          '<a href="#" aria-label="Instagram">' + SOCIAL.instagram + '</a>' +
          '<a href="#" aria-label="Facebook">' + SOCIAL.facebook + '</a>' +
          '<a href="#" aria-label="YouTube">' + SOCIAL.youtube + '</a>' +
        '</div>' +
        '<p class="foot-legal">&copy; 2026 ' + C.brand.legal + ' · ' + C.brand.license + '</p>' +
      '</div>';
  }

  /* ---------- reveals + counters ---------- */
  let io = null;
  function observe() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          e.target.querySelectorAll('.count').forEach(runCounter);
          io.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }
    );
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));

    function runCounter(el) {
      const target = +el.dataset.n;
      if (reduced) { el.textContent = target; return; }
      const t0 = performance.now(), dur = 1200;
      (function tick(t) {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }
  }

  /* ---------- header theme probe (owns the header past the film/hero) ---------- */
  let headerProbe = null;
  function wireHeaderTheme() {
    const headEl = document.getElementById('siteHead');
    const topBlock = document.querySelector(tier === 'simple' ? '.hero' : '.film-driver');
    let raf = 0;
    const probe = () => {
      raf = 0;
      if (topBlock && topBlock.getBoundingClientRect().bottom > 88) {
        if (tier === 'simple') headEl.classList.remove('on-light');
        return;
      }
      const el = document.elementFromPoint(Math.min(innerWidth * 0.55, innerWidth - 12), 100);
      const zone = el && el.closest('[data-hdr]');
      if (zone) headEl.classList.toggle('on-light', zone.dataset.hdr === 'light');
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(probe); }, { passive: true });
    headerProbe = probe;
    probe();
    setTimeout(probe, 1200);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => probe());
  }

  /* Dev contract: settle reveals + header after a ?jump (jumps skip the IO). */
  function settleReveals() {
    document.querySelectorAll('.rv:not(.in)').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) {
        el.classList.add('in');
        el.querySelectorAll('.count').forEach((c) => (c.textContent = c.dataset.n));
        if (io) io.unobserve(el);
      }
    });
    if (headerProbe) headerProbe();
  }
  window.__settleReveals = settleReveals;

  /* ---------- lead form ---------- */
  function wireForm() {
    const form = document.querySelector('form.lead');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.querySelector('.hp').value) return; // honeypot
      if (!form.reportValidity()) return;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      if (C.contact.endpoint && C.contact.endpoint !== '#') {
        const data = Object.fromEntries(new FormData(form).entries());
        fetch(C.contact.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(() => {});
      }
      form.classList.add('sent');
    });
  }

  renderHeader();
  renderBeats();
  build();
  observe();
  wireForm();
  wireHeaderTheme();

  /* Simple tier owns the dev contract itself (premium's lives in film.js). */
  if (tier === 'simple') {
    const jump = new URLSearchParams(location.search).get('jump');
    if (jump !== null) {
      history.scrollRestoration = 'manual';
      document.documentElement.classList.add('no-smooth');
      requestAnimationFrame(() => { window.scrollTo(0, +jump || 0); settleReveals(); });
    }
    const hero = document.querySelector('.hero-bg');
    if (!hero || hero.complete) window.__ready = true;
    else hero.addEventListener('load', () => (window.__ready = true), { once: true });
    setTimeout(() => (window.__ready = true), 6000);
  }
})();
