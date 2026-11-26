const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { createRoot } = local('react-dom/client');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
const seed = 'isolated_ui_seed', revision = '0123456789abcdef';
const highscoreKey = 'jagdlatein-revierduell-highscore-v1';
const questions = Array.from({ length: 7 }, (_, i) => ({
  id: `fixture-${i}`, categorySlug: `thema-${i}`, courseTitle: `Lernkontext ${i + 1}`,
  prompt: `Isolierte Testfrage ${i + 1}?`, options: ['a', 'b', 'c', 'd'].map(id => ({ id, text: `Antwort ${id.toUpperCase()}` })),
  correctIds: ['a'], explanation: `Unveränderte Erklärung ${i + 1}.`, sourceScope: i % 2 ? 'course' : 'lesson',
  reviewedOn: '2026-10-04', sources: [{ id: 'shared-source-id', title: `Originalnachweis ${i + 1}`, url: `https://example.invalid/original-${i}` }],
  href: `/kurse/isolierter-kurs-${i}#lesson-fixture-${i}`,
}));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function reactHandler(node, name = 'onClick') { const key = Object.keys(node).find(value => value.startsWith('__reactProps$')); assert.ok(key, 'real React DOM props exist'); return node[key][name]; }

async function harness({ path = `/revierduell?duell=${seed}&v=${revision}`, ready = true, overrides = {}, storage, consent, analyticsEnabled = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.de' + path });
  const descriptors = new Map();
  const assign = (key, value) => { descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); };
  let time = 1000, timerId = 0, blocked = false, currentConsent = consent || { known: false, enabled: false, accountKey: null, consentVersion: null };
  const timers = new Map(), subscribers = new Set(), events = [], pushes = [], scrolls = [], writes = [];
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'KeyboardEvent']) assign(key, dom.window[key]);
  assign('IS_REACT_ACT_ENVIRONMENT', true);
  const originalPerformance = globalThis.performance;
  assign('performance', new Proxy(originalPerformance, { get: (target, key) => key === 'now' ? () => time : typeof Reflect.get(target, key, target) === 'function' ? Reflect.get(target, key, target).bind(target) : Reflect.get(target, key, target) }));
  assign('setInterval', (callback, delay) => { assert.equal(delay, 250); const id = ++timerId; timers.set(id, callback); return id; });
  assign('clearInterval', id => timers.delete(id));
  dom.window.HTMLElement.prototype.scrollIntoView = function(options) { scrolls.push({ id: this.id, options }); };
  if (storage) Object.defineProperty(dom.window, 'localStorage', { configurable: true, get: () => storage });
  const storageObject = dom.window.localStorage;
  if (!storage && storageObject) {
    const original = storageObject.setItem.bind(storageObject);
    Object.defineProperty(storageObject, 'setItem', { configurable: true, value: (key, value) => { writes.push([key, value]); original(key, value); } });
  }
  const queryFor = raw => { const query = {}; for (const [key, value] of new URL(raw, 'https://jagdlatein.de').searchParams) query[key] = Object.hasOwn(query, key) ? [...(Array.isArray(query[key]) ? query[key] : [query[key]]), value] : value; return query; };
  const router = { isReady: ready, asPath: path, pathname: '/revierduell', query: queryFor(path), push: async value => { pushes.push(value); return false; } };
  const engine = createLoader()('lib/revierduell.js');
  const requestSelection = query => ({ seedQuery: engine.normaliseDuellSeed(query.duell), targetQuery: engine.parseDuellTarget(query.ziel), revisionQuery: engine.normaliseDuellRevision(query.v) });
  let props = { seed, revision, target: null, questions, unavailable: false, analyticsEnabled, requestSelection: requestSelection(router.query), initialRawPath: path.split('#')[0], ...overrides };
  const load = createLoader({
    'next/router': { useRouter: () => router },
    'next/link': { __esModule: true, default: ({ children, href, prefetch, ...other }) => React.createElement('a', { href, 'data-prefetch': String(prefetch), ...other }, children) },
    './LearningToolLayout': { __esModule: true, default: ({ children, title, headingOnly, hideCommunity, className }) => React.createElement('main', { className, 'data-heading-only': String(headingOnly), 'data-hide-community': String(hideCommunity) }, React.createElement('h1', {}, title), children) },
    '../lib/usage-analytics': { usagePreferenceClient: { getSnapshot: () => currentConsent, isBlocked: () => blocked, subscribe: callback => { subscribers.add(callback); return () => subscribers.delete(callback); } } },
    '../lib/revierduell-analytics': { emitDuellAnalytics: (name, options) => { if (options.enabled && options.isCurrent()) { events.push({ name, options }); return true; } return false; } },
  });
  const Component = load('components/RevierDuell.js').default, root = createRoot(dom.window.document.getElementById('root'));
  const act = fn => React.act(async () => { await fn?.(); await Promise.resolve(); await Promise.resolve(); });
  const render = async extra => { props = { ...props, ...extra }; await act(() => root.render(React.createElement(Component, props))); };
  const text = () => dom.window.document.body.textContent;
  const button = label => [...dom.window.document.querySelectorAll('button')].find(node => node.textContent.trim() === label);
  const click = async node => { assert.ok(node, 'button exists'); await act(() => node.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))); };
  const key = async (value, options = {}, target = dom.window) => act(() => target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options })));
  const settle = async fn => act(fn);
  const setPath = raw => { dom.window.history.replaceState(null, '', raw); router.asPath = raw; router.query = queryFor(raw); };
  const answerButtons = () => [...dom.window.document.querySelectorAll('[role="group"] button')];
  const finish = async () => { if (button('Duell starten')) await click(button('Duell starten')); for (let i = 0; i < 7; i++) { await key('1'); await key('Enter'); } assert.ok(dom.window.document.getElementById('revierduell-result')); };
  const close = async () => { await act(() => root.unmount()); dom.window.close(); for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; };
  await render();
  return { dom, router, render, act, settle, text, button, click, key, setPath, answerButtons, finish, close, events, pushes, scrolls, timers, writes,
    setTime: value => { time = value; }, time: () => time,
    tick: () => act(() => { for (const callback of [...timers.values()]) callback(); }),
    consent: value => act(() => { currentConsent = value; for (const callback of subscribers) callback(); }),
    blocked: value => { blocked = value; }, props: () => props, selection: () => requestSelection(router.query),
  };
}

