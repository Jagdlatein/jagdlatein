// Real React lifecycles; only synthetic questions, device storage and API responses.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const review = createLoader()('lib/daily-review.js');
const destinations = createLoader()('lib/login-destination.js');
const base = '/lernen/fuenf-minuten';
const questions = ['wildkunde', 'hundewesen'].map((category, index) => ({
  id: `wissen-return-${index}`, category, q: `Synthetische Frage ${index}?`,
  answers: ['a', 'b', 'c', 'd'].map(id => ({ id, text: `Antwort ${index}/${id}` })),
  correct: ['a'], explain: `Vorhandene Erklärung ${index}.`, courseTitle: 'Synthetischer Kurs',
  href: `/kurse/wissen-synthetic#lesson-${index}`, sources: [],
}));
const settle = async () => { for (let index = 0; index < 15; index++) await Promise.resolve(); };
function deferred() { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; }
function address(query, hash = '') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  return base + (params.size ? `?${params}` : '') + hash;
}
async function fixture(t, { query = {}, ready = true, hash = '' } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.invalid' + address(query, hash) });
  const saved = new Map(), requests = [], writes = [];
  let history = review.parseReviewHistory(null);
  for (const question of questions) history = review.updateReviewHistory(history, question.id, false, Date.now() - 3600000, `seed-${question.id}`);
  const records = new Map([[review.REVIEW_STORAGE_KEY, JSON.stringify(history)]]);
  const storage = {
    getItem(key) { assert.equal(key, review.REVIEW_STORAGE_KEY); return records.get(key) ?? null; },
    setItem(key, value) { assert.equal(key, review.REVIEW_STORAGE_KEY); records.set(key, value); writes.push(['save', value]); },
    removeItem(key) { assert.equal(key, review.REVIEW_STORAGE_KEY); records.delete(key); writes.push(['remove']); },
  };
  Object.defineProperty(dom.window, 'localStorage', { value: storage, configurable: true });
  dom.window.scrollTo = () => {};
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const router = { isReady: ready, query, asPath: address(query, hash), push() { throw new Error('No navigation is expected'); } };
  const fetcher = (url, options) => { const operation = { url, options, ...deferred() }; requests.push(operation); return operation.promise; };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, fetch: fetcher, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const wrap = value => ({ __esModule: true, default: value });
  const Component = createLoader({
    'next/router': { useRouter: () => router },
    'next/link': ({ href, children }) => React.createElement('a', { href }, children),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
    './PageMenu': { ...wrap(({ children }) => React.createElement('aside', null, children)), openPageMenu() {}, closePageMenu() {} },
  })('components/DailyReview.js').default;
  let root = local('react-dom/client').createRoot(document.getElementById('root'));
  const act = action => React.act(async () => { action?.(); await settle(); });
  const render = () => act(() => root.render(React.createElement(Component, { pool: questions.map(({ id, category }) => ({ id, category })) })));
  const ids = (index = requests.length - 1) => new URL(requests[index].url, 'https://example.invalid').searchParams.get('ids').split(',');
  const button = text => [...document.querySelectorAll('button')].find(node => node.textContent === text);
  async function click(text) { const target = button(text); assert.ok(target, text); await act(() => target.click()); }
  async function respond(index = requests.length - 1, status = 200) {
    await act(() => requests[index].resolve({ ok: status === 200, status, json: async () => status === 200 ? { questions: ids(index).map(id => questions.find(question => question.id === id)) } : { message: `Isolierter Zugriff ${status}` } }));
  }
  async function route(nextQuery, nextReady = true, nextHash = '') {
    router.query = nextQuery; router.isReady = nextReady; router.asPath = address(nextQuery, nextHash);
    dom.window.history.replaceState(null, '', router.asPath); await render();
  }
  async function finishWrong() {
    const order = ids();
    for (const [index, id] of order.entries()) {
      const question = questions.find(item => item.id === id);
      await click(question.answers.find(answer => answer.id === 'b').text);
      await click(index + 1 === order.length ? 'Runde abschließen' : 'Nächste Frage');
    }
  }
  t.after(async () => {
    if (root) { await act(() => root.unmount()); root = null; }
    dom.window.close();
    for (const [key, value] of saved) if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key];
  });
  await render();
  return { router, requests, writes, records, act, render, ids, click, respond, route, finishWrong, text: () => document.querySelector('main').textContent };
}
function recovery(status, expected) {
  const link = document.querySelector(`a[href^="${status === 401 ? '/login?' : '/preise?'}"]`);
  assert.ok(link, `Expected recovery link for ${status}`);
  const next = new URL(link.getAttribute('href'), 'https://jagdlatein.invalid').searchParams.get('next');
  assert.equal(next, expected);
  assert.equal(destinations.getNextUrl(next), expected);
  assert.equal(destinations.getLoginDestination(next, { paid: true }), expected);
  const unpaid = destinations.getLoginDestination(next, { paid: false });
  assert.equal(new URL(unpaid, 'https://jagdlatein.invalid').searchParams.get('next'), expected);
}

