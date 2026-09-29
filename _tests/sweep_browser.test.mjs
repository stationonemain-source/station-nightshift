// Browser checks for the free website check (homepage band, /sweep/) and the scanner-safe
// /unsubscribe/ page. Run from the repo root:
//
//   ~/.claude/scripts/test-browser.sh start bs-sweepsite 9996      # headless Chrome for Testing
//   node _tests/sweep_browser.test.mjs                             # TB_PORT=9996 SITE_PORT=10096
//   ~/.claude/scripts/test-browser.sh stop bs-sweepsite
//
// This file starts (and stops, by pid) its own static server for the repo. Every request the
// page makes outside that server is answered by the test itself (see cdp.mjs), so nothing
// reaches n8n, audit.station.solutions, Meta or a local Circle. SHOTS=<dir> also writes the
// review screenshots (web-*.png) there.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { openPage, setViewport, goto, screenshot, sleep, until } from "./cdp.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TB_PORT = +(process.env.TB_PORT || 9996);
const SITE_PORT = +(process.env.SITE_PORT || 10096);
const SHOTS = process.env.SHOTS || "";
const B = `http://127.0.0.1:${SITE_PORT}`;
const SERVICE = "https://audit.station.solutions/sweep";
const ENGINE = "https://audit.station.solutions/unsubscribe";
const N8N_UNSUB = "https://n8n.srv1748596.hstgr.cloud/webhook/station-unsub";
const COLLECTOR = "http://127.0.0.1:8790/api/range-analytics";

let failures = 0, passes = 0;
function check(cond, name, detail) {
  if (cond) { passes++; console.log("  ok   " + name); }
  else { failures++; console.log("  FAIL " + name + (detail !== undefined ? "  -> " + JSON.stringify(detail) : "")); }
}
const shot = async (page, name, full) => { if (SHOTS) { await screenshot(page, path.join(SHOTS, name), full); console.log("  shot " + name); } };

function form(postData) { return Object.fromEntries(new URLSearchParams(postData)); }
function events(page) {
  return page.requests.filter((r) => r.url === COLLECTOR && r.method === "POST")
    .map((r) => { try { return JSON.parse(r.postData); } catch (e) { return {}; } });
}

async function newPage({ consent = "all", width = 1440, height = 900, mobile = false } = {}) {
  const p = await openPage(TB_PORT);
  await setViewport(p, width, height, mobile);
  // consent is a per-browser choice in localStorage; set it before any script runs.
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source:
    `try{localStorage.setItem('rangeConsent',${JSON.stringify(consent)});}catch(e){}` });
  p.handler = async (req) => {
    if (req.url.startsWith(SERVICE + "/check") || req.url.startsWith(SERVICE + "/code")) {
      return { status: 200, headers: { "Content-Type": "text/html" }, body: "<!doctype html><title>stub</title><p>stub service</p>" };
    }
    return null;
  };
  return p;
}

async function noOverflow(p) {
  return p.eval("document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth");
}

async function scrollThrough(p) {
  const h = await p.eval("document.documentElement.scrollHeight");
  for (let y = 0; y < h; y += 350) { await p.eval(`scrollTo(0,${y})`); await sleep(50); }
  await p.eval("scrollTo(0,0)"); await sleep(400);
}

