const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');

// Native Request and ReadableStream only; account and answer dependencies are
// isolated doubles. These tests never send a question or use account storage.
const ORIGIN = 'https://isolated.invalid';
const URL = `${ORIGIN}/api/lernen/jagdlatein-chat`;
const LIMIT = 2048, DEADLINE = 8000;
const encode = value => new TextEncoder().encode(value);
const payload = JSON.stringify({ question: '  Was ist eine Stockente?  ', examProfile: { country: 'CH', region: 'ZH' } });
const normalize = createLoader()('lib/exam-profile.js').normalizeExamProfile;
const flush = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
function api({ authStatus, beforeNormalize } = {}) {
  const calls = { auth: 0, answers: [] };
  const load = createLoader({
    '../../../../lib/account-access': { async requirePaidAccount() {
      calls.auth++;
      if (authStatus) throw Object.assign(new Error('SYNTHETIC_PRIVATE_AUTH'), { status: authStatus });
      return { paid: true };
    } },
    '../../../../lib/jagdlatein-chat': { answerJagdlateinQuestion(question, profile) {
      calls.answers.push({ question, profile }); return { kind: 'isolated-fixture', question, profile };
    } },
    '../../../../lib/exam-profile': { normalizeExamProfile(profile) { beforeNormalize?.(); return normalize(profile); } },
  });
  return { post: load('app/api/lernen/jagdlatein-chat/route.js').POST, calls };
}
function request(input = payload, options = {}) {
  const { declared, chunkSize = LIMIT, cancelMode = 'normal', waiting = false,
    keepOpen = false, readError = false, abortOnEof = false, abortOnRelease = false,
    abortOnSubscribe = false, delayedRead = false, headers: extraHeaders = {} } = options;
  const bytes = typeof input === 'string' ? encode(input) : input;
  const stats = { acquired: 0, reads: 0, cancelCalls: 0, cancelled: 0, released: 0, listeners: 0, removed: 0, closed: false };
  const abortController = new AbortController();
  let controller, offset = 0, delayed;
  const stream = new ReadableStream({
    start(value) { controller = value; },
    pull(value) {
      if (waiting) return;
      if (readError) { stats.closed = true; value.error(new Error('SYNTHETIC_PRIVATE_TRANSPORT')); return; }
      if (offset === bytes.length) { if (!keepOpen) { stats.closed = true; value.close(); } return; }
      const part = bytes.slice(offset, offset + chunkSize); offset += part.length; value.enqueue(part);
    },
    cancel() {
      stats.cancelled++;
      if (cancelMode === 'pending') return new Promise(() => {});
      if (cancelMode === 'reject') return Promise.reject(new Error('SYNTHETIC_PRIVATE_CANCEL'));
    },
  });
  const headers = { origin: ORIGIN, 'content-type': 'application/json',
    ...(declared === undefined ? {} : { 'content-length': String(declared) }), ...extraHeaders };
  const req = new Request(URL, { method: 'POST', body: stream, duplex: 'half', headers, signal: abortController.signal });
  const add = req.signal.addEventListener.bind(req.signal), remove = req.signal.removeEventListener.bind(req.signal);
  req.signal.addEventListener = (...args) => { stats.listeners++; const result = add(...args); if (abortOnSubscribe) abortController.abort(); return result; };
  req.signal.removeEventListener = (...args) => { stats.removed++; return remove(...args); };
  const getReader = req.body.getReader.bind(req.body);
  req.body.getReader = (...args) => {
    stats.acquired++; const reader = getReader(...args);
    const read = reader.read.bind(reader), cancel = reader.cancel.bind(reader), release = reader.releaseLock.bind(reader);
    reader.read = () => {
      stats.reads++;
      const result = read().then(value => { if (value.done && abortOnEof) abortController.abort(); return value; });
      if (delayedRead && stats.reads === 1) return new Promise((resolve, reject) => { delayed = () => result.then(resolve, reject); });
      return result;
    };
    reader.cancel = (...values) => { stats.cancelCalls++; return cancel(...values); };
    reader.releaseLock = () => { stats.released++; const result = release(); if (abortOnRelease) abortController.abort(); return result; };
    return reader;
  };
  return { req, stats, bytes, controller, abortController, settleRead() { delayed?.(); }, finish() {
    if (stats.cancelled || stats.closed) return;
    if (waiting) controller.enqueue(encode(payload));
    stats.closed = true; controller.close();
  } };
}
function observe(promise) {
  const state = { settled: false, response: null, error: null };
  state.done = promise.then(value => { state.settled = true; state.response = value; }, error => { state.settled = true; state.error = error; });
  return state;
}
function assertPrivate(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('vary'), 'Cookie');
}
function assertClean(h) {
  assert.equal(h.stats.cancelCalls, 1); assert.equal(h.stats.released, 1);
  assert.equal(h.stats.listeners, h.stats.removed); assert.equal(h.req.body.locked, false);
}
async function statusResponse(post, h, status) {
  const response = await post(h.req); assert.equal(response.status, status); assertPrivate(response);
  assert.doesNotMatch(await response.text(), /SYNTHETIC_PRIVATE/); return response;
}

