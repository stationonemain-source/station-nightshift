/* BRAESIDE premium — renders from content.js, then THE CLOSING STRETCH.
   Signature scene: the scorecard fills in hole by hole while the paired
   photograph and caddie note crossfade beside it. */
(() => {
  const C = window.SITE;
  const K = window.StationCore;
  const { $, REDUCED } = K;

  /* ---------- render ---------- */
  K.renderNav(C.nav);
  $('#heroReadout').textContent = C.hero.readout;
  $('#heroImg').alt = C.hero.alt;
  $('#heroSub').textContent = C.hero.sub;
  $('#cueText').textContent = C.hero.cue;
  $('#heroSpec').innerHTML = [
    { k: 'GREEN FEES', v: '$38–68' },
    { k: 'PACE', v: '4 HRS, ENFORCED' },
    { k: 'STIMP', v: '11.2 AVG' },
  ].map((d) => `<div><dt>${d.k}</dt><dd>${d.v}</dd></div>`).join('');

  const D = C.card;
  $('#stageTitle').textContent = D.title;
  $('#beatIntroText').textContent = D.intro;
  $('#doneTag').textContent = D.complete;
  $('#doneVerdict').innerHTML = D.verdict.replace('earned', '<em>earned</em>');

  C.manifesto.lines.forEach((l, i) => { $(`#man-l${i} span`).textContent = l; });
  $('#manSupport').textContent = C.manifesto.support;
  $('#manStats').innerHTML = C.manifesto.stats
    .map((s) => `<div class="man-stat rv"><b>${s.n}</b><i>${s.label}</i></div>`).join('');

  $('#svcGrid').innerHTML = C.services.map((s) => `
    <article class="svc-card rv">
      <figure><img src="${s.img}" alt="" loading="lazy"></figure>
      <div class="svc-body"><h3>${s.title}</h3><p class="spec">${s.spec}</p>
      <p>${s.blurb}</p><p class="price">${s.price}</p></div>
    </article>`).join('');

  const X = C.extra;
  $('#stepsImg').src = X.img; $('#stepsImg').alt = X.imgAlt;
  $('#stepsTitle').textContent = X.title;
  $('#stepsSub').textContent = X.sub;
  $('#stepsList').innerHTML = X.items.map((i) => `<div class="rv"><dt>${i.k}</dt><dd>${i.v}</dd></div>`).join('');

  const W = C.crew;
  $('#crewPhotos').innerHTML = W.photos
    .map((p) => `<figure class="rv"><img src="${p.src}" alt="${p.alt}" loading="lazy"></figure>`).join('');
  $('#leadPhoto').src = W.leadPhoto;
  $('#leadPhoto').alt = `${W.leadName}, ${W.leadRole}`;
  $('#leadCap').textContent = `${W.leadName.toUpperCase()} · ${W.leadRole.toUpperCase()}`;
  $('#crewStory').textContent = W.story;
  $('#crewCerts').innerHTML = W.certs.map((c) => `<li>${c}</li>`).join('');

  $('#revGrid').innerHTML = C.reviews.map((r) => `
    <article class="rev-card rv">
      <span class="rev-tag">${r.tag}</span>
      <p class="rev-note">“${r.note}”</p>
      <p class="rev-meta"><span>— ${r.name}</span><span>${r.date}</span></p>
    </article>`).join('');

  K.renderBooking(C.brand, C.booking);
  K.renderFooter(C.brand, C.footer);

  /* ---------- build the scorecard + paired photos ---------- */
  $('#holeList').innerHTML = D.holes.map((h) => `
    <div class="hole-row">
      <span class="hole-num">${h.n}</span>
      <span class="hole-par">PAR ${h.par}</span>
      <span class="hole-yds">${h.yds} YDS</span>
      <span class="hole-name">${h.name}</span>
    </div>`).join('');
  const rows = K.$$('.hole-row');
  const countEl = $('#cardCount');
  const capHole = $('#capHole'), capNote = $('#capNote');

  const photoWrap = $('#cardPhoto');
  const photos = D.holes.map((h, i) => {
    const im = document.createElement('img');
    im.src = h.img; im.alt = '';
    im.loading = i === 0 ? 'eager' : 'lazy';
    photoWrap.insertBefore(im, photoWrap.firstChild);
    return im;
  });
  let shownHole = -1;

  function showHole(i) {
    if (i === shownHole) return;
    shownHole = i;
    const h = D.holes[i];
    capHole.textContent = `NO. ${h.n} · ${h.name} · PAR ${h.par} · ${h.yds} YDS`;
    capNote.textContent = h.note;
    photos.forEach((im, j) => { im.style.opacity = j === i ? 1 : 0; });
    if (!REDUCED) gsap.fromTo([capHole, capNote], { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: .5, stagger: .06, ease: 'power2.out', overwrite: 'auto' });
  }

  /* ---------- motion ---------- */
  K.smooth();
  K.heroLines('.hl-inner');
  if (!REDUCED) {
    gsap.fromTo('#heroReadout', { opacity: 0 }, { opacity: 1, duration: .7, delay: .1 });
    gsap.fromTo('#heroSub', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .9, delay: .95, ease: 'power2.out' });
    gsap.fromTo('.hero-spec div', { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: .8, stagger: .08, delay: 1.15, ease: 'power2.out' });
  } else {
    $('#heroSub').style.opacity = 1;
    document.querySelectorAll('.hero-spec div').forEach((d) => { d.style.opacity = 1; });
  }

  /* ----- THE CLOSING STRETCH (pinned; before ambient — ordering law) ----- */
  const IN = 0.10, OUT = 0.88;
  const SPAN = (OUT - IN) / rows.length;

  function paint(p) {
    let live = 0, done = 0;
    rows.forEach((el, i) => {
      const start = IN + i * SPAN;
      const f = gsap.utils.clamp(0, 1, (p - start) / SPAN);
      el.classList.toggle('on', f > 0);
      el.classList.toggle('now', f > 0 && f < 1);
      if (f >= 1) done += 1;
      if (f > 0) live = i;
    });
    countEl.textContent = `${done} / ${rows.length} CARDED`;
    showHole(live);
  }

  if (!REDUCED) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#stretch', start: 'top top', end: '+=420%',
        pin: '#stretchStage', scrub: true, anticipatePin: 1,
        onUpdate(self) { paint(self.progress); },
      },
    });
    tl.to('#beatIntro', { opacity: 0, duration: .03 }, .045)
      .fromTo('#beatDone', { opacity: 0 }, { opacity: 1, duration: .05 }, .90);
    gsap.set('#beatIntro', { opacity: 1 });
    paint(0);
  } else {
    paint(1);
    $('#beatIntro').style.display = 'none';
    $('#beatDone').style.opacity = 1;
    $('#beatDone').style.background = 'transparent';
  }

  /* ----- ambient AFTER the pin ----- */
  K.ambient({ dark: ['#paperwork', '#book'] });
  K.anchors();
  K.finish({ waitFor: '#heroImg' });
})();