test('Revierduell DOM: seven questions, four answers, manual feedback, sources last and unchanged inherited dates', async () => {
  const h = await harness({ path: `/revierduell?duell=${seed}&ziel=0&v=${revision}`, overrides: { target: 0 } });
  try {
    assert.equal(h.dom.window.document.querySelector('main').dataset.headingOnly, 'true');
    assert.equal(h.dom.window.document.querySelector('main').dataset.hideCommunity, 'true');
    assert.match(h.text(), /0 Punkte schlagen/); assert.equal(h.dom.window.document.getElementById('revierduell-quellen'), null);
    await h.click(h.button('Duell starten'));
    for (let i = 0; i < 7; i++) {
      assert.equal(h.dom.window.document.getElementById('revierduell-question').textContent, `Isolierte Testfrage ${i + 1}?`);
      assert.equal(h.answerButtons().length, 4); assert.equal(h.dom.window.document.activeElement.id, 'revierduell-question');
      assert.match(h.text(), new RegExp(`Lernkontext ${i + 1}`));
      await h.key('1'); assert.ok(h.answerButtons().every(node => node.disabled));
      assert.match(h.text(), /Deine richtige Antwort/); assert.match(h.text(), new RegExp(`Unveränderte Erklärung ${i + 1}`));
      const link = h.dom.window.document.querySelector(`a[href="${questions[i].href}"]`); assert.equal(link.dataset.prefetch, 'false');
      h.setTime(h.time() + 20000); await h.tick(); assert.match(h.text(), new RegExp(`Frage ${i + 1} von 7`), 'feedback never auto-advances');
      await h.key('Enter');
    }
    assert.match(h.text(), /Wissensfuchs/); assert.match(h.text(), /8['’]330 Punkte/); assert.match(h.text(), /7 von 7/); assert.match(h.text(), /Challenge gewonnen/);
    const details = h.dom.window.document.getElementById('revierduell-quellen'); assert.equal(details.open, false); assert.equal(details.querySelectorAll('section').length, 7);
    assert.equal(details.querySelectorAll('time[datetime="2026-10-04"]').length, 7); assert.match(details.textContent, /keine zusätzliche Einzelzuordnung/);
    assert.equal(details.querySelectorAll('a[rel="noopener noreferrer"]').length, 7); assert.equal(h.dom.window.document.querySelector('[data-revierduell-reader]').lastElementChild, details);
    assert.equal(h.dom.window.localStorage.getItem(highscoreKey), '8330'); assert.equal(h.dom.window.document.activeElement.id, 'revierduell-result');
    assert.equal(h.events.length, 0, 'default has no analytics');
  } finally { await h.close(); }
});

test('Revierduell DOM: readiness, exact raw identity, SSR selection and initial hash semantics', async () => {
  const h = await harness({ ready: false });
  try {
    const staleStart = reactHandler(h.button('Duell starten')); await h.act(() => staleStart()); assert.equal(h.dom.window.document.getElementById('revierduell-question'), null);
    h.router.isReady = true; await h.render(); await h.click(h.button('Duell starten')); assert.match(h.text(), /Frage 1 von 7/);
    const oldAnswer = reactHandler(h.answerButtons()[0]); h.setPath(`/revierduell?duell=${seed}&v=${revision}&q=changed`);
    await h.act(() => oldAnswer()); assert.equal(h.dom.window.document.querySelector('.feedback'), null);
    await h.render(); assert.equal(h.dom.window.document.querySelector('[data-revierduell-reader]').hidden, true);
    h.setPath(`/revierduell?duell=${seed}&v=${revision}#oberer-rand`);
    await h.render({ initialRawPath: `/revierduell?duell=${seed}&v=${revision}` }); assert.equal(h.dom.window.document.querySelector('[data-revierduell-reader]').hidden, false);
    const hashAnswer = reactHandler(h.answerButtons()[0]); h.dom.window.history.replaceState(null, '', `/revierduell?duell=${seed}&v=${revision}#anderer-rand`);
    await h.act(() => hashAnswer()); assert.equal(h.dom.window.document.querySelector('.feedback'), null);
  } finally { await h.close(); }
});

test('Revierduell DOM: bare and explicitly invalid seeds retain fresh SSR round without URL replacement', async () => {
  for (const path of ['/revierduell', '/revierduell?duell=&ziel=700', '/revierduell?duell=a&duell=b&ziel=10']) {
    const h = await harness({ path });
    try { assert.equal(h.dom.window.document.querySelector('[data-revierduell-reader]').hidden, false); await h.click(h.button('Duell starten')); assert.match(h.text(), /Frage 1 von 7/); assert.equal(h.pushes.length, 0); assert.equal(h.dom.window.location.pathname + h.dom.window.location.search, path); }
    finally { await h.close(); }
  }
});

test('Revierduell DOM: delayed visibility/focus timers expire once, keep feedback and reset streak', async () => {
  const h = await harness();
  try {
    await h.click(h.button('Duell starten')); await h.key('1'); await h.key('Enter'); assert.match(h.text(), /Serie 1/);
    const lateAnswer = reactHandler(h.answerButtons()[0]); h.setTime(h.time() + 12000);
    await h.act(() => h.dom.window.document.dispatchEvent(new h.dom.window.Event('visibilitychange')));
    assert.match(h.text(), /Zeit abgelaufen/); assert.match(h.text(), /Serie 0/); assert.match(h.text(), /\+0 Punkte/);
    await h.act(() => lateAnswer()); await h.tick(); await h.act(() => h.dom.window.dispatchEvent(new h.dom.window.Event('focus')));
    assert.match(h.text(), /Frage 2 von 7/); assert.equal(h.dom.window.document.querySelectorAll('.feedback').length, 1);
    await h.key('Enter'); const next = reactHandler(h.answerButtons()[0]); h.setTime(h.time() + 12001); await h.act(() => next()); assert.match(h.text(), /Zeit abgelaufen/);
  } finally { await h.close(); }
});

test('Revierduell DOM: keyboard ignores repeats, modifiers and editable fields; wrong answer remains explicit', async () => {
  const h = await harness();
  try {
    await h.click(h.button('Duell starten')); await h.key('1', { repeat: true }); await h.key('1', { ctrlKey: true }); await h.key('1', { altKey: true }); await h.key('1', { metaKey: true });
    const input = h.dom.window.document.createElement('input'); h.dom.window.document.body.append(input); await h.key('1', {}, input);
    for (const tag of ['button', 'a', 'summary']) { const outside = h.dom.window.document.createElement(tag); h.dom.window.document.body.append(outside); await h.key('1', {}, outside); outside.remove(); }
    const dialog = h.dom.window.document.createElement('div'); dialog.setAttribute('role', 'dialog'); h.dom.window.document.body.append(dialog); await h.key('1', {}, dialog); dialog.remove();
    assert.ok(h.answerButtons().every(node => !node.disabled)); await h.key('2');
    assert.match(h.text(), /Deine Antwort/); assert.match(h.text(), /Richtige Antwort/); assert.match(h.text(), /\+0 Punkte/);
    assert.equal(h.answerButtons().length, 4); assert.equal(h.dom.window.document.querySelector('.feedback h3').getAttribute('role'), 'status');
    await h.key('Enter', { repeat: true }); assert.match(h.text(), /Frage 1 von 7/); await h.key('Enter'); assert.match(h.text(), /Frage 2 von 7/);
  } finally { await h.close(); }
});

test('Revierduell DOM: retained answer/next handlers and final controls cannot act in another round', async () => {
  const h = await harness();
  try {
    await h.click(h.button('Duell starten')); const answer = reactHandler(h.answerButtons()[0]); await h.key('1'); const next = reactHandler(h.button('Nächste Frage')); await h.key('Enter');
    await h.act(() => { answer(); next(); }); assert.match(h.text(), /Frage 2 von 7/); assert.ok(h.answerButtons().every(node => !node.disabled));
    for (let i = 1; i < 7; i++) { await h.key('1'); await h.key('Enter'); }
    const oldNew = reactHandler(h.button('Neue Runde')), oldRestart = reactHandler(h.button('Diese Runde nochmals'));
    await h.click(h.button('Diese Runde nochmals')); await h.act(() => { oldNew(); oldRestart(); });
    assert.ok(h.button('Duell starten')); assert.equal(h.pushes.length, 0); assert.equal(h.dom.window.localStorage.getItem(highscoreKey), '8330');
  } finally { await h.close(); }
});

test('Revierduell DOM: native-share cancellation never copies; failed share leaves a manual read-only URL', async () => {
  const h = await harness();
  try {
    await h.finish(); let copied = 0, shared;
    Object.defineProperty(h.dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: async () => copied++ } });
    Object.defineProperty(h.dom.window.navigator, 'share', { configurable: true, value: async value => { shared = value; throw Object.assign(new Error('cancel'), { name: 'AbortError' }); } });
    await h.click(h.button('Challenge teilen')); assert.equal(copied, 0); assert.match(h.text(), /Teilen abgebrochen/);
    const url = new URL(shared.url); assert.equal(url.searchParams.get('duell'), seed); assert.equal(url.searchParams.get('v'), revision); assert.equal(url.searchParams.get('ziel'), '8330');
    assert.equal(h.dom.window.document.querySelector('input[readonly]').value, shared.url);
    Object.defineProperty(h.dom.window.navigator, 'share', { configurable: true, value: async () => { throw Error('blocked'); } });
    await h.click(h.button('Challenge teilen')); assert.equal(copied, 0); assert.match(h.text(), /Du kannst ihn unten kopieren/);
    await h.click(h.button('Link kopieren')); assert.equal(copied, 1); assert.match(h.text(), /Challenge-Link kopiert/);
  } finally { await h.close(); }
});