async function homepage(width, height, mobile, tag) {
  console.log(`homepage @${tag}`);
  const p = await newPage({ width, height, mobile });
  await goto(p, B + "/");
  check(await noOverflow(p), `no horizontal scroll @${tag}`);
  const ctas = await p.eval(`[...document.querySelectorAll('.hf-ctas > a')].map(a=>[a.className,a.getAttribute('href'),a.textContent.trim()])`);
  check(JSON.stringify(ctas) === JSON.stringify([["btn dark", "/custom/", "See your new website — free demo"], ["btn glass", "/audit/", "Get a free audit"]]), "both hero buttons exactly as before", ctas);
  const quiet = await p.eval(`(()=>{const q=document.querySelector('.hf-ctas + .hf-quiet');if(!q)return null;const r=q.getBoundingClientRect();return {text:q.innerText.trim(),bottom:r.bottom,vh:innerHeight,href:q.querySelector('a').getAttribute('href')}})()`);
  check(quiet && /^Worried your website has been hacked\?\s+Run the free website check\s→$/.test(quiet.text), "quiet line under the hero buttons", quiet);
  check(quiet && quiet.bottom < quiet.vh, "quiet line is on the first screen", quiet);
  const order = await p.eval(`(()=>{const b=document.getElementById('sweep-band');return [b.previousElementSibling.className,b.nextElementSibling.id,b.nextElementSibling.querySelector('h2').textContent]})()`);
  check(order[0] === "parallax" && order[1] === "shop" && order[2] === "Start here.", "band sits between the hero and Start here", order);
  const kicker = await p.eval(`document.querySelector('#sweep-band .sw-k').innerText.trim()`);
  check(kicker === "FREE WEBSITE CHECK · RESULT BY EMAIL", "band kicker", kicker);
  const hp = await p.eval(`(()=>{const i=document.querySelector('#sweep-band input[name=company_fax]');const r=i.getBoundingClientRect();return {right:r.right,tab:i.tabIndex,ac:i.autocomplete}})()`);
  check(hp.right < 0 && hp.tab === -1 && hp.ac === "off", "honeypot is off-screen and out of the tab order", hp);
  await shot(p, `web-station-home-hero-${tag}.png`, false);

  // the quiet line scrolls to the band
  await p.eval(`document.querySelector('.hf-quiet a').click()`);
  const top = await until(async () => { const t = await p.eval(`document.getElementById('sweep-band').getBoundingClientRect().top`); return t >= 0 && t < 160 ? t : null; }, 5000);
  check(top !== null, "quiet line scrolls to the band", top);
  await sleep(700);
  await shot(p, `web-station-home-band-${tag}.png`, false);

  // the band's form posts the contract fields to the service; the event carries src
  await p.eval(`(()=>{const f=document.querySelector('#sweep-band form');f.website.value='  fixture-dental-houston.com ';f.email.value='owner@fixture-dental-houston.com';})()`);
  const before = p.requests.length;
  await p.eval(`document.querySelector('#sweep-band button[type=submit]').click()`);
  const post = await until(() => p.requests.slice(before).find((r) => r.url === SERVICE + "/check"), 8000);
  check(post && post.method === "POST", "band form POSTs to " + SERVICE + "/check", post && post.method);
  const f = post ? form(post.postData) : {};
  check(JSON.stringify(f) === JSON.stringify({ website: "fixture-dental-houston.com", email: "owner@fixture-dental-houston.com", company_fax: "", src: "home_band" }), "band form fields (trimmed website, empty honeypot, src=home_band)", f);
  const ev = await until(() => events(p).find((e) => e.ev === "sweep_submit"), 4000);
  check(ev && ev.label === "home_band" && ev.path === "/", "sweep_submit event, label home_band", ev);
  check(!p.errors.length, "no script errors on the homepage", p.errors);
  await p.close();
}

async function sweepPage(width, height, mobile, tag) {
  console.log(`/sweep/ @${tag}`);
  const p = await newPage({ width, height, mobile });
  await goto(p, B + "/sweep/");
  check(await noOverflow(p), `no horizontal scroll @${tag}`);
  const view = await until(() => events(p).find((e) => e.ev === "sweep_view"), 4000);
  check(view && view.label === "sweep_page" && view.path === "/sweep/", "sweep_view event on load", view);
  check(!p.requests.some((r) => r.url.includes("audit-popup")), "audit-popup.js never requested on /sweep/");
  check(await p.eval(`getComputedStyle(document.querySelector('.sw-panel')).borderRadius === '18px'`), "v5.css styles applied");
  const h1 = await p.eval(`document.querySelector('h1').textContent`);
  check(h1 === "Has your website been hacked without you knowing?", "headline", h1);
  await scrollThrough(p);
  await shot(p, `web-station-sweep-${tag}.png`, true);

  if (!mobile) {
    // nav mega-menu (hover-driven): the entry is in the Storefront Help column
    const help = await p.eval(`[...document.querySelectorAll('.mwrap')][1].querySelector('.mcol:last-child').innerText`);
    check(/Website check — hacked or not\?/.test(help), "Storefront mega-menu Help column entry", help);
    // search finds the page
    await p.eval(`document.querySelector('.searchbtn').click()`);
    await sleep(300);
    await p.eval(`(()=>{const i=document.getElementById('searchIn');i.value='hacked';i.dispatchEvent(new Event('input'));})()`);
    const hits = await p.eval(`[...document.querySelectorAll('#searchRes a')].map(a=>a.getAttribute('href'))`);
    check(hits.includes("/sweep/"), "site search 'hacked' → /sweep/", hits);
  } else {
    await p.eval(`document.querySelector('.hamb').click()`);
    await sleep(300);
    const drawer = await p.eval(`(()=>{const a=document.querySelector('.msheet.open a[href="/sweep/"]');return a?[a.textContent,a.getBoundingClientRect().height>0]:null})()`);
    check(drawer && drawer[0] === "Website check" && drawer[1], "mobile drawer entry", drawer);
    await p.eval(`document.body.click()`);
  }

  // the page's own check form
  await p.eval(`(()=>{const f=document.getElementById('check');f.website.value='https://www.fixture-dental-houston.com/';f.email.value='owner@fixture-dental-houston.com';})()`);
  let before = p.requests.length;
  await p.eval(`document.querySelector('#check button[type=submit]').click()`);
  const post = await until(() => p.requests.slice(before).find((r) => r.url === SERVICE + "/check"), 8000);
  const f = post ? form(post.postData) : {};
  check(post && post.method === "POST" && f.src === "sweep_page" && f.website === "https://www.fixture-dental-houston.com/" && f.company_fax === "", "/sweep/ form POSTs with src=sweep_page", f);
  const ev = await until(() => events(p).find((e) => e.ev === "sweep_submit"), 4000);
  check(ev && ev.label === "sweep_page", "sweep_submit label sweep_page", ev);

  // prefill, and prefill is text only
  const q = "?url=" + encodeURIComponent('"><img src=x onerror=window.__pwned=1>') + "&code=7k3m-x9qd";
  await goto(p, B + "/sweep/" + q);
  const pre = await p.eval(`[document.getElementById('sw-website').value, document.getElementById('sw-c').value, !!window.__pwned, document.querySelectorAll('img[src="x"]').length]`);
  check(pre[0] === '"><img src=x onerror=window.__pwned=1>' && pre[1] === "7k3m-x9qd" && pre[2] === false && pre[3] === 0, "?url= and ?code= prefill as plain text", pre);

  // code box → GET /sweep/code?c=…
  before = p.requests.length;
  await p.eval(`document.querySelector('#code button[type=submit]').click()`);
  const get = await until(() => p.requests.slice(before).find((r) => r.url.startsWith(SERVICE + "/code")), 8000);
  check(get && get.method === "GET" && get.url === SERVICE + "/code?c=7k3m-x9qd", "code form GETs " + SERVICE + "/code?c=", get && get.url);
  const ce = await until(() => events(p).find((e) => e.ev === "sweep_code_open"), 4000);
  check(ce && ce.label === "sweep_page", "sweep_code_open label sweep_page", ce);
  check(!p.errors.length, "no script errors on /sweep/", p.errors);
  await p.close();
}

