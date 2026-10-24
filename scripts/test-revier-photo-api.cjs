// Isolated HTTP/SQL checks. No real image leaves this process, no provider call,
// private key, remote database, authentication email or billable request is used.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { randomUUID } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const pr = createRequire(path.join(root, "package.json"));
const swc = pr("next/dist/build/swc");
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || "",
  "Jagdlatein", "paypal-sandbox", "test-runtime", "node_modules", "@electric-sql", "pglite");
if (!fs.existsSync(runtime)) throw new Error("Missing isolated SQL test runtime. Set JL_PAYPAL_TEST_PGLITE_PATH.");
const { PGlite } = require(runtime);
const GENERATION = "11111111-1111-4111-8111-111111111111";
const REQUEST_ID = "22222222-2222-4222-8222-222222222222";
const HOST = "https://app.example.invalid";
const migrationPath = path.join(root, "supabase/migrations/20261023190000_photo_recognition_quota.sql");

function jpeg(width = 1200, height = 800, metadata = false, afterScan = false) {
  const app1 = [0xff, 0xe1, 0, 8, 69, 120, 105, 102, 0, 0];
  return new Uint8Array([0xff, 0xd8, ...(metadata && !afterScan ? app1 : []),
    0xff, 0xc0, 0, 11, 8, height >> 8, height & 255, width >> 8, width & 255, 1, 1, 0x11, 0,
    0xff, 0xda, 0, 8, 1, 1, 0, 0, 63, 0, 0,
    ...(metadata && afterScan ? app1 : []), 0xff, 0xd9]);
}
function iccChunk(sequence, count, data = "private source/location text must not leave this process") {
  const payload = [...Buffer.from("ICC_PROFILE\0", "ascii"), sequence, count, ...Buffer.from(data, "utf8")];
  const length = payload.length + 2;
  return [0xff, 0xe2, length >> 8, length & 255, ...payload];
}

function harness(options = {}) {
  const calls = { auth: 0, rpc: [], provider: [], normalization: 0, database: 0 };
  const env = { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: HOST,
    PHOTO_RECOGNITION_ENABLED: "true", OPENAI_API_KEY: "synthetic-not-a-key",
    SUPABASE_URL: "https://database.example.invalid", SUPABASE_SERVICE_ROLE_KEY: "synthetic-not-a-key", ...options.env };
  const database = { async rpc(name, args) {
    calls.rpc.push({ name, args });
    if (options.rpc) return options.rpc(name, args);
    return { error: null, data: name === "photo_recognition_quota_status"
      ? { schemaVersion: 1, available: true, dailyLimit: 5, globalDailyLimit: 50, globalMonthlyLimit: 100 }
      : { schemaVersion: 1, allowed: true, reason: "reserved" } };
  } };
  const clock = options.now === undefined ? Date : class extends Date {
    constructor(...args) { super(...(args.length ? args : [options.now])); }
    static now() { return options.now; }
  };
  const context = vm.createContext({ process: { env }, Buffer, Date: clock, URL, Uint8Array, ArrayBuffer, Response,
    setTimeout: options.shortReadTimeout ? (callback, duration) => setTimeout(callback, duration === 10000 ? 10 : duration) : setTimeout, clearTimeout });
  const cache = new Map();
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, "utf8"), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022" }, module: { type: "commonjs" } });
    const req = id => {
      if (id === "@supabase/supabase-js") return { createClient() { calls.database++; return database; } };
      if (id.endsWith("/account-access")) return { async requirePaidAccount(request) {
        calls.auth++;
        if (options.authError) throw Object.assign(new Error("private credential must never leak"), { status: options.authError });
        return { email: "synthetic@example.invalid", paid: true, accountGeneration: GENERATION, ...options.account };
      } };
      if (id.endsWith("/revier-photo-openai")) return { async requestPhotoRecognition(input) {
        calls.provider.push(input);
        if (options.providerError) throw options.providerError;
        return { syntheticRawResult: true };
      } };
      if (id.endsWith("/revier-photo-recognition")) return { normalizePhotoRecognitionResponse(data) {
        calls.normalization++; assert.equal(data.syntheticRawResult, true);
        return { status: "unknown", reason: "unknown", title: "Keine Zuordnung", ...options.normalized };
      } };
      if (id.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, mod, mod.exports);
    return mod.exports;
  }
  const route = load("app/api/fotohelfer/recognize/route.js");
  const quota = load("lib/revier-photo-quota.js");
  function request(overrides = {}) {
    const headers = { origin: HOST, "content-type": "image/jpeg", "x-jagdlatein-photo-consent": "openai-v1",
      "x-jagdlatein-photo-request-id": REQUEST_ID, ...overrides.headers };
    for (const [key, value] of Object.entries(headers)) if (value === null) delete headers[key];
    return new Request(overrides.url || `${HOST}/api/fotohelfer/recognize`, { method: overrides.method || "POST", headers,
      ...(overrides.method === "GET" ? {} : { body: overrides.body === undefined ? jpeg() : overrides.body }),
      ...(overrides.signal ? { signal: overrides.signal } : {}), ...(overrides.duplex ? { duplex: "half" } : {}) });
  }
  return { calls, route, quota, request, env };
}

