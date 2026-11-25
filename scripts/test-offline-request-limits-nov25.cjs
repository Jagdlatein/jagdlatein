const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { createLoader, root } = require('./helpers/project-module.cjs');

// Local native Request/ReadableStream only. Paid-access and pack creation are
// isolated doubles; the separate historical suite validates real offline packs.
const ORIGIN = 'https://isolated.invalid', ENDPOINT = ORIGIN + '/api/lernen/offline';
const MAX_UNITS = 3000, MAX_BYTES = 9003, DEADLINE = 8000;
const encode = text => new TextEncoder().encode(text);
const payload = JSON.stringify({ courseIds: ['wissen-rotwild-sozialverhalten'], sounds: false });
const flush = async () => { for (let index = 0; index < 40; index++) await Promise.resolve(); };
function api({ authStatus, beforeAuthReturns, packError } = {}) {
  const calls = { auth: 0, packs: [] };
  const access = { isolated: true, paid: true, admin: false };
  const load = createLoader({
    '../../../../lib/account-access': { async requirePaidAccount() {
      calls.auth++;
      if (authStatus) throw Object.assign(new Error([401, 403].includes(authStatus) ? 'Isolierter gültiger Zugangshinweis.' : 'SYNTHETIC_PRIVATE_AUTH'), { status: authStatus });
      beforeAuthReturns?.(); return access;
    } },
    '../../../../lib/offline-learning-server': {
      offlineAccountKey() { return 'isolated-existing-account-key'; },
      createOfflinePack(body, receivedAccess) {
        assert.equal(receivedAccess, access); calls.packs.push(body);
        if (packError) throw Object.assign(new Error([400, 403].includes(packError) ? 'Isolierter gültiger Packhinweis.' : 'SYNTHETIC_PRIVATE_PACK'), { status: packError });
        return { isolated: true, request: body };
      },
    },
  });
  return { ...load('app/api/lernen/offline/route.js'), calls };
}
function input(body = payload, options = {}) {
  const { declared, headers = {}, chunkSize = MAX_BYTES, waiting = false, keepOpen = false,
    cancelMode = 'normal', readError = false, abortOnEof = false, abortOnRelease = false,
    abortOnSubscribe = false, delayedRead = false, nonBytes = false } = options;
  const bytes = typeof body === 'string' ? encode(body) : body;
  const stats = { acquired: 0, reads: 0, cancelled: 0, cancelCalls: 0, released: 0, added: 0, removed: 0, closed: false };
  const abort = new AbortController(); let offset = 0, controller, settleRead;
  const stream = new ReadableStream({
    start(value) { controller = value; },
    pull(value) {
      if (waiting) return;
      if (readError) { stats.closed = true; value.error(readError === 'null' ? null : readError === 'undefined' ? undefined : readError === 'status-shaped' ? { status: 400, message: 'SYNTHETIC_PRIVATE_TRANSPORT' } : new Error('SYNTHETIC_PRIVATE_TRANSPORT')); return; }
      if (nonBytes) { value.enqueue('SYNTHETIC_PRIVATE_NONBYTE'); return; }
      if (offset >= bytes.length) { if (!keepOpen) { stats.closed = true; value.close(); } return; }
      const chunk = bytes.slice(offset, offset + chunkSize); offset += chunk.length; value.enqueue(chunk);
    },
    cancel() {
      stats.cancelled++;
      if (cancelMode === 'pending') return new Promise(() => {});
      if (cancelMode === 'reject') return Promise.reject(new Error('SYNTHETIC_PRIVATE_CANCEL'));
    },
  }, { highWaterMark: 0 });
  const req = new Request(ENDPOINT, { method: 'POST', body: stream, duplex: 'half', signal: abort.signal,
    headers: { origin: ORIGIN, 'content-type': 'application/json', ...(declared === undefined ? {} : { 'content-length': String(declared) }), ...headers } });
  const add = req.signal.addEventListener.bind(req.signal), remove = req.signal.removeEventListener.bind(req.signal);
  req.signal.addEventListener = (...args) => { stats.added++; const result = add(...args); if (abortOnSubscribe) abort.abort(); return result; };
  req.signal.removeEventListener = (...args) => { stats.removed++; return remove(...args); };
  const getReader = req.body.getReader.bind(req.body);
  req.body.getReader = (...args) => {
    stats.acquired++; const reader = getReader(...args);
    const read = reader.read.bind(reader), cancel = reader.cancel.bind(reader), release = reader.releaseLock.bind(reader);
    reader.read = () => {
      stats.reads++;
      const result = read().then(value => { if (value.done && abortOnEof) abort.abort(); return value; });
      if (delayedRead && stats.reads === 1) return new Promise((resolve, reject) => { settleRead = () => result.then(resolve, reject); });
      return result;
    };
    reader.cancel = (...args) => { stats.cancelCalls++; return cancel(...args); };
    reader.releaseLock = () => { stats.released++; const value = release(); if (abortOnRelease) abort.abort(); return value; };
    return reader;
  };
  return { req, stats, bytes, abort, enqueue: value => controller.enqueue(typeof value === 'string' ? encode(value) : value),
    settleRead: () => settleRead?.(), finish() {
      if (stats.closed || stats.cancelled) return;
      stats.closed = true; controller.close();
    } };
}
function observe(promise) {
  const result = { settled: false, response: null, error: null };
  result.done = promise.then(value => { result.settled = true; result.response = value; }, error => { result.settled = true; result.error = error; });
  return result;
}
function privateResponse(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
}
function clean(h) {
  assert.equal(h.stats.acquired, 1); assert.equal(h.stats.cancelCalls, 1); assert.equal(h.stats.released, 1);
  assert.equal(h.stats.added, h.stats.removed); assert.equal(h.req.body.locked, false);
}
async function status(api, h, expected) {
  const response = await api.POST(h.req); assert.equal(response.status, expected); privateResponse(response);
  assert.doesNotMatch(await response.text(), /SYNTHETIC_PRIVATE/); return response;
}