async function bandCodeLink() {
  console.log("band code link → /sweep/#code");
  const p = await newPage();
  await goto(p, B + "/");
  const loaded = new Promise((ok) => p.on("Page.loadEventFired", ok));
  await p.eval(`document.querySelector('#sweep-band a[data-sweep-code-link]').click()`);
  await loaded; await sleep(500);
  const where = await p.eval("location.pathname + location.hash");
  check(where === "/sweep/#code", "lands on /sweep/#code", where);
  await p.eval(`document.getElementById('sw-c').value='7K3MX9QD'`);
  await p.eval(`document.querySelector('#code button[type=submit]').click()`);
  const ce = await until(() => events(p).find((e) => e.ev === "sweep_code_open"), 5000);
  check(ce && ce.label === "home_band", "sweep_code_open label home_band", ce);
  await p.close();
}

async function consentGate() {
  console.log("no consent → no sweep_* events, forms still post");
  const p = await newPage({ consent: "essential" });
  await goto(p, B + "/sweep/");
  await p.eval(`(()=>{const f=document.getElementById('check');f.website.value='fixture-dental-houston.com';f.email.value='owner@fixture-dental-houston.com';})()`);
  await p.eval(`document.querySelector('#check button[type=submit]').click()`);
  const post = await until(() => p.requests.find((r) => r.url === SERVICE + "/check"), 8000);
  check(!!post, "form still posts without analytics consent");
  await sleep(800);
  check(!events(p).some((e) => /^sweep_/.test(e.ev || "")), "no sweep_* analytics without consent", events(p).map((e) => e.ev));
  await p.close();
}

async function noJs() {
  console.log("JavaScript off → the plain forms still work");
  const p = await newPage();
  await p.send("Emulation.setScriptExecutionDisabled", { value: true });
  await goto(p, B + "/sweep/");
  await p.send("DOM.enable");
  const doc = await p.send("DOM.getDocument", { depth: 0 });
  const q = async (sel) => (await p.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: sel })).nodeId;
  for (const [sel, val] of [["#sw-website", "fixture-dental-houston.com"], ["#sw-email", "owner@fixture-dental-houston.com"]]) {
    await p.send("DOM.focus", { nodeId: await q(sel) });
    await p.send("Input.insertText", { text: val });
  }
  const btn = await q("#check button[type=submit]");
  await p.send("DOM.scrollIntoViewIfNeeded", { nodeId: btn });
  const b = (await p.send("DOM.getBoxModel", { nodeId: btn })).model.border;
  const cx = (b[0] + b[4]) / 2, cy = (b[1] + b[5]) / 2;
  const before = p.requests.length;
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 });
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx, y: cy, button: "left", clickCount: 1 });
  const post = await until(() => p.requests.slice(before).find((r) => r.url === SERVICE + "/check"), 8000);
  const f = post ? form(post.postData) : {};
  check(post && f.src === "sweep_page" && f.email === "owner@fixture-dental-houston.com" && f.website === "fixture-dental-houston.com", "check form posts with JavaScript disabled", f);
  await p.close();
}