test('Revierduell DOM: share promise owners block parallel/stale controls and ignore replaced payloads', async () => {
  const h = await harness({ analyticsEnabled: true, consent: { known: true, enabled: true, accountKey: 'fixture-account', consentVersion: 'fixture-v1' } });
  try {
    await h.finish(); const share = deferred(); let copied = 0;
    Object.defineProperty(h.dom.window.navigator, 'share', { configurable: true, value: () => share.promise });
    Object.defineProperty(h.dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: async () => copied++ } });
    const oldShare = reactHandler(h.button('Challenge teilen')), oldRestart = reactHandler(h.button('Diese Runde nochmals')), oldNew = reactHandler(h.button('Neue Runde'));
    await h.act(() => { oldShare(); oldRestart(); oldNew(); oldShare(); });
    assert.ok(h.dom.window.document.getElementById('revierduell-result')); assert.equal(h.pushes.length, 0);
    const changed = questions.map((question, index) => index === 0 ? { ...question, prompt: 'Neu übernommene Frage?' } : question);
    await h.render({ questions: changed }); assert.ok(h.button('Duell starten'));
    await h.settle(() => share.resolve()); assert.equal(copied, 0); assert.doesNotMatch(h.text(), /Challenge geteilt/); assert.equal(h.events.filter(event => event.name === 'revierduell_share').length, 0);
    await h.act(() => oldNew()); assert.equal(h.pushes.length, 0);
  } finally { await h.close(); }
});

