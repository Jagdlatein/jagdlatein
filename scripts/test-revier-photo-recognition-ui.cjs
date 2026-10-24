// UI consent, payload and async lifecycle checks; no image leaves this test.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createLoader, local } = require("./helpers/project-module.cjs");
const React = local("react");
const { renderToStaticMarkup } = local("react-dom/server");
const { normalizePhotoRecognitionResponse } = createLoader()("lib/revier-photo-recognition.js");
const { createPhotoRecognitionRequestId } = createLoader()("lib/revier-photo-request-id.js");
const { photoRecognitionRequestId } = createLoader()("lib/revier-photo-quota.js");
const { photoRecognitionLimitMessage } = createLoader()("lib/revier-photo-limit-message.js");

function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(text).join(" ");
  return typeof node === "object" ? text(node.props?.children) : String(node);
}
function expand(node) {
  if (Array.isArray(node)) return node.map(expand);
  if (!node || typeof node !== "object") return node;
  if (typeof node.type === "function") return expand(node.type(node.props));
  return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
}
function findAll(node, predicate, found = []) {
  if (Array.isArray(node)) { node.forEach(item => findAll(item, predicate, found)); return found; }
  if (!node || typeof node !== "object") return found;
  if (predicate(node)) found.push(node);
  findAll(node.props?.children, predicate, found);
  return found;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function stateEngine() {
  const slots = []; let cursor = 0, effects = [], mounted = true, lateWrites = 0;
  const hooks = { ...React,
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[i].value, value => {
        if (!mounted) { lateWrites++; return; }
        slots[i].value = typeof value === "function" ? value(slots[i].value) : value;
      }];
    },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(fn, deps) {
      const i = cursor++, old = slots[i];
      if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) {
        slots[i] = { deps, cleanup: old?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  return {
    hooks, render(fn) { cursor = 0; return fn(); },
    flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); },
    unmount() { if (!mounted) return; mounted = false; effects = []; slots.forEach(slot => slot?.cleanup?.()); },
    get lateWrites() { return lateWrites; },
  };
}
function json(status, data) { return { status, ok: status >= 200 && status < 300, json: async () => data }; }
const available = () => json(200, { available: true, configured: true, dailyLimit: 5 });
const result = (changes = {}) => normalizePhotoRecognitionResponse({ status: "suggestion", candidateIds: ["rehwild"], categoryId: "wildkunde", observations: [], ...changes });
const success = (value = result()) => json(200, { ok: true, result: value });
const prepared = (label = "prepared-pixels") => new Blob([label], { type: "image/jpeg" });
const settle = () => new Promise(resolve => setImmediate(resolve));

function setup(options = {}) {
  const e = stateEngine(), calls = [], timers = new Map();
  const names = ["fetch", "crypto", "indexedDB", "localStorage", "sessionStorage", "setTimeout", "clearTimeout"];
  const originals = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let photo = options.photo || prepared(), tree, timerId = 0, uuid = 0, storageReads = 0;
  for (const name of ["indexedDB", "localStorage", "sessionStorage"]) Object.defineProperty(globalThis, name, {
    configurable: true, get() { storageReads++; throw new Error("Recognition must not save a model hypothesis or photo"); },
  });
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: Object.hasOwn(options, "crypto") ? options.crypto : options.noCrypto ? {} : {
    randomUUID() { return `10000000-0000-4000-8000-${String(++uuid).padStart(12, "0")}`; },
  } });
  Object.defineProperty(globalThis, "setTimeout", { configurable: true, value(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; } });
  Object.defineProperty(globalThis, "clearTimeout", { configurable: true, value(id) { timers.delete(id); } });
  Object.defineProperty(globalThis, "fetch", { configurable: true, value(url, init = {}) {
    const call = { url, init }; calls.push(call);
    if (options.fetch) return options.fetch(call, calls.length - 1);
    return Promise.resolve(init.method === "POST" ? success() : available());
  } });
  const Component = createLoader({
    react: e.hooks,
    "next/link": ({ children, ...props }) => React.createElement("a", props, children),
  })("components/RevierPhotoRecognition.js").default;
  const h = {
    e, calls, timers,
    get photo() { return photo; },
    get text() { return text(expand(tree)); },
    get storageReads() { return storageReads; },
    nodes(predicate) { return findAll(expand(tree), predicate); },
    button(label = "Foto mit OpenAI erkennen") {
      const button = this.nodes(node => node.type === "button" && text(node).trim() === label)[0];
      assert.ok(button, `Expected button: ${label}`); return button;
    },
    render() { tree = e.render(() => Component({ photo })); return tree; },
    flush() { this.render(); e.flush(); this.render(); e.flush(); this.render(); },
    async ready() { await settle(); this.flush(); },
    changePhoto(value) { photo = value; this.flush(); },
    recognize() { const pending = this.button().props.onClick(); this.render(); return pending; },
    requests(method) { return calls.filter(call => (call.init.method || "GET") === method); },
    fireTimer(delay) {
      const target = [...timers.entries()].find(([, timer]) => timer.delay === delay);
      assert.ok(target, `Expected timeout ${delay}`); timers.delete(target[0]); target[1].fn();
    },
    cleanup() { e.unmount(); for (const name of names) { if (originals[name]) Object.defineProperty(globalThis, name, originals[name]); else delete globalThis[name]; } },
  };
  h.flush(); return h;
}

