// Real React effects and an isolated DOM. No real saved package, account,
// browser, network request or user storage is read or changed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root: repo } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const settle = async () => { for (let n = 0; n < 6; n++) await Promise.resolve(); };
const clone = value => JSON.parse(JSON.stringify(value));
const notes = { CH: 'Eigenes Testmodell.', DE: 'Eigenes Testmodell.', AT: 'Eigenes Testmodell.' };
const model = {
  id: 'offline-feedback-model', title: 'Isolierter Kurs', description: 'Nur eigene Testdaten.', category: 'Wildkunde',
  countries: ['CH', 'DE', 'AT'], countryNotes: notes, objectives: ['Vorhandene Lektion lesen'], sources: [],
  lessons: ['anfang', 'passend', 'andere'].map(id => ({ id, title: `Lektion ${id}`, paragraphs: [`Vollständiger Text ${id}`], takeaway: `Merksatz ${id}`, exercise: `Übung ${id}` })),
  questions: ['eins', 'zwei'].map((id, index) => ({ id, q: `Frage ${id}`, lessonId: index === 0 ? 'passend' : 'andere',
    answers: [{ id: 'ja', text: `Richtig ${id}` }, { id: 'nein', text: `Falsch ${id}` }], correct: ['ja'], explain: `Erklärung ${id}`, countries: ['CH', 'DE', 'AT'] })),
};

function loadReader() {
  const filename = path.join(repo, 'components/OfflineLearning.js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };', {
    filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  });
  const module = { exports: {} }, load = createLoader();
  new Function('require', 'module', 'exports', code)(id => {
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id);
  }, module, module.exports);
  return module.exports.OfflineCourse;
}

async function fixture(t, original = clone(model)) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://offline.invalid/lernen/offline-rucksack#vorher' });
  const saved = new Map(), requests = [], scrolls = [], expirations = [], clock = { now: Date.parse('2026-10-29T18:00:00Z') };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true, fetch: (...args) => { requests.push(args); throw new Error('No request permitted'); } })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const now = Date.now; Date.now = () => clock.now;
  dom.window.scrollTo = options => scrolls.push(options);
  const Component = loadReader();
  let layoutJob = null, revision = 0, visible = true, course = original, expiresAt = clock.now + 60000;
  const onExpired = () => expirations.push('expired');
  function Scene() {
    React.useLayoutEffect(() => { const job = layoutJob; layoutJob = null; job?.(); }, [revision]);
    return React.createElement('main', null, React.createElement('h1', { tabIndex: -1, 'data-learning-page-start': true }, 'Offline-Kurse'),
      visible && React.createElement(Component, { course, expiresAt, onExpired }));
  }
  let root = local('react-dom/client').createRoot(document.getElementById('root'));
  const act = action => React.act(async () => { action(); await settle(); });
  const render = patch => act(() => {
    if (patch?.course) course = patch.course;
    if (patch?.expiresAt !== undefined) expiresAt = patch.expiresAt;
    if (patch?.visible !== undefined) visible = patch.visible;
    layoutJob = patch?.beforePassive || null; revision++; root.render(React.createElement(Scene));
  });
  const props = element => { assert.ok(element); return element[Object.keys(element).find(key => key.startsWith('__reactProps$'))]; };
  const button = label => [...document.querySelectorAll('button')].find(node => node.textContent === label);
  const click = label => act(() => { const node = button(label); assert.ok(node, label); node.click(); });
  const heading = () => document.querySelector('[data-offline-lesson-heading]');
  const read = () => document.querySelector('[data-offline-feedback-lesson]');
  const quiz = () => [...document.querySelectorAll('details')].find(node => node.querySelector('summary')?.textContent === 'Offline-Wissenscheck zum Kurs');
  const select = () => [...document.querySelectorAll('label')].find(node => node.textContent.startsWith('Lektion')).querySelector('select');
  const chooseLesson = index => act(() => props(select()).onChange({ target: { value: String(index) } }));
  async function unmount() { if (!root) return; await act(() => root.unmount()); root = null; }
  t.after(async () => { try { await unmount(); } finally { Date.now = now; dom.window.close(); for (const [key, descriptor] of saved) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; } });
  await render();
  return { act, render, props, click, heading, read, quiz, select, chooseLesson, unmount, scrolls, requests, expirations, clock,
    answer: (id = 'eins', correct = true) => click(`${correct ? 'Richtig' : 'Falsch'} ${id}`) };
}

for (const correct of [true, false]) test(`Explicit reading keeps the ${correct ? 'correct' : 'incorrect'} answer and round while focusing the committed H3 at page top`, async t => {
  const h = await fixture(t), address = window.location.href;
  assert.equal(h.read(), null); assert.equal(h.heading().textContent, 'Lektion anfang');
  await h.answer('eins', correct); assert.ok(h.read()); assert.equal(h.read().textContent, 'Passende Lektion lesen');
  const before = h.quiz().textContent;
  await h.click('Passende Lektion lesen');
  assert.equal(h.heading().textContent, 'Lektion passend'); assert.equal(document.activeElement, h.heading());
  assert.deepEqual(h.scrolls.at(-1), { left: 0, top: 0, behavior: 'instant' });
  assert.equal(h.quiz().textContent, before); assert.equal(window.location.href, address);
  assert.ok([...h.quiz().querySelectorAll('button')].filter(node => node.textContent.startsWith('Richtig') || node.textContent.startsWith('Falsch')).every(node => node.disabled));
  await h.click('Passende Lektion lesen'); assert.equal(h.quiz().textContent, before); assert.equal(h.heading().textContent, 'Lektion passend');
  assert.deepEqual(h.requests, []); assert.deepEqual(h.expirations, []);
});

