// Actual React DOM/effects. All fetches, session data and clocks are isolated.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), local = createRequire(path.join(root, 'package.json'));
const React = local('react'), swc = local('next/dist/build/swc');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const BASE = Date.parse('2026-11-25T15:00:00Z'), iso = ms => new Date(BASE + ms).toISOString();
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const wrap = value => ({ __esModule: true, default: value });
const nativeProps = node => node[Object.keys(node).find(key => key.startsWith('__reactProps'))];

async function fixture(t, query = 'topic=Jagdpraxis') {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.invalid/quiz-app/run?' + query });
  const saved = new Map(), requests = [], timers = new Map(), storage = new Map(), writes = [], controllers = [], navigations = [];
  let now = 0, timerID = 0, mounted = true, params = new URLSearchParams(query);
  const router = { push: href => navigations.push(href) };
  const NativeController = globalThis.AbortController;
  class Controller extends NativeController {
    constructor() {
      super(); const listeners = new Set(), signal = this.signal;
      const add = signal.addEventListener.bind(signal), remove = signal.removeEventListener.bind(signal);
      signal.addEventListener = (name, listener, options) => { if (name === 'abort') listeners.add(listener); return add(name, listener, options); };
      signal.removeEventListener = (name, listener, options) => { if (name === 'abort') listeners.delete(listener); return remove(name, listener, options); };
      controllers.push({ controller: this, listeners });
    }
  }
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  Object.defineProperty(dom.window, 'sessionStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) { writes.push(['set', key, value]); storage.set(key, value); },
    removeItem(key) { writes.push(['remove', key]); storage.delete(key); },
  } });
  const fetcher = (url, options = {}) => {
    assert.match(url, /^\/api\/quiz\/(register|round(?:\/(answer|next)|\?roundId=[a-f0-9-]+)?)$/);
    const request = { url, options, body: options.body ? JSON.parse(options.body) : null, ...deferred() }; requests.push(request); return request.promise;
  };
  const setTimer = (callback, delay) => { const id = ++timerID; timers.set(id, { callback, at: now + delay, delay }); return id; };
  const clearTimer = id => timers.delete(id);
  function compile(file, req) {
    const filename = path.join(root, file), mod = { exports: {} };
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', 'window', 'fetch', 'setTimeout', 'clearTimeout', 'globalThis', 'AbortController', code)(req, mod, mod.exports,
      dom.window, fetcher, setTimer, clearTimer, { performance: { now: () => now }, crypto: { randomUUID: () => crypto.randomUUID() } }, Controller);
    return mod.exports;
  }
  const deadline = compile('lib/quiz-request-deadline.js', local);
  const Component = compile('app/quiz-app/run/QuizClient.jsx', id => {
    if (id === 'react') return React;
    if (id === 'next/navigation') return { useRouter: () => router, useSearchParams: () => params };
    if (id === 'next/link') return wrap(({ href, children }) => React.createElement('a', { href }, children));
    if (id.endsWith('/AppIcon')) return wrap(() => null);
    if (id.endsWith('/daily-review')) return { recordReviewAnswer() { throw Error('Unexpected personal review write'); } };
    if (id.endsWith('/use-exam-profile')) return wrap(() => ({ ready: true, profile: { country: 'CH', region: 'ZH' } }));
    if (id.endsWith('/exam-profile')) return { getExamProfileDetails: () => ({ country: { code: 'CH' } }) };
    if (id.endsWith('/quiz-feedback-learning-link')) return createLoader()('lib/quiz-feedback-learning-link.js');
    if (id.endsWith('/quiz-request-deadline')) return deadline;
    if (id.endsWith('/quiz-learning-scope')) return { isCountryQuizTopic: topic => topic === 'Recht', quizLearningUrl: (url, country, topic) => url + '?' + new URLSearchParams({ country, topic }) };
    if (id.endsWith('.module.css')) return wrap(new Proxy({}, { get: (_, key) => String(key) }));
    return local(id);
  }).default;
  const container = document.getElementById('root'), reactRoot = local('react-dom/client').createRoot(container);
  const act = async action => React.act(async () => { action(); for (let i = 0; i < 16; i++) await Promise.resolve(); });
  const render = () => act(() => reactRoot.render(React.createElement(Component)));
  await render();
  async function reply(request, data, status = 200) { await act(() => request.resolve({ ok: status >= 200 && status < 300, status, json: async () => data })); }
  async function jsonPending(request) { const json = deferred(); await act(() => request.resolve({ ok: true, status: 200, json: () => json.promise })); return json; }
  function asking(request, label = 'CURRENT', index = 0, originalRound) {
    return { roundId: originalRound?.roundId || request.body.requestId, phase: 'asking', index, total: 2,
      country: originalRound?.country || request.body.country, topic: originalRound?.topic || request.body.topic,
      points: index ? 400 : 0, correctAnswers: index ? 1 : 0, timedOutAnswers: 0, serverNow: iso(now), deadlineAt: iso(now + 30000), finishedAt: null, feedback: null,
      question: { id: 'isolated-question-' + index, q: label + ' Prüfungsfrage?', answers: [{ id: 'a', text: 'Antwort A' }, { id: 'b', text: 'Antwort B' }] } };
  }
  let round;
  async function identified(request = requests.at(-1)) {
    assert.equal(request.url, '/api/quiz/register'); await reply(request, { success: true, identity: { username: 'isolated', country: 'DE' } }); return requests.at(-1);
  }
  async function start() { const request = await identified(); round = asking(request); await reply(request, { success: true, round }); return round; }
  async function click(label) { const button = [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label); assert.ok(button, 'Real button missing: ' + label); assert.equal(button.disabled, false); await act(() => button.click()); return requests.at(-1); }
  function feedback(label = 'CURRENT', value = round) {
    return { ...value, phase: 'feedback', deadlineAt: null, points: 400, correctAnswers: 1,
      feedback: { questionId: value.question.id, correct: true, timedOut: false, answeredAt: iso(now), selectedAnswerId: 'a', correctAnswerIds: ['a'], explain: label + ' Erklärung.', source: null, earnedPoints: 400 } };
  }
  async function answered() { await start(); const request = await click('Antwort A'); await reply(request, { success: true, round: feedback() }); }
  async function advance(ms) {
    const until = now + ms; let turns = 0;
    while (true) {
      const entry = [...timers.entries()].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break; assert.ok(++turns < 5000, 'Synthetic clock did not settle'); timers.delete(entry[0]); now = entry[1].at; await act(entry[1].callback);
    }
    now = until; await act(() => {});
  }
  async function unmount() { if (mounted) { await act(() => reactRoot.unmount()); mounted = false; } }
  t.after(async () => {
    await unmount(); assert.equal(timers.size, 0, 'Owned timers removed');
    assert.equal(controllers.reduce((sum, item) => sum + item.listeners.size, 0), 0, 'Owned parent abort listeners removed');
    dom.window.close(); for (const [key, descriptor] of saved) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
  });
  return { requests, timers, container, reply, jsonPending, identified, start, click, answered, advance, asking, feedback, unmount, act, deadline, Controller, writes, navigations,
    get round() { return round; }, get now() { return now; },
    listeners: () => controllers.reduce((sum, item) => sum + item.listeners.size, 0),
    async route(query) { params = new URLSearchParams(query); await render(); },
  };
}