test("Server rendering does not fetch, read browser storage or transmit a photo", () => {
  const Component = createLoader({ "next/link": ({ children, ...props }) => React.createElement("a", props, children) })("components/RevierPhotoRecognition.js").default;
  const html = renderToStaticMarkup(React.createElement(Component, { photo: prepared() }));
  assert.match(html, /Bilderkennung wird vorbereitet/);
  assert.doesNotMatch(html, /prepared-pixels|data:image|blob:|<img/);
});

test("Selecting a photo only reads configuration without an image-bearing request", async () => {
  const h = setup();
  try {
    await h.ready();
    assert.equal(h.requests("GET").length, 1);
    assert.equal(h.requests("POST").length, 0);
    const { url, init } = h.calls[0];
    assert.equal(url, "/api/fotohelfer/recognize");
    assert.equal(init.body, undefined);
    assert.equal(init.headers, undefined);
    assert.equal(init.credentials, "same-origin");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal);
    assert.match(h.text, /sendest du die verkleinerte Fotokopie über Jagdlatein an OpenAI/);
    assert.match(h.text, /Metadaten werden entfernt/);
    assert.equal(h.storageReads, 0);
    const replacement = prepared("second-photo"); h.changePhoto(replacement); await h.ready();
    assert.equal(h.requests("GET").length, 2);
    assert.equal(h.requests("POST").length, 0);
  } finally { h.cleanup(); }
});

test("Explicit recognition sends only the prepared JPEG blob with consent and a fresh UUID", async () => {
  let postCount = 0;
  const h = setup({ fetch: async ({ init }) => init.method !== "POST" ? available() : ++postCount === 1 ? json(503, { message: "upstream secret" }) : success() });
  try {
    await h.ready(); await h.recognize(); h.flush();
    assert.equal(h.requests("POST").length, 1);
    const first = h.requests("POST")[0].init;
    assert.equal(first.body, h.photo);
    assert.equal(await first.body.text(), "prepared-pixels");
    assert.equal(first.headers["Content-Type"], "image/jpeg");
    assert.equal(first.headers["X-Jagdlatein-Photo-Consent"], "openai-v1");
    assert.match(first.headers["X-Jagdlatein-Photo-Request-Id"], /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i);
    assert.deepEqual(Object.keys(first.headers).sort(), ["Content-Type", "X-Jagdlatein-Photo-Consent", "X-Jagdlatein-Photo-Request-Id"].sort());
    assert.equal(first.credentials, "same-origin"); assert.equal(first.cache, "no-store");
    assert.doesNotMatch(h.text, /upstream secret/);
    await h.recognize(); h.flush();
    assert.notEqual(h.requests("POST")[1].init.headers["X-Jagdlatein-Photo-Request-Id"], first.headers["X-Jagdlatein-Photo-Request-Id"]);
    assert.equal(h.requests("POST")[1].init.body, h.photo);
    assert.equal(h.storageReads, 0);
  } finally { h.cleanup(); }
});

test("Successful report shows existing article/category links and keeps the hypothesis out of journal storage", async () => {
  const h = setup();
  try {
    await h.ready(); await h.recognize(); h.flush();
    assert.match(h.text, /Bildvorschlag: Rehwild/);
    assert.match(h.text, /Rehwild hat einen hellen Spiegel/);
    assert.match(h.text, /nicht automatisch als eigene Einordnung im Tagebuch gespeichert/);
    const links = h.nodes(node => node.type === "a").map(node => node.props.href);
    assert.ok(links.includes("/lernen/wildkunde"));
    assert.ok(links.includes("/wildkunde/rehwild"));
    assert.match(h.text, /Fachquellen zum Lernwissen/);
    assert.match(h.text, /KI-Bestimmung des Fotos ist damit nicht bestätigt/);
    assert.equal(h.storageReads, 0);
    assert.equal(h.nodes(node => ["form", "textarea", "select"].includes(node.type)).length, 0);
  } finally { h.cleanup(); }
});