test('Revierduell DOM: successful delayed share and clipboard survive same-owner parent renders', async () => {
  const h = await harness({ analyticsEnabled: true, consent: { known: true, enabled: true, accountKey: 'isolated-account', consentVersion: 'v1' } });
  try {
    await h.finish(); const share = deferred(), copy = deferred();
    Object.defineProperty(h.dom.window.navigator, 'share', { configurable: true, value: () => share.promise });
    Object.defineProperty(h.dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: () => copy.promise } });
    await h.click(h.button('Challenge teilen')); assert.equal(h.button('Challenge teilen').disabled, true);
    await h.render({ linkNotice: 'Isolierte Statusänderung.' }); assert.equal(h.button('Challenge teilen').disabled, true); assert.ok(h.dom.window.document.querySelector('input[readonly]'));
    await h.settle(() => share.resolve()); assert.match(h.text(), /Challenge geteilt/); assert.equal(h.button('Challenge teilen').disabled, false);
    assert.equal(h.events.filter(event => event.name === 'revierduell_share').length, 1);
    await h.click(h.button('Link kopieren')); await h.render({ linkNotice: '' }); assert.equal(h.button('Link kopieren').disabled, true);
    await h.settle(() => copy.resolve()); assert.match(h.text(), /Challenge-Link kopiert/); assert.equal(h.button('Link kopieren').disabled, false);
    assert.equal(h.events.filter(event => event.name === 'revierduell_copy').length, 1);
    assert.equal(h.events.filter(event => event.name === 'revierduell_view').length, 1, 'same owner rerenders do not duplicate views');
  } finally { await h.close(); }
});

