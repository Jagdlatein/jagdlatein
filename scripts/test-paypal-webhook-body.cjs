const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const body = createLoader()('lib/paypal-webhook-body.js');
const LIMIT = 1024 * 1024, DEADLINE = 8000;
const encode = value => new TextEncoder().encode(value);
const eventText = JSON.stringify({ event_type: 'BILLING.SUBSCRIPTION.ACTIVATED', resource: { id: 'I-ISOLATED123' } });
const flush = async () => { for (let i = 0; i < 32; i++) await Promise.resolve(); };
function request(input = eventText, { declared, waiting = false, cancelMode = 'normal', chunkSize = 16384, readError = false, signal } = {}) {
  const bytes = typeof input === 'string' ? encode(input) : input;
  const stats = { yielded: 0, cancelled: 0, cancelCalls: 0, acquired: 0, released: 0, pulls: 0 }; let controller;
  const stream = new ReadableStream({
    start(value) { controller = value; },
    pull(value) {
      stats.pulls++;
      if (waiting) return;
      if (readError) { value.error(new Error('PRIVATE_TRANSPORT_FIXTURE')); return; }
      if (stats.yielded === bytes.length) { value.close(); return; }
      const part = bytes.slice(stats.yielded, stats.yielded + chunkSize); stats.yielded += part.byteLength; value.enqueue(part);
    },
    cancel() { stats.cancelled++; if (cancelMode === 'pending') return new Promise(() => {}); if (cancelMode === 'reject') return Promise.reject(new Error('PRIVATE_CANCEL_FIXTURE')); },
  }, { highWaterMark: 0 });
  const req = new Request('https://jagdlatein.test/api/paypal/webhook', { method: 'POST',
    headers: declared === undefined ? {} : { 'content-length': String(declared) }, body: stream, duplex: 'half', signal });
  const getReader = req.body.getReader.bind(req.body);
  req.body.getReader = (...args) => {
    stats.acquired++; const reader = getReader(...args), release = reader.releaseLock.bind(reader), cancel = reader.cancel.bind(reader);
    reader.releaseLock = () => { stats.released++; return release(); };
    reader.cancel = (...values) => { stats.cancelCalls++; return cancel(...values); }; return reader;
  };
  return { req, stats, controller, finish() { if (!stats.cancelled) controller.close(); } };
}
function observe(promise) { const state = { phase: 'pending' }; state.done = promise.then(value => { state.phase = 'fulfilled'; state.value = value; }, error => { state.phase = 'rejected'; state.error = error; }); return state; }
const status = (promise, expected) => assert.rejects(promise, error => error instanceof body.PayPalWebhookBodyError && error.status === expected);
function endpoint() {
  const calls = { verify: 0, apply: 0, access: 0, raw: null }; let verified = true;
  const route = createLoader({ './_base': { verifyPaypalWebhook: async (_request, raw) => { calls.verify++; calls.raw = raw; return verified ? JSON.parse(raw) : null; } },
    '../../../../lib/subscription-access': { applyVerifiedPaypalEvent: async () => { calls.apply++; return { status: 'ACTIVE' }; }, accessFromSubscriptions: () => { calls.access++; return { paid: true }; } },
  })('app/api/paypal/webhook/route.js');
  return { route, calls, invalidSignature() { verified = false; } };
}

test('The webhook accepts small and exact1MiB bodies, including split UTF8/BOM decoding identical to native Request.text', async () => {
  assert.equal(body.PAYPAL_WEBHOOK_MAX_BYTES, LIMIT); assert.equal(body.PAYPAL_WEBHOOK_READ_TIMEOUT_MS, DEADLINE);
  const unicode = JSON.stringify({ padding: '漢'.repeat(Math.floor((LIMIT - 20) / 3)) });
  const exactUnicode = ' '.repeat(LIMIT - encode(unicode).byteLength) + unicode;
  for (const [input, chunkSize] of [[eventText, 16384], [' '.repeat(LIMIT - encode(eventText).byteLength) + eventText, 16384], [exactUnicode, 4096], ['\ufeff' + eventText, 1]]) {
    const h = request(input, { chunkSize }), expected = await new Request('https://example.invalid', { method: 'POST', body: input }).text();
    assert.equal(await body.readPayPalWebhookBody(h.req), expected); assert.equal(h.stats.released, 1); assert.equal(h.req.body.locked, false); assert.equal(h.stats.cancelled, 0);
  }
});

test('Declared invalid/oversize lengths fail before acquiring transport; actual bytes override false-small or absent lengths', async () => {
  for (const declared of [LIMIT + 1, '-1', '', '1e3', 'not-a-number', '9'.repeat(30)]) {
    const h = request(eventText, { declared }); await status(body.readPayPalWebhookBody(h.req), 413); assert.equal(h.stats.acquired, 0); assert.equal(h.req.bodyUsed, false);
  }
  for (const declared of [undefined, 1]) {
    const h = request(' '.repeat(LIMIT + 65536), { declared }); await status(body.readPayPalWebhookBody(h.req), 413);
    assert.ok(h.stats.yielded < LIMIT + 65536); assert.equal(h.stats.cancelCalls, 1); assert.equal(h.stats.cancelled, 1); assert.equal(h.req.body.locked, false);
  }
});

test('A multibyte body above1MiB is rejected before verification even when its character count fits', async () => {
  const raw = JSON.stringify({ event_type: 'ISOLATED.IGNORED', padding: 'ä'.repeat(600000) });
  assert.ok(raw.length < LIMIT); assert.ok(encode(raw).byteLength > LIMIT);
  const h = request(raw), api = endpoint(), response = await api.route.POST(h.req);
  assert.equal(response.status, 413); assert.deepEqual(await response.json(), { error: 'payload too large' }); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(api.calls, { verify: 0, apply: 0, access: 0, raw: null }); assert.equal(h.stats.cancelled, 1);
});

