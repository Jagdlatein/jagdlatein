// Actual React/DOM and progress hook; only synthetic storage, timers and fetch.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root: repo } = require('./helpers/project-module.cjs');
const React = local('react'), { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const swc = local('next/dist/build/swc'), review = createLoader()('lib/daily-review.js');
const props = node => { assert.ok(node); return node[Object.keys(node).find(key => key.startsWith('__reactProps$'))]; };
const settle = async () => { for (let n = 0; n < 8; n++) await Promise.resolve(); };
const notes = Object.fromEntries(['DE', 'AT', 'CH'].map(id => [id, 'Isoliertes Lernbeispiel.']));
const course = { id: 'wissen-lifetime-test', title: 'Isolierter Kurs', description: 'Keine echten Kontodaten.', category: 'Wildkunde', countries: ['DE', 'AT', 'CH'], countryNotes: notes, objectives: ['Vorhandenes Wissen lesen'], sources: [], reviewedOn: '2026-10-16',
  lessons: ['eins', 'zwei'].map(id => ({ id, title: 'Lektion ' + id, paragraphs: ['Vollständiger Lerntext ' + id], takeaway: 'Merksatz', exercise: 'Papierübung' })),
  questions: ['eins', 'zwei'].map(id => ({ id: 'wissen-lifetime-' + id, lessonId: id, q: 'Vorhandene Frage ' + id, answers: ['a', 'b', 'c', 'd'].map(key => ({ id: key, text: id + '/' + key })), correct: ['a'], explain: 'Vollständige Erklärung ' + id, countries: ['DE', 'AT', 'CH'] })) };

async function fixture(t) {
  const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.invalid/kurse/' + course.id + '#wissenscheck' });
  const saved = new Map(), requests = [], timers = new Map(), writes = [], listeners = new Map([['storage', new Set()], ['jagdlatein-account-deleted', new Set()]]); let timerId = 0;
  const add = dom.window.addEventListener.bind(dom.window), remove = dom.window.removeEventListener.bind(dom.window);
  dom.window.addEventListener = (type, callback, ...rest) => { listeners.get(type)?.add(callback); return add(type, callback, ...rest); };
  dom.window.removeEventListener = (type, callback, ...rest) => { listeners.get(type)?.delete(callback); return remove(type, callback, ...rest); };
  dom.window.HTMLElement.prototype.scrollIntoView = () => {}; dom.window.scrollTo = () => {};
  const originalSet = dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.setItem = function(key, value) { writes.push({ key, value }); return originalSet.call(this, key, value); };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true }); }
  const progressModule = { exports: {} }, filename = path.join(repo, 'hooks/useCourseProgress.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', 'fetch', code)(id => id === 'react' ? React : id === '../lib/daily-review' ? review : (() => { throw Error('Unexpected hook dependency'); })(), progressModule, progressModule.exports,
    callback => { const id = ++timerId; timers.set(id, callback); return id; }, id => timers.delete(id),
    (url, init) => new Promise((resolve, reject) => requests.push({ url, init, payload: JSON.parse(init.body), resolve, reject })));
  const wrap = value => ({ __esModule: true, default: value }), router = { isReady: true, asPath: '/kurse/' + course.id + '#wissenscheck' };
  const Component = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': ({ children, href }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname }, children), './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)), './PageMenu': { ...wrap(({ children }) => React.createElement('aside', null, children)), closePageMenu() {} }, '../lib/learning-media': { getLearningMedia: () => null }, '../hooks/useSelectionPageStart': wrap(() => ({ focusSelection() {}, cancelSelectionFocus() {} })), '../hooks/useCourseProgress': progressModule.exports.default })('components/LearningCourse.js').default;
  let probeState;
  function ProgressProbe({ id, state, beforeEffects }) {
    probeState = progressModule.exports.default(id, state);
    React.useLayoutEffect(() => { beforeEffects?.(); }, [id]);
    return React.createElement('p', null, probeState.error?.code || 'No current error');
  }
  let reactRoot = local('react-dom/client').createRoot(document.getElementById('root'));
  const act = action => React.act(async () => { action(); await settle(); });
  const unmount = async () => { if (reactRoot) { await React.act(async () => { reactRoot.unmount(); await settle(); }); reactRoot = null; } };
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, value] of saved) value ? Object.defineProperty(globalThis, key, value) : delete globalThis[key]; });
  const render = () => act(() => reactRoot.render(React.createElement(Component, { module: course })));
  await render();
  const button = text => [...document.querySelectorAll('button')].find(node => node.textContent === text);
  const answer = (id = 'eins') => props([...document.querySelectorAll('[aria-labelledby="current-question"] button')].find(node => node.textContent === id + '/a')).onClick;
  function event(kind, fields = {}) { return kind === 'account-deleted' ? new dom.window.Event('jagdlatein-account-deleted') : new dom.window.StorageEvent('storage', { key: kind === 'clear' ? null : review.REVIEW_STORAGE_KEY, newValue: null, storageArea: dom.window.localStorage, ...fields }); }
  return { dom, act, render, requests, timers, writes, listeners, router, button, answer, unmount, event, text: () => document.querySelector('main').textContent,
    probe: () => probeState,
    renderProbe: (id, state, beforeEffects) => act(() => reactRoot.render(React.createElement(ProgressProbe, { id, state, beforeEffects }))),
    start: () => act(() => button('Wissen prüfen').click()),
    remove(kind) { if (kind === 'clear') dom.window.localStorage.clear(); else dom.window.localStorage.removeItem(review.REVIEW_STORAGE_KEY); dom.window.dispatchEvent(event(kind)); },
    flush: () => act(() => { for (const [id, callback] of [...timers]) { timers.delete(id); callback(); } }),
    route: async hash => { dom.window.history.replaceState(null, '', '/kurse/' + course.id + hash); router.asPath = '/kurse/' + course.id + hash; await render(); } };
}