async function result(response) {
  assert.match(response.headers.get("cache-control"), /private.*no-store/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  return { status: response.status, body: await response.json() };
}
function zeroProvider(ctx) { assert.equal(ctx.calls.provider.length, 0); assert.equal(ctx.calls.rpc.length, 0); }

test("paid authoritative auth gates GET and POST without reading photo or reserving quota", async () => {
  for (const status of [401, 403, 503]) {
    const ctx = harness({ authError: status });
    const post = await result(await ctx.route.POST(ctx.request()));
    const get = await result(await ctx.route.GET(ctx.request({ method: "GET" })));
    assert.equal(post.status, status); assert.equal(get.status, status);
    assert.doesNotMatch(JSON.stringify(post.body), /private credential|synthetic-not-a-key/);
    zeroProvider(ctx);
  }
});

test("unconsented, cross-origin, malformed and encoded requests never reach provider/quota", async () => {
  const cases = [
    [{ origin: null }, 403], [{ origin: "https://other.example.invalid" }, 403],
    [{ origin: `${HOST}/` }, 403], [{ origin: "null" }, 403],
    [{ "sec-fetch-site": "cross-site" }, 403], [{ "x-jagdlatein-photo-consent": null }, 400],
    [{ "x-jagdlatein-photo-consent": "other-version" }, 400], [{ "content-type": "application/json" }, 415],
    [{ "content-type": "image/png" }, 415], [{ "content-encoding": "gzip" }, 415],
    [{ "x-jagdlatein-photo-request-id": null }, 400], [{ "x-jagdlatein-photo-request-id": "../../private" }, 400],
  ];
  for (const [headers, status] of cases) {
    const ctx = harness();
    assert.equal((await result(await ctx.route.POST(ctx.request({ headers })))).status, status);
    zeroProvider(ctx);
  }
  const ctx = harness({ env: { NEXT_PUBLIC_SITE_URL: "https://canonical.example.invalid" } });
  assert.equal((await ctx.route.POST(ctx.request())).status, 403); zeroProvider(ctx);
});

test("disabled or unconfigured recognition makes no database/provider call", async () => {
  for (const env of [{ PHOTO_RECOGNITION_ENABLED: "false" }, { OPENAI_API_KEY: "" }, { SUPABASE_SERVICE_ROLE_KEY: "" }]) {
    const ctx = harness({ env });
    const get = await result(await ctx.route.GET(ctx.request({ method: "GET" })));
    assert.deepEqual(get.body, { configured: false, available: false, dailyLimit: 5 });
    assert.equal((await ctx.route.POST(ctx.request())).status, 503);
    zeroProvider(ctx); assert.equal(ctx.calls.database, 0);
  }
});

test("optional normalized single-account gate allows only the exact paid identity on GET and POST", async () => {
  const allowed = harness({ env: { PHOTO_RECOGNITION_TEST_ACCOUNT: "synthetic@example.invalid" } });
  const status = await result(await allowed.route.GET(allowed.request({ method: "GET" })));
  assert.deepEqual(status.body, { configured: true, available: true, dailyLimit: 5 });
  assert.equal((await allowed.route.POST(allowed.request())).status, 200);
  assert.equal(allowed.calls.provider.length, 1);
  assert.deepEqual(allowed.calls.rpc.map(call => call.name), ["photo_recognition_quota_status", "reserve_photo_recognition"]);
  for (const account of [{ email: "other@example.invalid" }, { email: "other@example.invalid", admin: true },
    { email: "Synthetic@example.invalid" }, { email: undefined }]) {
    const blocked = harness({ account, env: { PHOTO_RECOGNITION_TEST_ACCOUNT: "synthetic@example.invalid" } });
    let photoReads = 0;
    const request = blocked.request();
    Object.defineProperty(request, "body", { get() { photoReads++; throw new Error("private image body must not be read"); } });
    const get = await result(await blocked.route.GET(blocked.request({ method: "GET" })));
    assert.deepEqual(get.body, { configured: false, available: false, dailyLimit: 5 });
    const post = await result(await blocked.route.POST(request));
    assert.equal(post.status, 503); assert.equal(post.body.code, "photo_recognition_unavailable");
    assert.doesNotMatch(JSON.stringify(post.body), /synthetic@|other@|test.account|private image/i);
    assert.equal(photoReads, 0); assert.equal(blocked.calls.database, 0); zeroProvider(blocked);
  }
});

test("missing test gate preserves behaviour, while malformed or non-normalized settings fail closed identically", async () => {
  const ungated = harness();
  assert.equal((await ungated.route.POST(ungated.request())).status, 200);
  const disabled = harness({ env: { PHOTO_RECOGNITION_ENABLED: "false" } });
  const expected = await result(await disabled.route.POST(disabled.request()));
  for (const value of ["", " ", "Synthetic@example.invalid", " synthetic@example.invalid", "synthetic@example.invalid ",
    "not-an-email", "a@example.invalid,b@example.invalid", "a@example.invalid;b@example.invalid", "<synthetic@example.invalid>",
    "synthetic@example.invalid\n", "synthetic@example.invalid\0", null, 123]) {
    const blocked = harness({ env: { PHOTO_RECOGNITION_TEST_ACCOUNT: value } });
    assert.deepEqual(await result(await blocked.route.POST(blocked.request())), expected);
    const get = await result(await blocked.route.GET(blocked.request({ method: "GET" })));
    assert.deepEqual(get.body, { configured: false, available: false, dailyLimit: 5 }); zeroProvider(blocked);
  }
});

test("QA gate never replaces paid auth, feature flag, origin, consent or quota enforcement", async () => {
  const env = { PHOTO_RECOGNITION_TEST_ACCOUNT: "synthetic@example.invalid" };
  for (const authError of [401, 403]) {
    const ctx = harness({ env, authError });
    assert.equal((await ctx.route.GET(ctx.request({ method: "GET" }))).status, authError);
    assert.equal((await ctx.route.POST(ctx.request())).status, authError); zeroProvider(ctx);
  }
  const disabled = harness({ env: { ...env, PHOTO_RECOGNITION_ENABLED: "false" } });
  assert.equal((await disabled.route.POST(disabled.request())).status, 503); zeroProvider(disabled);
  for (const [headers, status] of [[{ origin: "https://other.example.invalid" }, 403], [{ "x-jagdlatein-photo-consent": null }, 400]]) {
    const ctx = harness({ env }); assert.equal((await ctx.route.POST(ctx.request({ headers }))).status, status); zeroProvider(ctx);
  }
  const limited = harness({ env, rpc: async () => ({ data: { schemaVersion: 1, allowed: false, reason: "account_limit", retryAfter: 20 }, error: null }) });
  assert.equal((await limited.route.POST(limited.request())).status, 429); assert.equal(limited.calls.provider.length, 0);
});

test("canonical www/apex aliases work only on the real first-party request origin", async () => {
  for (const [canonical, actual] of [["https://jagdlatein.de", "https://www.jagdlatein.de"], ["https://www.jagdlatein.de", "https://jagdlatein.de"]]) {
    const ctx = harness({ env: { NEXT_PUBLIC_SITE_URL: canonical } });
    assert.equal((await ctx.route.POST(ctx.request({ url: `${actual}/api/fotohelfer/recognize`, headers: { origin: actual } }))).status, 200);
    const crossed = harness({ env: { NEXT_PUBLIC_SITE_URL: canonical } });
    assert.equal((await crossed.route.POST(crossed.request({ url: `${actual}/api/fotohelfer/recognize`, headers: { origin: canonical } }))).status, 403);
    zeroProvider(crossed);
  }
  for (const actual of ["https://evil.jagdlatein.de", "https://www.jagdlatein.de.evil.invalid", "https://jagdlatein.de:444", "https://www.app.example.invalid"]) {
    const ctx = harness({ env: { NEXT_PUBLIC_SITE_URL: "https://jagdlatein.de" } });
    assert.equal((await ctx.route.POST(ctx.request({ url: `${actual}/api/fotohelfer/recognize`, headers: { origin: actual } }))).status, 403);
    zeroProvider(ctx);
  }
});

test("prepared JPEG bytes, resolution, metadata including after scan, and streaming bounds are enforced", async () => {
  const extraMetadata = jpeg(1200, 800, true, true);
  const cases = [new Uint8Array(), new TextEncoder().encode("https://external.invalid/image.jpg"),
    new TextEncoder().encode("<svg><script>private</script></svg>"), jpeg(1601, 800), jpeg(1200, 1601),
    jpeg(1200, 800, true), extraMetadata, jpeg().slice(0, -2), new Uint8Array(3 * 1024 * 1024 + 1)];
  for (const body of cases) {
    const ctx = harness();
    const response = await result(await ctx.route.POST(ctx.request({ body })));
    assert.ok([400, 413].includes(response.status), `${body.length} bytes rejected`); zeroProvider(ctx);
  }
  const ctx = harness();
  assert.equal((await ctx.route.POST(ctx.request({ headers: { "content-length": String(3 * 1024 * 1024 + 1) } }))).status, 413);
  assert.equal((await ctx.route.POST(ctx.request({ headers: { "content-length": "not-length" } }))).status, 413);
  assert.equal((await ctx.route.POST(ctx.request({ headers: { "content-length": "1" } }))).status, 400);
  zeroProvider(ctx);
  let canceled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(2 * 1024 * 1024)); controller.enqueue(new Uint8Array(2 * 1024 * 1024)); }, cancel() { canceled = true; } });
  assert.equal((await ctx.route.POST(ctx.request({ body: stream, duplex: true }))).status, 413);
  assert.equal(canceled, true); zeroProvider(ctx);
});