test("Generic motif, uncertain alternatives and unknown outcomes retain their distinct safe reports", async () => {
  for (const value of [
    result({ candidateIds: ["dog"], categoryId: "hundewesen" }),
    result({ status: "uncertain", candidateIds: ["rehwild", "damwild"], categoryId: "wildkunde" }),
    result({ status: "unknown", candidateIds: [], categoryId: null }),
  ]) {
    const h = setup({ fetch: async ({ init }) => init.method === "POST" ? success(value) : available() });
    try {
      await h.ready(); await h.recognize(); h.flush();
      assert.ok(h.text.includes(value.title));
      assert.ok(h.text.includes(value.notice));
      if (value.category) assert.ok(h.nodes(node => node.type === "a" && node.props.href === value.category.href).length);
      for (const alternative of value.alternatives) assert.ok(h.nodes(node => node.type === "a" && node.props.href === alternative.href).length);
      if (value.status === "unknown") assert.equal(h.nodes(node => node.type === "a" && node.props.href.startsWith("/wildkunde/")).length, 0);
      assert.equal(h.storageReads, 0);
    } finally { h.cleanup(); }
  }
});

test("GET auth, quota and unconfigured/unavailable responses explain the gate without posting the photo", async () => {
  const cases = [
    [401, {}, /Für die Bilderkennung anmelden/, "/login?next=%2Ffotohelfer"],
    [403, {}, /aktiven Jagdlatein-Zugang/, "/preise?next=%2Ffotohelfer"],
    [429, { code: "photo_daily_limit", message: "secret diagnostics" }, /Tageslimit von 5/, null],
    [503, { message: "secret diagnostics" }, /nicht verfügbar/, null],
    [200, { available: false, configured: false }, /nicht verfügbar/, null],
  ];
  for (const [status, data, message, href] of cases) {
    const h = setup({ fetch: async () => json(status, data) });
    try {
      await h.ready(); assert.match(h.text, message);
      assert.equal(h.requests("POST").length, 0);
      assert.equal(h.nodes(node => node.type === "button" && text(node) === "Foto mit OpenAI erkennen").length, 0);
      if (href) assert.ok(h.nodes(node => node.type === "a" && node.props.href === href).length);
      assert.doesNotMatch(h.text, /secret diagnostics/);
    } finally { h.cleanup(); }
  }
});

test("A temporary configuration/network failure can be retried without selecting or posting the photo again", async () => {
  for (const failure of [() => json(503, {}), () => Promise.reject(new Error("network unavailable"))]) {
    let checks = 0;
    const h = setup({ fetch: async ({ init }) => {
      assert.notEqual(init.method, "POST");
      return ++checks === 1 ? failure() : available();
    } });
    try {
      await h.ready(); assert.match(h.text, /nicht verfügbar/);
      h.button("Verfügbarkeit erneut prüfen").props.onClick(); h.flush(); await h.ready();
      assert.ok(h.button());
      assert.equal(h.requests("GET").length, 2);
      assert.equal(h.requests("POST").length, 0);
      assert.equal(h.storageReads, 0);
    } finally { h.cleanup(); }
  }
});

