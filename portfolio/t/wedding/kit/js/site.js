/* OAKHOLLOW — shared renderer. Reads window.OAKHOLLOW_CONTENT, renders header,
 * after-film sections and footer on both tiers. Premium film logic lives in film.js. */
(function () {
  'use strict';
  const C = window.OAKHOLLOW_CONTENT;
  const tier = document.body.dataset.tier || 'premium';
  const root = tier === 'simple' ? '../' : '';

  const MARK_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 21v-7.5a7.5 7.5 0 0 1 15 0V21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M2.5 21h19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="9.2" r="1.15"/></svg>';

  const SOCIAL = {
    instagram:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.4" y="2.4" width="19.2" height="19.2" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.1" cy="6.9" r="1.35"/></svg>',
    pinterest:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 4.9 3 9 7.3 10.7-.1-.9-.2-2.3 0-3.3l1.4-5.9s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5.1-5-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2.9 2.8.1.1.1.2.1.4l-.3 1.3c0 .2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.7 0-3.8 2.8-7.3 8-7.3 4.2 0 7.5 3 7.5 7 0 4.2-2.6 7.6-6.3 7.6-1.2 0-2.4-.6-2.8-1.4l-.8 2.9c-.3 1.1-1 2.4-1.5 3.2 1.1.3 2.3.5 3.5.5 6.3 0 11.5-5.2 11.5-11.5C23.5 5.7 18.3.5 12 .5z"/></svg>',
    facebook:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21.5v-7h2.4l.4-2.9h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.4-3.7 3.9v2.4H8v2.9h2.5v7h3z"/></svg>'
  };

  const wordmark = (tag) =>
    '<' + tag + ' class="wordmark" aria-label="' + C.brand.legal + '">' +
    (C.brand.mark || MARK_SVG) +
    (C.brand.markOnly ? '' :
      ('<span class="wm-name">' + C.brand.name + '</span>' +
       '<span class="wm-co">Weddings</span>')) +
    '</' + tag + '>';

  /* ---------- header ---------- */
  function renderHeader() {
    const nav = C.nav
      .map((n) => '<a href="' + n.href + '">' + n.label + '</a>')
      .join('');
    const gauge =
      tier === 'premium'
        ? '<div class="gauge" aria-hidden="true">' +
          '<span class="g-label">Light</span><span class="g-depth" id="gDepth">Dawn</span>' +
          '<span class="g-bar"><i class="g-fill" id="gFill"></i></span>' +
          '<span class="g-ch" id="gCh">01 · The Meadow</span></div>'
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
      '<section class="section" id="spaces" data-hdr="light" aria-labelledby="spaces-h">' +
        '<div class="section-head"><p class="kicker rv">' + C.spaces.kicker + '</p>' +
        '<h2 id="spaces-h" class="display rv rv-d1">' + C.spaces.title + '</h2></div>' +
        C.spaces.items.map((b) =>
          '<article class="space rv">' +
            '<div class="space-media"><span class="tag">' + b.place + '</span>' +
            '<img src="' + root + b.img + '" alt="' + b.name + ' — ' + b.spec + '" loading="lazy" width="1040" height="1300"></div>' +
            '<div class="space-copy"><h3 class="display">' + b.name + '</h3>' +
            '<p class="spec">' + b.spec + '</p><p>' + b.blurb + '</p></div>' +
          '</article>'
        ).join('') +
      '</section>'
    );

    sec.push(
      '<section class="section on-dark" id="theday" data-hdr="dark" aria-labelledby="theday-h">' +
        '<div class="section-head"><p class="kicker rv">' + C.theday.kicker + '</p>' +
        '<h2 id="theday-h" class="display rv rv-d1">' + C.theday.title + '</h2></div>' +
        '<div class="day-grid">' +
          '<figure class="day-media rv"><img src="' + root + C.theday.detailImg + '" alt="' +
            C.theday.detailCaption + '" loading="lazy" width="1040" height="1300">' +
            '<figcaption>' + C.theday.detailCaption + '</figcaption></figure>' +
          '<ol class="moments">' +
            C.theday.steps.map((s) =>
              '<li class="moment rv"><span class="when">' + s.weeks + '</span>' +
              '<h3>' + s.title + '</h3><p>' + s.body + '</p></li>'
            ).join('') +
          '</ol>' +
        '</div>' +
      '</section>'
    );

    sec.push(
      '<section class="section" id="included" data-hdr="light" aria-labelledby="included-h">' +
        '<div class="section-head"><p class="kicker rv">' + C.included.kicker + '</p>' +
        '<h2 id="included-h" class="display rv rv-d1">' + C.included.title + '</h2></div>' +
        '<div class="included-rows">' +
          C.included.items.map((s, i) =>
            '<div class="inc rv"><span class="n">0' + (i + 1) + '</span>' +
            '<h3>' + s.title + '</h3><p>' + s.body + '</p></div>'
          ).join('') +
        '</div>' +
      '</section>'
    );

    sec.push(
      '<section class="pricing" id="pricing" data-hdr="dark" aria-labelledby="pricing-h">' +
        '<div class="pricing-inner"><div>' +
          '<p class="kicker rv">' + C.pricing.kicker + '</p>' +
          '<h2 id="pricing-h" class="rv rv-d1">' + C.pricing.title + '</h2>' +
          '<p class="rv rv-d2">' + C.pricing.body + '</p></div>' +
          '<a class="btn btn-primary rv rv-d2" href="' + C.pricing.cta.href + '">' + C.pricing.cta.label + '</a>' +
      '</div></section>'
    );

    sec.push(
      '<section class="section" data-hdr="light" aria-label="Couples">' +
        '<div class="quotes">' +
          C.testimonials.map((t) =>
            '<blockquote class="quote rv"><p>' + t.quote + '</p>' +
            '<cite>' + t.name + '</cite></blockquote>'
          ).join('') +
        '</div>' +
      '</section>'
    );

    sec.push(
      '<section class="section contact" id="inquire" data-hdr="dark" aria-labelledby="inquire-h">' +
        '<div class="contact-grid">' +
          '<div class="contact-copy"><p class="kicker rv">' + C.contact.kicker + '</p>' +
          '<h2 id="inquire-h" class="display rv rv-d1">' + C.contact.title + '</h2>' +
          '<p class="rv rv-d2">' + C.contact.body + '</p>' +
          '<div class="contact-meta rv rv-d2"><a href="tel:' + C.brand.phone.replace(/[^\d+]/g, '') + '">' +
            C.brand.phone + '</a><a href="mailto:' + C.brand.email + '">' + C.brand.email + '</a>' +
          '<span>' + C.brand.address + '</span></div>' +
          '<p class="areas-label rv rv-d3">' + C.areasLabel + '</p>' +
          '<ul class="areas rv rv-d3" aria-label="' + C.areasLabel + '">' +
            C.areas.map((a) => '<li>' + a + '</li>').join('') + '</ul></div>' +
          '<form class="lead rv rv-d1" novalidate>' +
            '<div class="field-row">' +
              '<div class="field"><label for="f-names">Your names</label><input id="f-names" name="names" autocomplete="name" required></div>' +
              '<div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>' +
            '</div>' +
            '<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>' +
            '<div class="field-row">' +
              '<div class="field"><label for="f-guests">Guest count</label><select id="f-guests" name="guests">' +
                C.contact.guestCounts.map((g) => '<option>' + g + '</option>').join('') + '</select></div>' +
              '<div class="field"><label for="f-season">Season or date</label><input id="f-season" name="season" placeholder="October 2027"></div>' +
            '</div>' +
            '<div class="field"><label for="f-note">The wedding, in a sentence</label><textarea id="f-note" name="note" rows="3"></textarea></div>' +
            '<input class="hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<button class="btn btn-primary" type="submit">Check your date</button>' +
            '<p class="form-ok" role="status">Thank you — we will reply within one business day.</p>' +
            '<p class="form-note">One wedding a weekend. Dates go quickly in spring and fall. ' + C.brand.license + '.</p>' +
          '</form>' +
        '</div>' +
      '</section>'
    );

    document.getElementById('afterFilm').innerHTML = sec.join('');

    document.getElementById('siteFoot').innerHTML =
      '<div class="foot">' +
        wordmark('span') +
        '<div class="foot-meta"><span>' + C.brand.phone + ' · ' + C.brand.email + '</span>' +
        '<span>' + C.brand.address + ' · Since ' + C.brand.founded + '</span></div>' +
        '<div class="foot-social">' +
          '<a href="#" aria-label="Instagram">' + SOCIAL.instagram + '</a>' +
          '<a href="#" aria-label="Pinterest">' + SOCIAL.pinterest + '</a>' +
          '<a href="#" aria-label="Facebook">' + SOCIAL.facebook + '</a>' +
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