const stages = {
  profile: { message: /Dein Quizname konnte gerade nicht bestätigt/, setup: async () => {} },
  start: { message: /Quizrunde konnte gerade nicht geladen/, setup: f => f.identified() },
  answer: { message: /Deine Antwort konnte gerade nicht bestätigt/, setup: async f => { await f.start(); await f.click('Antwort A'); } },
  next: { message: /nächste Frage konnte gerade nicht geladen/, setup: async f => { await f.answered(); await f.click('Weiter'); } },
  sync: { message: /Quizrunde konnte gerade nicht erneut geladen/, setup: async f => {
    await f.start(); const request = await f.click('Antwort A'); await f.reply(request, { success: false, error: 'Synthetic retryable conflict' }, 409); await f.click('Runde erneut laden');
  } },
};
for (const [stage, config] of Object.entries(stages)) for (const phase of ['fetch', 'json']) {
  test(`A hanging ${stage} ${phase} reaches one8s error and an explicit exact retry; late old data cannot replace its result`, async t => {
    const f = await fixture(t); await config.setup(f);
    const old = f.requests.at(-1), requestCount = f.requests.length;
    const oldJSON = phase === 'json' ? await f.jsonPending(old) : null;
    assert.equal(f.listeners(), 1); assert.ok([...f.timers.values()].some(timer => timer.delay === 8000));
    await f.advance(7999); assert.equal(f.container.querySelector('[role="alert"]'), null); assert.equal(old.options.signal.aborted, false);
    await f.advance(1);
    assert.match(f.container.querySelector('[role="alert"]').textContent, config.message);
    assert.equal(old.options.signal.aborted, true); assert.equal(f.requests.length, requestCount, 'No automatic retry or POST');
    assert.equal(f.listeners(), 0); assert.equal(f.timers.size, 0);
    assert.doesNotMatch(f.container.textContent, /AbortError|sensitive|internal transport/);
    const retry = await f.click('Erneut versuchen');
    if (!['profile', 'start'].includes(stage)) {
      assert.equal(retry.url, old.url); assert.equal(retry.options.method, old.options.method); assert.deepEqual(retry.body, old.body, 'Reuse exact idempotent operation payload');
    }
    let current;
    if (['profile', 'start'].includes(stage)) {
      const start = await f.identified(retry);
      if (stage === 'start') assert.deepEqual(start.body, old.body, 'Round start keeps the same request UUID');
      current = f.asking(start, 'CURRENT-RETRY'); await f.reply(start, { success: true, round: current });
    } else {
      current = stage === 'answer' ? f.feedback('CURRENT-RETRY') : f.asking(retry, 'CURRENT-RETRY', stage === 'next' ? 1 : 0, f.round);
      await f.reply(retry, { success: true, round: current });
    }
    const currentHTML = f.container.innerHTML, calls = f.requests.length, saved = JSON.stringify(f.writes);
    const late = stage === 'profile' ? { success: true, identity: { username: 'LATE-PRIVATE', country: 'DE' } }
      : { success: true, round: stage === 'answer' ? f.feedback('LATE-PRIVATE') : { ...current, question: { ...current.question, q: 'LATE-PRIVATE Prüfungsfrage?' } } };
    if (oldJSON) await f.act(() => oldJSON.resolve(late)); else await f.reply(old, late);
    assert.equal(f.container.innerHTML, currentHTML); assert.equal(f.requests.length, calls); assert.equal(JSON.stringify(f.writes), saved);
    assert.equal(f.container.querySelector('[role="alert"]'), null); assert.equal(f.listeners(), 0);
    assert.ok(![...f.timers.values()].some(timer => timer.delay === 8000), 'Success removed the complete transport deadline');
  });
}