test("POST auth changes and exhausted quota remain visible and do not replay a purchase or recognition", async () => {
  const resetsAt = new Date(Math.ceil((Date.now() + 60000) / 86400000) * 86400000).toISOString();
  for (const [status, message, metadata = {}, hasReset = false] of [
    [401, /anmelden/], [403, /aktiven Jagdlatein-Zugang/], [429, /Erkennungslimit ist erreicht/],
    [429, /Dein Tageslimit von 5 Foto-Erkennungsversuchen/, { code: "photo_daily_limit", resetsAt }, true],
    [429, /Tageskontingent.*für alle Konten/, { code: "photo_capacity_limit", resetsAt }, true],
    [429, /Gesamtkontingent.*für alle Konten/, { code: "photo_capacity_limit" }],
    [429, /monatliche Gesamtkontingent/, { code: "photo_monthly_capacity_limit", resetsAt }],
    [429, /Dein Tageslimit von 5/, { code: "photo_daily_limit" }],
    [429, /Dein Tageslimit von 5/, { code: "photo_daily_limit", resetsAt: "<script>private reset</script>" }],
    [429, /Erkennungslimit ist erreicht/, { code: "private unknown code", resetsAt }],
  ]) {
    const h = setup({ fetch: async ({ init }) => init.method === "POST" ? json(status, { ...metadata, message: "private provider body" }) : available() });
    try {
      await h.ready(); await h.recognize(); h.flush();
      assert.match(h.text, message); assert.doesNotMatch(h.text, /private (?:provider body|reset|unknown code)/);
      if (hasReset) assert.match(h.text, /Tageskontingent wird am .*deine Ortszeit.*erneuert/);
      else assert.doesNotMatch(h.text, /deine Ortszeit/);
      if (metadata.code === "photo_daily_limit") assert.match(h.text, /Auch ein gestarteter Versuch ohne Ergebnis zählt mit/);
      assert.equal(h.requests("POST").length, 1);
      assert.equal(h.nodes(node => node.type === "button" && text(node) === "Foto mit OpenAI erkennen").length, 0);
      assert.equal(h.timers.size, 0, "A reset timestamp must not schedule an automatic recognition");
    } finally { h.cleanup(); }
  }
});

test("Daily reset metadata displays local summer/winter time and rejects malformed or unbounded dates", () => {
  const summer = { now: Date.parse("2026-10-23T16:00:00.000Z"), timeZone: "Europe/Zurich" };
  const reset = "2026-10-24T00:00:00.000Z";
  const message = photoRecognitionLimitMessage({ code: "photo_daily_limit", resetsAt: reset, message: "private body" }, summer);
  assert.match(message, /24\.10\.2026/); assert.match(message, /02:00/); assert.match(message, /deine Ortszeit/);
  assert.match(message, /5 Foto-Erkennungsversuchen/); assert.doesNotMatch(message, /private body/);
  const winter = photoRecognitionLimitMessage({ code: "photo_capacity_limit", resetsAt: "2026-10-26T00:00:00Z" },
    { now: Date.parse("2026-10-25T16:00:00.000Z"), timeZone: "Europe/Zurich" });
  assert.match(winter, /26\.10\.2026/); assert.match(winter, /01:00/);
  assert.doesNotMatch(winter, /Dein Tageslimit/);
  for (const resetsAt of [undefined, null, 1792800000000, {}, "not a date", "9999-10-24T00:00:00.000Z", "2026-10-22T00:00:00.000Z",
    "2026-10-24T01:00:00.000Z", "2026-02-30T00:00:00.000Z", "2026-10-24T00:00:00.000Z private text"]) {
    const invalid = photoRecognitionLimitMessage({ code: "photo_daily_limit", resetsAt }, summer);
    assert.match(invalid, /Dein Tageslimit von 5/); assert.match(invalid, /später erneut/);
    assert.doesNotMatch(invalid, /deine Ortszeit|9999|private text|not a date/);
  }
  const monthly = photoRecognitionLimitMessage({ code: "photo_monthly_capacity_limit", resetsAt: reset }, summer);
  assert.match(monthly, /monatliche Gesamtkontingent/); assert.doesNotMatch(monthly, /24\.10|deine Ortszeit|Tageslimit/);
  const unknown = photoRecognitionLimitMessage({ code: "__proto__", resetsAt: reset, message: "private body" }, summer);
  assert.match(unknown, /Erkennungslimit ist erreicht/); assert.doesNotMatch(unknown, /private body|deine Ortszeit/);
});

test("Network failure, provider failure and malformed JSON offer an explicit retry", async () => {
  for (const failure of [
    async () => { throw new Error("private network diagnostic"); },
    async () => json(502, { code: "provider_error", message: "private provider diagnostic" }),
    async () => ({ status: 200, ok: true, json: async () => { throw new SyntaxError("private response"); } }),
  ]) {
    let posts = 0;
    const h = setup({ fetch: async ({ init }) => init.method !== "POST" ? available() : ++posts === 1 ? failure() : success() });
    try {
      await h.ready(); await h.recognize(); h.flush();
      assert.ok(h.nodes(node => node.props?.role === "alert").length);
      assert.doesNotMatch(h.text, /private (?:network|provider|response)/);
      await h.recognize(); h.flush();
      assert.match(h.text, /Bildvorschlag: Rehwild/);
      assert.equal(h.requests("POST").length, 2);
    } finally { h.cleanup(); }
  }
});