test("successful request reserves hard limits before exactly one provider call and passes bytes only", async () => {
  const ctx = harness();
  const response = await result(await ctx.route.POST(ctx.request()));
  assert.equal(response.status, 200); assert.equal(response.body.ok, true);
  assert.equal(ctx.calls.auth, 1); assert.equal(ctx.calls.provider.length, 1); assert.equal(ctx.calls.normalization, 1);
  assert.equal(ctx.calls.rpc[0].name, "reserve_photo_recognition");
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.calls.rpc[0].args)), { p_account_generation: GENERATION, p_request_id: REQUEST_ID,
    p_account_limit: 5, p_global_daily_limit: 50, p_global_monthly_limit: 100 });
  const provider = ctx.calls.provider[0];
  assert.deepEqual(Object.keys(provider), ["imageBytes", "signal"]);
  assert.equal(Buffer.compare(Buffer.from(provider.imageBytes), Buffer.from(jpeg())), 0);
});

test("stalled or cancelled request-body streams are bounded and cancel before any provider reservation", async () => {
  let canceled = 0;
  const stalled = new ReadableStream({ cancel() { canceled++; } });
  const ctx = harness({ shortReadTimeout: true });
  assert.equal((await ctx.route.POST(ctx.request({ body: stalled, duplex: true }))).status, 408);
  assert.equal(canceled, 1); zeroProvider(ctx);
  const controller = new AbortController();
  const another = harness();
  const body = new ReadableStream({ cancel() { canceled++; } });
  const pending = another.route.POST(another.request({ body, signal: controller.signal, duplex: true }));
  setTimeout(() => controller.abort(), 5);
  assert.equal((await pending).status, 408); assert.equal(canceled, 2); zeroProvider(another);
});