for (const phase of ['fetch', 'json']) test(`Actual unmount retires a pending ${phase}, cancels timers and leaves late responses inert`, async t => {
  const f = await fixture(t); const request = f.requests[0], json = phase === 'json' ? await f.jsonPending(request) : null;
  const timer = [...f.timers.values()][0].callback;
  await f.unmount(); assert.equal(request.options.signal.aborted, true); assert.equal(f.listeners(), 0); assert.equal(f.timers.size, 0);
  const calls = f.requests.length, saved = JSON.stringify(f.writes);
  await f.act(() => { timer(); if (json) json.resolve({ success: true, identity: { username: 'late', country: 'DE' } }); else request.resolve(Response.json({ success: true, identity: { username: 'late', country: 'DE' } })); });
  assert.equal(f.requests.length, calls); assert.equal(JSON.stringify(f.writes), saved); assert.equal(f.container.textContent, '');
});

test('A-B-A law selection retires old timeouts, responses and retry actions while the current round remains usable', async t => {
  const f = await fixture(t, 'topic=Recht&country=CH');
  const old = f.requests[0], oldTimer = [...f.timers.values()][0].callback;
  await f.advance(8000); const staleRetry = nativeProps([...f.container.querySelectorAll('button')].find(button => button.textContent === 'Erneut versuchen')).onClick;
  await f.route('topic=Recht&country=AT'); const atProfile = f.requests.at(-1);
  await f.act(() => { oldTimer(); staleRetry(); }); assert.equal(atProfile.options.signal.aborted, false);
  const atStart = await f.identified(atProfile); const atRound = f.asking(atStart, 'CURRENT-AT'); await f.reply(atStart, { success: true, round: atRound });
  await f.route('topic=Recht&country=CH'); const chProfile = f.requests.at(-1), before = f.requests.length;
  await f.act(staleRetry); assert.equal(f.requests.length, before);
  await f.reply(old, { success: true, identity: { username: 'LATE-PRIVATE', country: 'CH' } }); assert.equal(f.requests.length, before);
  const chStart = await f.identified(chProfile); const chRound = f.asking(chStart, 'CURRENT-CH'); await f.reply(chStart, { success: true, round: chRound });
  assert.match(f.container.textContent, /CURRENT-CH/); assert.doesNotMatch(f.container.textContent, /CURRENT-AT|LATE-PRIVATE/);
  await f.click('Antwort A'); assert.equal(f.requests.at(-1).body.roundId, chRound.roundId);
});

