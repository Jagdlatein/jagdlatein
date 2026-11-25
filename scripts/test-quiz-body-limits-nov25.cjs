// Real Request/ReadableStream regression contract, independently red before the fix.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const api = createLoader({ './account-session': { accountDatabaseOptions: () => ({}) } })('lib/quiz-api.js');
const LIMIT = 4096, DEADLINE = 8000;
const encode = text => new TextEncoder().encode(text);
const plain = JSON.stringify({ username: 'boundary-fixture', country: 'CH' });
const flush = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };
function request(input, { declared, chunkSize = 4096, cancelMode = 'normal', waiting = false, readError = false, keepOpen = false } = {}) {
  const bytes = typeof input === 'string' ? encode(input) : input;
  const stats = { cancelled: 0, cancelCalls: 0, acquired: 0, released: 0, pulls: 0 }; let offset = 0, controller;
  const stream = new ReadableStream({
    start(value) { controller = value; },
    pull(value) {
      stats.pulls++;
      if (waiting) return;
      if (readError) { value.error(new Error('SYNTHETIC_PRIVATE_TRANSPORT_DETAIL')); return; }
      if (offset === bytes.length) { if (!keepOpen) value.close(); return; }
      const part = bytes.slice(offset, offset + chunkSize); offset += part.length; value.enqueue(part);
    },
    cancel() { stats.cancelled++; if (cancelMode === 'pending') return new Promise(() => {}); if (cancelMode === 'reject') return Promise.reject(new Error('SYNTHETIC_CANCEL_REJECTION')); },
  });
  const headers = { 'content-type': 'application/json', origin: 'https://jagdlatein.test', ...(declared === undefined ? {} : { 'content-length': String(declared) }) };
  const req = new Request('https://jagdlatein.test/api/quiz/register', { method: 'POST', headers, body: stream, duplex: 'half' });
  const getReader = req.body.getReader.bind(req.body);
  req.body.getReader = (...args) => {
    stats.acquired++; const reader = getReader(...args), release = reader.releaseLock.bind(reader), cancel = reader.cancel.bind(reader);
    reader.cancel = (...values) => { stats.cancelCalls++; return cancel(...values); };
    reader.releaseLock = () => { stats.released++; return release(); }; return reader;
  };
  return { req, stats, bytes, controller, finish() { if (!stats.cancelled) { if (waiting) controller.enqueue(encode(plain)); controller.close(); } } };
}
function observe(promise) {
  const record = { phase: 'pending', error: null, value: null };
  record.done = promise.then(value => { record.phase = 'fulfilled'; record.value = value; }, error => { record.phase = 'rejected'; record.error = error; });
  return record;
}
async function rejectedStatus(promise, status) { await assert.rejects(promise, error => error.status === status); }

test('Small and exact-boundary JSON, including split multibyte UTF-8, remains accepted and releases its owned reader', async () => {
  const multibyte = JSON.stringify({ p: '漢'.repeat(1362) }) + '  ';
  assert.equal(encode(multibyte).length, LIMIT);
  for (const [input, options] of [[plain, {}], [' '.repeat(LIMIT - encode(plain).length) + plain, {}], [multibyte, { chunkSize: 1 }]]) {
    const h = request(input, options), result = await api.readQuizBody(h.req);
    assert.deepEqual(result, JSON.parse(input)); assert.equal(h.stats.cancelled, 0); assert.equal(h.stats.acquired, 1); assert.equal(h.stats.released, 1); assert.equal(h.req.body.locked, false);
  }
});

test('Declared overlimit or malformed lengths fail before reader acquisition, while streamed bytes beat missing or false-small lengths', async () => {
  for (const declared of [LIMIT + 1, '-1', '1e3', 'not-a-number', '']) {
    const h = request(plain, { declared }); await rejectedStatus(api.readQuizBody(h.req), 413);
    assert.equal(h.stats.acquired, 0); assert.equal(h.req.bodyUsed, false);
  }
  for (const declared of [undefined, 1]) {
    const h = request(' '.repeat(LIMIT + 1) + plain, { declared }); await rejectedStatus(api.readQuizBody(h.req), 413);
    assert.equal(h.stats.cancelCalls, 1); assert.equal(h.stats.released, 1); assert.equal(h.req.body.locked, false);
  }
});