test('Initial 401/403 recovery retains only the validated canonical review selection', async t => {
  const cases = [
    [{}, base],
    [{ modus: 'gemischt' }, base],
    [{ modus: 'fehler', kategorie: 'hundewesen' }, base + '?modus=fehler&kategorie=hundewesen'],
    [{ modus: 'faellig', kategorie: 'wildkunde' }, base + '?modus=faellig&kategorie=wildkunde'],
    [{ kategorie: 'wildkunde' }, base + '?kategorie=wildkunde'],
    [{ modus: 'fehler' }, base + '?modus=fehler'],
    [{ modus: 'gemischt', kategorie: 'hundewesen', email: 'private@example.invalid', next: 'https://example.invalid/', quelle: ['a', 'b'] }, base + '?kategorie=hundewesen'],
  ];
  for (const status of [401, 403]) for (const [query, expected] of cases) await t.test(`${status}: ${expected}`, async t => {
    const h = await fixture(t, { query, hash: '#private-anchor' });
    await h.respond(0, status); recovery(status, expected);
    assert.deepEqual(h.writes, []);
    assert.deepEqual([...new URL(h.requests[0].url, 'https://example.invalid').searchParams.keys()], ['ids']);
  });
});

test('Mistake-repeat 401/403 recovery keeps the same selection and completed reading without a new storage write', async t => {
  for (const status of [401, 403]) for (const mode of ['fehler', 'faellig']) await t.test(`${status}: ${mode}`, async t => {
    const h = await fixture(t, { query: { modus: mode, kategorie: 'hundewesen' } });
    await h.respond(); await h.finishWrong();
    const before = h.writes.length;
    await h.click('Diese Fehler üben'); await h.respond(1, status);
    recovery(status, `${base}?modus=${mode}&kategorie=hundewesen`);
    assert.match(h.text(), /0 von 1 richtig/); assert.match(h.text(), /Vorhandene Erklärung 1/);
    assert.equal(h.writes.length, before);
  });
});

test('A late old access error cannot publish its recovery target in a changed selection', async t => {
  const h = await fixture(t, { query: { modus: 'fehler', kategorie: 'wildkunde' } });
  await h.route({ modus: 'faellig', kategorie: 'hundewesen', email: 'private@example.invalid' }, true, '#anderes-ziel');
  assert.equal(h.requests[0].options.signal.aborted, true);
  await h.respond(0, 401); assert.equal(document.querySelector('main [role="alert"] a'), null);
  await h.respond(1, 403); recovery(403, base + '?modus=faellig&kategorie=hundewesen');
  assert.deepEqual(h.writes, []);
});

test('A late mistake-repeat access error cannot replace the successor round or its recovery target', async t => {
  const h = await fixture(t, { query: { modus: 'fehler', kategorie: 'wildkunde' } });
  await h.respond(); await h.finishWrong(); await h.click('Diese Fehler üben');
  const before = h.writes.length;
  await h.route({ modus: 'faellig', kategorie: 'hundewesen' });
  assert.equal(h.requests[1].options.signal.aborted, true);
  await h.respond(1, 401); assert.equal(document.querySelector('main [role="alert"] a'), null);
  await h.respond(2, 403); recovery(403, base + '?modus=faellig&kategorie=hundewesen');
  assert.equal(h.writes.length, before);
});

test('Readiness and invalid repeated selection fields never expose a fallback access target', async t => {
  const h = await fixture(t, { query: { modus: 'fehler', kategorie: 'hundewesen' }, ready: false });
  assert.equal(h.requests.length, 0); assert.equal(document.querySelector('main [role="alert"] a'), null);
  for (const query of [{ modus: ['fehler', 'faellig'] }, { modus: 'unbekannt' }, { kategorie: ['wildkunde', 'hundewesen'] }, { kategorie: 'jagdrecht' }]) {
    await h.route(query); assert.equal(h.requests.length, 0); assert.equal(document.querySelector('main [role="alert"] a'), null);
  }
  await h.route({ modus: 'fehler', kategorie: 'hundewesen' }); await h.respond(0, 401);
  recovery(401, base + '?modus=fehler&kategorie=hundewesen'); assert.deepEqual(h.writes, []);
});
