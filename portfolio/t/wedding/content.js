/* OAKHOLLOW — the ONE content file.
 * Both tiers read this: index.html (premium scroll-film) and simple/index.html.
 * Swap venue details, copy and images here to re-skin the template for a client. */
window.OAKHOLLOW_CONTENT = {
  brand: {
    name: 'OAKHOLLOW',
    legal: 'Oakhollow Weddings',
    tagline: 'Begin under the oak.',
    sub: 'Forty acres, one 300-year live oak, and every hour of golden light.',
    kicker: 'Hill Country wedding venue · Dripping Springs, TX',
    city: 'Dripping Springs',
    address: '4820 Creek Rd, Dripping Springs, TX',
    phone: '(512) 555-0187',
    email: 'hello@oakhollowweddings.com',
    license: 'TABC-licensed bar · Fully insured',
    founded: ''
  },

  nav: [
    { label: 'Spaces', href: '#spaces' },
    { label: 'The Day', href: '#theday' },
    { label: 'Included', href: '#included' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Inquire', href: '#inquire' }
  ],
  cta: { label: 'Check your date', href: '#inquire' },

  /* Film beats — premium tier only. in/peak/out are film progress (0-1).
   * tone: 'light' = ivory text (dark frames), 'dark' = ink text (bright frames).
   * anchor: center | left | right. The finale uses out:2 so it never fades. */
  beats: [
    { id: 'hero',   in: -0.1, peak: 0,    out: 0.09, tone: 'light', anchor: 'center',
      kicker: 'Hill Country wedding venue · Dripping Springs, TX',
      title: 'Begin under the oak.',
      body: 'Forty acres, one 300-year live oak, and every hour of golden light.' },
    { id: 'ch1',    in: 0.12, peak: 0.17, out: 0.24, tone: 'light', anchor: 'left',
      kicker: '01 · The Meadow', title: 'Forty acres of quiet, one aisle.',
      body: 'The meadow faces west — every ceremony ends in golden light.' },
    { id: 'ch2',    in: 0.30, peak: 0.36, out: 0.44, tone: 'dark', anchor: 'right',
      kicker: '02 · The Rows', title: 'Fifty guests, or two hundred forty.',
      body: 'Chairs, tables, linens and staff are ours — nothing arrives on a rental truck.' },
    { id: 'ch3',    in: 0.48, peak: 0.54, out: 0.62, tone: 'dark', anchor: 'left',
      kicker: '03 · The Arch', title: 'Your florist’s favorite canvas.',
      body: 'A steel arch under the oak, wired and weighted for whatever they dream up.' },
    { id: 'ch4',    in: 0.66, peak: 0.72, out: 0.80, tone: 'dark', anchor: 'right',
      kicker: '04 · The Lights', title: 'Lit like a promise.',
      body: 'Café strings, aisle lanterns, chandeliers in the branches — all ours, all included.' },
    { id: 'finale', in: 0.87, peak: 0.93, out: 2, tone: 'light', anchor: 'left',
      kicker: '05 · The Ceremony', title: 'The hour you keep.',
      body: 'Golden hour is written into every contract — the meadow is yours from ten to midnight.',
      ctas: [
        { label: 'Check your date', href: '#inquire', kind: 'primary' },
        { label: 'Tour the spaces', href: '#spaces', kind: 'ghost' }
      ] }
  ],

  /* Header light-meter readout (premium): chapter label + time-of-day word. */
  chapters: [
    { until: 0.20, label: '01 · The Meadow' },
    { until: 0.42, label: '02 · The Rows' },
    { until: 0.62, label: '03 · The Arch' },
    { until: 0.84, label: '04 · The Lights' },
    { until: 1.01, label: '05 · The Ceremony' }
  ],
  lightWords: [
    [0, 'Dawn'], [0.22, 'Morning'], [0.42, 'Midday'],
    [0.60, 'Afternoon'], [0.72, 'Golden hour'], [0.88, 'Dusk']
  ],

  manifesto: {
    lede: 'Some places are built for weddings. This one was grown for them.',
    accent: 'grown',
    body: 'Oakhollow is forty acres of Hill Country meadow gathered around one ' +
      'three-hundred-year-old live oak. One wedding a weekend, the whole property ' +
      'from ten to midnight, and a team that has set a thousand chairs without ever ' +
      'once rushing a couple out of golden hour.'
  },

  stats: [
    { n: 40,  suffix: '', label: 'acres of meadow & shade' },
    { n: 240, suffix: '', label: 'guests, seated and danced' },
    { n: 1,   suffix: '', label: 'wedding per weekend — yours' },
    { n: 300, suffix: ' yrs', label: 'the oak that marries you' }
  ],

  spaces: {
    kicker: 'The spaces',
    title: 'One meadow, three rooms.',
    items: [
      { name: 'The Hall', place: 'Seats 240',
        spec: 'reclaimed timber frame · farm tables · candlelight',
        blurb: 'A restored timber-frame hall with farm tables, cross-back chairs and ' +
          'candlelight to the rafters. Dinner lives here — and so does the plan when ' +
          'the weather votes no.',
        img: 'img/space-hall.jpg' },
      { name: 'The Courtyard', place: 'Open sky',
        spec: 'limestone · café lights · oaks all around',
        blurb: 'Limestone underfoot and café lights overhead, walled by old oaks. ' +
          'The dance floor people are still talking about at brunch.',
        img: 'img/space-courtyard.jpg' },
      { name: 'The Suite', place: 'Private',
        spec: 'farmhouse · tall windows · morning light',
        blurb: 'A restored farmhouse suite with tall windows and honest mirrors. ' +
          'Mornings here become half the photographs.',
        img: 'img/space-suite.jpg' }
    ]
  },

  theday: {
    kicker: 'The day',
    title: 'Ten to midnight, unhurried.',
    detailImg: 'img/detail-place.jpg',
    detailCaption: 'Place setting, The Hall — golden hour.',
    steps: [
      { title: 'The suites open', weeks: '10:00 AM',
        body: 'Coffee on, steamer warm, playlists yours. The day starts slow on purpose.' },
      { title: 'First look', weeks: '4:00 PM',
        body: 'Under the oak or out in the meadow — the light is soft either way.' },
      { title: 'The ceremony', weeks: '6:00 PM',
        body: 'West-facing rows under the oak. Twenty minutes of forever.' },
      { title: 'Golden hour', weeks: '7:30 PM',
        body: 'Dinner pauses for photographs. It is written into the timeline — and the contract.' },
      { title: 'Last dance', weeks: '11:45 PM',
        body: 'Sparklers out front. Behind you, our team handles every chair.' }
    ]
  },

  included: {
    kicker: 'Included',
    title: 'Ours, not rented.',
    items: [
      { title: 'Tables, chairs & linens',
        body: 'Farm tables, cross-backs, ceremony seating for 240 and pressed linens — set and struck by our team.' },
      { title: 'Day-of coordination',
        body: 'A lead coordinator from your first tour to your last dance, plus a written month-of timeline.' },
      { title: 'The light plan',
        body: 'Café strings, aisle lanterns, chandeliers in the oak — hung, dimmed and tended all night.' },
      { title: 'Open vendor policy',
        body: 'Any caterer, florist, band or photographer. We hand them a load-in map, not a rulebook.' }
    ]
  },

  pricing: {
    kicker: 'Pricing',
    title: 'Weekends from $7,800.',
    body: 'Fridays from $5,400, weekdays from $3,900. Every date includes the full property ' +
      'from ten to midnight, both suites, and the Oakhollow team. Hold any date free for 14 days.',
    cta: { label: 'Check your date', href: '#inquire' }
  },

  testimonials: [
    { quote: 'It rained for twenty minutes and we never noticed — the team flipped the ' +
        'courtyard while we were still at cocktail hour.', name: 'Maren & Josh — June 2025' },
    { quote: 'Golden hour under that oak is the reason our photographer cried.',
      name: 'Priya & Dan — October 2025' }
  ],

  areasLabel: 'Couples come from',
  areas: ['Austin', 'San Antonio', 'Fredericksburg', 'Houston', 'Dallas'],

  contact: {
    kicker: 'Inquire',
    title: 'Check your date.',
    body: 'Tell us the season you are dreaming about. We answer within a day, and tours ' +
      'end at the oak at sunset — on purpose.',
    /* Template slot: point at the client CRM / GHL webhook. '#' keeps the form in demo mode. */
    endpoint: '#',
    guestCounts: ['Under 75', '75–150', '150–240']
  }
};