for (const kind of ['remove', 'clear', 'account-deleted']) test('Removal pauses the course before paint and blocks retained answer/start/practice: ' + kind, async t => {
  const h = await fixture(t); const oldStart = props(h.button('Wissen prüfen')).onClick, oldPractice = props(h.button('Lektion üben')).onClick;
  await h.start(); const oldAnswer = h.answer();
  h.dom.window.localStorage.setItem('jagdlatein.flashcards.v1', 'preserved-device-ratings'); h.dom.window.localStorage.setItem('unrelated-notes', 'preserved-notes');
  const before = h.writes.length;
  await h.act(() => { h.remove(kind); oldAnswer(); oldStart(); oldPractice(); });
  assert.equal(h.dom.window.localStorage.getItem(review.REVIEW_STORAGE_KEY), null); assert.equal(h.writes.length, before);
  assert.match(h.text(), /Die Übungsrunde wurde geschlossen/); assert.ok(h.text().includes('Vollständiger Lerntext eins')); assert.equal(h.button('Lektion üben').disabled, true);
  assert.equal(document.getElementById('current-question'), null); assert.equal(h.timers.size, 0); assert.equal(h.requests.length, 0);
  const reopen = [...document.querySelectorAll('a')].find(node => node.textContent === 'Kurs erneut öffnen');
  assert.equal(reopen.getAttribute('href'), '/kurse/' + course.id + '#lesson-eins'); assert.equal(props(reopen).onClick, undefined, 'Real anchor delegates fresh page access to the existing server guard');
  if (kind !== 'clear') { assert.equal(h.dom.window.localStorage.getItem('jagdlatein.flashcards.v1'), 'preserved-device-ratings'); assert.equal(h.dom.window.localStorage.getItem('unrelated-notes'), 'preserved-notes'); }
  await h.route('#lesson-zwei'); assert.ok(h.text().includes('Vollständiger Lerntext zwei')); assert.equal(h.button('Lektion üben').disabled, true);
  await h.act(() => { oldAnswer(); oldStart(); oldPractice(); }); await h.unmount(); assert.equal(h.requests.length, 0);
});