test('Valid paid input, the exact 2048-byte boundary and split UTF-8 preserve trimmed question and validated region', async t => {
  const outgoing = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request'); });
  const { post, calls } = api();
  const utf8 = JSON.stringify({ question: 'Gämse 漢字' });
  for (const [input, options] of [[payload, {}], [' '.repeat(LIMIT - encode(payload).length) + payload, { declared: LIMIT }],
    [' '.repeat(LIMIT - encode(utf8).length) + utf8, { chunkSize: 1 }]]) {
    const h = request(input, options), response = await post(h.req);
    assert.equal(response.status, 200); assertPrivate(response); assertClean(h);
    assert.equal(h.stats.cancelled, 0);
    assert.equal(calls.answers.at(-1).question, JSON.parse(input).question.trim());
  }
  assert.deepEqual(calls.answers[0].profile, { country: 'CH', region: 'ZH' });
  assert.equal(outgoing.mock.callCount(), 0);
});

test('Origin, Fetch-Site, content type and declared length still reject before auth or body acquisition', async () => {
  const { post, calls } = api();
  for (const [options, status] of [[{ headers: { origin: 'https://foreign.invalid' } }, 403],
    [{ headers: { 'sec-fetch-site': 'same-site' } }, 403], [{ headers: { 'content-type': 'text/plain' } }, 415],
    ...[LIMIT + 1, '-1', '', '1e3', 'private'].map(declared => [{ declared }, 413])]) {
    const h = request(payload, options); await statusResponse(post, h, status);
    assert.equal(h.stats.acquired, 0); assert.equal(h.req.bodyUsed, false); h.finish();
  }
  const missing = request(); missing.req.headers.delete('origin'); await statusResponse(post, missing, 403); missing.finish();
  assert.equal(calls.auth, 0); assert.equal(calls.answers.length, 0);
});

test('Logged-out, inactive and failed auth stay before parsing even for an already aborted body', async () => {
  for (const authStatus of [401, 403, 503]) {
    const { post, calls } = api({ authStatus }), h = request(); h.abortController.abort();
    await statusResponse(post, h, authStatus);
    assert.equal(calls.auth, 1); assert.equal(calls.answers.length, 0);
    assert.equal(h.req.bodyUsed, false); assert.equal(h.stats.acquired, 0); h.finish();
  }
});

test('Actual stream bytes enforce 2048 without trusting absent or false-small declared lengths', async () => {
  for (const declared of [undefined, 1]) {
    const { post, calls } = api(), h = request(' '.repeat(LIMIT + 1) + payload, { declared, keepOpen: true });
    await statusResponse(post, h, 413); assertClean(h);
    assert.equal(h.stats.cancelled, 1); assert.equal(calls.auth, 1); assert.equal(calls.answers.length, 0);
  }
});

test('Empty, malformed, non-object, invalid UTF-8 and transport-error input stays a private 400', async () => {
  for (const [input, options] of [['', {}], ['{', {}], ['null', {}], ['[]', {}], ['1', {}], ['"text"', {}],
    [new Uint8Array([123,34,120,34,58,34,195,40,34,125]), {}], ['', { readError: true }]]) {
    const { post, calls } = api(), h = request(input, options);
    await statusResponse(post, h, 400); assertClean(h); assert.equal(calls.answers.length, 0);
  }
});

