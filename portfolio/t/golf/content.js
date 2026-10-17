/* Cedar Bend Golf Club — shared content. Both tiers read this one file.
   Cedar Bend is a fictional Texas town (the estate's demo town). Every name, number and hole
   here is sample content and the footer says so; no real course is described. */
window.SITE = {
 brand: {
    mark: '<svg class="wm-mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="1.3" y="1.3" width="37.4" height="37.4" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/><text x="20" y="21" text-anchor="middle" dominant-baseline="central" font-family="inherit" font-size="15.5" font-weight="800" letter-spacing=".3" fill="currentColor">CB</text></svg>',
    markOnly: false,
 name: 'CEDAR BEND',
 suffix: 'Golf Club',
 tagline: 'Public 18 holes — Cedar Bend, Texas',
 city: 'Cedar Bend, TX',
 address: '1 Fairway Drive, Cedar Bend, TX 76000',
 phone: '(512) 555-0148',
 phoneHref: 'tel:+15125550148',
 email: 'proshop@cedarbendgolf.example',
 license: '',
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
 /* photo file names do not match their content (2026-10-17 audit): dinner.jpg is the course, hero.jpg is fries */
 src: 'assets/photos/dinner.jpg',
 alt: 'A pond in front of a green on the course under a clear sky',
 readout: 'PUBLIC WELCOME · WALKABLE 18',
 lines: ['Public eighteen,', 'greens rolled true.'],
 sub: 'Eighteen holes that ask you to shape shots, not bomb them. Greens rolling true, tee times seven days a week, and nobody checking your handicap at the door.',
 cue: 'play the stretch',
 },

 /* THE SCORECARD — the premium signature. The closing stretch, hole by hole. */
 card: {
 title: 'THE CLOSING STRETCH',
 intro: 'Every course has a stretch that decides the round. Ours is 15 through 18 — four holes that settle Saturday matches. Here is how they play.',
 complete: 'THE STRETCH · CARDED',
 verdict: 'Par here and you have earned the clubhouse.',
 holes: [
 { n: 15, par: 4, yds: 415, name: 'THE OAKS', img: 'assets/photos/dinner.jpg', note: 'A drive threaded between the live oaks. Position beats distance — the approach opens up only from the left half.' },
 { n: 16, par: 3, yds: 178, name: 'THE CARRY', img: 'assets/photos/dinner.jpg', note: 'All carry over water to a green that slopes away. The smart miss is long; everything short is wet and everyone knows it.' },
 { n: 17, par: 5, yds: 540, name: 'THE DECISION', img: 'assets/photos/dinner.jpg', note: 'Reachable in two if you flirt with the right-side bunkers. The scorecard says par five; your match probably says go.' },
 { n: 18, par: 4, yds: 432, name: 'THE WALK HOME', img: 'assets/photos/bunker.jpg', note: 'Uphill to a green that sits under the clubhouse terrace, where everyone on the rail has an opinion about your club choice.' },
 ],
 },

 manifesto: {
 lines: ['Great golf is conditions,', 'not clubhouse chandeliers.'],
 support:
 'We put the budget where your ball actually rolls: greens cut daily and rolled true, bunkers with actual sand in them, fairways that reward a struck iron. The clubhouse is comfortable, the burger is honest, and the course is the point.',
 stats: [{ n: 'CEDAR BEND', label: 'and the surrounding area' }],
 },

 services: [
 {
 title: 'Daily Tee Times',
 spec: 'PUBLIC · 7 DAYS · WALKING ALWAYS ALLOWED',
 blurb: 'Booked online, first light to twilight, singles welcome.',
 price: '',
 img: 'assets/photos/dinner.jpg',
 },
 {
 title: 'Memberships',
 spec: 'UNLIMITED GOLF · 10-DAY BOOKING WINDOW · NO ASSESSMENTS',
 blurb: 'One flat rate, no initiation games, no minimums at the grill.',
 price: '',
 img: 'assets/photos/bunker.jpg',
 },
 {
 title: 'The Range & Lessons',
 spec: 'GRASS TEES · JUNIOR PROGRAM',
 blurb: 'A real grass range and a teaching pro who watches you, not a screen.',
 price: '',
 img: 'assets/photos/lesson.jpg',
 },
 {
 title: 'Tournaments & Outings',
 spec: '40–144 PLAYERS · SCORING RUN BY US · TERRACE DINNER',
 blurb: 'Corporate days and charity scrambles that run on time.',
 price: '',
 img: 'assets/photos/cart.jpg',
 },
 {
 title: 'The Grill',
 spec: 'OPEN TO THE PUBLIC · TERRACE OVER 18 · HONEST BURGER',
 blurb: 'The best seat in the neighborhood is the rail above the last green.',
 price: '',
 img: 'assets/photos/green.jpg',
 },
 {
 title: 'Leagues',
 spec: 'WEEKNIGHT 9S · ALL LEVELS · SEASON STANDINGS',
 blurb: 'Nine holes after work with people who become your regular game.',
 price: '',
 img: 'assets/photos/bunker.jpg',
 },
 ],

 extra: {
 title: 'The conditions report we hold ourselves to.',
 sub: 'Posted in the pro shop every Monday, kept honest all week. If we would not putt on it, we tell you before you pay.',
 img: 'assets/photos/dinner.jpg',
 imgAlt: 'A pond in front of a green on the course under a clear sky',
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
 { src: 'assets/photos/practice.jpg', alt: 'Salmon salad and a glass of red wine at the grill' },
 { src: 'assets/photos/cart.jpg', alt: 'The grill dining room, with windows onto the course' },
 { src: 'assets/photos/bunker.jpg', alt: 'The covered terrace, looking out over the course' },
 ],
 leadName: '',
 leadRole: '',
 /* lesson.jpg / lesson-portrait.jpg: a real photo (U.S. Air Force, Benjamin Faske, public domain, via
    Wikimedia Commons "Annual Junior Golf Clinic 120613-F-ST721-266.jpg"); it replaced a generated portrait. */
 leadPhoto: 'assets/photos/lesson-portrait.jpg',
 story: 'Cedar Bend Golf Club is a public course run by the people you will meet in the pro shop. Straight answers about conditions and tee times, and the same faces every week. Call or send a message and you will hear back from someone who can actually help.',
 certs: ['PUBLIC COURSE · CEDAR BEND, TX'],
 },

 /* No reviews: a fictional course has none, and the section hides itself when this is empty. */
 reviews: [],

 booking: {
 title: 'Book a tee time.',
 sub: 'Online up to ten days out for members, seven for everyone else. Singles welcome, walkers always, and twilight rates that start while there is still plenty of golf left.',
 badges: ['PUBLIC WELCOME', 'WALKING ALWAYS ALLOWED'],
 hours: [{ d: 'TEE TIMES', h: 'SUNRISE TO TWILIGHT, DAILY' }],
 },

 footer: {
 line: 'Cedar Bend Golf Club — a public eighteen in Cedar Bend, Texas.',
 fine: 'Demonstration site. Cedar Bend is a fictional town; every name, number and hole here is sample content.',
 },
};