test('Empty, malformed, non-object and invalid UTF-8 bodies stay invalid; json-only mocks do not become an unbounded fallback', async () => {
  for (const input of ['', '{', 'null', '[]', '1', '"string"']) {
    const h = request(input); await rejectedStatus(api.readQuizBody(h.req), 400); assert.equal(h.req.body.locked, false);
  }
  const invalidUtf8 = request(new Uint8Array([123,34,120,34,58,34,195,40,34,125]));
  await rejectedStatus(api.readQuizBody(invalidUtf8.req), 400); assert.equal(invalidUtf8.req.body.locked, false);
  let jsonCalls = 0;
  await rejectedStatus(api.readQuizBody({ headers: new Headers(), async json() { jsonCalls++; return {}; } }), 400); assert.equal(jsonCalls, 0);
  const broken = request('', { readError: true }); await rejectedStatus(api.readQuizBody(broken.req), 400); assert.equal(broken.req.body.locked, false);
});

test('An already locked real Request body stays a 400 input error without releasing another reader ownership', async () => {
  const h = request(plain), foreignReader = h.req.body.getReader();
  try {
    await rejectedStatus(api.readQuizBody(h.req), 400);
    assert.equal(h.req.body.locked, true); assert.equal(h.stats.released, 0);
  } finally { await foreignReader.cancel(); foreignReader.releaseLock(); }
});

test('A rejecting or permanently pending underlying cancel cannot block a 413 response or reader release', async () => {
  for (const cancelMode of ['pending', 'reject']) {
    const h = request(' '.repeat(LIMIT + 1) + plain, { cancelMode, keepOpen: true }), state = observe(api.readQuizBody(h.req));
    try {
      await flush();
      assert.equal(state.phase, 'rejected'); assert.equal(state.error.status, 413);
      assert.equal(h.stats.cancelCalls, 1); assert.equal(h.stats.cancelled, 1); assert.equal(h.stats.released, 1); assert.equal(h.req.body.locked, false);
    } finally { if (state.phase === 'pending' && !h.stats.cancelled) { h.finish(); await state.done; } }
  }
});

for (const cancelMode of ['normal', 'pending', 'reject']) test(`A never-delivering body reaches the 8s total read deadline even with ${cancelMode} cancel`, async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = request('', { waiting: true, cancelMode }), state = observe(api.readQuizBody(h.req));
  try {
    await flush(); t.mock.timers.tick(DEADLINE - 1); await flush(); assert.equal(state.phase, 'pending');
    t.mock.timers.tick(1); await flush();
    assert.equal(state.phase, 'rejected'); assert.equal(state.error.status, 408);
    assert.equal(h.stats.cancelled, 1); assert.equal(h.stats.released, 1); assert.equal(h.req.body.locked, false);
  } finally {
    // The unfixed implementation has no deadline. Close that local fixture so
    // even its intentionally red run leaves no hanging network/stream resource.
    if (state.phase === 'pending' && !h.stats.cancelled) { h.finish(); await state.done; }
    t.mock.timers.reset();
  }
});

test('The deadline covers the whole body rather than restarting for each arriving chunk', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = request('', { waiting: true }), state = observe(api.readQuizBody(h.req));
  try {
    await flush(); t.mock.timers.tick(4000); h.controller.enqueue(encode(' ')); await flush();
    t.mock.timers.tick(3999); h.controller.enqueue(encode(' ')); await flush(); assert.equal(state.phase, 'pending');
    t.mock.timers.tick(1); await flush(); assert.equal(state.phase, 'rejected'); assert.equal(state.error.status, 408);
    assert.equal(h.stats.cancelled, 1); assert.equal(h.req.body.locked, false);
  } finally { if (state.phase === 'pending' && !h.stats.cancelled) { h.finish(); await state.done; } t.mock.timers.reset(); }
});

test('Success and transport failure clear their timers without later cancelling a completed request', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const good = request(plain); await api.readQuizBody(good.req); assert.equal(good.req.body.locked, false);
    const broken = request('', { readError: true }); await rejectedStatus(api.readQuizBody(broken.req), 400); assert.equal(broken.req.body.locked, false);
    t.mock.timers.tick(DEADLINE * 2); await flush(); assert.equal(good.stats.cancelled, 0); assert.equal(broken.stats.cancelled, 0);
  } finally { t.mock.timers.reset(); }
});

test('413 and 408 reach callers with private no-store; unknown internal errors still use the generic 503 response', async () => {
  for (const status of [413, 408]) {
    const response = api.quizFailure(Object.assign(new Error('Synthetische sichere Anfragemeldung.'), { status }));
    assert.equal(response.status, status); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  const failed = api.quizFailure(new Error('SYNTHETIC_PRIVATE_INTERNAL_DETAIL'));
  assert.equal(failed.status, 503); assert.doesNotMatch(await failed.text(), /SYNTHETIC_PRIVATE_INTERNAL_DETAIL/);
});