test('Origin and media type still reject before paid auth or any body read', async () => {
  const h = api();
  for (const [headers, expected] of [[{ origin: 'https://foreign.invalid' }, 403], [{ origin: '' }, 403], [{ 'content-type': 'text/plain' }, 415]]) {
    const sent = input(payload, { headers }); await status(h, sent, expected);
    assert.equal(sent.stats.acquired, 0); assert.equal(sent.req.bodyUsed, false); sent.finish();
  }
  assert.equal(h.calls.auth, 0); assert.equal(h.calls.packs.length, 0);
});

test('Paid auth remains before declared length and aborted-body outcomes', async () => {
  for (const authStatus of [401, 403, 503]) {
    const h = api({ authStatus }), sent = input(payload, { declared: MAX_BYTES + 1 }); sent.abort.abort();
    await status(h, sent, authStatus); assert.equal(h.calls.auth, 1); assert.equal(h.calls.packs.length, 0);
    assert.equal(sent.stats.acquired, 0); assert.equal(sent.req.bodyUsed, false); sent.finish();
  }
});

test('Oversized or malformed declared lengths reject after paid auth and before acquisition', async () => {
  for (const declared of [MAX_BYTES + 1, '-1', '', '1e3', 'private', '99999999999999999999999']) {
    const h = api(), sent = input(payload, { declared }); await status(h, sent, 413);
    assert.equal(h.calls.auth, 1); assert.equal(h.calls.packs.length, 0); assert.equal(sent.stats.acquired, 0);
    assert.equal(sent.req.bodyUsed, false); sent.finish();
  }
});

test('Existing 3000-unit ASCII inputs and JSON whitespace retain the exact pack request', async t => {
  const network = t.mock.method(globalThis, 'fetch', () => assert.fail('No network allowed'));
  const escapedKnownId = payload.replace('wissen-', '\\u0077issen-');
  for (const body of [payload, ' '.repeat(MAX_UNITS - payload.length) + payload, ' '.repeat(MAX_UNITS - escapedKnownId.length) + escapedKnownId]) {
    const h = api(), sent = input(body, { declared: encode(body).length });
    const response = await h.POST(sent.req); assert.equal(response.status, 200); privateResponse(response); clean(sent);
    assert.deepEqual(h.calls.packs, [JSON.parse(body)]); assert.equal(sent.stats.cancelled, 0);
  }
  assert.equal(network.mock.callCount(), 0);
});