async function unsubscribe() {
  console.log("/unsubscribe/ is scanner-safe");
  const TOKEN = "v1.abc123.ABCDEFGHIJKLMNOPQRSTUVWX_-12";
  const sentTo = (p) => p.requests.filter((r) => (r.url === ENGINE || r.url === N8N_UNSUB) && r.method === "POST");

  // 1. opening the link (as a mail scanner would, JavaScript on) sends nothing
  let p = await newPage({ width: 390, height: 844, mobile: true });
  let engineAnswer = { status: 200, body: JSON.stringify({ ok: true, recorded: true }) };
  p.handler = async (req) => req.url === ENGINE ? { status: engineAnswer.status, headers: { "Content-Type": "application/json" }, body: engineAnswer.body } : null;
  await goto(p, B + "/unsubscribe/?u=" + encodeURIComponent(TOKEN + ","));   // trailing comma a mail app glued on
  await sleep(2500);
  check(sentTo(p).length === 0, "page load sends no POST", sentTo(p).map((r) => r.url));
  const ask = await p.eval(`[document.querySelector('h1').textContent, !!document.getElementById('unsub-go')]`);
  check(ask[0] === "Stop all email from Station to this address?" && ask[1], "page asks first, with one button", ask);
  await shot(p, "web-station-unsubscribe-confirm-390.png", false);
  // 2. a person presses the button (twice): exactly one POST to each, same body as before
  await p.eval(`(()=>{const b=document.getElementById('unsub-go');b.click();b.click();})()`);
  const done = await until(() => p.eval(`document.querySelector('h1').textContent === "You won’t get any more email from us."`), 5000);
  const posts = sentTo(p);
  check(posts.length === 2 && posts.some((r) => r.url === ENGINE) && posts.some((r) => r.url === N8N_UNSUB), "one click → one POST to the engine and one to n8n", posts.map((r) => r.url));
  check(posts.every((r) => r.postData === "u=" + encodeURIComponent(TOKEN)), "POST body is the cleaned token", posts.map((r) => r.postData));
  check(!!done, "engine confirmed → 'Unsubscribed'");
  await shot(p, "web-station-unsubscribe-done-390.png", false);
  await p.close();

  // 3. engine cannot confirm → the same "Request sent" outcome as before
  p = await newPage({ width: 390, height: 844, mobile: true });
  p.handler = async (req) => req.url === ENGINE ? { status: 500, headers: { "Content-Type": "application/json" }, body: "{}" } : null;
  await goto(p, B + "/unsubscribe/?u=" + encodeURIComponent(TOKEN));
  await p.eval(`document.getElementById('unsub-go').click()`);
  const sent = await until(() => p.eval(`document.querySelector('h1').textContent === "Your unsubscribe request was sent."`), 5000);
  check(!!sent, "engine unconfirmed → 'Request sent'");
  await p.close();

  // 4. a broken link says so and never offers the button
  p = await newPage({ width: 390, height: 844, mobile: true });
  await goto(p, B + "/unsubscribe/?u=v1.x");
  await sleep(800);
  const broken = await p.eval(`[document.querySelector('h1').textContent, !!document.getElementById('unsub-go')]`);
  check(broken[0] === "This link is incomplete." && !broken[1] && sentTo(p).length === 0, "incomplete link → no button, no POST", broken);
  await p.close();
}

async function main() {
  try { await (await fetch(`http://127.0.0.1:${TB_PORT}/json/version`)).json(); }
  catch (e) { console.error(`No test browser on ${TB_PORT}. Start one: ~/.claude/scripts/test-browser.sh start bs-sweepsite ${TB_PORT}`); process.exit(2); }
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const srv = spawn("python3", ["-m", "http.server", String(SITE_PORT), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  try {
    await until(async () => { try { return (await fetch(B + "/sweep/")).ok; } catch (e) { return false; } }, 5000);
    await homepage(1440, 900, false, "1440");
    await homepage(390, 844, true, "390");
    await sweepPage(1440, 900, false, "1440");
    await sweepPage(390, 844, true, "390");
    await bandCodeLink();
    await consentGate();
    await noJs();
    await unsubscribe();
  } finally {
    srv.kill("SIGTERM");
  }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
