// Native request/stream transport checks. No real account, database, mail,
// provider, private credential or network request is involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const EMAIL = 'native-reader@example.invalid';
const bytes = text => new TextEncoder().encode(text);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function fixture(options = {}) {
  const effects = { database: 0, request: 0, verify: 0, mailEligibility: 0, forbidden: 0 };
  const timers = new Set(), timerDurations = [], cache = new Map();
  const forbidden = () => { effects.forbidden++; throw Error('No live or registration-workflow dependency may run.'); };
  let facade;
  const context = vm.createContext({ process: { env: {} }, Buffer, Date, URL, TextDecoder: options.TextDecoder || TextDecoder,
    Uint8Array, Response, console,
    setTimeout(callback, delay) { timerDurations.push(delay); const timer = setTimeout(callback, delay); timers.add(timer); return timer; },
    clearTimeout(timer) { timers.delete(timer); clearTimeout(timer); } });
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const req = id => {
      if (id === '@supabase/supabase-js') return { createClient: forbidden };
      if (id === 'bcryptjs') return { hash: forbidden, compare: forbidden };
      if (id === './email') return { sendLoginCode: forbidden };
      if (id === './subscription-access') return { resolveSubscriptionAccess: forbidden };
      if (id.endsWith('/account-registration') && facade) return facade;
      if (id === './test-environment') return { isLoginMailRecipientAllowed: forbidden };
      if (id.endsWith('/test-environment')) return { isLoginMailRecipientAllowed() { effects.mailEligibility++; return true; } };
      if (id === 'next/server') return { NextResponse: { json: (value, init) => Response.json(value, init) } };
      if (id === 'crypto') return { ...require('node:crypto'), randomInt: forbidden };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      throw Error('Unreviewed module dependency: ' + id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, mod, mod.exports);
    return mod.exports;
  }
  const api = load('lib/account-registration.js');
  facade = { ...api, isAccountRegistrationEnabled: () => options.disabled !== true,
    async readRegistrationRequest(req, verifying) {
      const result = await api.readRegistrationRequest(req, verifying);
      options.afterReader?.(req, result);
      return result;
    },
    getRegistrationDatabase() { effects.database++; return {}; },
    async requestAccountRegistration(database, email) { effects.request++; assert.equal(email, EMAIL); return { success: true }; },
    async verifyAccountRegistration(database, email, code) { effects.verify++; assert.equal(email, EMAIL); assert.equal(code, '012345'); return Response.json({ success: true }); } };
  return { api, load, effects, timers, timerDurations,
    async post(verifying, req) { return load(`app/api/auth/register-${verifying ? 'verify' : 'request'}/route.js`).POST(req); } };
}

function nativeRequest(body = JSON.stringify({ email: EMAIL }), options = {}) {
  return new Request('https://jagdlatein.de/api/auth/register-request', { method: 'POST',
    headers: { origin: 'https://jagdlatein.de', 'content-type': 'application/json', ...options.headers },
    body, ...(options.signal ? { signal: options.signal } : {}), ...(body instanceof ReadableStream ? { duplex: 'half' } : {}) });
}
function watch(req, hooks = {}) {
  const observed = { acquired: 0, read: 0, cancel: 0, release: 0, added: 0, removed: 0 };
  const acquire = req.body.getReader.bind(req.body);
  req.body.getReader = () => {
    observed.acquired++;
    const reader = acquire(), read = reader.read.bind(reader), cancel = reader.cancel.bind(reader), release = reader.releaseLock.bind(reader);
    reader.read = () => { observed.read++; const result = read(); return hooks.read ? hooks.read(result, observed.read) : result; };
    reader.cancel = () => { observed.cancel++; return hooks.cancel ? hooks.cancel(cancel) : cancel(); };
    reader.releaseLock = () => { observed.release++; return release(); };
    hooks.acquired?.();
    return reader;
  };
  const add = req.signal.addEventListener.bind(req.signal), remove = req.signal.removeEventListener.bind(req.signal);
  req.signal.addEventListener = (...args) => { if (args[0] === 'abort') observed.added++; return add(...args); };
  req.signal.removeEventListener = (...args) => { if (args[0] === 'abort') observed.removed++; return remove(...args); };
  return observed;
}
function clean(ctx, req, observed) {
  assert.equal(ctx.timers.size, 0, 'No read timer survives.');
  assert.equal(ctx.effects.forbidden, 0);
  if (observed?.acquired) {
    assert.equal(observed.cancel, 1, 'Exactly the acquired reader receives one nonblocking cancel.');
    assert.equal(observed.release, 1);
    assert.equal(observed.added, observed.removed);
    assert.equal(req.body.locked, false);
  }
}
const rejectedStatus = (status, code) => error => error?.status === status && (!code || error.code === code);