test("exact 3MiB/1600px boundary and clean canvas JPEG headers remain accepted", async () => {
  const clean = jpeg(1600, 1600);
  const limit = new Uint8Array(3 * 1024 * 1024);
  limit.set(clean.slice(0, -2)); limit.set([0xff, 0xd9], limit.length - 2);
  const jfif = [0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0];
  const ctx = harness();
  for (const body of [limit, new Uint8Array([0xff, 0xd8, ...jfif, ...clean.slice(2)])]) {
    assert.equal((await ctx.route.POST(ctx.request({ body }))).status, 200);
  }
  for (const metadataMarker of [0xe2, 0xe3, 0xec, 0xed, 0xef, 0xfe]) {
    const next = harness();
    const body = new Uint8Array([0xff, 0xd8, 0xff, metadataMarker, 0, 3, 0, ...clean.slice(2)]);
    assert.equal((await next.route.POST(next.request({ body }))).status, 400); zeroProvider(next);
  }
});

test("exact ICC_PROFILE chunks are removed without changing JPEG pixels or forwarding private profile text", async () => {
  const original = jpeg();
  const variants = [
    [0xff, 0xd8, ...iccChunk(1, 1), ...original.slice(2)],
    [0xff, 0xd8, ...iccChunk(1, 2, "private creator"), ...iccChunk(2, 2, "GPS coordinates in ICC text"), ...original.slice(2)],
    [...original.slice(0, -2), ...iccChunk(1, 1), ...original.slice(-2)],
    [0xff, 0xd8, ...iccChunk(1, 2), ...original.slice(2, -2), ...iccChunk(2, 2), ...original.slice(-2)],
  ];
  for (const variant of variants) {
    const ctx = harness();
    assert.equal((await ctx.route.POST(ctx.request({ body: new Uint8Array(variant) }))).status, 200);
    const transmitted = Buffer.from(ctx.calls.provider[0].imageBytes);
    assert.equal(Buffer.compare(transmitted, Buffer.from(original)), 0);
    assert.equal(transmitted.includes(Buffer.from("ICC_PROFILE")), false);
    assert.equal(transmitted.includes(Buffer.from("private")), false);
  }
});

