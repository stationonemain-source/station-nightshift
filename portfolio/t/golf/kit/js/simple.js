/* station-shared/simple.js — the simple tier's renderer, shared by all sites.
   Reads window.SITE (same schema as the premium tier) and fills fixed ids.
   `extra` is whichever trust block that niche uses (paperwork / comfort / etc).  */
(() => {
  const C = window.SITE;
  const $ = (s) => document.querySelector(s);
  const set = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
  const up = (s) => String(s).toUpperCase();

  set('#hdrPhone', C.brand.phone);
  const hc = $('#hdrCall'); if (hc) hc.href = C.brand.phoneHref;

  set('#heroKick', up(C.brand.tagline));
  set('#heroLede', C.hero.sub);
  const call = (sel) => {
    const el = $(sel);
    if (!el) return;
    el.href = C.brand.phoneHref;
    el.querySelector('span').textContent = `Call ${C.brand.phone}`;
  };
  call('#heroCall'); call('#ctCall');
  if ($('#heroBadges')) $('#heroBadges').innerHTML = C.booking.badges.map((b) => `<li>${b}</li>`).join('');
  const hi = $('#heroImg');
  if (hi) { hi.src = `../${C.hero.src}`; hi.alt = C.hero.alt; }

  if ($('#svcGrid')) $('#svcGrid').innerHTML = C.services.map((s) => `
    <article class="svc-card rv">
      <figure><img src="../${s.img}" alt="" loading="lazy"></figure>
      <div class="svc-body"><h3>${s.title}</h3><p class="mono spec">${s.spec}</p>
      <p>${s.blurb}</p><p class="mono price">${s.price}</p></div>
    </article>`).join('');

  const X = C.extra;
  if (X) {
    set('#extraH', X.title);
    set('#extraSub', X.sub);
    if ($('#extraItems')) $('#extraItems').innerHTML = X.items
      .map((i) => `<div><dt>${i.k}</dt><dd>${i.v}</dd></div>`).join('');
  }

  const L = C.crew;
  const li = $('#leadImg');
  if (li) { li.src = `../${L.leadPhoto}`; li.alt = `${L.leadName}, ${L.leadRole}`; }
  set('#leadCap', `${up(L.leadName)} · ${up(L.leadRole)}`);
  set('#aboutStory', L.story);
  if ($('#aboutCerts')) $('#aboutCerts').innerHTML = L.certs.map((c) => `<li>${c}</li>`).join('');
  if ($('#aboutStats')) $('#aboutStats').innerHTML = C.manifesto.stats
    .map((s) => `<div><b>${s.n}</b><i>${s.label}</i></div>`).join('');

  if ($('#revGrid')) $('#revGrid').innerHTML = C.reviews.map((r) => `
    <article class="rev-card rv">
      <p class="rev-head">${r.tag} <span class="stars">★★★★★</span></p>
      <p>“${r.note}”</p><p class="rev-name">— ${r.name}</p>
    </article>`).join('');

  set('#ctH', C.booking.title);
  set('#ctSub', C.booking.sub);
  const cm = $('#ctMail');
  if (cm) { cm.href = `mailto:${C.brand.email}`; cm.querySelector('span').textContent = C.brand.email; }
  if ($('#ctHours')) $('#ctHours').innerHTML = C.booking.hours.map((h) => `<dt>${h.d}</dt><dd>${h.h}</dd>`).join('');
  if ($('#ctAddr')) $('#ctAddr').innerHTML = `<b>${C.brand.name} ${C.brand.suffix}</b><br>${C.brand.address}`;
  set('#ftrLine', C.footer.line);
  set('#ftrFine', C.footer.fine);

  /* reveals + the dev contract the verify harness needs */
  const JUMP = new URLSearchParams(location.search).get('jump');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const all = document.querySelectorAll('.rv');
  if (reduced || JUMP !== null) {
    all.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    all.forEach((el) => io.observe(el));
  }
  if (JUMP !== null) { history.scrollRestoration = 'manual'; scrollTo(0, +JUMP || 0); }
  window.__ready = true;
})();