test('Registration retains its exact2048-byte boundary and8000ms total deadline', () => {
  const ctx = fixture(); assert.equal(ctx.api.REGISTRATION_MAX_BODY_BYTES, 2048); assert.equal(ctx.api.REGISTRATION_READ_TIMEOUT_MS, 8000);
});

test('Native ordinary request and verify payloads preserve normalization and initial BOM', async () => {
  for (const [verifying, text] of [[false, JSON.stringify({ email: ` ${EMAIL.toUpperCase()} ` })], [true, JSON.stringify({ email: EMAIL, code: ' 012345 ' })]]) {
    const ctx = fixture(), req = nativeRequest(Buffer.concat([Buffer.from([239, 187, 191]), Buffer.from(text)])), observed = watch(req);
    const value = await ctx.api.readRegistrationRequest(req, verifying);
    assert.equal(value.email, EMAIL); assert.deepEqual(Object.keys(value).sort(), verifying ? ['code', 'email'] : ['email']); if (verifying) assert.equal(value.code, '012345');
    assert.deepEqual(ctx.timerDurations, [8000]); clean(ctx, req, observed);
  }
});

test('Strict UTF8 remains valid across split multibyte and BOM byte boundaries', async () => {
  const raw = Buffer.concat([Buffer.from([239, 187, 191]), Buffer.from(JSON.stringify({ email: 'Ä@example.invalid' }))]);
  const stream = new ReadableStream({ start(control) { for (const byte of raw) control.enqueue(Uint8Array.of(byte)); control.close(); } });
  const ctx = fixture(), req = nativeRequest(stream), observed = watch(req);
  assert.equal((await ctx.api.readRegistrationRequest(req)).email, 'ä@example.invalid'); clean(ctx, req, observed);
});

test('Exactly2048 native bytes are accepted while2049 actual bytes reject even with a false small header', async () => {
  const text = JSON.stringify({ email: EMAIL });
  for (const size of [2048, 2049]) {
    const ctx = fixture(), req = nativeRequest(text + ' '.repeat(size - Buffer.byteLength(text)), { headers: { 'content-length': '1' } }), observed = watch(req);
    if (size === 2048) assert.equal((await ctx.api.readRegistrationRequest(req)).email, EMAIL);
    else await assert.rejects(ctx.api.readRegistrationRequest(req), rejectedStatus(413, 'REGISTRATION_INVALID'));
    clean(ctx, req, observed);
  }
});