for (const cancelMode of ['normal', 'pending', 'reject']) test(`A stalled body returns408 at8s without awaiting ${cancelMode} cancellation`, async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = request('', { waiting: true, cancelMode }), api = endpoint(), state = observe(api.route.POST(h.req));
  try {
    await flush(); t.mock.timers.tick(DEADLINE - 1); await flush(); assert.equal(state.phase, 'pending');
    t.mock.timers.tick(1); await flush(); assert.equal(state.phase, 'fulfilled'); assert.equal(state.value.status, 408); assert.deepEqual(await state.value.json(), { error: 'request timeout' });
    assert.equal(h.stats.cancelCalls, 1); assert.equal(h.stats.cancelled, 1); assert.equal(h.stats.released, 1); assert.equal(h.req.body.locked, false); assert.equal(api.calls.verify, 0); assert.equal(api.calls.apply, 0);
  } finally { if (state.phase === 'pending' && !h.stats.cancelled) { h.finish(); await state.done; } t.mock.timers.reset(); }
});

test('The deadline covers the whole transport and is not extended by arriving chunks', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); const h = request('', { waiting: true }), state = observe(body.readPayPalWebhookBody(h.req));
  try {
    await flush(); t.mock.timers.tick(4000); h.controller.enqueue(encode(' ')); await flush(); t.mock.timers.tick(3999); h.controller.enqueue(encode(' ')); await flush(); assert.equal(state.phase, 'pending');
    t.mock.timers.tick(1); await flush(); assert.equal(state.phase, 'rejected'); assert.equal(state.error.status, 408); assert.equal(h.stats.cancelled, 1); assert.equal(h.req.body.locked, false);
  } finally { if (state.phase === 'pending' && !h.stats.cancelled) { h.finish(); await state.done; } t.mock.timers.reset(); }
});

test('Aborted requests stop before acquisition or interrupt an owned pending read without verification', async () => {
  const already = new AbortController(); already.abort(); const early = request(eventText, { signal: already.signal }); await status(body.readPayPalWebhookBody(early.req), 408); assert.equal(early.stats.acquired, 0);
  const controller = new AbortController(), h = request('', { waiting: true, cancelMode: 'pending', signal: controller.signal }), api = endpoint(), state = observe(api.route.POST(h.req));
  await flush(); controller.abort(); await flush(); assert.equal(state.phase, 'fulfilled'); assert.equal(state.value.status, 408); assert.equal(h.stats.cancelled, 1); assert.equal(h.req.body.locked, false); assert.equal(api.calls.verify, 0);
});

test('Transport failures and missing/foreign reader ownership become bounded400 errors without private details or text fallback', async () => {
  const h = request('', { readError: true }), api = endpoint(), failed = await api.route.POST(h.req);
  assert.equal(failed.status, 400); assert.doesNotMatch(await failed.text(), /PRIVATE_/); assert.equal(api.calls.verify, 0); assert.equal(h.req.body.locked, false);
  let textCalls = 0; const missing = await api.route.POST({ headers: new Headers(), text: async () => { textCalls++; return eventText; } }); assert.equal(missing.status, 400); assert.equal(textCalls, 0);
  const locked = request(), foreign = locked.req.body.getReader();
  try { await status(body.readPayPalWebhookBody(locked.req), 400); assert.equal(locked.req.body.locked, true); assert.equal(locked.stats.released, 0); }
  finally { await foreign.cancel(); foreign.releaseLock(); }
});

test('Reader cancellation rejection/pending promises cannot hold413 open or change the controlled response', async () => {
  for (const cancelMode of ['pending', 'reject']) {
    const h = request(' '.repeat(LIMIT + 65536), { cancelMode }), state = observe(body.readPayPalWebhookBody(h.req)); await flush();
    // A megabyte takes multiple stream turns; await the bounded result rather than wall time.
    await state.done; assert.equal(state.phase, 'rejected'); assert.equal(state.error.status, 413); assert.equal(h.stats.cancelCalls, 1); assert.equal(h.req.body.locked, false);
  }
});

test('Successful/failed reads clear deadlines and never later cancel a completed request', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try { const good = request(); await body.readPayPalWebhookBody(good.req); const broken = request('', { readError: true }); await status(body.readPayPalWebhookBody(broken.req), 400); t.mock.timers.tick(DEADLINE * 2); await flush(); assert.equal(good.stats.cancelled, 0); assert.equal(good.req.body.locked, false); assert.equal(broken.req.body.locked, false); }
  finally { t.mock.timers.reset(); }
});

test('Valid raw event/signature/event-selection/access responses preserve the existing webhook workflow', async () => {
  const raw = '  ' + eventText + '\n', api = endpoint(), good = await api.route.POST(request(raw).req);
  assert.equal(good.status, 200); assert.deepEqual(await good.json(), { ok: true, premium: true }); assert.deepEqual(api.calls, { verify: 1, apply: 1, access: 1, raw });
  const unsigned = endpoint(); unsigned.invalidSignature(); const denied = await unsigned.route.POST(request().req); assert.equal(denied.status, 401); assert.equal(unsigned.calls.apply, 0);
  const ignored = endpoint(), response = await ignored.route.POST(request(JSON.stringify({ event_type: 'CHECKOUT.ORDER.APPROVED' })).req); assert.deepEqual(await response.json(), { ignored: true }); assert.equal(ignored.calls.apply, 0);
  for (const raw of ['{', 'null', '[]', '1']) { const malformed = endpoint(), response = await malformed.route.POST(request(raw).req); assert.equal(response.status, 400); assert.equal(malformed.calls.verify, 0); }
});
