/* bots.js — THE RANGE AT DAWN
   Two client-side conversation engines, no backend:
   1. #demo phone — visitors text a sample business's front desk like a customer.
   2. #aiw widget — "Ask Station" FAQ concierge about plans, websites, setup.
   Both run on the same tiny intent matcher; replies are typed with a delay so
   the exchange reads live. */
(function () {
  "use strict";

  /* ---------------- shared thread helpers ---------------- */
  function mkThread(bodyEl) {
    var t = {
      line: function (cls, text, html) {
        var el = document.createElement("div");
        el.className = cls;
        if (html) el.innerHTML = html;
        el.appendChild(document.createTextNode(text));
        bodyEl.appendChild(el);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { el.classList.add("show"); });
        });
        bodyEl.scrollTop = bodyEl.scrollHeight;
        return el;
      },
      typing: function (cls) {
        var el = document.createElement("div");
        el.className = cls;
        el.innerHTML = "<i></i><i></i><i></i>";
        bodyEl.appendChild(el);
        bodyEl.scrollTop = bodyEl.scrollHeight;
        return el;
      },
      clear: function () { bodyEl.innerHTML = ""; }
    };
    return t;
  }

  // queue bot replies with typing indicator; texts = array of strings
  function replyQueue(thread, lineCls, typingCls, texts, done, alive) {
    var i = 0;
    (function next() {
      if (alive && !alive()) return;              // session changed — drop stale reply
      if (i >= texts.length) { if (done) done(); return; }
      var tEl = thread.typing(typingCls);
      var delay = 650 + Math.min(1100, texts[i].length * 14);
      setTimeout(function () {
        if (alive && !alive()) { tEl.remove(); return; }
        tEl.remove();
        thread.line(lineCls, texts[i]);
        i++;
        setTimeout(next, 420);
      }, delay);
    })();
  }

  function renderChips(el, chips, onPick) {
    el.innerHTML = "";
    chips.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip-btn";
      b.textContent = c;
      b.addEventListener("click", function () { onPick(c); });
      el.appendChild(b);
    });
  }

  /* ============ 1. the phone - universal front desk (any business) ============ */
  var pThread = document.getElementById("p-thread"),
      pChips = document.getElementById("p-chips"),
      pForm = document.getElementById("p-form"),
      pIn = document.getElementById("p-in"),
      pName = document.querySelector("#demo .p-name"),
      pSub = document.querySelector("#demo .p-sub");

  // Each business is a light persona over one shared intent engine, so the same
  // "front desk" convincingly handles any trade the visitor picks.
  var BIZ = {
    plumber: {
      name: "Summit Plumbing", greet: "Summit Plumbing front desk - what's going on today?",
      chips: ["My water heater's leaking", "How much for a repair?", "Book a visit", "Are you open?"],
      owner: "Mike", slots: ["9:00 AM", "11:30 AM"], when: "tomorrow", ask: "address",
      price: "Service call is $89 - credited to the job if you hire us. Most repairs land between $150 and $450.",
      urgent: /(leak|burst|flood|pipe|no hot water|no water|no heat|overflow|emergen)/,
      urgentReply: ["That's an emergency - I've flagged it. If water's spraying, shut the valve where it meets the wall (righty-tighty).", "I can have a tech out first thing - {s1} or {s2}?"],
      can: "book a visit, price a job, or handle an emergency"
    },
    salon: {
      name: "Luxe Hair Studio", greet: "Luxe Hair Studio - how can I help you look great?",
      chips: ["Book a cut & color", "How much is balayage?", "Any openings today?", "What are your hours?"],
      owner: "Dana", slots: ["Thursday 2:00", "Friday 10:00"], when: "", ask: "name",
      price: "A cut starts at $55, and balayage runs $180-$260 depending on length. I'll pin an exact quote when I book you.",
      urgent: /(today|tonight|last minute|asap|right now|squeeze|special event|wedding)/,
      urgentReply: ["Let me check the book... I think I can squeeze you in - {s1} or {s2}?"],
      can: "book an appointment, quote a service, or check today's openings"
    },
    dentist: {
      name: "Bright Smile Dental", greet: "Bright Smile Dental - what can I set up for you?",
      chips: ["I have a toothache", "How much is a cleaning?", "Book a checkup", "Do you take insurance?"],
      owner: "Dr. Lee", slots: ["Tuesday 9:00 AM", "Wednesday 3:00 PM"], when: "", ask: "name",
      price: "A cleaning and exam is $120 without insurance, and most plans cover it fully. New-patient X-rays are included.",
      urgent: /(toothache|pain|hurts|broke|chipped|swollen|emergen|bleeding|knocked)/,
      urgentReply: ["Sorry you're in pain - that's a priority. Rinse with warm salt water and avoid chewing on that side.", "I can get you in - {s1} or {s2}?"],
      can: "book a visit, quote a service, or handle a dental emergency"
    },
    auto: {
      name: "Apex Auto Repair", greet: "Apex Auto - what's your car doing?",
      chips: ["Check-engine light's on", "How much for brakes?", "Book a service", "Open Saturday?"],
      owner: "Sal", slots: ["tomorrow 8:00 AM", "tomorrow 1:00 PM"], when: "", ask: "name",
      price: "Diagnostic is $95 - credited to the repair. Brake jobs typically run $250-$450 per axle.",
      urgent: /(smoke|overheat|won't start|wont start|stranded|tow|grinding|brakes|leaking|emergen)/,
      urgentReply: ["Don't risk driving it - if it's overheating, pull over and let it cool.", "I can get a bay open - {s1} or {s2}? Need a tow? I'll arrange it."],
      can: "book a service, quote a repair, or get you towed in"
    },
    gym: {
      name: "Iron Peak Fitness", greet: "Iron Peak Fitness - looking to get started?",
      chips: ["Book a tour", "How much is membership?", "Do you have classes?", "What are your hours?"],
      owner: "Coach Ray", slots: ["today 5:00 PM", "tomorrow 10:00 AM"], when: "", ask: "name",
      price: "Memberships are $39/mo month-to-month, or $29/mo on annual. Your first class and a tour are free.",
      urgent: /(today|now|drop ?in|walk ?in|trial|free)/,
      urgentReply: ["Come on by - I'll set up a free tour and a class. {s1} or {s2}?"],
      can: "book a tour, explain memberships, or get you into a class"
    },
    restaurant: {
      name: "The Copper Table", greet: "The Copper Table - can I get you a reservation?",
      chips: ["Table for 2 tonight", "Do you take walk-ins?", "What's on the menu?", "Open Sunday?"],
      owner: "Elena", slots: ["tonight 7:00", "tonight 8:30"], when: "", ask: "name",
      price: "Dinner runs about $30-$45 a head, and we've got a $28 prix-fixe on weeknights.",
      urgent: /(tonight|now|walk|last minute|asap)/,
      urgentReply: ["I can fit you in - {s1} or {s2}? How many in your party?"],
      can: "book a table, share the menu, or check tonight's availability"
    },
    // catch-all persona so any visitor can try the demo even if their trade
    // isn't one of the six picks below - typing a message activates this.
    universal: {
      name: "Station Front Desk", greet: "Station front desk - go ahead, ask like a real customer would.",
      chips: ["Book an appointment", "How much does this cost?", "Are you open now?", "What can you handle?"],
      owner: "the team", slots: ["tomorrow 9:00 AM", "tomorrow 2:00 PM"], when: "", ask: "name",
      price: "Every plan's flat-rate, no per-lead fees - Core starts at $750/mo, Pro at $1,500/mo. Every plan starts with a free 15-minute audit.",
      urgent: /(emergency|urgent|asap|right now|help|stuck)/,
      urgentReply: ["Got it, flagging that as urgent.", "I can get someone on it - {s1} or {s2}?"],
      can: "book you a time, answer pricing, or route you to a real person"
    }
  };
  var BIZ_PICK = [["Plumber","plumber"],["Salon","salon"],["Dentist","dentist"],["Auto shop","auto"],["Gym","gym"],["Restaurant","restaurant"],["Something else","universal"]];

  if (pThread) {
    var phone = mkThread(pThread);
    var st = { key: null, stage: null, slot: null, session: 0 };
    function cfg() { return BIZ[st.key]; }
    function guardFor() { var s = st.session; return function () { return s === st.session; }; }
    function fill(s) { var c = cfg(); return s.replace("{s1}", c.slots[0]).replace("{s2}", c.slots[1]); }
    function whenSlot() { var c = cfg(); var s = st.slot || c.slots[0]; return (c.when ? c.when + " " : "") + s; }

    function pickSlot(m) {
      var c = cfg(), s1 = c.slots[0].toLowerCase(), s2 = c.slots[1].toLowerCase();
      var n1 = (s1.match(/\d+/) || [])[0], n2 = (s2.match(/\d+/) || [])[0];
      if (n2 && n1 !== n2 && m.indexOf(n2) !== -1) return c.slots[1];
      if (n1 && m.indexOf(n1) !== -1) return c.slots[0];
      if (/(second|2nd|\blater\b|afternoon|evening|\b2\b)/.test(m)) return c.slots[1];
      if (/(first|1st|earlier|morning|sooner|\b1\b)/.test(m)) return c.slots[0];
      var days = ["today","tonight","thursday","friday","tuesday","wednesday","saturday","sunday","monday"];
      for (var i = 0; i < days.length; i++) {
        var d = days[i];
        if (m.indexOf(d) !== -1) {
          if (s2.indexOf(d) !== -1 && s1.indexOf(d) === -1) return c.slots[1];
          if (s1.indexOf(d) !== -1 && s2.indexOf(d) === -1) return c.slots[0];
        }
      }
      if (/(yes|works|either|whichever|sure|ok|okay|book|sounds|great|perfect|that one|go)/.test(m)) return c.slots[0];
      return null;
    }

    function deskReply(raw) {
      var c = cfg(), m = raw.toLowerCase();
      if (st.stage === "slot") {
        var s = pickSlot(m);
        if (s) {
          st.slot = s; st.stage = (c.ask === "address") ? "addr" : "name";
          return [c.ask === "address"
            ? "Perfect - holding " + s + ". What's the service address?"
            : "Perfect - holding " + s + ". Can I grab a name for the booking?"];
        }
      }
      if (st.stage === "addr" && (/\d+\s+\w+/.test(m) || /(st|street|ln|lane|ave|avenue|rd|road|dr|drive|way|blvd|court|ct)\b/.test(m))) {
        st.stage = null;
        return ["Booked - " + whenSlot() + ", " + raw.trim() + ". You'll get a text confirmation in a second.", "Anything else I can grab for you?"];
      }
      if (st.stage === "name" && raw.trim().length && !/\?$/.test(raw.trim())) {
        st.stage = null;
        return ["Booked - " + whenSlot() + ", under " + raw.trim() + ". Text confirmation's on its way.", "Anything else I can help with?"];
      }
      if (c.urgent.test(m)) { st.stage = "slot"; return c.urgentReply.map(fill); }
      if (/(book|appoint|schedul|come out|visit|reserv|table|tour|sign ?up|slot|opening|get me in)/.test(m)) {
        st.stage = "slot"; return [fill("Absolutely - I've got {s1} or {s2}. Which works better?")];
      }
      if (/(price|cost|how much|charge|estimate|quote|fee|rate|member)/.test(m)) return [c.price, "Want me to book you in? I'll lock the details."];
      if (/(hour|open|close|weekend|sunday|saturday|holiday)/.test(m)) return ["The front desk - that's me - answers 24/7, so you'll never hit voicemail. Want me to book you a time?"];
      if (/(human|person|real|manager|owner|speak to)/.test(m)) return ["I'll have " + c.owner + " reach out the moment they're free. If it can't wait, tell me what you need and I'll handle it now."];
      if (/(thank|great|awesome|perfect|nice|cool|appreciate)/.test(m)) return ["Anytime - I'm here day or night."];
      if (/(menu|service|offer|do you (do|have)|what do you|can you)/.test(m)) return ["We've got you - I can " + c.can + ". What are you after?"];
      return ["I can " + c.can + " - which do you need?"];
    }

    function custChips() { renderChips(pChips, ["⇄ Another business"].concat(cfg().chips), onCustChip); }
    function onCustChip(c) { if (c === "⇄ Another business") { showPicker(); return; } deskSend(c); }

    function deskSend(text) {
      if (!st.key || !text.trim()) return;
      phone.line("sms me", text.trim());
      pChips.innerHTML = "";
      replyQueue(phone, "sms biz", "sms-typing", deskReply(text), custChips, guardFor());
    }

    function loadBiz(key) {
      st.key = key; st.stage = null; st.slot = null; st.session++;
      var c = cfg(), alive = guardFor();
      if (pName) pName.textContent = c.name;
      if (pSub) pSub.textContent = "Front desk · replies in seconds";
      phone.clear();
      phone.line("sms-note show", "Live demo · texts answered by " + c.name + "'s front desk");
      setTimeout(function () { if (!alive()) return; replyQueue(phone, "sms biz", "sms-typing", [c.greet], custChips, alive); }, 420);
    }

    function showPicker() {
      st.key = null; st.stage = null; st.slot = null; st.session++;
      phone.clear();
      if (pName) pName.textContent = "Station front desk";
      if (pSub) pSub.textContent = "Pick a business to try it";
      phone.line("sms-note show", "Station's front desk works for any business - pick one and text it like a customer.");
      renderChips(pChips, BIZ_PICK.map(function (b) { return b[0]; }), function (label) {
        for (var i = 0; i < BIZ_PICK.length; i++) if (BIZ_PICK[i][0] === label) { loadBiz(BIZ_PICK[i][1]); return; }
      });
    }

    // Visitor might type without picking a business first - any trade works,
    // so silently activate the universal front desk rather than dropping the message.
    function ensureBiz() {
      if (st.key) return;
      st.key = "universal"; st.stage = null; st.slot = null; st.session++;
      var c = cfg();
      if (pName) pName.textContent = c.name;
      if (pSub) pSub.textContent = "Front desk · replies in seconds";
    }

    pForm.addEventListener("submit", function (e) { e.preventDefault(); ensureBiz(); deskSend(pIn.value); pIn.value = ""; });

    var seeded = false;
    function seedPhone() { if (seeded) return; seeded = true; showPicker(); }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) { seedPhone(); io.disconnect(); } }, { threshold: 0.25 });
      io.observe(pThread);
    } else { seedPhone(); }
  }

  /* ================= 2. Ask Station — FAQ concierge ================= */
  var aBody = document.getElementById("aiw-body"),
      aChips = document.getElementById("aiw-chips"),
      aForm = document.getElementById("aiw-form"),
      aIn = document.getElementById("aiw-in");

  if (aBody) {
    var faq = mkThread(aBody);
    var greeted = false;

    var FAQ_CHIPS = ["What does Station cost?", "What do you actually do?", "Website builds", "How fast can we start?"];

    var KB = [
      // specific intents first — "how much is a website" must beat generic pricing
      [/(website|web ?site|premiere|launch site)/, [
        "Two ways: a Launch site — $350 build + $150/mo hosting and care, live in days — or Premiere, a fully custom cinematic build. The page you're on right now is a Premiere.",
        "Premiere is quoted on a quick call."
      ]],
      [/(price|cost|how much|rate|tier|plan|month)/, [
        "Three plans, no contracts: Core $750/mo + $1,000 setup — the phones handled. Pro $1,500/mo + $2,000 setup — the full front office. Custom from $2,500/mo + $3,000 setup — multi-location, custom builds, POS. Start with a $350 Launch site and the Core setup fee is waived when you step up.",
        "Every one starts with a free 15-minute audit."
      ]],
      [/(what (is|does)|do you (do|actually)|about station|services|front office|handle)/, [
        "Station staffs your front office: every call answered 24/7, jobs booked onto your calendar, follow-ups that never slip, and one inbox for calls, texts, reviews and leads."
      ]],
      [/(setup|how long|how fast|start|onboard|go live|week)/, [
        "Running in about a week: a 15-minute audit, then we wire your phones, calendar, inbox and follow-up into how you already work. You change nothing."
      ]],
      [/(audit)/, [
        "The audit is free and takes fifteen minutes — we find the calls and leads you're missing and what they're worth. The form is just below on this page."
      ]],
      [/(contract|cancel|commit|lock)/, [
        "Month-to-month. No contracts, no cancellation fees."
      ]],
      [/(number|phone line|business line)/, [
        "A local business number is included on every plan — or we connect the one you already have."
      ]],
      [/(app\b|mobile app)/, [
        "A branded mobile app for your business is an add-on at $250/mo."
      ]],
      [/(pos|payment|card reader|checkout)/, [
        "POS and payments setup is quoted on the Custom plan."
      ]],
      [/(integrat|quickbooks|stripe|shopify|google|calendar|calendly|zapier|slack|connect|tools)/, [
        "Station plugs into what you already run — Google, QuickBooks, Stripe, Shopify, Calendly, Zapier, Slack and 500+ more."
      ]],
      [/(\bai\b|robot|who answers|voice|automated)/, [
        "An AI voice receptionist trained on your business answers instantly, books jobs and texts back — and a real person tunes it with you every month.",
        "Try it yourself — scroll up to the phone demo and text it like a customer."
      ]],
      [/(human|talk to|call you|someone|sales)/, [
        "Easiest is a quick intro call — hit “Book a call” in the top right. Or start with the free audit below and we'll call you."
      ]],
      [/(demo|try|test|text it)/, [
        "Scroll up a touch — there's a live phone on this page you can text like a real customer."
      ]]
    ];

    function faqReply(raw) {
      var m = raw.toLowerCase();
      for (var i = 0; i < KB.length; i++) {
        if (KB[i][0].test(m)) return KB[i][1];
      }
      return [
        "Good question — I've got answers on pricing, website builds, setup speed, integrations and what Station handles day to day.",
        "Or book a call from the top right and ask a human."
      ];
    }

    function faqSend(text) {
      if (!text.trim()) return;
      faq.line("msg cust", text.trim());
      aChips.innerHTML = "";
      replyQueue(faq, "msg ai", "aiw-typing", faqReply(text), function () {
        renderChips(aChips, FAQ_CHIPS, faqSend);
      });
    }

    aForm.addEventListener("submit", function (e) {
      e.preventDefault();
      faqSend(aIn.value);
      aIn.value = "";
    });

    document.getElementById("aiw-clear").addEventListener("click", function () {
      faq.clear(); greeted = false; window.__faqGreet();
    });

    window.__faqGreet = function () {
      if (greeted) return;
      greeted = true;
      replyQueue(faq, "msg ai", "aiw-typing",
        ["Hey — I'm the Station desk. Ask me anything about plans, website builds, or how this all works."],
        function () { renderChips(aChips, FAQ_CHIPS, faqSend); });
    };
  }
})();
