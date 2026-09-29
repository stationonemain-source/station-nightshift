// Minimal Chrome DevTools Protocol client for the site's browser tests (Node 22+: global WebSocket).
// Talks ONLY to a headless browser started with ~/.claude/scripts/test-browser.sh (never the everyday
// Chrome). Every request the page makes is paused: the local static server and Google Fonts go
// through; anything else (n8n, audit.station.solutions, Meta, the local analytics collector) is
// answered by the test's own handler or with an empty 204, so a test run never reaches a live system.
export const LOCAL_ORIGINS = ["http://127.0.0.1:", "http://localhost:"];
const PASS = [/^https:\/\/fonts\.(googleapis|gstatic)\.com\//];

export async function openPage(cdpPort) {
  const r = await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" });
  const t = await r.json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  let id = 0;
  const pending = new Map(), listeners = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const p = pending.get(d.id); pending.delete(d.id);
      d.error ? p.bad(new Error(d.error.message + " (" + p.method + ")")) : p.ok(d.result);
    } else if (d.method) {
      (listeners.get(d.method) || []).forEach((fn) => fn(d.params));
    }
  };
  const page = {
    targetId: t.id,
    send(method, params = {}) {
      return new Promise((ok, bad) => { const i = ++id; pending.set(i, { ok, bad, method }); ws.send(JSON.stringify({ id: i, method, params })); });
    },
    on(method, fn) { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); },
    requests: [],          // every request the page tried to make: {url, method, postData, type}
    errors: [],            // uncaught exceptions + console errors
    handler: null,         // async (req) => {status, headers, body} | null (null = default)
    async eval(expr) {
      const r = await page.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error("eval failed: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async close() {
      try { await fetch(`http://127.0.0.1:${cdpPort}/json/close/${t.id}`); } catch (e) {}
      try { ws.close(); } catch (e) {}
    },
  };
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  // the test browser keeps a profile between runs: never let a cached copy stand in for the file on disk
  await page.send("Network.enable");
  await page.send("Network.setCacheDisabled", { cacheDisabled: true });
  page.on("Runtime.exceptionThrown", (p) => page.errors.push("exception: " + (p.exceptionDetails.exception && p.exceptionDetails.exception.description || p.exceptionDetails.text)));
  page.on("Runtime.consoleAPICalled", (p) => { if (p.type === "error") page.errors.push("console.error: " + p.args.map((a) => a.value || a.description).join(" ")); });
  await page.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  page.on("Fetch.requestPaused", async (p) => {
    const req = { url: p.request.url, method: p.request.method, postData: p.request.postData || "", type: p.resourceType, headers: p.request.headers };
    page.requests.push(req);
    try {
      if (LOCAL_ORIGINS.some((o) => req.url.startsWith(o)) && !req.url.startsWith("http://127.0.0.1:8790/")) {
        return await page.send("Fetch.continueRequest", { requestId: p.requestId });
      }
      if (PASS.some((re) => re.test(req.url))) return await page.send("Fetch.continueRequest", { requestId: p.requestId });
      let res = page.handler ? await page.handler(req) : null;
      if (!res) res = { status: 204, headers: {}, body: "" };
      const headers = Object.entries(Object.assign({ "Access-Control-Allow-Origin": "*" }, res.headers || {})).map(([name, value]) => ({ name, value: String(value) }));
      await page.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: res.status, responseHeaders: headers,
        body: Buffer.from(res.body || "").toString("base64") });
    } catch (e) { /* the page may have navigated away mid-request */ }
  });
  return page;
}

export async function setViewport(page, width, height, mobile) {
  await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile: !!mobile });
  if (mobile) await page.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
}

export function waitFor(page, method, pred = () => true, ms = 15000) {
  return new Promise((ok, bad) => {
    const to = setTimeout(() => bad(new Error("timeout waiting for " + method)), ms);
    page.on(method, (p) => { if (pred(p)) { clearTimeout(to); ok(p); } });
  });
}

export async function goto(page, url) {
  const loaded = waitFor(page, "Page.loadEventFired");
  await page.send("Page.navigate", { url });
  await loaded;
  await sleep(400);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function until(fn, ms = 6000, step = 100) {
  const t0 = Date.now();
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) return v; await sleep(step); }
}

export async function screenshot(page, path, full = true) {
  const fs = await import("node:fs");
  const r = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full, fromSurface: true });
  fs.writeFileSync(path, Buffer.from(r.data, "base64"));
  return path;
}