test('3000 UTF16 units with multibyte, split surrogate codepoint and leading BOM match native Request.text', async () => {
  // Unicode fake IDs exercise reader decoding only; real course selection stays
  // validated by the unchanged createOfflinePack in the historical pack suite.
  const base = JSON.stringify({ courseIds: ['漢'.repeat(2000) + '🦌é'], sounds: false });
  const boundary = base + ' '.repeat(MAX_UNITS - base.length);
  for (const body of [boundary, '\uFEFF' + boundary]) {
    const native = await new Request(ENDPOINT, { method: 'POST', body }).text();
    assert.equal(native.length, MAX_UNITS); assert.ok(encode(body).length > MAX_UNITS);
    const h = api(), sent = input(body, { chunkSize: 1, declared: encode(body).length });
    await status(h, sent, 200); clean(sent); assert.deepEqual(h.calls.packs, [JSON.parse(native)]);
  }
});

test('Malformed UTF8 replacement and terminal decoder flush preserve native text decoding semantics', async () => {
  const before = encode('{"courseIds":["'), after = encode('"],"sounds":false}');
  const bytes = new Uint8Array([...before, 0xc3, 0x28, ...after]);
  const native = await new Request(ENDPOINT, { method: 'POST', body: bytes }).text();
  const h = api(), sent = input(bytes, { chunkSize: 1 }); await status(h, sent, 200); clean(sent);
  assert.deepEqual(h.calls.packs, [JSON.parse(native)]); assert.equal(h.calls.packs[0].courseIds[0], '\uFFFD(');
  const truncated = input(new Uint8Array([0xe2, 0x82]), { chunkSize: 1 }), malformed = api();
  await status(malformed, truncated, 400); clean(truncated); assert.equal(malformed.calls.packs.length, 0);
});

test('3001 decoded units reject and cancel without waiting for body EOF', async () => {
  for (const declared of [undefined, 1]) {
    const h = api(), sent = input(payload + ' '.repeat(MAX_UNITS + 1 - payload.length), { declared, keepOpen: true });
    const pending = observe(h.POST(sent.req)); await flush();
    try {
      assert.equal(pending.settled, true); assert.equal(pending.response.status, 413); privateResponse(pending.response);
      assert.equal(h.calls.packs.length, 0); assert.equal(sent.stats.cancelled, 1); clean(sent);
    } finally { if (!pending.settled) { sent.finish(); await pending.done; } }
  }
});

test('The conservative transport ceiling is 9003 bytes, with the original decoded-unit limit still binding', async () => {
  const dense = '\uFEFF' + '漢'.repeat(MAX_UNITS);
  assert.equal(encode(dense).length, MAX_BYTES);
  assert.equal((await new Request(ENDPOINT, { method: 'POST', body: dense }).text()).length, MAX_UNITS);
  const boundary = api(), acceptedByReader = input(dense, { declared: MAX_BYTES, chunkSize: 1 });
  await status(boundary, acceptedByReader, 400); clean(acceptedByReader); // Native decoded text is not valid JSON.
  const h = api(), overflow = input(encode(dense + ' '), { keepOpen: true });
  const pending = observe(h.POST(overflow.req)); await flush();
  try {
    assert.equal(pending.settled, true); assert.equal(pending.response.status, 413); clean(overflow);
    assert.equal(h.calls.packs.length, 0); assert.equal(overflow.stats.cancelled, 1);
  } finally { if (!pending.settled) { overflow.finish(); await pending.done; } }
});

test('Empty and malformed JSON stay private 400 and pack validation retains its existing 400/403/503 mapping', async () => {
  for (const body of ['', '{']) { const h = api(), sent = input(body); await status(h, sent, 400); clean(sent); assert.equal(h.calls.packs.length, 0); }
  for (const packError of [400, 403, 503]) {
    const h = api({ packError }), sent = input(); await status(h, sent, packError); clean(sent);
    assert.equal(h.calls.packs.length, 1);
  }
});