for (const kind of ['remove', 'clear', 'account-deleted']) test('Removal cancels queued progress, its retained timer and the normal unmount flush: ' + kind, async t => {
  const h = await fixture(t); await h.start(); await h.act(() => h.answer()());
  assert.equal(h.timers.size, 1); const retainedTimer = [...h.timers.values()][0], next = props(h.button('Nächste Frage')).onClick;
  await h.act(() => { h.remove(kind); retainedTimer(); next(); });
  assert.equal(h.timers.size, 0); assert.equal(h.requests.length, 0);
  await h.unmount(); assert.equal(h.requests.length, 0);
});

for (const outcome of ['success', 'failure']) test('Removal aborts dispatched work and rejects late ' + outcome + ' without replaying a queued newer answer', async t => {
  const h = await fixture(t); await h.start(); await h.act(() => h.answer()()); await h.flush(); assert.equal(h.requests.length, 1);
  await h.act(() => h.button('Nächste Frage').click()); await h.act(() => h.answer('zwei')());
  assert.equal(h.requests.length, 1, 'Newer completed payload waits for the first response');
  const retainedResult = props(h.button('Ergebnis ansehen')).onClick;
  await h.act(() => { h.remove('account-deleted'); retainedResult(); }); assert.equal(h.requests[0].init.signal.aborted, true);
  await h.act(() => outcome === 'success' ? h.requests[0].resolve({ ok: true, status: 200 }) : h.requests[0].reject(Error('isolated late failure')));
  assert.equal(h.requests.length, 1); assert.equal(h.button('Erneut speichern'), undefined); assert.match(h.text(), /Die Übungsrunde wurde geschlossen/);
  await h.unmount(); assert.equal(h.requests.length, 1);
});

test('A captured retry cannot restore cleared pending/latest state or send after removal/unmount', async t => {
  const h = await fixture(t); await h.start(); await h.act(() => h.answer()()); await h.flush();
  await h.act(() => h.requests[0].resolve({ ok: false, status: 503 })); const retry = props(h.button('Erneut speichern')).onClick;
  await h.act(() => { h.remove('remove'); retry(); }); assert.equal(h.requests.length, 1); assert.equal(h.button('Erneut speichern'), undefined);
  await h.unmount(); await h.act(retry); assert.equal(h.requests.length, 1);
});

test('Normal history updates, unrelated removals and sessionStorage events preserve the current round and queued save', async t => {
  const h = await fixture(t); await h.start(); await h.act(() => h.answer()());
  await h.act(() => { h.dom.window.dispatchEvent(h.event('remove', { newValue: '{"version":1,"entries":{}}' })); h.dom.window.dispatchEvent(h.event('remove', { key: 'unrelated-notes' })); h.dom.window.dispatchEvent(h.event('remove', { storageArea: h.dom.window.sessionStorage })); });
  assert.ok(!h.text().includes('Die Übungsrunde wurde geschlossen')); assert.equal(h.button('Lektion üben').disabled, false); assert.equal(h.timers.size, 1);
  await h.flush(); assert.equal(h.requests.length, 1); assert.equal(h.requests[0].payload.answeredQuestions, 1);
  await h.act(() => h.requests[0].resolve({ ok: true, status: 200 }));
});

test('An ordinary route unmount still flushes the newest already given answer once', async t => {
  const h = await fixture(t); await h.start(); await h.act(() => h.answer()()); assert.equal(h.requests.length, 0);
  await h.unmount(); assert.equal(h.requests.length, 1); assert.equal(h.requests[0].init.keepalive, true); assert.equal(h.requests[0].payload.courseId, course.id);
  assert.equal(h.listeners.get('storage').size, 1); assert.equal(h.listeners.get('jagdlatein-account-deleted').size, 1);
  await h.act(() => h.requests[0].resolve({ ok: true, status: 200 })); assert.equal(h.requests.length, 1);
  assert.equal(h.listeners.get('storage').size, 0); assert.equal(h.listeners.get('jagdlatein-account-deleted').size, 0);
});