for (const binding of [undefined, '', 'not-a-lesson', ['passend']]) test(`Invalid lesson binding ${JSON.stringify(binding)} never invents a reading action`, async t => {
  const data = clone(model); data.questions[0].lessonId = binding;
  const h = await fixture(t, data); await h.answer(); assert.equal(h.read(), null);
});

test('An older feedback handler is blocked immediately after Next and after the next question is answered', async t => {
  const h = await fixture(t); await h.answer(); const old = h.props(h.read()).onClick;
  await h.act(() => { h.props([...h.quiz().querySelectorAll('button')].find(node => node.textContent === 'Nächste Frage')).onClick(); old(); });
  assert.equal(h.heading().textContent, 'Lektion anfang'); assert.match(h.quiz().textContent, /Frage 2 von 2 · 1 richtig/); assert.equal(h.scrolls.length, 0);
  await h.answer('zwei'); await h.act(old); assert.equal(h.heading().textContent, 'Lektion anfang');
  await h.click('Passende Lektion lesen'); assert.equal(h.heading().textContent, 'Lektion andere'); assert.match(h.quiz().textContent, /2 von 2 richtig/);
});

test('Repetition invalidates the old action even when it returns to the identical question object', async t => {
  const data = clone(model); data.questions = [data.questions[0]];
  const h = await fixture(t, data); await h.answer(); const old = h.props(h.read()).onClick;
  await h.act(() => { h.props([...h.quiz().querySelectorAll('button')].find(node => node.textContent === 'Noch einmal üben')).onClick(); old(); });
  assert.equal(h.read(), null); assert.equal(h.heading().textContent, 'Lektion anfang'); assert.equal(h.scrolls.length, 0);
  await h.answer(); await h.act(old); assert.equal(h.heading().textContent, 'Lektion anfang');
});

test('Expired feedback cannot change the reading selection or focus and uses the existing expiry callback', async t => {
  const h = await fixture(t); await h.answer(); const old = h.props(h.read()).onClick;
  h.clock.now += 60001; await h.act(old);
  assert.equal(h.heading().textContent, 'Lektion anfang'); assert.equal(h.scrolls.length, 0); assert.deepEqual(h.expirations, ['expired']);
});

test('An unmounted feedback handler neither changes state nor fires expiry or focus', async t => {
  const h = await fixture(t); await h.answer(); const old = h.props(h.read()).onClick;
  await h.unmount(); h.clock.now += 60001; await h.act(old);
  assert.equal(h.scrolls.length, 0); assert.deepEqual(h.expirations, []); assert.equal(document.querySelector('main'), null);
});

test('Course replacement rejects its old action in the commit before passive cleanup', async t => {
  const h = await fixture(t); await h.answer(); const old = h.props(h.read()).onClick;
  const next = clone(model); next.id = 'replacement-course'; next.lessons[0].title = 'Neuer Kursanfang';
  await h.render({ course: next, beforePassive: old });
  assert.equal(h.heading().textContent, 'Neuer Kursanfang'); assert.equal(h.scrolls.length, 0); assert.deepEqual(h.expirations, []);
});

test('A changed package expiry rejects its previous handler before passive effects', async t => {
  const h = await fixture(t); await h.answer(); const old = h.props(h.read()).onClick;
  await h.render({ expiresAt: h.clock.now + 120000, beforePassive: old });
  assert.equal(h.heading().textContent, 'Lektion anfang'); assert.equal(h.scrolls.length, 0); assert.deepEqual(h.expirations, []);
});

test('Replacing the question object alone invalidates its retained handler before passive effects', async t => {
  const data = clone(model), h = await fixture(t, data); await h.answer(); const old = h.props(h.read()).onClick;
  data.questions[0] = { ...data.questions[0], q: 'Neu übernommene Frage' };
  await h.render({ beforePassive: old });
  assert.equal(h.heading().textContent, 'Lektion anfang'); assert.equal(h.scrolls.length, 0);
  await h.click('Passende Lektion lesen'); assert.equal(h.heading().textContent, 'Lektion passend');
});

test('Removing the connected lesson heading blocks an old callback before unmount cleanup', async t => {
  const h = await fixture(t); await h.answer(); const old = h.props(h.read()).onClick;
  await h.render({ visible: false, beforePassive: old });
  assert.equal(h.heading(), null); assert.equal(h.scrolls.length, 0); assert.deepEqual(h.expirations, []);
});

test('Ordinary same-course rerenders and unrelated browser history keep the local reading choice and answered round', async t => {
  const h = await fixture(t); await h.answer(); await h.click('Passende Lektion lesen'); await h.chooseLesson(2);
  const before = h.quiz().textContent, scrollCount = h.scrolls.length;
  window.history.replaceState(null, '', '/lernen/offline-rucksack?test=local#anderer-kontext'); await h.render();
  assert.equal(h.heading().textContent, 'Lektion andere'); assert.equal(h.quiz().textContent, before); assert.equal(h.scrolls.length, scrollCount);
  const address = window.location.href; await h.click('Passende Lektion lesen');
  assert.equal(h.heading().textContent, 'Lektion passend'); assert.equal(h.quiz().textContent, before); assert.equal(window.location.href, address);
});

test('A later local selection cancels pending reading focus and does not reawaken it later', async t => {
  const h = await fixture(t); await h.answer(); const choose = h.props(h.select()).onChange, old = h.props(h.read()).onClick;
  await h.act(() => { old(); choose({ target: { value: '2' } }); });
  assert.equal(h.heading().textContent, 'Lektion andere'); assert.equal(h.scrolls.length, 0);
  await h.chooseLesson(1); assert.equal(h.heading().textContent, 'Lektion passend'); assert.equal(h.scrolls.length, 0);
});