test('Transport Error/null/undefined rejections and non-byte chunks keep the generic 503 without message leaks', async () => {
  for (const options of [{ readError: true }, { readError: 'null' }, { readError: 'undefined' }, { readError: 'status-shaped' }, { nonBytes: true }]) {
    const h = api(), sent = input('', options); await status(h, sent, 503); clean(sent); assert.equal(h.calls.packs.length, 0);
  }
});

test('A reader owned by another consumer stays locked and is neither cancelled nor released', async () => {
  const h = api(), sent = input(), reader = sent.req.body.getReader();
  try {
    await status(h, sent, 503); assert.equal(sent.req.body.locked, true); assert.equal(sent.stats.released, 0);
    assert.equal(sent.stats.cancelCalls, 0); assert.equal(h.calls.packs.length, 0);
  } finally { await reader.cancel(); reader.releaseLock(); }
});

test('Bodyless requests keep malformed JSON400 and honour abort without any fallback reader', async () => {
  for (const aborted of [false, true]) {
    const h = api(), abort = new AbortController(), req = new Request(ENDPOINT, { method: 'POST', signal: abort.signal,
      headers: { origin: ORIGIN, 'content-type': 'application/json' } });
    let textCalls = 0, jsonCalls = 0; req.text = async () => { textCalls++; return ''; }; req.json = async () => { jsonCalls++; return {}; };
    if (aborted) abort.abort();
    const response = await h.POST(req); assert.equal(response.status, aborted ? 408 : 400); privateResponse(response);
    assert.equal(textCalls, 0); assert.equal(jsonCalls, 0); assert.equal(h.calls.packs.length, 0); assert.equal(h.calls.auth, 1);
  }
});

test('Already aborted and auth-completion aborted requests never acquire or build a pack', async () => {
  const pre = input(); pre.abort.abort(); const h = api(); await status(h, pre, 408);
  assert.equal(pre.stats.acquired, 0); assert.equal(h.calls.packs.length, 0); pre.finish();
  const later = input(), a = api({ beforeAuthReturns() { later.abort.abort(); } }); await status(a, later, 408);
  assert.equal(later.stats.acquired, 0); assert.equal(a.calls.packs.length, 0); later.finish();
});

test('An abort during listener subscription has no unhandled rejection and cleans its owned reader', async () => {
  const h = api(), sent = input(payload, { abortOnSubscribe: true });
  await status(h, sent, 408); await flush(); clean(sent); assert.equal(h.calls.packs.length, 0);
});

for (const cancelMode of ['normal', 'pending', 'reject']) test(`Abort during pending EOF terminates even when cancellation is ${cancelMode}`, async () => {
  const h = api(), sent = input(payload, { keepOpen: true, cancelMode }), pending = observe(h.POST(sent.req));
  try {
    await flush(); assert.equal(pending.settled, false); sent.abort.abort(); await flush();
    assert.equal(pending.settled, true); assert.equal(pending.response.status, 408); privateResponse(pending.response);
    assert.equal(h.calls.packs.length, 0); assert.equal(sent.stats.cancelled, 1); clean(sent);
  } finally { if (!pending.settled) { sent.finish(); await pending.done; } }
});

for (const cancelMode of ['normal', 'pending', 'reject']) test(`The single total 8000ms body deadline bounds never-delivered input with ${cancelMode} cancel`, async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = api(), sent = input('', { waiting: true, cancelMode }), pending = observe(h.POST(sent.req));
  try {
    await flush(); t.mock.timers.tick(DEADLINE - 1); await flush(); assert.equal(pending.settled, false);
    t.mock.timers.tick(1); await flush(); assert.equal(pending.settled, true);
    assert.equal(pending.response.status, 408); privateResponse(pending.response); assert.equal(h.calls.packs.length, 0); clean(sent);
  } finally { if (!pending.settled) { sent.finish(); await pending.done; } }
});

