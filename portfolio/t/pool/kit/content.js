/* GLASS Pool Co. — the ONE content file.
 * Both tiers read this: index.html (premium scroll-film) and simple/index.html.
 * Swap city, contact, images and copy here to re-skin the template for a client. */
window.GLASS_CONTENT = {
  brand: {
    name: 'GLASS',
    legal: 'Glass Pool Co.',
    tagline: 'Water, held still.',
    sub: 'Design-build pools & outdoor living for the Texas Hill Country.',
    kicker: 'Custom pools · Austin, TX',
    city: 'Austin',
    // 2-letter state; niche_kit._swap_state rewrites this to the prospect's real
    // state on generate. The footer used to hard-code ", Texas" instead.
    region: 'TX',
    phone: '(512) 555-0143',
    email: 'hello@glasspool.co',
    // NEVER ship a license/registration number the client did not give us. This kit
    // used to hard-code 'TX Licensed & Insured · TICL #78421' -- a fabricated Texas
    // contractor number that went out on every pool demo under the client's own name.
    // Leave it empty; site.js omits the line entirely when it is blank, and it gets
    // filled from the client's real credentials on purchase.
    license: '',
    // Same rule as license: a founding year is a verifiable claim about the client's
    // business, not set dressing. Blank until they tell us -- site.js drops the
    // "Since ____" line when it is empty.
    founded: ''
  },

  nav: [
    { label: 'Builds', href: '#builds' },
    { label: 'Process', href: '#process' },
    { label: 'Services', href: '#services' },
    { label: 'Financing', href: '#financing' },
    { label: 'Contact', href: '#contact' }
  ],
  cta: { label: 'Book a consult', href: '#contact' },

  /* Film beats — premium tier only. in/peak/out are film progress (0-1).
   * The finale uses out:2 so it never fades. */
  beats: [
    { id: 'hero',   in: -0.1, peak: 0,     out: 0.09,
      kicker: 'Custom pools · Austin, TX', title: 'Water, held still.',
      body: 'Design-build pools & outdoor living for the Texas Hill Country.' },
    { id: 'ch1',    in: 0.12, peak: 0.17,  out: 0.24,
      kicker: '01 · The Surface', title: 'Built to read like part of the architecture.',
      body: 'Sight-lines, stone and waterline are decided before the first shovel.' },
    { id: 'ch2',    in: 0.30, peak: 0.36,  out: 0.44,
      kicker: '02 · The Shell', title: 'Eleven inches of steel-tied gunite under every quiet surface.',
      // "warrantied for 25 years" was an invented warranty term -- same problem as the
      // fake license number. Describe the construction, not a guarantee we can't make.
      body: 'Engineered for expansive Hill Country clay, and built to outlast the house.' },
    { id: 'ch3',    in: 0.48, peak: 0.54,  out: 0.62,
      kicker: '03 · The Craft', title: 'The details you only see underwater decide how it ages.',
      body: 'Hand-set stone and tile, measured in millimeters.' },
    { id: 'ch4',    in: 0.66, peak: 0.72,  out: 0.80,
      kicker: '04 · The Finish', title: 'First sketch to first fill in fourteen weeks.',
      body: 'One team, one contract, no handoffs.' },
    { id: 'finale', in: 0.87, peak: 0.93,  out: 2,
      kicker: '05 · After Dark', title: 'Your backyard, after dark.',
      body: 'This is what we build. The rest of the page is how.',
      ctas: [
        { label: 'Book a design consultation', href: '#contact', kind: 'primary' },
        { label: 'See our builds', href: '#builds', kind: 'ghost' }
      ] }
  ],

  /* Depth-gauge chapters for the premium header readout. */
  chapters: [
    { until: 0.20, label: '01 · The Surface' },
    { until: 0.42, label: '02 · The Shell' },
    { until: 0.62, label: '03 · The Craft' },
    { until: 0.84, label: '04 · The Finish' },
    { until: 1.01, label: '05 · After Dark' }
  ],

  manifesto: {
    lede: 'The backyard is the last room of the house. We build it in water.',
    // Keep this at 40-160 words. It is the paragraph an AI assistant quotes when it
    // answers "what does this company do?", and anything shorter gets skipped.
    body: 'GLASS is a design-build studio: one team from the first sketch to the first swim. ' +
      'We design the pool, engineer it, and build it ourselves — no subbed-out shells, ' +
      'no handoffs between trades, no surprises halfway through the season. That means ' +
      'custom gunite pools and spas, water and fire features, the outdoor room around ' +
      'them, and renovations of pools worth saving. What you get is quiet geometry, ' +
      'honest stone, and water engineered to hold still.'
  },

  // Empty on purpose -- see the note in site.js. These were invented numbers about
  // the client's business. Fill them ONLY with figures the client has given us:
  //   stats: [{ n: 300, suffix: '+', label: 'pools designed & built' }, ...]
  stats: [],

  builds: {
    kicker: 'Signature builds',
    title: 'Three backyards, held still.',
    items: [
      { name: 'Ledgestone', place: 'Westlake',
        spec: "68' geometric · raised spa · glass tile & bluestone",
        blurb: 'A pool aligned to the house grid so precisely the spa spillway reads ' +
          'as a fourth window. Dark interior, one-inch glass tile, a single sheet of moving water.',
        img: 'img/build-ledgestone.jpg' },
      { name: 'Cove', place: 'Dripping Springs',
        spec: 'freeform lagoon · boulder falls · native planting',
        blurb: 'Native limestone boulders set before the shell was shot, so the water ' +
          'wraps the rock instead of meeting it. Reads found, not built.',
        img: 'img/build-cove.jpg' },
      { name: 'Mirror Ridge', place: 'Lakeway',
        spec: 'perimeter-overflow · tanning ledge · twin fire bowls',
        blurb: 'A knife-edge overflow on all four sides. By day it disappears into the ' +
          'hills; by night it is a black mirror with two flames standing in it.',
        img: 'img/build-mirrorridge.jpg' }
    ]
  },

  process: {
    kicker: 'The build',
    title: 'Fourteen weeks, five chapters.',
    detailImg: 'img/detail-spillway.jpg',
    detailCaption: 'Spillway sheet, Ledgestone — week eleven.',
    steps: [
      { title: 'Design & engineering', weeks: 'Weeks 1–3',
        body: '3D design in your actual backyard, geotech borings, structural engineering, HOA & permits.' },
      { title: 'Excavation & steel', weeks: 'Weeks 4–5',
        body: 'Dig, plumb and a steel cage tied by hand — the skeleton every quiet surface hangs on.' },
      { title: 'Gunite shell', weeks: 'Week 6',
        body: 'Eleven inches of pneumatically-placed concrete, then a supervised 28-day wet cure.' },
      { title: 'Stone, tile & decking', weeks: 'Weeks 7–11',
        body: 'Coping, waterline tile, decking and the outdoor room — the slow, visible craft.' },
      { title: 'Interior & first fill', weeks: 'Weeks 12–14',
        body: 'Interior finish, water chemistry start-up, equipment orientation. Then we hand you the calm.' }
    ]
  },

  services: {
    kicker: 'What we build',
    title: 'Four ways in.',
    items: [
      { title: 'Custom pools & spas',
        body: 'Design-build gunite pools — geometric, freeform, perimeter-overflow — with all-tile or polished interiors.' },
      { title: 'Water & fire features',
        body: 'Spillways, sheer descents, rain curtains, fire bowls — motion designed to make the stillness read.' },
      { title: 'Outdoor living',
        body: 'Kitchens, pergolas, decking, landscape and lighting — the room around the water.' },
      { title: 'Renovation & remodel',
        body: 'Resurfacing, tile and coping, equipment and automation for pools that deserve a second life.' }
    ]
  },

  // NOTE: this block used to ship invented numbers ("Builds from $95K", "$1,240/mo",
  // "approvals inside 48 hours, no draw fees"). Those are financial claims, and they
  // went out under the client's name on every demo built from this kit. Never put a
  // price, a rate, or an approval time here unless the client supplied it -- the copy
  // below says the true thing (financing exists, the number depends on the build)
  // without asserting anything we cannot back.
  financing: {
    kicker: 'Financing',
    title: 'Built to your budget.',
    body: 'Every build is priced from the design, so the number follows the backyard rather ' +
      'than a package. Financing is available — we will walk through the options with ' +
      'you once the scope is set.',
    cta: { label: 'Start a conversation', href: '#contact' }
  },

  testimonials: [
    { quote: 'They promised fourteen weeks and delivered in thirteen. The pool is now the reason ' +
        'people think we bought the house.', name: 'R. & C. Alvarez — Westlake' },
    { quote: 'Every sight-line from the kitchen ends in water. It is the calmest thing we own.',
      name: 'M. Straub — Lakeway' }
  ],

  areas: ['Austin', 'Westlake', 'Rollingwood', 'Lakeway', 'Dripping Springs', 'Spicewood'],

  contact: {
    kicker: 'Start here',
    title: 'Start with a conversation.',
    body: 'Tell us about the backyard. We will come look, listen, and bring a sketch to the second meeting.',
    /* Template slot: point at the client CRM / GHL webhook. '#' keeps the form in demo mode. */
    endpoint: '#',
    projectTypes: ['New pool', 'Pool + outdoor living', 'Renovation']
  }
};