test("A rapid double click starts exactly one POST and displays a working state", async () => {
  const pending = deferred();
  const h = setup({ fetch: async ({ init }) => init.method === "POST" ? pending.promise : available() });
  try {
    await h.ready();
    const click = h.button().props.onClick;
    const first = click(), second = click(); h.flush();
    assert.equal(h.requests("POST").length, 1);
    assert.match(h.text, /Dein Foto wird ausgewertet/);
    assert.ok(h.nodes(node => node.props?.["aria-busy"] === true).length);
    pending.resolve(success()); await Promise.all([first, second]); h.flush();
    assert.match(h.text, /Bildvorschlag: Rehwild/);
  } finally { h.cleanup(); }
});

test("Replacing a photo aborts old GET and prevents a stale response from changing the new gate", async () => {
  for (const oldOutcome of [() => available(), () => json(401, {})]) {
    const old = deferred();
    const h = setup({ fetch: async (_call, index) => index === 0 ? old.promise : json(403, {}) });
    try {
      const oldSignal = h.calls[0].init.signal;
      h.changePhoto(prepared("replacement")); await h.ready();
      assert.equal(oldSignal.aborted, true);
      assert.match(h.text, /aktiven Jagdlatein-Zugang/);
      old.resolve(oldOutcome()); await h.ready();
      assert.match(h.text, /aktiven Jagdlatein-Zugang/);
      assert.doesNotMatch(h.text, /Für die Bilderkennung anmelden/);
      assert.equal(h.requests("POST").length, 0);
    } finally { h.cleanup(); }
  }
});

test("Replacing a photo aborts POST and discards its later success or failure", async () => {
  for (const rejectOld of [false, true]) {
    const old = deferred();
    const h = setup({ fetch: async ({ init }) => init.method === "POST" ? old.promise : available() });
    try {
      await h.ready(); const job = h.recognize(); h.flush();
      const oldSignal = h.requests("POST")[0].init.signal;
      h.changePhoto(prepared("replacement")); await h.ready();
      assert.equal(oldSignal.aborted, true);
      if (rejectOld) old.reject(new Error("old request failure")); else old.resolve(success());
      await job; h.flush();
      assert.ok(h.button());
      assert.doesNotMatch(h.text, /Bildvorschlag: Rehwild|nicht erreichbar|old request/);
      assert.equal(h.storageReads, 0);
    } finally { h.cleanup(); }
  }
});

test("Removing the photo or unmounting aborts pending GET/POST and never writes late UI state", async () => {
  // The parent removes this component when its photo is removed. Exercise the
  // same unmount cleanup for both request phases; fetch deliberately ignores abort.
  for (const phase of ["GET", "POST"]) {
    const old = deferred();
    const h = setup({ fetch: async ({ init }) => (init.method || "GET") === phase ? old.promise : available() });
    try {
      let job;
      if (phase === "POST") { await h.ready(); job = h.recognize(); h.flush(); }
      const signal = h.calls.at(-1).init.signal;
      h.e.unmount(); assert.equal(signal.aborted, true);
      old.resolve(phase === "POST" ? success() : available());
      if (job) await job; await settle();
      assert.equal(h.e.lateWrites, 0, phase);
      assert.equal(h.timers.size, 0, phase);
    } finally { h.cleanup(); }
  }
});

test("A timeout aborts network work and presents a retry instead of a permanent spinner", async () => {
  const h = setup({ fetch: ({ init }) => init.method !== "POST" ? Promise.resolve(available()) : new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }) });
  try {
    await h.ready(); const job = h.recognize(); h.flush(); h.fireTimer(55000);
    await job; h.flush();
    assert.match(h.text, /Erkennung dauert zu lange/);
    assert.ok(h.button());
    assert.equal(h.requests("POST")[0].init.signal.aborted, true);
    assert.equal(h.nodes(node => node.props?.["aria-busy"] === true).length, 0);
  } finally { h.cleanup(); }
});

test("A transport resolving successfully after timeout cannot revive a timed-out GET or POST", async () => {
  for (const phase of ["GET", "POST"]) {
    const pending = deferred();
    const h = setup({ fetch: async ({ init }) => (init.method || "GET") === phase ? pending.promise : available() });
    try {
      let job;
      if (phase === "POST") { await h.ready(); job = h.recognize(); h.flush(); }
      h.fireTimer(phase === "POST" ? 55000 : 10000);
      pending.resolve(phase === "POST" ? success() : available());
      if (job) await job; await h.ready();
      assert.doesNotMatch(h.text, /Bildvorschlag: Rehwild/);
      if (phase === "POST") { assert.match(h.text, /Erkennung dauert zu lange/); assert.ok(h.button()); }
      else { assert.match(h.text, /nicht verfügbar/); assert.ok(h.button("Verfügbarkeit erneut prüfen")); }
    } finally { h.cleanup(); }
  }
});