test('Partial chunks cannot restart the total deadline and delayed reads cannot build a late pack', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = api(), sent = input('', { waiting: true }), pending = observe(h.POST(sent.req));
  try {
    await flush(); t.mock.timers.tick(6000); sent.enqueue(payload.slice(0, 15)); await flush();
    t.mock.timers.tick(1999); await flush(); assert.equal(pending.settled, false);
    sent.enqueue(payload.slice(15)); await flush(); t.mock.timers.tick(1); await flush();
    assert.equal(pending.settled, true); assert.equal(pending.response.status, 408); assert.equal(h.calls.packs.length, 0); clean(sent);
  } finally { if (!pending.settled) { sent.finish(); await pending.done; } }
  const late = api(), held = input(payload, { delayedRead: true }), delayed = observe(late.POST(held.req));
  try {
    await flush(); t.mock.timers.tick(DEADLINE); await flush(); assert.equal(delayed.settled, true);
    assert.equal(delayed.response.status, 408); held.settleRead(); await flush();
    assert.equal(late.calls.packs.length, 0); clean(held);
  } finally { held.settleRead(); if (!delayed.settled) { held.finish(); await delayed.done; } }
});

test('Abort at EOF and release prevents parsing or pack retrieval after the body finishes', async () => {
  for (const options of [{ abortOnEof: true }, { abortOnRelease: true }]) {
    const h = api(), sent = input(payload, options); await status(h, sent, 408); clean(sent); assert.equal(h.calls.packs.length, 0);
  }
});

test('Abort during JSON.parse is rechecked immediately before createOfflinePack', async t => {
  const h = api(), sent = input(), parse = JSON.parse;
  t.mock.method(JSON, 'parse', (...args) => { const value = parse(...args); if (args[0] === payload) sent.abort.abort(); return value; });
  await status(h, sent, 408); clean(sent); assert.equal(h.calls.packs.length, 0);
});

test('Abort while parsing malformed JSON also wins over the ordinary malformed-request response', async t => {
  const h = api(), sent = input('{'), parse = JSON.parse;
  t.mock.method(JSON, 'parse', (...args) => { if (args[0] === '{') sent.abort.abort(); return parse(...args); });
  await status(h, sent, 408); clean(sent); assert.equal(h.calls.packs.length, 0);
});

test('Successful, invalid and aborted owned readers clear exactly their timer and abort listener', async t => {
  const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
  const registered = [], cleared = [];
  t.mock.method(globalThis, 'setTimeout', (...args) => { const handle = realSet(...args); registered.push({ handle, delay: args[1] }); return handle; });
  t.mock.method(globalThis, 'clearTimeout', handle => { cleared.push(handle); return realClear(handle); });
  for (const [body, options, expected] of [[payload, {}, 200], ['{', {}, 400], [payload, { abortOnEof: true }, 408]]) {
    const h = api(), sent = input(body, options); await status(h, sent, expected); clean(sent);
  }
  assert.equal(registered.length, 3); assert.ok(registered.every(row => row.delay === DEADLINE));
  assert.deepEqual(cleared, registered.map(row => row.handle));
});

test('The complete GET function is unchanged apart from line endings and keeps its existing paid account/key response', async () => {
  const current = fs.readFileSync(root + '/app/api/lernen/offline/route.js', 'utf8');
  const previous = execFileSync('git', ['show', '59bbeda4e20869acc6f4a2973a90bfffaf99bd96:app/api/lernen/offline/route.js'], { cwd: root, encoding: 'utf8' });
  const get = text => text.slice(text.indexOf('export async function GET'), text.indexOf('export async function POST')).replaceAll('\r\n', '\n');
  assert.equal(get(current), get(previous));
  const h = api(), response = await h.GET(new Request(ENDPOINT)); assert.equal(response.status, 200); privateResponse(response);
  assert.deepEqual(await response.json(), { accountKey: 'isolated-existing-account-key' }); assert.equal(h.calls.auth, 1); assert.equal(h.calls.packs.length, 0);
});
