const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react');
const swc = pr('next/dist/build/swc');
const ROUND = '00000001-1111-4111-8111-111111111111';
const BASE = Date.parse('2026-10-16T10:00:00Z');
const iso = elapsed => new Date(BASE + elapsed).toISOString();
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const match = find(child, predicate); if (match) return match; } return null; }
  return !node || typeof node !== 'object' ? null : predicate(node) ? node : find(node.props?.children, predicate);
}
function asking(index = 0, elapsed = 0, overrides = {}) {
  return { roundId: ROUND, phase: 'asking', index, total: 2, country: 'DE', topic: 'Jagdpraxis',
    points: index ? 400 : 0, correctAnswers: index ? 1 : 0, timedOutAnswers: 0,
    serverNow: iso(elapsed), deadlineAt: iso(elapsed + 30000), feedback: null, finishedAt: null,
    question: { id: `synthetic-question-${index + 1}`, q: `Synthetische Frage ${index + 1}?`,
      answers: [{ id: 'a', text: 'Synthetische Antwort A' }, { id: 'b', text: 'Synthetische Antwort B' }] },
    ...overrides };
}
function feedback(index = 0, elapsed = 0, timedOut = false) {
  const round = asking(index, elapsed);
  return { ...round, phase: 'feedback', deadlineAt: null, points: timedOut ? 0 : 400,
    correctAnswers: timedOut ? 0 : 1, timedOutAnswers: timedOut ? 1 : 0,
    feedback: { questionId: round.question.id, correct: !timedOut, timedOut,
      answeredAt: iso(elapsed), selectedAnswerId: timedOut ? null : 'a',
      correctAnswerIds: ['a'], explain: 'Synthetische Erklärung zum Testen der Oberfläche.',
      source: null, earnedPoints: timedOut ? 0 : 400 } };
}

