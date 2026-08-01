/* GABLE Roof Co. — the ONE content file.
 * Both tiers read this: index.html (premium scroll-film) and simple/index.html.
 * Swap city, contact, images and copy here to re-skin the template for a client. */
window.GABLE_CONTENT = {
  brand: {
    name: 'GABLE',
    legal: 'Gable Roof Co.',
    tagline: 'The roof over everything.',
    sub: 'Replacement, repair and storm restoration — built to outlive the warranty.',
    kicker: 'Roofing · Austin, TX',
    city: 'Austin',
    phone: '(512) 555-0164',
    email: 'hello@gableroof.co',
    license: 'TX Licensed & Insured · GAF Master Elite',
    founded: ''
  },

  nav: [
    { label: 'Work', href: '#work' },
    { label: 'The System', href: '#system' },
    { label: 'Storm Help', href: '#storm' },
    { label: 'Financing', href: '#financing' },
    { label: 'Inspection', href: '#inspection' }
  ],
  cta: { label: 'Free inspection', href: '#inspection' },

  /* Film beats — premium tier only. tone: light|dark text; anchor: center|left|right. */
  beats: [
    { id: 'hero',   in: -0.1, peak: 0,    out: 0.09, tone: 'light', anchor: 'center',
      kicker: 'Roofing · Austin, TX',
      title: 'The roof over everything.',
      body: 'Replacement, repair and storm restoration — built to outlive the warranty.' },
    { id: 'ch1',    in: 0.12, peak: 0.17, out: 0.24, tone: 'light', anchor: 'left',
      kicker: '01 · The Ground', title: 'Every roof starts with boots on the lawn.',
      body: 'A 40-point inspection, photographed and explained in plain English — free.' },
    { id: 'ch2',    in: 0.30, peak: 0.36, out: 0.44, tone: 'light', anchor: 'right',
      kicker: '02 · The Eave', title: 'The edge is where roofs fail.',
      body: 'Drip edge, ice-and-water shield, seamless gutters — the unglamorous parts, done right.' },
    { id: 'ch3',    in: 0.48, peak: 0.54, out: 0.62, tone: 'light', anchor: 'left',
      kicker: '03 · The Field', title: 'Class 4 shingles, nailed to spec.',
      body: 'Impact-rated architectural shingles. Your insurance company knows exactly what that means.' },
    { id: 'ch4',    in: 0.66, peak: 0.72, out: 0.80, tone: 'light', anchor: 'right',
      kicker: '04 · The Ridge', title: 'Ventilation is the warranty’s fine print.',
      body: 'Ridge vents balanced to soffit intake — heat out, decking dry, shingles honest.' },
    { id: 'finale', in: 0.87, peak: 0.93, out: 2, tone: 'light', anchor: 'left',
      kicker: '05 · The Neighborhood', title: 'The neighborhood standard.',
      body: '2,400 roofs across Austin. Inspected free. Built once.',
      ctas: [
        { label: 'Book a free inspection', href: '#inspection', kind: 'primary' },
        { label: 'See our work', href: '#work', kind: 'ghost' }
      ] }
  ],

  /* Header altitude readout (premium): chapter label + elevation. */
  chapters: [
    { until: 0.20, label: '01 · The Ground' },
    { until: 0.42, label: '02 · The Eave' },
    { until: 0.62, label: '03 · The Field' },
    { until: 0.84, label: '04 · The Ridge' },
    { until: 1.01, label: '05 · The Neighborhood' }
  ],
  /* progress -> feet above ground; past 0.86 the readout flips to AERIAL. */
  elevation: [[0, 5], [0.2, 14], [0.42, 22], [0.62, 28], [0.8, 32], [0.86, 60], [1, 220]],

  manifesto: {
    lede: 'A roof is a promise you make once.',
    accent: 'once',
    body: 'GABLE is a crew-owned roofing company: our estimators climbed ladders before ' +
      'they carried tablets, our crews are employees, and every roof gets the same spec ' +
      'we put on our own homes. No storm-chaser vans, no disappearing warranties.'
  },

  stats: [
    { n: 2400, suffix: '+', label: 'roofs across greater Austin' },
    { n: 24,   suffix: ' hr', label: 'storm tarp response, any night' },
    { n: 4,    suffix: '', label: 'Class — the impact rating we install' },
    { n: 50,   suffix: ' yr', label: 'manufacturer-backed warranties' }
  ],

  work: {
    kicker: 'Recent work',
    title: 'Three roofs, three materials.',
    items: [
      { name: 'The Hartley House', place: 'Tarrytown',
        spec: 'standing-seam metal · charcoal · 24 squares',
        blurb: 'A 1960s ranch gone modern: concealed-fastener standing seam, snow-country ' +
          'underlayment specs in a hail state, and a roof that will outlive the mortgage.',
        img: 'img/work-metal.jpg' },
      { name: 'The Bellmead Cottage', place: 'Hyde Park',
        spec: 'Class 4 architectural shingle · weathered wood',
        blurb: 'Full tear-off, two decking repairs the old roof was hiding, and a hand-nailed ' +
          'shingle field that earned the owners an insurance discount.',
        img: 'img/work-shingle.jpg' },
      { name: 'Casa Sabino', place: 'Barton Hills',
        spec: 'clay barrel tile · mixed terracotta · full relay',
        blurb: 'Every tile lifted, felt and flashing replaced beneath, and ninety percent of ' +
          'the original clay relaid — the roof looks original because it mostly is.',
        img: 'img/work-tile.jpg' }
    ]
  },

  system: {
    kicker: 'The system',
    title: 'What a GABLE roof is made of.',
    detailImg: 'img/detail-flashing.jpg',
    detailCaption: 'Copper drip edge and valley, The Bellmead Cottage.',
    steps: [
      { title: 'Inspection & report', weeks: 'Day 1',
        body: 'Forty points, photographed on your actual roof. You keep the report either way.' },
      { title: 'Tear-off & deck check', weeks: 'Day 2',
        body: 'Down to bare decking, every sheet sounded and screwed. Rot never gets shingled over.' },
      { title: 'Underlayment & flashing', weeks: 'Day 2',
        body: 'Ice-and-water shield in the valleys and eaves, synthetic felt on the field, new metal everywhere.' },
      { title: 'Shingle field & ridge', weeks: 'Day 3',
        body: 'Class 4 architectural shingles nailed to manufacturer spec, ridge vent balanced to intake.' },
      { title: 'Walkthrough & warranty', weeks: 'Day 3',
        body: 'Magnet-swept lawn, photographed result, registered 50-year warranty in your name.' }
    ]
  },

  services: {
    kicker: 'Storm help',
    title: 'Four ways we show up.',
    items: [
      { title: 'Full replacement',
        body: 'Tear-off to warranty registration in three days, most homes — shingle, metal or tile.' },
      { title: 'Storm & insurance claims',
        body: 'We tarp within 24 hours, document everything, and meet your adjuster on the roof.' },
      { title: 'Metal & specialty',
        body: 'Standing seam, clay and concrete tile, low-slope TPO — the crews, not subcontractors.' },
      { title: 'Repair & maintenance',
        body: 'Leaks chased to the source, flashing rebuilt, gutters and ventilation tuned.' }
    ]
  },

  financing: {
    kicker: 'Financing',
    title: 'Most roofs: $12K–$28K.',
    body: 'Financed from around $185/mo through partner lenders, approvals inside a day. ' +
      'On insurance claims you pay your deductible — we handle the rest of the paperwork.',
    cta: { label: 'Book the free inspection', href: '#inspection' }
  },

  testimonials: [
    { quote: 'Hail on a Friday, tarped Saturday morning, adjuster met Tuesday, new roof the ' +
        'next week. Our neighbors are still fighting their claim.', name: 'D. Okafor — Round Rock' },
    { quote: 'They found rot two other companies quoted right over. Fixed it, photographed it, ' +
        'charged what they said they would.', name: 'S. & T. Nguyen — Cedar Park' }
  ],

  areasLabel: 'Serving',
  areas: ['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Dripping Springs', 'Lakeway'],

  contact: {
    kicker: 'Inspection',
    title: 'Get the free inspection.',
    body: 'Forty points, photographs, a plain-English report — and zero pressure. If your roof ' +
      'has years left, we will tell you that too.',
    /* Template slot: point at the client CRM / GHL webhook. '#' keeps the form in demo mode. */
    endpoint: '#',
    concerns: ['Storm or hail damage', 'Roof age / replacement', 'Active leak', 'New build or addition']
  }
};
