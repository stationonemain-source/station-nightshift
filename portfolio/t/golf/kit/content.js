/* BRAESIDE Golf Club — shared content. Both tiers read this one file. */
window.SITE = {
  brand: {
    name: 'BRAESIDE',
    suffix: 'Golf Club',
    tagline: 'Public 18 holes — Houston, Texas',
    city: 'Houston, TX',
    address: '10440 Braeside Dr, Houston, TX 77071',
    phone: '(713) 555-0193',
    phoneHref: 'tel:+17135550193',
    email: 'proshop@braesidegolf.com',
    license: 'EST. 1962',
    socials: [
      { id: 'instagram', label: 'Instagram', url: '#' },
      { id: 'facebook', label: 'Facebook', url: '#' },
      { id: 'google', label: 'Google Reviews', url: '#' },
    ],
  },

  nav: [
    { label: 'The Course', href: '#services' },
    { label: 'Conditions', href: '#paperwork' },
    { label: 'The Club', href: '#crew' },
    { label: 'Book a Tee Time', href: '#book', cta: true },
  ],

  hero: {
    src: 'assets/photos/hero.jpg',
    alt: 'A dramatic par-3 green guarded by water and bunkers at dawn',
    readout: 'EST. 1962 · PUBLIC WELCOME · WALKABLE 18',
    lines: ['Sixty-two years', 'under the oaks.'],
    sub: 'A classic parkland eighteen that asks you to shape shots, not bomb them. Greens rolling true, tee times seven days a week, and nobody checking your handicap at the door.',
    cue: 'play the stretch',
  },

  /* THE SCORECARD — the premium signature. The famous closing stretch, hole by hole. */
  card: {
    title: 'THE CLOSING STRETCH',
    intro: 'Every course has a stretch that decides the round. Ours is 15 through 18 — four holes that have been rearranging Saturday matches since 1962. Here is how they play.',
    complete: 'THE STRETCH · CARDED',
    verdict: 'Par here and you have earned the clubhouse.',
    holes: [
      { n: 15, par: 4, yds: 415, name: 'THE OAKS', img: 'assets/photos/fairway.jpg', note: 'A drive threaded between two-hundred-year-old live oaks. Position beats distance — the approach opens up only from the left half.' },
      { n: 16, par: 3, yds: 178, name: 'THE CARRY', img: 'assets/photos/hero.jpg', note: 'All carry over water to a green that slopes away. The smart miss is long; everything short is wet and everyone knows it.' },
      { n: 17, par: 5, yds: 540, name: 'THE DECISION', img: 'assets/photos/green.jpg', note: 'Reachable in two if you flirt with the right-side bunkers. The scorecard says par five; your match probably says go.' },
      { n: 18, par: 4, yds: 432, name: 'THE WALK HOME', img: 'assets/photos/clubhouse.jpg', note: 'Uphill to a green that sits under the clubhouse terrace, where everyone on the rail has an opinion about your club choice.' },
    ],
  },

  manifesto: {
    lines: ['Great golf is conditions,', 'not clubhouse chandeliers.'],
    support:
      'We put the budget where your ball actually rolls: greens cut daily and rolled true, bunkers with actual sand in them, fairways that reward a struck iron. The clubhouse is comfortable, the burger is honest, and the course is the point.',
    stats: [
      { n: '11.2', label: 'average stimp, measured weekly' },
      { n: '4 HRS', label: 'the pace we actually enforce' },
      { n: '$38–68', label: 'walking green fees, public always welcome' },
    ],
  },

  services: [
    {
      title: 'Daily Tee Times',
      spec: 'PUBLIC · 7 DAYS · WALKING ALWAYS ALLOWED',
      blurb: 'Booked online, first light to twilight, singles welcome.',
      price: '$38–68',
      img: 'assets/photos/fairway.jpg',
    },
    {
      title: 'Memberships',
      spec: 'UNLIMITED GOLF · 10-DAY BOOKING WINDOW · NO ASSESSMENTS',
      blurb: 'One flat rate, no initiation games, no minimums at the grill.',
      price: 'from $215 / month',
      img: 'assets/photos/green.jpg',
    },
    {
      title: 'The Range & Lessons',
      spec: 'GRASS TEES · PGA INSTRUCTION · JUNIOR PROGRAM',
      blurb: 'A real grass range and a teaching pro who watches you, not a screen.',
      price: 'lessons from $85',
      img: 'assets/photos/practice.jpg',
    },
    {
      title: 'Tournaments & Outings',
      spec: '40–144 PLAYERS · SCORING RUN BY US · TERRACE DINNER',
      blurb: 'Corporate days and charity scrambles that run on time.',
      price: 'from $95 / player',
      img: 'assets/photos/cart.jpg',
    },
    {
      title: 'The Grill',
      spec: 'OPEN TO THE PUBLIC · TERRACE OVER 18 · HONEST BURGER',
      blurb: 'The best seat in the neighborhood is the rail above the last green.',
      price: 'kitchen till 9 PM',
      img: 'assets/photos/dinner.jpg',
    },
    {
      title: 'Leagues',
      spec: 'WEEKNIGHT 9S · ALL LEVELS · SEASON STANDINGS',
      blurb: 'Nine holes after work with people who become your regular game.',
      price: '$180 / season',
      img: 'assets/photos/bunker.jpg',
    },
  ],

  extra: {
    title: 'The conditions report we hold ourselves to.',
    sub: 'Posted in the pro shop every Monday, kept honest all week. If we would not putt on it, we tell you before you pay.',
    img: 'assets/photos/green.jpg',
    imgAlt: 'A perfectly mown putting green with dew lines at dawn',
    items: [
      { k: '01 · GREENS', v: 'Cut daily, rolled to a measured stimp posted in the shop. Aerification dates published a season ahead.' },
      { k: '02 · BUNKERS', v: 'Raked every morning and topped to a consistent four inches of sand. Fried eggs should be breakfast, not a lie.' },
      { k: '03 · PACE', v: 'Four hours, politely enforced by marshals who actually marshal. Slow groups get moved, not glared at.' },
      { k: '04 · WEATHER CALLS', v: 'Course status posted by 6 AM daily. Rain checks honored without an argument.' },
    ],
  },

  crew: {
    title: 'The Club',
    photos: [
      { src: 'assets/photos/practice.jpg', alt: 'The driving range at sunrise, balls arcing into mist' },
      { src: 'assets/photos/cart.jpg', alt: 'Two golf carts on a path beside the fairway at dawn' },
      { src: 'assets/photos/dinner.jpg', alt: 'The clubhouse dining room at dusk overlooking the course' },
    ],
    leadName: 'Walt Brennan',
    leadRole: 'Head Professional · 22 Years',
    leadPhoto: 'assets/photos/pro.jpg',
    story:
      'Walt has run the shop since 2004 and still plays the closing stretch even par more often than not. He knows half the morning regulars by their swings before he sees their faces, runs a junior program with sixty kids in it, and will pair a nervous single with the right threesome every time. The course gets the money; Walt is the reason people stay.',
    certs: ['PGA HEAD PROFESSIONAL', 'JUNIOR PROGRAM · 60 KIDS', 'EST. 1962'],
  },

  reviews: [
    {
      date: '2026-06-21', tag: 'CONDITIONS',
      note: 'Greens roll truer than the private club I left. They post the stimp in the shop like a fish market posts the catch. Unheard of at this price.',
      name: 'Ray D.',
    },
    {
      date: '2026-05-17', tag: 'PACE OF PLAY',
      note: 'Four hours and five minutes on a Saturday morning. The marshal moved the group ahead of us without being asked. I nearly cried.',
      name: 'Jenna K.',
    },
    {
      date: '2026-07-12', tag: 'THE STRETCH',
      note: 'Came in two up, walked off 18 all square. Fifteen through eighteen is the best free drama in Houston. The terrace rail agreed.',
      name: 'Marcus & the Saturday game',
    },
    {
      date: '2026-04-19', tag: 'SINGLE WELCOME',
      note: 'Showed up alone at 7am. Walt paired me with three guys I have now played with every Sunday for three months.',
      name: 'Tom I.',
    },
  ],

  booking: {
    title: 'Book a tee time.',
    sub: 'Online up to ten days out for members, seven for everyone else. Singles welcome, walkers always, and twilight rates that start while there is still plenty of golf left.',
    badges: ['PUBLIC WELCOME', 'WALKING ALWAYS ALLOWED', 'TWILIGHT AFTER 3 PM'],
    hours: [
      { d: 'FIRST TEE', h: 'SUNRISE, DAILY' },
      { d: 'PRO SHOP', h: '6:00 AM – 8:00 PM' },
      { d: 'THE GRILL', h: '7:00 AM – 9:00 PM' },
    ],
  },

  footer: {
    line: 'BRAESIDE Golf Club — public 18 under the oaks since 1962.',
    fine: 'Template by STATION. Rates, measurements and reviews shown are illustrative.',
  },
};