test('Revierduell DOM: clipboard fallback, unavailable clipboard and after-unmount promise continuations', async () => {
  const h = await harness(); let closed = false;
  try {
    await h.finish(); await h.click(h.button('Challenge teilen')); assert.match(h.text(), /Kopiere den Link aus dem Feld/);
    const copy = deferred(); Object.defineProperty(h.dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: () => copy.promise } });
    const oldNew = reactHandler(h.button('Neue Runde')); await h.click(h.button('Link kopieren'));
    await h.close(); closed = true; await h.settle(() => { copy.resolve(); oldNew(); }); assert.equal(h.pushes.length, 0);
  } finally { if (!closed) await h.close(); }
});

test('Revierduell DOM: new-round push failures are visible and never optimistically replace selection', async () => {
  const h = await harness();
  try {
    await h.finish(); const push = deferred(); h.router.push = value => { h.pushes.push(value); return push.promise; };
    const oldShare = reactHandler(h.button('Challenge teilen')); await h.click(h.button('Neue Runde')); await h.act(() => oldShare());
    assert.match(h.pushes[0], /^\/revierduell\?duell=d1_[a-f0-9]{32}$/); assert.ok(h.dom.window.document.getElementById('revierduell-result')); assert.equal(h.dom.window.document.querySelector('input[readonly]'), null);
    await h.settle(() => push.resolve(false)); assert.match(h.text(), /Neue Runde konnte nicht geladen werden/i); assert.ok(!h.button('Neue Runde').disabled);
    h.router.push = async () => { throw Error('route rejected'); }; await h.click(h.button('Neue Runde')); assert.match(h.text(), /Bitte versuche es erneut/);
  } finally { await h.close(); }
});