test('Header and exact schema failures retain their original statuses and do not start workflows', async () => {
  for (const [headers, text, status] of [
    [{ origin: 'https://foreign.invalid' }, '{}', 403], [{ origin: 'null' }, '{}', 403], [{ origin: 'https://jagdlatein.de/path' }, '{}', 403],
    [{ 'sec-fetch-site': 'cross-site' }, '{}', 403], [{ 'content-type': 'text/plain' }, '{}', 415],
    [{ 'content-length': '2049' }, '{}', 413], [{ 'content-length': '-1' }, '{}', 413], [{ 'content-length': 'invalid' }, '{}', 413],
    [{}, JSON.stringify({ email: EMAIL, admin: true }), 400], [{}, 'null', 400], [{}, '[]', 400], [{}, '{', 400],
  ]) {
    const ctx = fixture(), req = nativeRequest(text, { headers });
    const response = await ctx.post(false, req); assert.equal(response.status, status); assert.equal(ctx.effects.database, 0); assert.equal(ctx.effects.request, 0); assert.equal(ctx.effects.mailEligibility, 0); assert.equal(ctx.timers.size, 0);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('Malformed UTF8 and invalid verify code keep400 rather than silently replacing bytes', async () => {
  const malformed = Buffer.concat([Buffer.from('{"email":"'), Buffer.from([255]), Buffer.from('@example.invalid"}')]);
  for (const [verifying, body] of [[false, malformed], [false, Buffer.from([0xc3])], [true, JSON.stringify({ email: EMAIL, code: '12345' })], [true, JSON.stringify({ email: EMAIL, code: '012345', paid: true })]]) {
    const ctx = fixture(), req = nativeRequest(body), observed = watch(req);
    await assert.rejects(ctx.api.readRegistrationRequest(req, verifying), rejectedStatus(400, 'REGISTRATION_INVALID')); clean(ctx, req, observed);
  }
});

test('Pre-aborted native requests stop before acquiring any reader or timer', async () => {
  const controller = new AbortController(); controller.abort(); const ctx = fixture(), req = nativeRequest(undefined, { signal: controller.signal }), observed = watch(req);
  await assert.rejects(ctx.api.readRegistrationRequest(req), rejectedStatus(408, 'REGISTRATION_ABORTED'));
  assert.equal(observed.acquired, 0); assert.equal(observed.read, 0); assert.equal(ctx.timers.size, 0);
});

test('Acquisition-time abort cleans up the acquired native reader before any read', async () => {
  const controller = new AbortController(), ctx = fixture(), req = nativeRequest(undefined, { signal: controller.signal }), observed = watch(req, { acquired: () => controller.abort() });
  await assert.rejects(ctx.api.readRegistrationRequest(req), rejectedStatus(408)); assert.equal(observed.read, 0); clean(ctx, req, observed);
});

test('Abort settles a pending native read without waiting for a stalled cancel', async () => {
  let underlyingCancel = 0;
  const stream = new ReadableStream({ start(control) { control.enqueue(bytes(JSON.stringify({ email: EMAIL }))); }, cancel() { underlyingCancel++; return new Promise(() => {}); } });
  const controller = new AbortController(), ctx = fixture(), req = nativeRequest(stream, { signal: controller.signal }), observed = watch(req);
  const pending = ctx.api.readRegistrationRequest(req); await sleep(20); controller.abort();
  await assert.rejects(Promise.race([pending, sleep(300).then(() => { throw Error('Abort did not settle promptly.'); })]), rejectedStatus(408, 'REGISTRATION_ABORTED'));
  assert.equal(underlyingCancel, 1); clean(ctx, req, observed);
});

test('Abort after a resolved native chunk and after native EOF cannot adopt a payload', async () => {
  for (const abortAtEOF of [false, true]) {
    const controller = new AbortController(), ctx = fixture(), req = nativeRequest(undefined, { signal: controller.signal });
    const observed = watch(req, { read: promise => promise.then(part => { if (part.done === abortAtEOF) controller.abort(); return part; }) });
    await assert.rejects(ctx.api.readRegistrationRequest(req), rejectedStatus(408)); clean(ctx, req, observed);
  }
});

test('An abort during decoding is checked before schema/workflow adoption', async () => {
  const controller = new AbortController();
  class AbortingDecoder extends TextDecoder { decode(...args) { const text = super.decode(...args); controller.abort(); return text; } }
  const ctx = fixture({ TextDecoder: AbortingDecoder }), req = nativeRequest(undefined, { signal: controller.signal }), observed = watch(req);
  await assert.rejects(ctx.api.readRegistrationRequest(req), rejectedStatus(408)); clean(ctx, req, observed);
});

test('Oversize native body rejects413 without awaiting a hanging cancel', async () => {
  const stream = new ReadableStream({ start(control) { control.enqueue(new Uint8Array(2049)); }, cancel() { return new Promise(() => {}); } });
  const ctx = fixture(), req = nativeRequest(stream), observed = watch(req);
  await assert.rejects(Promise.race([ctx.api.readRegistrationRequest(req), sleep(300).then(() => { throw Error('Oversize waited on cancel.'); })]), rejectedStatus(413)); clean(ctx, req, observed);
});

test('A genuine8000ms total deadline bounds an incomplete native request and stalled cancel', { timeout: 11000 }, async () => {
  const stream = new ReadableStream({ start(control) { control.enqueue(bytes(JSON.stringify({ email: EMAIL }))); }, cancel() { return new Promise(() => {}); } });
  const ctx = fixture(), req = nativeRequest(stream), observed = watch(req), began = Date.now();
  await assert.rejects(ctx.api.readRegistrationRequest(req), rejectedStatus(408, 'REGISTRATION_TIMEOUT'));
  const elapsed = Date.now() - began; assert.ok(elapsed >= 7900 && elapsed < 10500, `Real deadline elapsed${elapsed}ms`); clean(ctx, req, observed);
});

test('Transport rejection objects cannot supply registration statuses or private messages', async () => {
  for (const rejection of [null, undefined, 'private-transport', { status: 401, message: 'private-transport' }, new Error('private-transport')]) {
    const ctx = fixture(), stream = new ReadableStream({ start(control) { control.error(rejection); } }), req = nativeRequest(stream), observed = watch(req);
    await assert.rejects(ctx.api.readRegistrationRequest(req), error => error.status === 503 && error.code === 'REGISTRATION_UNAVAILABLE' && !error.message.includes('private-transport')); clean(ctx, req, observed);
  }
});

test('Even a transport-supplied registration error is not one of this read invocation\'s owned errors', async () => {
  const ctx = fixture(), transport = new ctx.api.AccountRegistrationError('SYNTHETIC_PRIVATE', 401, 'private-transport');
  const req = nativeRequest(new ReadableStream({ start(control) { control.error(transport); } })), observed = watch(req);
  await assert.rejects(ctx.api.readRegistrationRequest(req), rejectedStatus(503, 'REGISTRATION_UNAVAILABLE')); clean(ctx, req, observed);
});

test('Reader acquisition failures and locked native streams keep normalized503', async () => {
  for (const locked of [false, true]) {
    const ctx = fixture(), req = nativeRequest(); let held;
    if (locked) held = req.body.getReader(); else req.body.getReader = () => { throw Object.assign(new Error('private-acquisition'), { status: 403 }); };
    await assert.rejects(ctx.api.readRegistrationRequest(req), error => error.status === 503 && !error.message.includes('private-acquisition')); held?.releaseLock(); assert.equal(ctx.timers.size, 0);
  }
});

test('Rejected or throwing cleanup does not replace a valid native result', async () => {
  for (const throwing of [false, true]) {
    const ctx = fixture(), req = nativeRequest(), observed = watch(req, { cancel: cancel => { cancel(); if (throwing) throw Error('private-cancel'); return Promise.reject(Error('private-cancel')); } });
    assert.equal((await ctx.api.readRegistrationRequest(req)).email, EMAIL); clean(ctx, req, observed); await Promise.resolve();
  }
});

test('Completed reads remove their abort listener and remain settled after a later native abort', async () => {
  const ctx = fixture(), controller = new AbortController(), req = nativeRequest(undefined, { signal: controller.signal }), observed = watch(req);
  assert.equal((await ctx.api.readRegistrationRequest(req)).email, EMAIL); clean(ctx, req, observed); controller.abort(); await Promise.resolve(); assert.equal(ctx.timers.size, 0); assert.equal(observed.cancel, 1);
});

test('Both register routes check a fresh post-await abort before database, allowlist, mail or verification', async () => {
  for (const verifying of [false, true]) {
    const controller = new AbortController(), ctx = fixture({ afterReader: () => controller.abort() }), req = nativeRequest(JSON.stringify({ email: EMAIL, ...(verifying ? { code: '012345' } : {}) }), { signal: controller.signal });
    const response = await ctx.post(verifying, req); assert.equal(response.status, 408); const body = await response.json(); assert.equal(body.code, 'REGISTRATION_ABORTED');
    assert.deepEqual(ctx.effects, { database: 0, request: 0, verify: 0, mailEligibility: 0, forbidden: 0 }); assert.equal(ctx.timers.size, 0);
  }
});

test('Feature-disabled routes still reject before origin checks, body acquisition or any workflow', async () => {
  for (const verifying of [false, true]) {
    const ctx = fixture({ disabled: true }), req = { get body() { throw Error('Do not acquire.'); }, get headers() { throw Error('Do not inspect origin.'); } };
    const response = await ctx.post(verifying, req); assert.equal(response.status, 503); assert.deepEqual(ctx.effects, { database: 0, request: 0, verify: 0, mailEligibility: 0, forbidden: 0 });
  }
});

test('Valid native route requests reach only the existing request or verify workflow exactly once', async () => {
  for (const verifying of [false, true]) {
    const ctx = fixture(), req = nativeRequest(JSON.stringify({ email: EMAIL, ...(verifying ? { code: '012345' } : {}) }));
    const response = await ctx.post(verifying, req); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { success: true });
    assert.deepEqual(ctx.effects, { database: 1, request: verifying ? 0 : 1, verify: verifying ? 1 : 0, mailEligibility: verifying ? 0 : 1, forbidden: 0 }); assert.equal(ctx.timers.size, 0);
  }
});
