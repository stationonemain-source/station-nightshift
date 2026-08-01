/* Cementville Grill at The Quarry Golf Course — shared content. Both tiers read this one file. */
window.SITE = {
 brand: {
    mark: '<svg class="wm-mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="1.3" y="1.3" width="37.4" height="37.4" rx="9" fill="none" stroke="currentColor" stroke-width="1.7"/><text x="20" y="21" text-anchor="middle" dominant-baseline="central" font-family="inherit" font-size="15.5" font-weight="800" letter-spacing=".3" fill="currentColor">CG</text></svg>',
    markOnly: false,
 name: 'CEMENTVILLE GRILL AT THE QUARRY GOLF COURSE',
 suffix: '',
 tagline: 'Public 18 holes — San Antonio, Texas',
 city: 'San Antonio, TX',
 address: '444 E Basse Rd, San Antonio, TX 78209, USA',
 phone: '(210) 824-4500',
 phoneHref: 'tel:+12108244500',
 email: 'hello@cementvillegrillatthequarrygolfcourse.com',
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
 src: 'assets/photos/hero.jpg',
 alt: 'A dramatic par-3 green guarded by water and bunkers at dawn',
 readout: 'PUBLIC WELCOME · WALKABLE 18',
 lines: ['Sixty-two years', 'under the oaks.'],
 sub: 'A classic parkland eighteen that asks you to shape shots, not bomb them. Greens rolling true, tee times seven days a week, and nobody checking your handicap at the door.',
 cue: 'play the stretch',
 },

 /* THE SCORECARD — the premium signature. The famous closing stretch, hole by hole. */
 card: {
 title: 'THE CLOSING STRETCH',
 intro: 'Every course has a stretch that decides the round. Ours is 15 through 18 — four holes that have been rearranging Saturday matches. Here is how they play.',
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
 stats: [{ n: 'SAN ANTONIO', label: 'and the surrounding area' }],
 },

 services: [
 {
 title: 'Daily Tee Times',
 spec: 'PUBLIC · 7 DAYS · WALKING ALWAYS ALLOWED',
 blurb: 'Booked online, first light to twilight, singles welcome.',
 price: '',
 img: 'assets/photos/fairway.jpg',
 },
 {
 title: 'Memberships',
 spec: 'UNLIMITED GOLF · 10-DAY BOOKING WINDOW · NO ASSESSMENTS',
 blurb: 'One flat rate, no initiation games, no minimums at the grill.',
 price: '',
 img: 'assets/photos/green.jpg',
 },
 {
 title: 'The Range & Lessons',
 spec: 'GRASS TEES · JUNIOR PROGRAM',
 blurb: 'A real grass range and a teaching pro who watches you, not a screen.',
 price: '',
 img: 'assets/photos/practice.jpg',
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
 img: 'assets/photos/dinner.jpg',
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
 leadName: '',
 leadRole: '',
 leadPhoto: 'assets/photos/pro.jpg',
 story: 'Cementville Grill at The Quarry Golf Course serves San Antonio and the surrounding area. Straight answers about what you need and what it will take, work we are happy to put our name on, and the same people every time. Call or send a message and you will hear back from someone who can actually help.',
 certs: ['SERVING SAN ANTONIO'],
 },

 reviews: [
    { date: '', tag: 'GOOGLE REVIEW', note: 'I’m constantly surprised this joint isn’t crowded. Great lunch menu with sandwiches, tacos, larger plates and specials. I had the Brisket tacos, they were a different…', name: 'kyle grothues' },
    { date: '', tag: 'GOOGLE REVIEW', note: 'Had a delicious burger here recently. Great view. Not sure what was going on with our server. Not very attentive at all. She took our order, served our food and never…', name: 'Ceabreeze' },
    { date: '', tag: 'GOOGLE REVIEW', note: '**Amazing Food, Great View, and Friendly Service!** I had the brisket mac and cheese, and it was absolutely delicious—so flavorful and super filling! My wife ordered…', name: 'Brian Gehrke' }
  ],

 booking: {
 title: 'Book a tee time.',
 sub: 'Online up to ten days out for members, seven for everyone else. Singles welcome, walkers always, and twilight rates that start while there is still plenty of golf left.',
 badges: ['SERVING SAN ANTONIO'],
 hours: [{ d: 'MONDAY', h: '6:30 AM – 7:30 PM' }, { d: 'TUESDAY', h: '6:30 AM – 7:30 PM' }, { d: 'WEDNESDAY', h: '6:30 AM – 7:30 PM' }, { d: 'THURSDAY', h: '6:30 AM – 7:30 PM' }, { d: 'FRIDAY', h: '6:30 AM – 7:30 PM' }, { d: 'SATURDAY', h: '6:30 AM – 7:30 PM' }, { d: 'SUNDAY', h: '6:30 AM – 7:30 PM' }],
 },

 footer: {
 line: 'Cementville Grill at The Quarry Golf Course — public 18 under the oaks.',
 fine: '',
 },
};