test('Schema and region rejection keep their exact bounded chat contract', async () => {
  for (const body of [{}, { question: ' ' }, { question: 'x'.repeat(241) }, { question: ['text'] },
    { question: 'text', history: 'SYNTHETIC_PRIVATE' }, { question: 'text', examProfile: { country: 'CH', region: 'BY' } },
    { question: 'text', examProfile: { country: 'CH', region: 'ZH', extra: true } }]) {
    const { post, calls } = api(), h = request(JSON.stringify(body));
    await statusResponse(post, h, 400); assertClean(h); assert.equal(calls.answers.length, 0);
  }
  const { post, calls } = api(), h = request(JSON.stringify({ question: 'x'.repeat(240), examProfile: null }));
  await statusResponse(post, h, 200); assert.equal(calls.answers[0].question.length, 240); assert.equal(calls.answers[0].profile, null);
});

test('A locked real Request body cannot release or cancel the reader owned by another consumer', async () => {
  const { post, calls } = api(), h = request(), reader = h.req.body.getReader();
  try {
    await statusResponse(post, h, 400); assert.equal(calls.answers.length, 0);
    assert.equal(h.req.body.locked, true); assert.equal(h.stats.released, 0); assert.equal(h.stats.cancelCalls, 0);
  } finally { await reader.cancel(); reader.releaseLock(); }
});

test('A bodyless real Request stays invalid without an unbounded json fallback, and still respects abort', async () => {
  for (const aborted of [false, true]) {
    const { post, calls } = api(), controller = new AbortController();
    const req = new Request(URL, { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json' }, signal: controller.signal });
    let jsonCalls = 0;
    req.json = async () => { jsonCalls++; throw new Error('SYNTHETIC_PRIVATE_FALLBACK'); };
    if (aborted) controller.abort();
    const response = await post(req); assert.equal(response.status, aborted ? 408 : 400); assertPrivate(response);
    assert.equal(jsonCalls, 0); assert.equal(calls.auth, 1); assert.equal(calls.answers.length, 0); assert.equal(req.bodyUsed, false);
  }
});

test('An already aborted authenticated Request never reads or retrieves an answer', async () => {
  const { post, calls } = api(), h = request(); h.abortController.abort();
  await statusResponse(post, h, 408); assertClean(h); assert.equal(h.stats.reads, 0);
  assert.equal(h.stats.listeners, 0);
  assert.equal(calls.auth, 1); assert.equal(calls.answers.length, 0);
});

test('Abort during listener registration is consumed and cannot escape as an unhandled promise rejection', async () => {
  const { post, calls } = api(), h = request(payload, { abortOnSubscribe: true });
  await statusResponse(post, h, 408); await flush(); assertClean(h); assert.equal(calls.answers.length, 0);
});

for (const cancelMode of ['normal', 'pending', 'reject']) test(`Abort during an unfinished body responds immediately even with ${cancelMode} transport cancel`, async () => {
  const { post, calls } = api(), h = request(payload, { keepOpen: true, cancelMode }), state = observe(post(h.req));
  try {
    await flush(); assert.equal(state.settled, false); h.abortController.abort(); await flush();
    assert.equal(state.settled, true); assert.equal(state.response.status, 408); assertPrivate(state.response);
    assert.equal(calls.answers.length, 0); assert.equal(h.stats.cancelled, 1); assertClean(h);
  } finally { if (!state.settled) { h.finish(); await state.done; } }
});

for (const cancelMode of ['normal', 'pending', 'reject']) test(`A never-delivering stream reaches its 8s deadline with ${cancelMode} cancellation`, async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { post, calls } = api(), h = request('', { waiting: true, cancelMode }), state = observe(post(h.req));
  try {
    await flush(); t.mock.timers.tick(DEADLINE - 1); await flush(); assert.equal(state.settled, false);
    t.mock.timers.tick(1); await flush();
    assert.equal(state.settled, true); assert.equal(state.response.status, 408); assertPrivate(state.response);
    assert.equal(calls.answers.length, 0); assert.equal(h.stats.cancelled, 1); assertClean(h);
  } finally {
    // Even a deliberately red baseline run closes its isolated stream.
    if (!state.settled) { h.finish(); await state.done; } t.mock.timers.reset();
  }
});

test('The 8s deadline covers the entire read rather than restarting at each chunk', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { post, calls } = api(), h = request('', { waiting: true }), state = observe(post(h.req));
  try {
    await flush(); t.mock.timers.tick(4000); h.controller.enqueue(encode(' ')); await flush();
    t.mock.timers.tick(3999); h.controller.enqueue(encode(' ')); await flush(); assert.equal(state.settled, false);
    t.mock.timers.tick(1); await flush(); assert.equal(state.settled, true); assert.equal(state.response.status, 408);
    assert.equal(calls.answers.length, 0); assertClean(h);
  } finally { if (!state.settled) { h.finish(); await state.done; } t.mock.timers.reset(); }
});

