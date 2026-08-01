/* Harold\'s Quality Auto Repair Inc — shared content. Both tiers read this one file.
 Swap copy + photos here to re-skin the template for a real shop. */
window.CAMBER = {
 brand: {
    mark: '<img class="wm-logo" src="assets/logo.png" alt="Harold\\\'s Quality Auto Repair Inc">',
    markOnly: false,
 name: 'HAROLD\'S QUALITY AUTO REPAIR INC',
 suffix: '',
 tagline: 'Precision auto care — Salem, Oregon',
 definition: '',
 city: 'Salem, OR',
 address: '675 Bartell Dr NW, Salem, OR 97304, USA',
 phone: '(503) 365-9702',
 phoneHref: 'tel:+15033659702',
 email: 'hwtch1@integra.net',
 socials: [
 { id: 'instagram', label: 'Instagram', url: '#' },
 { id: 'facebook', label: 'Facebook', url: '#' },
 { id: 'google', label: 'Google Reviews', url: '#' },
 ],
 },

 nav: [
 { label: 'Services', href: '#services' },
 { label: 'The Shop', href: '#shop' },
 { label: 'Reviews', href: '#logbook' },
 { label: 'Book a Bay', href: '#book', cta: true },
 ],

 hero: {
 src: 'assets/photos/hero.jpg',
 alt: 'Classic silver coupe raised on a two-post lift under amber work lights',
 readout: 'BAY 02 · INTAKE ACCEPTED · ODO 84,212 MI',
 line: 'Your car, measured — not guessed at.',
 cue: 'begin inspection',
 },

 /* THE INSPECTION — the premium signature. Four systems, checked in order. */
 inspection: {
 title: '50-POINT DIGITAL INSPECTION',
 intro: 'Every car that enters a HAROLD\'S QUALITY AUTO REPAIR INC bay gets one. Photos, measurements, and honest verdicts — texted to your phone before we touch a wrench.',
 complete: 'INSPECTION COMPLETE · 50/50 CHECKS',
 verdict: 'Nothing repaired that doesn’t need it. Nothing missed that does.',
 systems: [
 {
 id: 'brakes', label: 'BRAKES',
 specs: [
 { k: 'ROTOR THICKNESS', v: '28.4 mm', min: 'MIN 26.0' },
 { k: 'PAD LIFE F/R', v: '72% / 64%', min: 'REPLACE < 20%' },
 ],
 stamp: 'SET TO SPEC',
 },
 {
 id: 'suspension', label: 'SUSPENSION',
 specs: [
 { k: 'HAROLD\'S QUALITY AUTO REPAIR INC FL/FR', v: '-0.8° / -0.8°', min: 'SPEC ±0.5°' },
 { k: 'DAMPER LEAK CHECK', v: 'DRY ×4', min: 'PASS' },
 ],
 stamp: 'SET TO SPEC',
 },
 {
 id: 'engine', label: 'OIL & ENGINE',
 specs: [
 { k: 'DRAIN PLUG TORQUE', v: '34 N·m', min: 'SPEC 34' },
 { k: 'COOLANT / LEAKS', v: 'CLEAR', min: 'PASS' },
 ],
 stamp: 'SET TO SPEC',
 },
 {
 id: 'alignment', label: 'ALIGNMENT',
 specs: [
 { k: 'TOE TOTAL', v: '0.10°', min: 'SPEC 0.10 ±0.05' },
 { k: 'THRUST ANGLE', v: '0.02°', min: 'SPEC < 0.10' },
 ],
 stamp: 'SET TO SPEC',
 },
 ],
 },

 manifesto: {
 lines: ['We measure.', 'Then we fix.'],
 support:
 'Most shops sell you what pays best. We show you what the instruments say — rotor microns, torque values, alignment angles — and let the numbers make the case. That’s why our customers stay for decades.',
 stats: [{ n: 'SALEM', label: 'and the surrounding area' }],
 },

 services: [
 {
 title: 'Oil & Fluid Service',
 spec: 'FACTORY-SPEC FLUIDS · TORQUE-WRENCH DRAIN PLUG · RESET',
 blurb: 'Full-synthetic service with a 12-point under-car check every visit.',
 price: '',
 img: 'assets/photos/oil.jpg',
 },
 {
 title: 'Brake Service',
 spec: 'ROTORS MEASURED IN MICRONS · PADS · FLUID FLUSH',
 blurb: 'We machine or replace on measurement, never on guesswork.',
 price: '',
 img: 'assets/photos/torque.jpg',
 },
 {
 title: 'Alignment & Suspension',
 spec: 'LASER 4-WHEEL ALIGNMENT · HAROLD\'S QUALITY AUTO REPAIR INC / TOE / THRUST',
 blurb: 'Printed before-and-after angles with every alignment.',
 price: '',
 img: 'assets/photos/align.jpg',
 },
 {
 title: 'Diagnostics',
 spec: 'FACTORY-LEVEL SCAN TOOLS · LIVE DATA · NO PARTS CANNON',
 blurb: 'We chase the cause, not the code. Diagnostic fee credited to the repair.',
 price: '',
 img: 'assets/photos/diag.jpg',
 },
 {
 title: 'Engine & Drivetrain',
 spec: 'TIMING · COOLING · GASKETS · MOUNTS',
 blurb: 'From weeping gaskets to full timing jobs — documented with photos.',
 price: '',
 img: 'assets/photos/engine.jpg',
 },
 {
 title: 'Pre-Purchase Inspection',
 spec: '50-POINT REPORT · COMPRESSION · HISTORY REVIEW',
 blurb: 'Know what you’re buying before you wire the money.',
 price: '',
 img: 'assets/photos/keys.jpg',
 },
 ],

 shop: {
 title: 'The Shop',
 photos: [
 { src: 'assets/photos/bays.jpg', alt: 'Row of three pristine service bays at night' },
 { src: 'assets/photos/engine.jpg', alt: 'Engine bay under LED inspection lamp' },
 { src: 'assets/photos/exterior.jpg', alt: 'HAROLD\'S QUALITY AUTO REPAIR INC shop exterior at dusk, bay doors glowing' },
 ],
 techName: 'Marcus Hale',
 techRole: 'Master Technician · Founder',
 techPhoto: 'assets/photos/tech.jpg',
 story: 'Harold\'s Quality Auto Repair Inc serves Salem and the surrounding area. Straight answers about what you need and what it will take, work we are happy to put our name on, and the same people every time. Call or send a message and you will hear back from someone who can actually help.',
 certs: ['SERVING SALEM'],
 },

 reviews: [],

 booking: {
 title: 'Book your bay.',
 sub: 'Tell us what you’re driving and what it’s doing. We’ll text you a slot — and an inspection report before any work begins.',
 badges: ['SERVING SALEM'],
 hours: [{ d: 'MONDAY', h: '7:00 AM – 5:00 PM' }, { d: 'TUESDAY', h: '7:00 AM – 5:00 PM' }, { d: 'WEDNESDAY', h: '7:00 AM – 5:00 PM' }, { d: 'THURSDAY', h: '7:00 AM – 5:00 PM' }, { d: 'FRIDAY', h: '7:00 AM – 5:00 PM' }, { d: 'SATURDAY', h: 'Closed' }, { d: 'SUNDAY', h: 'Closed' }],
 },

 footer: {
 line: 'Harold\'s Quality Auto Repair Inc — measured.',
 fine: '',
 },
};