test('Already-aborted and active-aborted parent signals stop transport without exposing private reasons or leaking owned resources', async t => {
  const f = await fixture(t); await f.unmount();
  const early = new f.Controller(); early.abort('sensitive account reason'); let calls = 0;
  await assert.rejects(f.deadline.withQuizRequestDeadline(early.signal, () => { calls++; }), /Quizrunde ist gerade nicht erreichbar/); assert.equal(calls, 0);
  const active = new f.Controller(), pending = deferred(); let child;
  const value = f.deadline.withQuizRequestDeadline(active.signal, signal => { child = signal; calls++; return pending.promise; });
  active.abort(new Error('sensitive provider reason'));
  await assert.rejects(value, error => !/sensitive/.test(error.message)); assert.equal(child.aborted, true);
  pending.reject(new Error('late sensitive rejection')); await f.act(() => {});
  assert.equal(f.listeners(), 0); assert.equal(f.timers.size, 0);
});

test('Headers arriving at7999ms do not restart the deadline while a native streamed JSON body is pending', async t => {
  const f = await fixture(t); const request = f.requests[0]; let stream;
  const body = new ReadableStream({ start(controller) { stream = controller; } });
  await f.advance(7999);
  await f.act(() => request.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })));
  assert.equal(f.container.querySelector('[role="alert"]'), null);
  await f.advance(1); assert.match(f.container.querySelector('[role="alert"]').textContent, /Quizname konnte gerade nicht bestätigt/);
  assert.equal(request.options.signal.aborted, true); assert.equal(f.listeners(), 0); assert.equal(f.timers.size, 0);
  const html = f.container.innerHTML, count = f.requests.length;
  await f.act(() => { stream.enqueue(new TextEncoder().encode(JSON.stringify({ success: true, identity: { username: 'LATE-PRIVATE', country: 'DE' } }))); stream.close(); });
  assert.equal(f.container.innerHTML, html); assert.equal(f.requests.length, count);
});

test('A successful request at7999ms retires its own timer without cancelling the next request in the same selection', async t => {
  const f = await fixture(t); const oldTimer = [...f.timers.values()][0].callback;
  await f.advance(7999); const start = await f.identified(); assert.equal(start.options.signal.aborted, false);
  await f.act(oldTimer); await f.advance(1);
  assert.equal(start.options.signal.aborted, false); assert.equal(f.container.querySelector('[role="alert"]'), null);
  assert.equal(f.listeners(), 1); const value = f.asking(start); await f.reply(start, { success: true, round: value });
  assert.equal(f.listeners(), 0); assert.match(f.container.textContent, /CURRENT Prüfungsfrage/);
});

test('A successful profile and round remain blind, preserve the30s answer timer and release all transport listeners', async t => {
  const f = await fixture(t); const round = await f.start();
  assert.match(f.container.textContent, /30 Sekunden/); assert.match(f.container.textContent, /CURRENT Prüfungsfrage/);
  assert.equal(f.listeners(), 0); assert.equal([...f.timers.values()].filter(timer => timer.delay === 8000).length, 0);
  assert.doesNotMatch(f.container.textContent, /Richtige Antwort|Erklärung/);
  const before = f.requests.length; await f.advance(29999); assert.equal(f.requests.length, before);
  await f.advance(1); assert.equal(f.requests.length, before + 1); assert.equal(f.requests.at(-1).body.answerId, null); assert.equal(f.requests.at(-1).body.roundId, round.roundId);
  await f.advance(8000); assert.match(f.container.querySelector('[role="alert"]').textContent, /Deine Antwort konnte gerade nicht bestätigt/);
});
