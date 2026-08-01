/* station-shared/site-core.js — the machinery every Station premium tier shares.
   Structure and plumbing ONLY: nav, reveals, smooth scroll, the dev contract.
   All visual identity (type, colour, composition, signature scene) stays per-site.

   Call order matters — the ScrollTrigger ordering law:
     renderNav → smooth → heroLines → <site builds its pinned scene> → ambient → finish
   Ambient/background triggers MUST be created after pinned ones or their positions
   are computed before pin spacers exist and fire thousands of pixels early. */
window.StationCore = (() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const JUMP = new URLSearchParams(location.search).get('jump');
  if (JUMP !== null) history.scrollRestoration = 'manual';

  let lenis = null;

  const SOCIAL = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z"/></svg>',
    google: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path d="M6.4 14a6 6 0 0 1 0-3.8V7.6H3.1a10 10 0 0 0 0 8.9L6.4 14z"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.6L6.4 10c.8-2.3 3-4.1 5.6-4.1z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9.5h4v11H3v-11zm6.5 0h3.8v1.5h.06c.53-1 1.83-1.8 3.64-1.8 2.7 0 3.5 1.7 3.5 4.3v7h-4v-6.2c0-1.5-.5-2.5-1.8-2.5-1.1 0-1.7.75-2 1.5-.1.25-.13.6-.13.95v6.25h-4v-11z"/></svg>',
    pinterest: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3 0-4.9 2.3-4.9 4.8 0 .9.3 1.6.7 2.1.2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.6.3-1.4-.6-2.1-2.2-2.1-4C6.1 7.4 8.4 4.5 12.5 4.5c3.4 0 5.9 2.4 5.9 5.6 0 3.8-2.2 6.6-5.3 6.6-1.1 0-2-.6-2.4-1.2l-.7 2.5c-.2.9-.8 2-1.2 2.7A10 10 0 1 0 12 2z"/></svg>',
  };

  function renderNav(navArr) {
    const nav = $('#nav'), mob = $('#mobileMenu'), burger = $('#burger');
    if (!nav) return;
    navArr.forEach((n) => {
      const a = document.createElement('a');
      a.href = n.href; a.textContent = n.label;
      if (n.cta) a.className = 'cta';
      nav.appendChild(a);
      if (mob) mob.appendChild(a.cloneNode(true));
    });
    if (burger && mob) {
      burger.addEventListener('click', () => {
        const open = mob.classList.toggle('open');
        burger.setAttribute('aria-expanded', open);
        mob.setAttribute('aria-hidden', !open);
      });
      mob.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') return;
        mob.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    }
  }

  function renderFooter(brand, footer) {
    if ($('#ftrLine')) $('#ftrLine').textContent = footer.line;
    if ($('#ftrFine')) $('#ftrFine').textContent = footer.fine;
    const s = $('#ftrSocial');
    if (s) s.innerHTML = brand.socials
      .map((x) => `<a href="${x.url}" aria-label="${x.label}">${SOCIAL[x.id] || x.label}</a>`).join('');
  }

  function renderBooking(brand, booking) {
    const set = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
    set('#bookTitle', booking.title);
    set('#bookSub', booking.sub);
    const ph = $('#bookPhone');
    if (ph) { ph.href = brand.phoneHref; ph.querySelector('span').textContent = `CALL ${brand.phone}`; }
    const em = $('#bookEmail');
    if (em) { em.href = `mailto:${brand.email}`; em.querySelector('span').textContent = brand.email; }
    if ($('#bookBadges')) $('#bookBadges').innerHTML = booking.badges.map((b) => `<li>${b}</li>`).join('');
    if ($('#bookHours')) $('#bookHours').innerHTML = booking.hours.map((h) => `<dt>${h.d}</dt><dd>${h.h}</dd>`).join('');
    if ($('#bookAddr')) $('#bookAddr').innerHTML = `<b>${brand.name} ${brand.suffix}</b><br>${brand.address}`;
  }

  function smooth() {
    gsap.registerPlugin(ScrollTrigger);
    if (REDUCED || JUMP !== null) return null;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  /* masked line reveal — pass the inner-span selector */
  function heroLines(sel, opts = {}) {
    const els = $$(sel);
    if (!els.length) return;
    if (REDUCED) { els.forEach((el) => { el.style.transform = 'none'; }); return; }
    gsap.fromTo(els, { yPercent: 112, y: 0 },
      { yPercent: 0, y: 0, duration: 1.15, stagger: opts.stagger ?? 0.13, ease: 'expo.out', delay: opts.delay ?? 0.2 });
  }

  function fadeIn(sel, opts = {}) {
    const el = $(sel);
    if (!el) return;
    if (REDUCED) { el.style.opacity = 1; return; }
    gsap.fromTo(el, { opacity: 0, y: opts.y ?? 16 },
      { opacity: 1, y: 0, duration: 0.9, delay: opts.delay ?? 0.9, ease: 'power2.out' });
  }

  /* Ambient reveals + header inversion. Create AFTER every pinned scene. */
  function ambient({ dark = [], headerClass = 'on-dark' } = {}) {
    if (REDUCED) {
      $$('.rv').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
      $$('.man-line span').forEach((el) => { el.style.transform = 'none'; });
    } else {
      $$('.man-line span').forEach((el, i) => {
        gsap.fromTo(el, { yPercent: 112, y: 0 }, {
          yPercent: 0, y: 0, duration: 1.05, ease: 'expo.out', delay: i * 0.12,
          scrollTrigger: { trigger: el.parentElement, start: 'top 82%', once: true },
        });
      });
      $$('.rv').forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
    }
    dark.forEach((sel) => {
      if (!$(sel)) return;
      ScrollTrigger.create({
        trigger: sel, start: 'top 62px', end: 'bottom 62px',
        toggleClass: { targets: '#hdr', className: headerClass },
      });
    });
  }

  function anchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const t = document.querySelector(a.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(t, { offset: 0 }); else t.scrollIntoView();
      });
    });
  }

  /* jank meter + the ?jump / __ready dev contract the verify harness needs */
  function finish({ waitFor = '#heroImg' } = {}) {
    let last = performance.now(), maxD = 0;
    const meter = () => {
      const now = performance.now(); const d = now - last; last = now;
      if (d > maxD) maxD = d;
      requestAnimationFrame(meter);
    };
    requestAnimationFrame(meter);
    setInterval(() => { console.log(`[jank] max rAF delta ${maxD.toFixed(1)}ms`); maxD = 0; }, 2000);

    const ready = () => {
      ScrollTrigger.refresh();
      if (JUMP !== null) {
        scrollTo(0, +JUMP || 0);
        ScrollTrigger.update();
        requestAnimationFrame(() => { ScrollTrigger.update(); window.__ready = true; });
      } else {
        window.__ready = true;
      }
    };
    const img = waitFor ? $(waitFor) : null;
    const imgDone = (!img || img.complete)
      ? Promise.resolve()
      : new Promise((r) => { img.onload = r; img.onerror = r; });
    Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), imgDone])
      .then(() => setTimeout(ready, 60));
  }

  return { $, $$, REDUCED, JUMP, SOCIAL, renderNav, renderFooter, renderBooking, smooth, heroLines, fadeIn, ambient, anchors, finish };
})();