test('Revierduell DOM: old route new-round rejection cannot write to the newer committed round', async () => {
  const h = await harness();
  try {
    await h.finish(); const push = deferred(); h.router.push = () => push.promise; await h.click(h.button('Neue Runde'));
    h.setPath(`/revierduell?duell=new_seed&v=${revision}`); await h.render({ seed: 'new_seed', initialRawPath: h.router.asPath, requestSelection: h.selection() });
    await h.settle(() => push.reject(Error('old rejection'))); assert.ok(h.button('Duell starten')); assert.doesNotMatch(h.text(), /konnte nicht geladen/);
  } finally { await h.close(); }
});

test('Revierduell DOM: source mismatch notice has no engine initialization; secure-random failure stays visible', async () => {
  const h = await harness({ overrides: { unavailable: true, questions: [], target: null } });
  try {
    assert.match(h.text(), /Challenge ist nicht mehr verfügbar/); assert.equal(h.button('Duell starten'), undefined);
    Object.defineProperty(h.dom.window.crypto, 'getRandomValues', { configurable: true, value: () => { throw Error('denied'); } });
    await h.click(h.button('Neue Runde starten')); assert.match(h.text(), /sichere neue Runde ist hier nicht verfügbar/); assert.equal(h.pushes.length, 0);
  } finally { await h.close(); }
});

test('Revierduell DOM: storage denial never prevents play, invalid stored scores cannot become a record', async () => {
  const denied = await harness({ storage: { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } } });
  try { assert.match(denied.text(), /Bestwert ist hier nicht dauerhaft verfügbar/); await denied.finish(); assert.match(denied.text(), /8['’]330 Punkte/); } finally { await denied.close(); }
  const invalid = await harness({ storage: { getItem: () => '99999', setItem: (key, value) => { assert.equal(key, highscoreKey); assert.equal(value, '8330'); } } });
  try { assert.doesNotMatch(invalid.text(), /99.?999/); await invalid.finish(); } finally { await invalid.close(); }
});

test('Revierduell DOM: existing higher valid record remains and only owned highscore key is written', async () => {
  const writes = [], h = await harness({ storage: { getItem: key => { assert.equal(key, highscoreKey); return '8330'; }, setItem: (...value) => writes.push(value) } });
  try { await h.click(h.button('Duell starten')); for (let i = 0; i < 7; i++) { await h.key('2'); await h.key('Enter'); } assert.equal(writes.length, 0); assert.match(h.text(), /8['’]330 Punkte/); assert.match(h.text(), /0 von 7/); } finally { await h.close(); }
});

test('Revierduell DOM: named analytics require flag plus current account consent, view resumes after opt-in', async () => {
  const h = await harness({ analyticsEnabled: true });
  try {
    assert.equal(h.events.length, 0); await h.click(h.button('Duell starten')); assert.equal(h.events.length, 0);
    const consent = { known: true, enabled: true, accountKey: 'isolated-account', consentVersion: 'fixture-v1' }; await h.consent(consent);
    assert.deepEqual(h.events.map(event => event.name), ['revierduell_view']); await h.consent(consent); assert.equal(h.events.length, 1);
    await h.key('1'); assert.deepEqual(h.events.map(event => event.name), ['revierduell_view', 'revierduell_answer']);
    assert.deepEqual(Object.keys(h.events[0].options).sort(), ['enabled', 'isCurrent']);
    await h.consent({ ...consent, enabled: false }); assert.ok(h.events.every(event => event.options.isCurrent() === false));
    await h.consent(consent); assert.equal(h.events.filter(event => event.name === 'revierduell_view').length, 2);
    await h.key('Enter'); assert.equal(h.events.filter(event => event.name === 'revierduell_question_view').length, 1);
    h.setPath(`/revierduell?duell=${seed}&v=${revision}#changed`); assert.ok(h.events.every(event => event.options.isCurrent() === false));
  } finally { await h.close(); }
});

test('Revierduell DOM: anonymous or migration-disabled analytics emit nothing even with complete play', async () => {
  for (const options of [{ analyticsEnabled: false, consent: { known: true, enabled: true, accountKey: 'fixture', consentVersion: 'v1' } }, { analyticsEnabled: true, consent: { known: true, enabled: true, accountKey: null, consentVersion: 'v1' } }]) {
    const h = await harness(options); try { await h.finish(); assert.equal(h.events.length, 0); } finally { await h.close(); }
  }
});