test("Photo request IDs prefer native randomUUID and securely encode fallback version/variant bytes", () => {
  const savedRandom = Math.random;
  Math.random = () => assert.fail("Photo request identifiers must never use Math.random");
  try {
    const native = { randomUUID() { assert.equal(this, native); return "ABCDEFAB-CDEF-4ABC-8ABC-ABCDEFABCDEF"; }, getRandomValues() { assert.fail("Native randomUUID should take precedence"); } };
    assert.equal(createPhotoRecognitionRequestId(native), "abcdefab-cdef-4abc-8abc-abcdefabcdef");
    for (const [fill, expected] of [
      [bytes => bytes.forEach((_, i) => { bytes[i] = i; }), "00010203-0405-4607-8809-0a0b0c0d0e0f"],
      [bytes => bytes.fill(0xff), "ffffffff-ffff-4fff-bfff-ffffffffffff"],
    ]) {
      let draws = 0;
      const secure = { getRandomValues(bytes) { assert.equal(this, secure); assert.ok(bytes instanceof Uint8Array); assert.equal(bytes.length, 16); draws++; fill(bytes); return bytes; } };
      const id = createPhotoRecognitionRequestId(secure);
      assert.equal(id, expected);
      assert.equal(photoRecognitionRequestId(id), id, "Actual server UUID validator accepts the fallback");
      assert.equal(draws, 1);
    }
    for (const secure of [null, {}, { getRandomValues() { throw new Error("private crypto error"); } }, { randomUUID() { return "not-a-v4-uuid"; } }]) {
      assert.throws(() => createPhotoRecognitionRequestId(secure), error => error.code === "photo_secure_random_unavailable" && !error.message.includes("private"));
    }
  } finally { Math.random = savedRandom; }
});

test("A WebView with only getRandomValues sends an accepted fresh photo request ID after consent", async () => {
  let draws = 0;
  const h = setup({ crypto: { getRandomValues(bytes) { bytes.fill(++draws); return bytes; } } });
  try {
    await h.ready(); assert.equal(draws, 0); assert.equal(h.requests("POST").length, 0);
    await h.recognize(); h.flush();
    assert.equal(draws, 1); assert.equal(h.requests("POST").length, 1);
    const first = h.requests("POST")[0].init;
    assert.equal(first.headers["X-Jagdlatein-Photo-Request-Id"], "01010101-0101-4101-8101-010101010101");
    assert.equal(photoRecognitionRequestId(first.headers["X-Jagdlatein-Photo-Request-Id"]), first.headers["X-Jagdlatein-Photo-Request-Id"]);
    assert.equal(first.headers["X-Jagdlatein-Photo-Consent"], "openai-v1"); assert.equal(first.body, h.photo);
    assert.match(h.text, /Bildvorschlag: Rehwild/);
    h.changePhoto(prepared("another-photo")); await h.ready(); await h.recognize(); h.flush();
    assert.equal(draws, 2); assert.equal(h.requests("POST").length, 2);
    assert.notEqual(h.requests("POST")[1].init.headers["X-Jagdlatein-Photo-Request-Id"], first.headers["X-Jagdlatein-Photo-Request-Id"]);
    assert.equal(h.storageReads, 0);
  } finally { h.cleanup(); }
});

test("Missing or failing secure request identifiers explain the limitation before sending the image", async () => {
  for (const crypto of [undefined, null, {}, { getRandomValues() { throw new Error("private crypto detail"); } }, { randomUUID() { throw new Error("private native detail"); } }]) {
    const h = setup({ crypto });
    try {
      await h.ready(); await h.recognize(); h.flush();
      assert.equal(h.requests("POST").length, 0);
      assert.match(h.text, /keine sichere Foto-Anfrage erstellen/);
      assert.match(h.text, /Merkmalsvergleiche bleiben verfügbar/);
      assert.doesNotMatch(h.text, /private (?:crypto|native) detail/);
      assert.ok(h.button());
      assert.equal(h.timers.size, 0);
    } finally { h.cleanup(); }
  }
});
