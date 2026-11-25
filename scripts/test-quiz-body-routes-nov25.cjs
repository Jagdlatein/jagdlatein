// Real-route regression contract for the bounded shared quiz reader.
// All identities, database calls and quiz state are isolated synthetic doubles.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const api = createLoader({ './account-session': { accountDatabaseOptions: () => ({}) } })('lib/quiz-api.js');
const ID = '11111111-1111-4111-8111-111111111111', REQUEST_ID = '22222222-2222-4222-8222-222222222222';
const encode = text => new TextEncoder().encode(text), flush = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };
const cases = [
  { name: 'register', path: 'app/api/quiz/register/route.js', prefix: '../../../../', rpc: 'register_ranked_quiz', payload: { username: 'route-fixture', country: 'CH' } },
  { name: 'start', path: 'app/api/quiz/round/route.js', prefix: '../../../../', rpc: 'start_ranked_quiz', payload: { country: 'CH', topic: 'Alle', requestId: ID } },
  { name: 'answer', path: 'app/api/quiz/round/answer/route.js', prefix: '../../../../../', rpc: 'answer_ranked_quiz', payload: { roundId: ID, questionId: 'synthetic-question', answerId: 'a', requestId: REQUEST_ID } },
  { name: 'next', path: 'app/api/quiz/round/next/route.js', prefix: '../../../../../', rpc: 'advance_ranked_quiz', payload: { roundId: ID, requestId: REQUEST_ID } },
];
function fixture(item, { allow = true, origin = 'https://jagdlatein.test', waiting = false, padding = 0, cancelMode = 'normal' } = {}) {
  const effects = { accountChecks: 0, rpcCalls: 0, cancelled: 0, arguments: [] }; let controller;
  const question = { id: 'synthetic-question', q: 'Synthetic question?', answers: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }, { id: 'd', text: 'D' }], correct: ['a'], explain: 'Synthetic explanation' };
  const ranked = createLoader({
    './quiz-api': { quizDatabase: () => ({ async rpc(name, args) { effects.rpcCalls++; effects.arguments.push(args); assert.equal(name, item.rpc); assert.equal(args.p_email, 'route-fixture@example.invalid'); return { data: item.name === 'register' ? { username: 'route-fixture', country: 'CH' } : { roundId: ID, phase: 'asking', index: 0, questions: [question], country: 'CH', topic: 'Alle', points: 0, correctAnswers: 0, timedOutAnswers: 0, serverNow: 1000, deadlineAt: 31000 }, error: null }; } }) },
    '../data/questions-full': { PACK_INFO: { countries: ['DE', 'AT', 'CH'], topics: [] }, filterQuestions: () => [question] },
  })('lib/ranked-quiz-server.js');
  const route = createLoader({
    [item.prefix + 'lib/account-access']: { async requirePaidAccount() { effects.accountChecks++; if (!allow) throw Object.assign(new Error('Synthetic login required'), { status: 401 }); return { email: 'route-fixture@example.invalid' }; } },
    [item.prefix + 'lib/account-session']: { isAccountGenerationEnabled: () => false },
    [item.prefix + 'lib/quiz-api']: api,
    [item.prefix + 'lib/ranked-quiz-server']: ranked,
  })(item.path);
  const text = ' '.repeat(padding) + JSON.stringify(item.payload);
  const stream = new ReadableStream({ start(value) { controller = value; if (!waiting) { value.enqueue(encode(text)); value.close(); } }, cancel() { effects.cancelled++; if (cancelMode === 'pending') return new Promise(() => {}); } });
  const req = new Request('https://jagdlatein.test/api/quiz/' + item.name, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: stream, duplex: 'half' });
  return { route, req, effects, finish() { if (!effects.cancelled) { controller.enqueue(encode(JSON.stringify(item.payload))); controller.close(); } } };
}
for (const item of cases) {
  test(`${item.name}: real route keeps its normal small command and safe cache boundary`, async () => {
    const h = fixture(item), response = await h.route.POST(h.req);
    assert.equal(response.status, 200); assert.equal(h.effects.accountChecks, 1); assert.equal(h.effects.rpcCalls, 1); assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(h.effects.cancelled, 0); const body = await response.json(); assert.equal(body.success, true);
    if (item.name !== 'register') { assert.equal(body.round.roundId, ID); assert.equal(Object.hasOwn(body.round.question, 'correct'), false); }
  });
  test(`${item.name}: true stream-byte overflow becomes 413 before its mutation adapter`, async () => {
    const h = fixture(item, { padding: 4097 }), response = await h.route.POST(h.req);
    assert.equal(response.status, 413); assert.equal(h.effects.accountChecks, 1); assert.equal(h.effects.rpcCalls, 0); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  });
  test(`${item.name}: wrong Origin and absent access remain ahead of any body consumption or mutation`, async () => {
    for (const [options, status, accountChecks] of [[{ origin: 'https://different.invalid' }, 403, 0], [{ allow: false }, 401, 1]]) {
      const h = fixture(item, options), response = await h.route.POST(h.req);
      assert.equal(response.status, status); assert.equal(h.effects.accountChecks, accountChecks); assert.equal(h.effects.rpcCalls, 0); assert.equal(h.req.bodyUsed, false);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
    }
  });
  test(`${item.name}: 8s read timeout remains 408 with a nonsettling cancel and no mutation`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = fixture(item, { waiting: true, cancelMode: 'pending' }), outcome = { phase: 'pending', response: null };
    const operation = h.route.POST(h.req).then(response => { outcome.phase = 'resolved'; outcome.response = response; });
    try {
      await flush(); t.mock.timers.tick(8000); await flush();
      assert.equal(outcome.phase, 'resolved'); assert.equal(outcome.response.status, 408); assert.equal(h.effects.cancelled, 1); assert.equal(h.effects.rpcCalls, 0);
      assert.equal(outcome.response.headers.get('cache-control'), 'private, no-store'); assert.equal(h.req.body.locked, false);
    } finally { if (outcome.phase === 'pending' && !h.effects.cancelled) { h.finish(); await operation; } t.mock.timers.reset(); }
  });
}