test('Cancellation at EOF, during reader cleanup and during profile normalization all stop before retrieval', async () => {
  for (const phase of ['EOF', 'release', 'normalize']) {
    const h = request(payload, { abortOnEof: phase === 'EOF', abortOnRelease: phase === 'release' });
    const { post, calls } = api({ beforeNormalize: phase === 'normalize' ? () => h.abortController.abort() : undefined });
    await statusResponse(post, h, 408); assertClean(h); assert.equal(calls.answers.length, 0);
  }
});

for (const interruption of ['abort', 'deadline']) test(`A late native read completion cannot revive a request after ${interruption}`, async t => {
  if (interruption === 'deadline') t.mock.timers.enable({ apis: ['setTimeout'] });
  const { post, calls } = api(), h = request(payload, { delayedRead: true }), state = observe(post(h.req));
  try {
    await flush();
    if (interruption === 'abort') h.abortController.abort(); else t.mock.timers.tick(DEADLINE);
    await flush(); assert.equal(state.settled, true);
    assert.equal(state.response.status, 408); assertClean(h);
    h.settleRead(); await flush(); assert.equal(calls.answers.length, 0); assert.equal(h.stats.reads, 1);
    assert.equal(state.response.status, 408);
  } finally {
    if (!state.settled) { h.settleRead(); h.finish(); await state.done; }
    if (interruption === 'deadline') t.mock.timers.reset();
  }
});

test('Overflow or malformed input does not await a rejecting or permanently pending cancel', async () => {
  for (const cancelMode of ['pending', 'reject']) for (const [input, status] of [
    [' '.repeat(LIMIT + 1), 413], [new Uint8Array([195,40]), 400],
  ]) {
    const { post, calls } = api(), h = request(input, { keepOpen: true, cancelMode }), state = observe(post(h.req));
    try {
      await flush(); assert.equal(state.settled, true); assert.equal(state.response.status, status);
      assertClean(h); assert.equal(h.stats.cancelled, 1); assert.equal(calls.answers.length, 0);
    } finally { if (!state.settled) { h.finish(); await state.done; } }
  }
});

test('Successful and invalid completed requests clear their timers and signal listeners exactly once', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const scheduled = t.mock.method(globalThis, 'setTimeout');
    const cleared = t.mock.method(globalThis, 'clearTimeout');
    const { post, calls } = api();
    const good = request(), bad = request('{'), broken = request('', { readError: true });
    for (const [h, status] of [[good, 200], [bad, 400], [broken, 400]]) {
      await statusResponse(post, h, status); assertClean(h); assert.equal(h.stats.listeners, 1); assert.equal(h.stats.removed, 1);
    }
    assert.equal(scheduled.mock.callCount(), 3); assert.equal(cleared.mock.callCount(), 3);
    assert.ok(scheduled.mock.calls.every(call => call.arguments[1] === DEADLINE));
    t.mock.timers.tick(DEADLINE * 2); good.abortController.abort(); bad.abortController.abort(); broken.abortController.abort(); await flush();
    assert.equal(calls.answers.length, 1);
    for (const h of [good, bad, broken]) { assert.equal(h.stats.cancelCalls, 1); assert.equal(h.stats.released, 1); }
  } finally { t.mock.restoreAll(); t.mock.timers.reset(); }
});