test("malformed, incomplete, duplicate or out-of-order ICC sets never reach provider or quota", async () => {
  const original = jpeg();
  const invalid = [iccChunk(1, 2), iccChunk(2, 2), iccChunk(1, 0), iccChunk(2, 1),
    [...iccChunk(1, 2), ...iccChunk(1, 2)], [...iccChunk(1, 2), ...iccChunk(2, 3)],
    [...iccChunk(1, 1), ...iccChunk(1, 1)], iccChunk(1, 1, "")];
  const fakeSignature = iccChunk(1, 1); fakeSignature[4] = 88; invalid.push(fakeSignature);
  const truncated = iccChunk(1, 1); truncated[2] = 0x7f; invalid.push(truncated);
  for (const segment of invalid) {
    const ctx = harness();
    const body = new Uint8Array([0xff, 0xd8, ...segment, ...original.slice(2)]);
    assert.equal((await ctx.route.POST(ctx.request({ body }))).status, 400); zeroProvider(ctx);
  }
});

test("missing/malformed quota schema fails closed, no in-memory fallback and no provider call", async () => {
  for (const rpc of [async () => ({ data: null, error: { message: "private SQL" } }),
    async () => ({ data: { schemaVersion: 2, allowed: true }, error: null }),
    async () => { throw new Error("private connection details"); }]) {
    const ctx = harness({ rpc });
    assert.equal((await ctx.route.POST(ctx.request())).status, 503);
    assert.equal((await ctx.route.GET(ctx.request({ method: "GET" }))).status, 503);
    assert.equal(ctx.calls.provider.length, 0);
  }
  const noIdentity = harness({ account: { accountGeneration: null } });
  assert.equal((await noIdentity.route.POST(noIdentity.request())).status, 401); zeroProvider(noIdentity);
});

test("duplicate and exhausted distributed counters stop provider and use safe retry information", async () => {
  for (const [reason, status, code] of [["duplicate", 409, "photo_request_already_used"], ["account_limit", 429, "photo_daily_limit"],
    ["global_limit", 429, "photo_capacity_limit"], ["monthly_limit", 429, "photo_monthly_capacity_limit"], ["identity_missing", 401, "photo_session_required"]]) {
    const ctx = harness({ rpc: async () => ({ data: { schemaVersion: 1, allowed: false, reason, retryAfter: 3600 }, error: null }) });
    const response = await ctx.route.POST(ctx.request()); const parsed = await result(response);
    assert.equal(parsed.status, status); assert.equal(parsed.body.code, code); assert.equal(ctx.calls.provider.length, 0);
    if (["account_limit", "global_limit"].includes(reason)) assert.equal(response.headers.get("retry-after"), "3600");
  }
});