for (const kind of ['remove', 'clear', 'account-deleted']) test('A leaving in-flight context still observes ' + kind + ' and cannot send its second queued payload', async t => {
  const h = await fixture(t); await h.start(); await h.act(() => h.answer()()); await h.flush();
  await h.act(() => h.button('Nächste Frage').click()); await h.act(() => h.answer('zwei')()); assert.equal(h.requests.length, 1);
  await h.unmount(); assert.equal(h.listeners.get('storage').size, 1); assert.equal(h.listeners.get('jagdlatein-account-deleted').size, 1);
  h.remove(kind); assert.equal(h.requests[0].init.signal.aborted, true);
  await h.act(() => h.requests[0].resolve({ ok: true, status: 200 })); assert.equal(h.requests.length, 1);
  assert.equal(h.listeners.get('storage').size, 0); assert.equal(h.listeners.get('jagdlatein-account-deleted').size, 0);
});

test('Ordinary in-flight progress remains serialized and sends the latest completed payload', async t => {
  const h = await fixture(t); await h.start(); await h.act(() => h.answer()()); await h.flush();
  await h.act(() => h.button('Nächste Frage').click()); await h.act(() => h.answer('zwei')()); assert.equal(h.requests.length, 1);
  await h.act(() => h.requests[0].resolve({ ok: true, status: 200 })); assert.equal(h.requests.length, 2);
  assert.deepEqual(h.requests.map(item => item.payload.answeredQuestions), [1, 2]); assert.equal(h.requests[1].payload.completed, true);
  await h.act(() => h.requests[1].resolve({ ok: true, status: 200 })); await h.unmount(); assert.equal(h.requests.length, 2);
});

test('A reused progress hook blocks the old course retry before effects and stops its leaving queue on removal', async t => {
  const h = await fixture(t), state = { started: true, answeredQuestions: 1, totalQuestions: 3, score: 1, completed: false };
  await h.renderProbe('scope-a', state); await h.flush(); assert.equal(h.requests.length, 1);
  const oldRetry = h.probe().retry;
  await h.renderProbe('scope-a', { ...state, answeredQuestions: 2, score: 2 });
  let callsBeforeEffects;
  await h.renderProbe('scope-b', { ...state, started: false }, () => { oldRetry(); callsBeforeEffects = h.requests.length; });
  assert.equal(callsBeforeEffects, 1); assert.equal(h.requests.length, 1);
  await h.act(() => h.remove('account-deleted')); await h.act(() => h.requests[0].resolve({ ok: true, status: 200 }));
  assert.equal(h.requests.length, 1);
  await h.renderProbe('scope-b', { ...state, completed: true }); await h.flush(); assert.equal(h.requests.length, 1);
  await h.unmount(); assert.equal(h.listeners.get('storage').size, 0); assert.equal(h.listeners.get('jagdlatein-account-deleted').size, 0);
});

test('Ordinary course changes preserve leave-flush and keep an old failure/retry out of its successor, including A-B-A', async t => {
  const h = await fixture(t), state = { started: true, answeredQuestions: 1, totalQuestions: 3, score: 1, completed: false };
  await h.renderProbe('scope-a', state); const oldRetry = h.probe().retry;
  await h.renderProbe('scope-b', state); assert.equal(h.requests.length, 1); assert.equal(h.requests[0].payload.courseId, 'scope-a');
  await h.flush(); assert.equal(h.requests.length, 2); assert.equal(h.requests[1].payload.courseId, 'scope-b');
  await h.act(() => h.requests[1].resolve({ ok: true, status: 200 }));
  await h.act(() => h.requests[0].reject(Error('isolated old failure'))); assert.equal(h.probe().error, null);
  await h.renderProbe('scope-a', { ...state, started: false }); await h.act(oldRetry); assert.equal(h.requests.length, 2);
  await h.unmount(); assert.equal(h.requests.length, 2); assert.equal(h.listeners.get('storage').size, 0);
});