// Run the real component with isolated hooks, a monotonic fake clock and deferred
// fetches. No actual browser storage, account, network or database is accessed.
function setup() {
  let now = 0, timerId = 0, uuidId = 0, cursor = 0, changed = false, effects = [], tree;
  let params = new URLSearchParams('topic=Jagdpraxis');
  const slots = [], timers = new Map(), requests = [], storage = new Map(), navigations = [];
  const router = { push(href) { navigations.push(href); } };
  const hooks = { ...React,
    useState(initial) {
      const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value;
        if (!Object.is(next, slots[i].value)) changed = true; slots[i].value = next; }];
    },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || !deps || deps.some((value, index) => !Object.is(value, previous.deps?.[index]))) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); });
      }
    },
  };
  const window = { sessionStorage: { getItem: key => storage.get(key) ?? null,
    setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); } } };
  const globalThis = { performance: { now: () => now }, crypto: { randomUUID() {
    return `${String(++uuidId).padStart(8, '0')}-1111-4111-8111-111111111111`;
  } } };
  const setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; };
  const clearTimeout = id => timers.delete(id);
  const fetch = (url, options = {}) => new Promise(resolve => {
    assert.ok(/^\/api\/quiz\/(register|round(?:\/(answer|next)|\?roundId=[a-f0-9-]+)?)$/.test(url), `Unexpected synthetic request: ${url}`);
    const request = { url, options, body: options.body ? JSON.parse(options.body) : null,
      respond(data, status = 200) { resolve({ ok: status >= 200 && status < 300, status, async json() { return data; } }); } };
    requests.push(request);
  });
  const filename = path.join(root, 'app/quiz-app/run/QuizClient.jsx');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'fetch', 'setTimeout', 'clearTimeout', 'globalThis', code)(id => {
    if (id === 'react') return hooks;
    if (id === 'next/navigation') return { useRouter: () => router, useSearchParams: () => params };
    if (id === 'next/link') return { __esModule: true, default: ({ children }) => children };
    if (id.endsWith('/AppIcon')) return { __esModule: true, default: () => null };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.endsWith('/daily-review')) return { recordReviewAnswer() {} };
    if (id.endsWith('/quiz-learning-scope')) return { isCountryQuizTopic: topic => topic === 'Recht',
      quizLearningUrl: (pathname, country, topic) => `${pathname}?${topic === 'Recht' ? `country=${country}&` : ''}topic=${encodeURIComponent(topic)}` };
    return pr(id);
  }, mod, mod.exports, window, fetch, setTimeout, clearTimeout, globalThis);
  function commit() {
    for (let pass = 0; pass < 30; pass++) {
      cursor = 0; changed = false; tree = mod.exports.default();
      const pending = effects; effects = []; pending.forEach(effect => effect());
      if (!changed && !effects.length) return;
    }
    throw new Error('Synthetic component failed to settle');
  }
  async function settle() { for (let pass = 0; pass < 10; pass++) { await Promise.resolve(); commit(); } }
  commit();
  return { requests, timers, navigations, storage, commit, settle,
    get tree() { return tree; }, get now() { return now; }, text: () => text(tree),
    button(label) { const button = find(tree, node => node.type === 'button' && text(node).trim() === label);
      assert.ok(button, `Missing button: ${label}`); return button; },
    click(label) { const button = this.button(label); assert.ok(!button.props.disabled, `Disabled button: ${label}`);
      button.props.onClick(); commit(); return button; },
    advance(ms) {
      const target = now + ms;
      for (let count = 0; count < 1000; count++) {
        const entry = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) { now = target; commit(); return; }
        timers.delete(entry[0]); now = entry[1].at; entry[1].callback(); commit();
      }
      throw new Error('Synthetic timer did not settle');
    },
    setTopic(topic) { params = new URLSearchParams({ topic }); commit(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    async start() {
      assert.equal(requests.length, 1); assert.equal(requests[0].url, '/api/quiz/register');
      requests[0].respond({ success: true, identity: { username: 'synthetic-player', country: 'CH' } }); await settle();
      assert.equal(requests[1].url, '/api/quiz/round'); assert.equal(requests[1].body.requestId, ROUND);
      requests[1].respond({ success: true, round: asking() }); await settle();
      assert.match(text(tree), /Synthetische Frage 1\?/); return this;
    },
    async answer() {
      this.click('Synthetische Antwort A');
      assert.equal(requests.at(-1).url, '/api/quiz/round/answer');
      requests.at(-1).respond({ success: true, round: feedback(0, now) }); await settle(); return this;
    },
  };
}

test('Feedback remains readable after 45 seconds and only a manual Weiter starts the next answer time', async () => {
  const s = await setup().start(); await s.answer();
  assert.match(s.text(), /Synthetische Erklärung/); assert.match(s.text(), /Lies in Ruhe nach/);
  s.advance(45000); await s.settle();
  assert.equal(s.requests.length, 3); assert.equal(s.timers.size, 0);
  assert.match(s.text(), /Frage 1 von 2/); assert.match(s.text(), /Synthetische Erklärung/);
  const next = s.click('Weiter'); next.props.onClick(); s.commit();
  assert.equal(s.requests.filter(request => request.url === '/api/quiz/round/next').length, 1);
  assert.equal(s.button('Weiter').props.disabled, true);
  const request = s.requests.at(-1); assert.equal(request.body.roundId, ROUND);
  request.respond({ success: true, round: asking(1, s.now) }); await s.settle();
  assert.match(s.text(), /Frage 2 von 2/); assert.match(s.text(), /30 Sekunden/);
  next.props.onClick(); s.commit(); assert.equal(s.requests.length, 4, 'A stale Weiter handler cannot skip a new question');
  s.advance(29999); assert.equal(s.requests.length, 4); assert.match(s.text(), /1 Sekunden/);
  s.unmount();
});

