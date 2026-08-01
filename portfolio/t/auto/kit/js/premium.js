/* CAMBER premium — render from content.js, then the inspection film.
   Ordering law: pinned inspection trigger is created FIRST, ambient after. */
(() => {
  const C = window.CAMBER;
  const $ = (s) => document.querySelector(s);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const JUMP = new URLSearchParams(location.search).get('jump');
  if (JUMP !== null) history.scrollRestoration = 'manual';

  /* ---------- render ---------- */
  const nav = $('#nav'), mob = $('#mobileMenu');
  C.nav.forEach((n) => {
    const a = document.createElement('a');
    a.href = n.href; a.textContent = n.label;
    if (n.cta) a.className = 'cta';
    nav.appendChild(a);
    mob.appendChild(a.cloneNode(true));
  });

  $('#introReadout').textContent = C.hero.readout;
  $('#heroImg').alt = C.hero.alt;
  $('#heroLine').textContent = C.hero.line;
  $('#cueText').textContent = C.hero.cue;
  const wordRow = $('#wordRow');
  [...C.brand.name].forEach((ch) => {
    const s = document.createElement('span');
    s.className = 'ch'; s.textContent = ch;
    wordRow.appendChild(s);
  });

  $('#inspTitle').textContent = C.inspection.title;
  $('#inspIntroText').textContent = C.inspection.intro;
  $('#doneTag').textContent = C.inspection.complete;
  $('#doneVerdict').textContent = C.inspection.verdict;

  C.manifesto.lines.forEach((l, i) => { $(`#man-l${i} span`).textContent = l; });
  $('#manSupport').textContent = C.manifesto.support;
  $('#manStats').innerHTML = C.manifesto.stats
    .map((s) => `<div class="man-stat rv"><b>${s.n}</b><i>${s.label}</i></div>`).join('');

  $('#svcRows').innerHTML = C.services.map((s, i) => `
    <div class="svc-row rv" data-img="${s.img}" data-i="${i}">
      <div><h3 class="svc-name">${s.title}</h3><span class="svc-spec">${s.spec}</span></div>
      <p class="svc-blurb">${s.blurb}</p>
      <span class="svc-price">${s.price}</span>
    </div>`).join('');

  $('#shopPhotos').innerHTML = C.shop.photos
    .map((p) => `<figure class="rv"><img src="${p.src}" alt="${p.alt}" loading="lazy"></figure>`).join('');
  $('#techPhoto').src = C.shop.techPhoto;
  $('#techPhoto').alt = `${C.shop.techName}, ${C.shop.techRole}`;
  $('#techCap').textContent = `${C.shop.techName.toUpperCase()} · ${C.shop.techRole.toUpperCase()}`;
  $('#shopStory').textContent = C.shop.story;
  $('#shopCerts').innerHTML = C.shop.certs.map((c) => `<li>${c}</li>`).join('');

  $('#logGrid').innerHTML = C.reviews.map((r) => `
    <article class="log-card rv">
      <header class="log-head"><span>${r.date} · ${r.vehicle}</span><span class="log-stars">★★★★★</span></header>
      <p class="log-note">“${r.note}”</p>
      <p class="log-name">— ${r.name}</p>
    </article>`).join('');

  $('#bookTitle').textContent = C.booking.title;
  $('#bookSub').textContent = C.booking.sub;
  $('#bookPhone').href = C.brand.phoneHref;
  $('#bookPhone span').textContent = C.brand.phone;
  $('#bookEmail').href = `mailto:${C.brand.email}`;
  $('#bookEmail span').textContent = C.brand.email;
  $('#bookBadges').innerHTML = C.booking.badges.map((b) => `<li>${b}</li>`).join('');
  $('#bookHours').innerHTML = C.booking.hours.map((h) => `<dt>${h.d}</dt><dd>${h.h}</dd>`).join('');
  $('#bookAddr').innerHTML = `<b>${C.brand.name} ${C.brand.suffix}</b><br>${C.brand.address}`;

  const SOCIAL = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z"/></svg>',
    google: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path d="M6.4 14a6 6 0 0 1 0-3.8V7.6H3.1a10 10 0 0 0 0 8.9L6.4 14z"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.6L6.4 10c.8-2.3 3-4.1 5.6-4.1z"/></svg>',
  };
  $('#ftrLine').textContent = C.footer.line;
  $('#ftrFine').textContent = C.footer.fine;
  $('#ftrSocial').innerHTML = C.brand.socials
    .map((s) => `<a href="${s.url}" aria-label="${s.label}">${SOCIAL[s.id] || ''}</a>`).join('');

  /* ---------- mobile menu ---------- */
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = mob.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    mob.setAttribute('aria-hidden', !open);
  });
  mob.addEventListener('click', (e) => { if (e.target.tagName === 'A') { mob.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

  /* ---------- motion ---------- */
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!REDUCED && JUMP === null) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* hero entrance (time-based, not scroll) */
  if (!REDUCED) {
    gsap.fromTo('#wordRow .ch', { yPercent: 115, y: 0 }, { yPercent: 0, y: 0, duration: 1.15, stagger: 0.055, ease: 'expo.out', delay: 0.25 });
    gsap.fromTo('#heroLine', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, delay: 1.0, ease: 'power2.out' });
    gsap.fromTo('#introReadout', { opacity: 0 }, { opacity: 0.95, duration: 0.7, delay: 0.15 });
  } else {
    gsap.set('#wordRow .ch', { yPercent: 0 });
  }

  /* ----- THE INSPECTION (created FIRST — ordering law) ----- */
  const sys = C.inspection.systems;
  const zones = sys.map((s) => document.getElementById(`z-${s.id}`));
  const panel = $('#inspPanel'), panelSys = $('#panelSys'),
    panelSpecs = $('#panelSpecs'), panelStamp = $('#panelStamp'),
    countEl = $('#inspCount');
  const WINDOWS = [[0.30, 0.42], [0.44, 0.56], [0.58, 0.70], [0.72, 0.84]];
  let shownSys = -1;

  function renderPanel(i) {
    if (i === shownSys) return;
    shownSys = i;
    if (i < 0) return;
    const s = sys[i];
    panelSys.textContent = `▸ ${s.label}`;
    panelSpecs.innerHTML = s.specs.map((sp) => `
      <div class="spec-row"><span class="spec-k">${sp.k}</span>
      <span class="spec-v">${sp.v}</span><span class="spec-min">${sp.min}</span></div>`).join('');
    panelStamp.textContent = s.stamp;
  }

  const paths = gsap.utils.toArray('#carLines .cl');
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = REDUCED ? 0 : len;
  });

  if (!REDUCED) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#inspection', start: 'top top', end: '+=340%',
        pin: '#inspStage', scrub: true, anticipatePin: 1,
        onUpdate(self) {
          const p = self.progress;
          /* check counter */
          const n = Math.round(gsap.utils.clamp(0, 1, (p - 0.14) / 0.70) * 50);
          countEl.textContent = `CHECKS ${String(n).padStart(2, '0')}/50`;
          /* zones + panel state (scrub-safe, both directions) */
          let active = -1;
          WINDOWS.forEach(([a, b], i) => {
            const z = zones[i];
            z.classList.toggle('active', p >= a && p < b);
            z.classList.toggle('passed', p >= b);
            if (p >= a && p < b) active = i;
          });
          if (active >= 0) renderPanel(active);
          const inWin = active >= 0;
          panel.style.opacity = inWin ? 1 : 0;
          panel.style.visibility = inWin ? 'visible' : 'hidden';
          if (inWin) {
            const [a, b] = WINDOWS[active];
            panelStamp.classList.toggle('on', (p - a) / (b - a) > 0.62);
          }
        },
      },
    });

    tl.fromTo('#inspIntro', { opacity: 0 }, { opacity: 1, duration: 0.035 }, 0.008)
      .to('#inspIntro', { opacity: 0, duration: 0.03 }, 0.085)
      .fromTo('#liftPosts', { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.05)
      .fromTo('#floorLine', { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.05);
    /* car draws in */
    paths.forEach((p, i) => {
      tl.to(p, { strokeDashoffset: 0, duration: 0.09, ease: 'none' }, 0.06 + i * 0.006);
    });
    /* scan sweep */
    tl.fromTo('#scanLine', { attr: { x1: 60, x2: 60 }, opacity: 0 },
      { opacity: 0.9, duration: 0.012 }, 0.165)
      .to('#scanLine', { attr: { x1: 840, x2: 840 }, duration: 0.05, ease: 'none' }, 0.177)
      .to('#scanLine', { opacity: 0, duration: 0.012 }, 0.227);
    /* the lift */
    tl.to('#carGroup', { y: -64, duration: 0.07, ease: 'power1.inOut' }, 0.225);
    /* completion */
    tl.to('#carSvg', { opacity: 0.16, duration: 0.045 }, 0.865)
      .fromTo('#inspDone', { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.875)
      .fromTo('.insp-fade', { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.93);
  } else {
    /* reduced motion: static completed state */
    zones.forEach((z) => z.classList.add('passed'));
    $('#inspDone').style.opacity = 1;
    $('#carSvg').style.opacity = 0.33;
    countEl.textContent = 'CHECKS 50/50';
  }

  /* ----- ambient triggers (AFTER the pin — ordering law) ----- */
  if (!REDUCED) {
    gsap.utils.toArray('.man-line span').forEach((el, i) => {
      gsap.fromTo(el, { yPercent: 112, y: 0 }, {
        yPercent: 0, y: 0, duration: 1.05, ease: 'expo.out', delay: i * 0.12,
        scrollTrigger: { trigger: el.parentElement, start: 'top 82%', once: true },
      });
    });
    gsap.utils.toArray('.rv').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  } else {
    document.querySelectorAll('.rv').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.man-line span').forEach((el) => { el.style.transform = 'none'; });
  }
  ScrollTrigger.create({
    trigger: '#manifesto', start: 'top 64px',
    endTrigger: '#logbook', end: 'bottom 64px',
    toggleClass: { targets: '#hdr', className: 'on-light' },
  });

  /* services hover float (hidden until first real mousemove) */
  const float = $('#svcFloat'), floatImg = $('#svcFloatImg');
  let floatArmed = false, fx = 0, fy = 0, tx = 0, ty = 0, floatOn = false;
  addEventListener('mousemove', (e) => {
    if (!floatArmed) floatArmed = true;
    tx = e.clientX + 24; ty = e.clientY - 90;
  }, { passive: true });
  if (!REDUCED) gsap.ticker.add(() => {
    fx += (tx - fx) * 0.16; fy += (ty - fy) * 0.16;
    float.style.transform = `translate(${fx}px,${fy}px) scale(${floatOn ? 1 : 0.92})`;
    float.style.opacity = floatOn && floatArmed ? 1 : 0;
  });
  document.querySelectorAll('.svc-row').forEach((row) => {
    row.addEventListener('mouseenter', () => { floatImg.src = row.dataset.img; floatOn = true; });
    row.addEventListener('mouseleave', () => { floatOn = false; });
  });

  /* anchor nav with lenis */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: 0 }); else t.scrollIntoView();
    });
  });

  /* ---------- jank meter ---------- */
  let last = performance.now(), maxD = 0;
  const meter = () => {
    const now = performance.now(); const d = now - last; last = now;
    if (d > maxD) maxD = d;
    requestAnimationFrame(meter);
  };
  requestAnimationFrame(meter);
  setInterval(() => { console.log(`[jank] max rAF delta ${maxD.toFixed(1)}ms`); maxD = 0; }, 2000);

  /* ---------- dev contract ---------- */
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
  const hero = $('#heroImg');
  const heroDone = hero.complete ? Promise.resolve() : new Promise((r) => { hero.onload = r; hero.onerror = r; });
  Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), heroDone])
    .then(() => setTimeout(ready, 60));
})();