test("daily limits return the UTC reset only when bounded database timing agrees, without a provider call", async () => {
  const now = Date.parse("2026-10-23T12:00:00.000Z");
  for (const reason of ["account_limit", "global_limit"]) {
    for (const retryAfter of [43200, 43199]) {
      const ctx = harness({ now, rpc: async () => ({ data: { schemaVersion: 1, allowed: false, reason, retryAfter }, error: null }) });
      const response = await ctx.route.POST(ctx.request());
      const parsed = await result(response);
      assert.equal(parsed.status, 429);
      assert.equal(parsed.body.resetsAt, "2026-10-24T00:00:00.000Z");
      assert.equal(response.headers.get("retry-after"), String(retryAfter));
      assert.equal(ctx.calls.provider.length, 0);
      assert.equal(ctx.calls.rpc.length, 1);
    }
    for (const retryAfter of [undefined, null, "43200", 0, -1, 86401, 43200.5, 3600]) {
      const ctx = harness({ now, rpc: async () => ({ data: { schemaVersion: 1, allowed: false, reason, retryAfter }, error: null }) });
      const response = await ctx.route.POST(ctx.request());
      const parsed = await result(response);
      assert.equal(parsed.status, 429);
      assert.equal(Object.hasOwn(parsed.body, "resetsAt"), false);
      assert.equal(ctx.calls.provider.length, 0);
      if (retryAfter !== 3600) assert.equal(response.headers.get("retry-after"), null);
    }
  }
  const month = harness({ now, rpc: async () => ({ data: { schemaVersion: 1, allowed: false, reason: "monthly_limit", retryAfter: 43200 }, error: null }) });
  const monthlyResponse = await month.route.POST(month.request());
  const monthly = await result(monthlyResponse);
  assert.equal(monthly.body.code, "photo_monthly_capacity_limit");
  assert.equal(Object.hasOwn(monthly.body, "resetsAt"), false);
  assert.equal(monthlyResponse.headers.get("retry-after"), null);
  assert.equal(month.calls.provider.length, 0);
});

test("daily reset metadata handles UTC month/year boundaries and the European clock change", async () => {
  for (const [instant, retryAfter, reset] of [
    ["2026-10-24T23:59:59.500Z", 1, "2026-10-25T00:00:00.000Z"],
    ["2026-10-25T12:00:00.000Z", 43200, "2026-10-26T00:00:00.000Z"],
    ["2026-12-31T23:59:30.000Z", 30, "2027-01-01T00:00:00.000Z"],
  ]) {
    const ctx = harness({ now: Date.parse(instant), rpc: async () => ({ data: { schemaVersion: 1, allowed: false, reason: "account_limit", retryAfter }, error: null }) });
    const response = await result(await ctx.route.POST(ctx.request()));
    assert.equal(response.body.resetsAt, reset);
    assert.equal(ctx.calls.provider.length, 0);
  }
});

test("provider/normalization failures do not expose raw content or release a reservation", async () => {
  for (const [code, status] of [["photo_recognition_timeout", 504], ["photo_recognition_rate_limited", 503],
    ["photo_recognition_provider_capacity", 503], ["photo_recognition_provider_configuration", 503],
    ["photo_recognition_invalid_response", 502], ["unexpected_secret", 503], ["toString", 503], ["__proto__", 503]]) {
    const ctx = harness({ providerError: Object.assign(new Error("private photo prompt credential upstream content"), { code }) });
    const response = await result(await ctx.route.POST(ctx.request()));
    assert.equal(response.status, status); assert.equal(ctx.calls.rpc.length, 1);
    assert.doesNotMatch(JSON.stringify(response.body), /private photo|credential|upstream|unexpected_secret/);
  }
  for (const reason of ["invalid-response", "inconsistent-category"]) {
    const ctx = harness({ normalized: { reason } });
    assert.equal((await ctx.route.POST(ctx.request())).status, 502); assert.equal(ctx.calls.rpc.length, 1);
  }
  const controller = new AbortController(); controller.abort();
  const ctx = harness(); assert.equal((await ctx.route.POST(ctx.request({ signal: controller.signal }))).status, 400); zeroProvider(ctx);
});