test('An unanswered question still times out after 30 seconds, sends answer:null once and keeps its feedback', async () => {
  const s = await setup().start();
  s.advance(29999); assert.equal(s.requests.length, 2);
  s.advance(1); assert.equal(s.requests.length, 3);
  const answer = s.requests.at(-1); assert.equal(answer.url, '/api/quiz/round/answer');
  assert.equal(answer.body.roundId, ROUND); assert.equal(answer.body.questionId, 'synthetic-question-1');
  assert.equal(answer.body.answerId, null);
  s.advance(60000); assert.equal(s.requests.length, 3, 'A pending timeout cannot be submitted twice');
  answer.respond({ success: true, round: feedback(0, s.now, true) }); await s.settle();
  assert.match(s.text(), /Zeit abgelaufen/); s.advance(45000); await s.settle();
  assert.equal(s.requests.length, 3); assert.match(s.text(), /Frage 1 von 2/);
  assert.equal(s.button('Weiter').props.disabled, false); s.unmount();
});

test('Double answers, clicks while busy and stale prior-question handlers cannot submit extra answers', async () => {
  const s = await setup().start(); const first = s.button('Synthetische Antwort A');
  first.props.onClick(); first.props.onClick(); s.commit();
  assert.equal(s.requests.length, 3); assert.equal(s.button('Synthetische Antwort A').props.disabled, true);
  s.requests.at(-1).respond({ success: true, round: feedback() }); await s.settle();
  first.props.onClick(); s.commit(); assert.equal(s.requests.length, 3);
  s.click('Weiter'); s.requests.at(-1).respond({ success: true, round: asking(1, s.now) }); await s.settle();
  first.props.onClick(); s.commit(); assert.equal(s.requests.length, 4);
  s.click('Synthetische Antwort B'); assert.equal(s.requests.length, 5);
  assert.equal(s.requests.at(-1).body.questionId, 'synthetic-question-2');
  assert.equal(s.requests.at(-1).body.answerId, 'b'); s.unmount();
});

test('A response belonging to another round is rejected and retry preserves its original request ID', async () => {
  const s = await setup().start(); await s.answer(); s.click('Weiter');
  const operation = s.requests.at(-1);
  operation.respond({ success: true, round: asking(1, s.now, { roundId: '99999999-1111-4111-8111-111111111111' }) });
  await s.settle(); assert.match(s.text(), /Die nächste Frage konnte gerade nicht geladen werden/);
  assert.match(s.text(), /Frage 1 von 2/); assert.equal(s.button('Weiter').props.disabled, true);
  s.click('Erneut versuchen'); assert.equal(s.requests.length, 5);
  assert.deepEqual(s.requests.at(-1).body, operation.body, 'Retry replays the same idempotent operation');
  s.requests.at(-1).respond({ success: true, round: asking(1, s.now) }); await s.settle();
  assert.match(s.text(), /Frage 2 von 2/); s.unmount();
});

test('Changing topic invalidates an outstanding answer response before the new round is loaded', async () => {
  const s = await setup().start(); s.click('Synthetische Antwort A'); const oldAnswer = s.requests.at(-1);
  s.setTopic('Wildkunde'); assert.equal(oldAnswer.options.signal.aborted, true);
  assert.equal(s.requests.at(-1).url, '/api/quiz/register');
  oldAnswer.respond({ success: true, round: feedback() }); await s.settle();
  assert.doesNotMatch(s.text(), /Synthetische Erklärung/); assert.match(s.text(), /Dein Quizname wird bestätigt/);
  assert.equal(s.requests.length, 4); s.unmount();
});

test('Unmounting cancels the question timer and ignores late profile responses and stale buttons', async () => {
  const loading = setup(); const profile = loading.requests[0]; loading.unmount();
  assert.equal(profile.options.signal.aborted, true);
  profile.respond({ success: true, identity: { username: 'synthetic-player', country: 'CH' } }); await loading.settle();
  assert.equal(loading.requests.length, 1);
  const s = await setup().start(); const stale = s.button('Synthetische Antwort A'); s.unmount();
  assert.equal(s.timers.size, 0); stale.props.onClick(); s.advance(60000);
  assert.equal(s.requests.length, 2);
});
