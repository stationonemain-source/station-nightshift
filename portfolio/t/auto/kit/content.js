/* CAMBER Auto Works — shared content. Both tiers read this one file.
   Swap copy + photos here to re-skin the template for a real shop. */
window.CAMBER = {
  brand: {
    name: 'CAMBER',
    suffix: 'Auto Works',
    tagline: 'Precision auto care — Houston, Texas',
    definition: 'cam·ber (n.) — the precise angle at which a wheel meets the road.',
    city: 'Houston, TX',
    address: '2214 Winter St, Houston, TX 77007',
    phone: '(713) 555-0184',
    phoneHref: 'tel:+17135550184',
    email: 'service@camberautoworks.com',
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
    intro: 'Every car that enters a CAMBER bay gets one. Photos, measurements, and honest verdicts — texted to your phone before we touch a wrench.',
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
          { k: 'CAMBER FL/FR', v: '-0.8° / -0.8°', min: 'SPEC ±0.5°' },
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
    stats: [
      { n: '18 YRS', label: 'same corner of Washington Ave' },
      { n: '21,000+', label: 'cars measured, serviced, returned' },
      { n: '36/36', label: 'month / thousand-mile parts & labor warranty' },
    ],
  },

  services: [
    {
      title: 'Oil & Fluid Service',
      spec: 'FACTORY-SPEC FLUIDS · TORQUE-WRENCH DRAIN PLUG · RESET',
      blurb: 'Full-synthetic service with a 12-point under-car check every visit.',
      price: 'from $89',
      img: 'assets/photos/oil.jpg',
    },
    {
      title: 'Brake Service',
      spec: 'ROTORS MEASURED IN MICRONS · PADS · FLUID FLUSH',
      blurb: 'We machine or replace on measurement, never on guesswork.',
      price: 'from $189',
      img: 'assets/photos/torque.jpg',
    },
    {
      title: 'Alignment & Suspension',
      spec: 'LASER 4-WHEEL ALIGNMENT · CAMBER / TOE / THRUST',
      blurb: 'Printed before-and-after angles with every alignment.',
      price: 'from $129',
      img: 'assets/photos/align.jpg',
    },
    {
      title: 'Diagnostics',
      spec: 'FACTORY-LEVEL SCAN TOOLS · LIVE DATA · NO PARTS CANNON',
      blurb: 'We chase the cause, not the code. Diagnostic fee credited to the repair.',
      price: 'from $149',
      img: 'assets/photos/diag.jpg',
    },
    {
      title: 'Engine & Drivetrain',
      spec: 'TIMING · COOLING · GASKETS · MOUNTS',
      blurb: 'From weeping gaskets to full timing jobs — documented with photos.',
      price: 'quoted after inspection',
      img: 'assets/photos/engine.jpg',
    },
    {
      title: 'Pre-Purchase Inspection',
      spec: '50-POINT REPORT · COMPRESSION · HISTORY REVIEW',
      blurb: 'Know what you’re buying before you wire the money.',
      price: '$249 flat',
      img: 'assets/photos/keys.jpg',
    },
  ],

  shop: {
    title: 'The Shop',
    photos: [
      { src: 'assets/photos/bays.jpg', alt: 'Row of three pristine service bays at night' },
      { src: 'assets/photos/engine.jpg', alt: 'Engine bay under LED inspection lamp' },
      { src: 'assets/photos/exterior.jpg', alt: 'CAMBER shop exterior at dusk, bay doors glowing' },
    ],
    techName: 'Marcus Hale',
    techRole: 'Master Technician · Founder',
    techPhoto: 'assets/photos/tech.jpg',
    story:
      'Marcus spent eleven years at a German dealership watching customers pay for work they couldn’t see. CAMBER is the answer: a shop where every verdict comes with a measurement, every measurement comes with a photo, and the lobby coffee is actually good. ASE Master certified. Factory scan tools. Zero upsell culture.',
    certs: ['ASE MASTER CERTIFIED', 'FACTORY SCAN TOOLS', 'OEM & OEM+ PARTS'],
  },

  reviews: [
    {
      date: '2026-05-14', vehicle: '2019 4RUNNER',
      note: 'They texted me the inspection with photos before calling. Quoted $400 less than the dealer and showed me why. I’m done going anywhere else.',
      name: 'Dana R.',
    },
    {
      date: '2026-04-02', vehicle: '1987 911 CARRERA',
      note: 'Trusted them with the air-cooled car. Torque specs written on the invoice. That tells you everything about this shop.',
      name: 'Tom V.',
    },
    {
      date: '2026-06-21', vehicle: '2022 MODEL Y',
      note: 'Alignment printout before and after. Steering wheel is finally straight after two other shops failed.',
      name: 'Priya S.',
    },
    {
      date: '2026-03-09', vehicle: '2015 F-150',
      note: 'Diagnosed a misfire two other shops threw parts at. One coil, one hour, done. Fee credited like they promised.',
      name: 'Mike B.',
    },
  ],

  booking: {
    title: 'Book your bay.',
    sub: 'Tell us what you’re driving and what it’s doing. We’ll text you a slot — and an inspection report before any work begins.',
    badges: ['36-MO / 36K-MI WARRANTY', 'DIGITAL INSPECTION INCLUDED', 'LOANER CARS AVAILABLE'],
    hours: [
      { d: 'MON – FRI', h: '7:30 AM – 6:00 PM' },
      { d: 'SATURDAY', h: '8:00 AM – 2:00 PM' },
      { d: 'SUNDAY', h: 'CLOSED' },
    ],
  },

  footer: {
    line: 'CAMBER Auto Works — measured since 2008.',
    fine: 'Template by STATION. All specifications shown are illustrative.',
  },
};