let pg;
test.before(async () => {
  pg = new PGlite();
  await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE public.userprofile(account_generation uuid PRIMARY KEY);");
  await pg.exec(fs.readFileSync(migrationPath, "utf8"));
});
test.after(async () => { await pg?.close(); });
async function resetSql() {
  await pg.exec("TRUNCATE public.photo_recognition_requests,public.photo_recognition_months,public.userprofile;");
  await pg.query("INSERT INTO public.userprofile VALUES($1)", [GENERATION]);
}
async function reserve(generation = GENERATION, requestId = randomUUID()) {
  return (await pg.query("SELECT public.reserve_photo_recognition($1,$2,5,50,100) AS result", [generation, requestId])).rows[0].result;
}

test("real SQL enforces per-generation daily limits, dedup, deleted identity and service-only privileges", async () => {
  await resetSql();
  assert.equal((await reserve(GENERATION, REQUEST_ID)).allowed, true);
  assert.equal((await reserve(GENERATION, REQUEST_ID)).reason, "duplicate");
  for (let i = 1; i < 5; i++) assert.equal((await reserve()).allowed, true);
  assert.equal((await reserve()).reason, "account_limit");
  assert.equal(Number((await pg.query("SELECT count(*) AS count FROM public.photo_recognition_requests")).rows[0].count), 5);
  await pg.query("DELETE FROM public.userprofile WHERE account_generation=$1", [GENERATION]);
  assert.equal((await reserve()).reason, "identity_missing");
  for (const role of ["anon", "authenticated"]) {
    await pg.exec(`SET ROLE ${role};`);
    await assert.rejects(pg.query("SELECT public.photo_recognition_quota_status()"), /permission denied/);
    await assert.rejects(pg.query("SELECT public.reserve_photo_recognition($1,$2,5,50,100)", [GENERATION, randomUUID()]), /permission denied/);
    await assert.rejects(pg.query("SELECT * FROM public.photo_recognition_requests"), /permission denied/);
    await assert.rejects(pg.query("SELECT * FROM public.photo_recognition_months"), /permission denied/);
    await pg.exec("RESET ROLE;");
  }
  await pg.exec("SET ROLE service_role;");
  assert.equal((await pg.query("SELECT public.photo_recognition_quota_status() AS result")).rows[0].result.available, true);
  await assert.rejects(pg.query("SELECT * FROM public.photo_recognition_requests"), /permission denied/);
  await pg.exec("RESET ROLE;");
});

test("real SQL global daily ceiling is shared across accounts and UTC-independent session zones", async () => {
  await resetSql();
  for (let n = 0; n < 10; n++) {
    const generation = randomUUID(); await pg.query("INSERT INTO public.userprofile VALUES($1)", [generation]);
    for (let i = 0; i < 5; i++) assert.equal((await reserve(generation)).allowed, true);
  }
  assert.equal((await reserve()).reason, "global_limit");
  assert.equal((await pg.query("SELECT attempts FROM public.photo_recognition_months")).rows[0].attempts, 50);
  await pg.exec("SET TIME ZONE 'Pacific/Kiritimati';");
  assert.equal((await reserve()).reason, "global_limit");
  await pg.exec("SET TIME ZONE 'UTC';");
});

test("real SQL monthly aggregate survives 48-hour cleanup and prevents budget reset", async () => {
  await resetSql();
  await pg.query("INSERT INTO public.photo_recognition_requests VALUES($1,$2,clock_timestamp()-interval '49 hours')", [GENERATION, REQUEST_ID]);
  await pg.exec("INSERT INTO public.photo_recognition_months VALUES(date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date,100);");
  const status = (await pg.query("SELECT public.photo_recognition_quota_status() AS result")).rows[0].result;
  assert.equal(status.globalMonthlyLimit, 100);
  assert.equal(Number((await pg.query("SELECT count(*) AS count FROM public.photo_recognition_requests")).rows[0].count), 0);
  assert.equal((await reserve()).reason, "monthly_limit");
  assert.equal((await pg.query("SELECT attempts FROM public.photo_recognition_months")).rows[0].attempts, 100);
  await assert.rejects(pg.query("SELECT public.reserve_photo_recognition($1,$2,6,50,100)", [GENERATION, randomUUID()]), /JL_PHOTO_QUOTA_INVALID/);
  // Idempotent setup changes neither preserved counters nor feature activation.
  await pg.exec(fs.readFileSync(migrationPath, "utf8"));
  assert.equal((await reserve()).reason, "monthly_limit");
});
