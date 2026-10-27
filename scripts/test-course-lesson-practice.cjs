const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const note = { DE: 'Gemeinsames Lernbeispiel.', AT: 'Gemeinsames Lernbeispiel.', CH: 'Gemeinsames Lernbeispiel.' };
const question = (id, lessonId) => ({ id, lessonId, q: 'Frage ' + id, answers: [{ id: 'a', text: 'Richtig ' + id }, { id: 'b', text: 'Falsch ' + id }], correct: ['a'], explain: 'Erklärung ' + id, countries: ['DE', 'AT', 'CH'] });
const moduleData = { id: 'fixture-course', title: 'Isolierter Übungskurs', description: 'Eigene Testdaten.', category: 'Wildkunde', countries: ['DE', 'AT', 'CH'], countryNotes: note,
  objectives: ['Lektionszuordnung prüfen'], sources: [], reviewedOn: '2026-10-16',
  lessons: ['eins', 'zwei', 'ohne-fragen'].map(id => ({ id, title: 'Lektion ' + id, paragraphs: ['Lerntext ' + id], takeaway: 'Merksatz ' + id, exercise: 'Gedankenübung ' + id })),
  questions: [question('q1', 'eins'), question('q2', 'eins'), question('q3', 'zwei')] };
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const handler = node => { assert.ok(node); return node[Object.keys(node).find(key => key.startsWith('__reactProps$'))].onClick; };

async function fixture(t, { lesson = 'eins', ready = true } = {}) {
  const base = '/kurse/' + moduleData.id;
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.invalid' + base + '#lesson-' + lesson });
  const saved = new Map(), progress = [], records = [], scrolls = [], calls = [];
  const menu = { closed: 0 };
  dom.window.HTMLElement.prototype.scrollIntoView = function() { scrolls.push(this.id); };
  dom.window.scrollTo = () => {};
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const router = { isReady: ready, asPath: base + '#lesson-' + lesson, replace(href) { calls.push(href); return new Promise(() => {}); } };
  const wrap = value => ({ __esModule: true, default: value });
  const Course = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': ({ children, href }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname }, children),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
    './PageMenu': { ...wrap(({ children }) => React.createElement('aside', { 'data-lower-menu': true }, children)), closePageMenu() { menu.closed++; } },
    '../lib/learning-media': { getLearningMedia: () => null }, '../hooks/useCourseProgress': (id, state) => { progress.push({ courseId: id, ...state }); return {}; },
    '../lib/daily-review': { recordReviewAnswer: (...args) => records.push(args) },
    './CourseProgressNotice': wrap(() => null),
  })('components/LearningCourse.js').default;
  let root = local('react-dom/client').createRoot(document.getElementById('root'));
  const render = () => React.act(async () => { root.render(React.createElement(Course, { module: moduleData })); await settle(); });
  const act = action => React.act(async () => { action(); await settle(); });
  async function route(hash) { dom.window.history.replaceState(null, '', base + hash); router.asPath = base + hash; await render(); }
  const button = label => [...document.querySelectorAll('button')].find(node => node.textContent === label);
  async function click(label) { const node = button(label); assert.ok(node, label); await act(() => node.click()); }
  async function answer(id, correct = true) { await click((correct ? 'Richtig ' : 'Falsch ') + id); }
  async function advance() { await click(button('Nächste Frage') ? 'Nächste Frage' : 'Ergebnis ansehen'); }
  async function unmount() { if (!root) return; await React.act(async () => root.unmount()); root = null; }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  await render();
  return { router, records, progress, scrolls, calls, menu, act, render, route, click, button, answer, advance, unmount,
    start: () => click('Lektion üben'), text: () => document.querySelector('main').textContent,
    question: () => document.getElementById('current-question')?.textContent,
    lessonButton: () => document.querySelector('[data-course-lesson-practice]') };
}

test('Lesson practice is one lower-menu action in the existing quiz, after complete teaching text and before the closed final sources', async t => {
  const h = await fixture(t);
  assert.equal(h.lessonButton().closest('aside').dataset.lowerMenu, 'true');
  assert.equal(h.lessonButton().dataset.courseLessonPractice, 'eins');
  assert.match(h.lessonButton().getAttribute('aria-label'), /2 Fragen/);
  assert.equal(document.querySelectorAll('#wissenscheck').length, 1);
  assert.equal(document.querySelectorAll('dialog').length, 0);
  assert.equal(document.getElementById('quellen').open, false);
  assert.ok(h.text().indexOf('Lerntext eins') < h.text().indexOf('Alle Quellen dieses Themenbereichs'));
  await h.start();
  assert.equal(h.question(), 'Frage q1'); assert.match(h.text(), /Lektionsübung: Lektion eins/); assert.match(h.text(), /Frage 1 von 2/);
  assert.equal(document.activeElement.id, 'quiz-heading'); assert.equal(h.scrolls.at(-1), 'quiz-heading'); assert.ok(h.menu.closed > 0);
  assert.equal(h.calls.length, 0); assert.equal(document.getElementById('wissenscheck').open, true);
});

test('The exact committed lesson chooses its own questions, while a lesson without questions offers no invented round', async t => {
  const h = await fixture(t, { lesson: 'zwei' });
  await h.start(); assert.equal(h.question(), 'Frage q3'); assert.match(h.text(), /Frage 1 von 1/);
  await h.answer('q3'); await h.advance(); assert.match(h.text(), /Lektionsrunde abgeschlossen/);
  assert.deepEqual(h.records, [['q3', true]]);
  await h.route('#lesson-ohne-fragen'); assert.equal(h.lessonButton(), null);
});

test('Wrong-only and whole-lesson repetition retain the original lesson pool even when another lesson is being read', async t => {
  const h = await fixture(t); await h.start(); await h.answer('q1', false); await h.advance(); await h.answer('q2'); await h.advance();
  await h.route('#lesson-zwei'); await h.click('Nur Fehler üben (1)');
  assert.equal(h.question(), 'Frage q1'); assert.match(h.text(), /Fehlertraining: Lektion eins/); assert.match(h.text(), /Frage 1 von 1/);
  await h.answer('q1'); await h.advance(); await h.click('Lektion wiederholen');
  assert.equal(h.question(), 'Frage q1'); assert.match(h.text(), /Frage 1 von 2/);
  assert.ok(!h.text().includes('Frage 1 von 3')); assert.equal(h.records.some(item => item[0] === 'q3'), false);
});

test('Lesson practice and its errors never overwrite a real full-course completion or best-result input', async t => {
  const h = await fixture(t); await h.click('Wissen prüfen');
  for (const id of ['q1', 'q2', 'q3']) { await h.answer(id); await h.advance(); }
  const completed = h.progress.at(-1); assert.equal(completed.completed, true); assert.equal(completed.score, 3); assert.equal(completed.totalQuestions, 3);
  const startIndex = h.progress.length;
  await h.start(); await h.answer('q1', false); await h.advance(); await h.answer('q2'); await h.advance(); await h.click('Nur Fehler üben (1)'); await h.answer('q1'); await h.advance();
  for (const current of h.progress.slice(startIndex)) assert.deepEqual(current, completed);
  assert.match(h.text(), /Übungsrunde verändert deinen gespeicherten Kursabschluss nicht/);
});

test('Departed lesson and unmounted start/answer actions cannot reset a new round or write review answers', async t => {
  const h = await fixture(t), oldStart = handler(h.lessonButton());
  await h.route('#lesson-zwei'); await h.act(oldStart); assert.equal(h.question(), undefined);
  await h.start(); const oldAnswer = handler(h.button('Richtig q3')); const currentStart = handler(h.lessonButton());
  const before = h.records.length; await h.unmount();
  await h.act(() => { oldAnswer(); currentStart(); }); assert.equal(h.records.length, before);
});

test('Unready and invalid committed lesson addresses cannot start a borrowed lesson pool', async t => {
  const h = await fixture(t, { ready: false }); assert.equal(h.lessonButton().disabled, true);
  await h.act(handler(h.lessonButton())); assert.equal(h.question(), undefined);
  h.router.isReady = true; await h.route('#lesson-does-not-exist'); await h.start(); assert.equal(h.question(), undefined); assert.equal(h.records.length, 0);
});

test('A fresh lesson start reopens/focuses the existing panel, while stale buttons cannot replace or answer the newer round', async t => {
  const h = await fixture(t); await h.start(); const oldAnswer = handler(h.button('Richtig q1')), oldStart = handler(h.lessonButton());
  await h.answer('q1'); await h.advance();
  await h.act(oldStart); assert.equal(h.question(), 'Frage q2');
  await h.start(); await h.act(oldAnswer); assert.equal(h.button('Nächste Frage'), undefined); assert.equal(h.records.length, 1);
  assert.equal(h.question(), 'Frage q1'); assert.equal(document.activeElement.id, 'quiz-heading'); assert.equal(document.querySelectorAll('#wissenscheck').length, 1);
});

test('An actual committed hash before rerender blocks the outgoing lesson start', async t => {
  const h = await fixture(t), outgoing = handler(h.lessonButton());
  window.history.replaceState(null, '', '/kurse/fixture-course#lesson-zwei');
  await h.act(outgoing);
  assert.equal(h.question(), undefined); assert.equal(h.records.length, 0);
  await h.route('#lesson-zwei'); await h.start(); assert.equal(h.question(), 'Frage q3');
});

test('Old next and repeat closures cannot advance or reset a replacement lesson round', async t => {
  const h = await fixture(t); await h.start(); await h.answer('q1');
  const oldNext = handler(h.button('Nächste Frage'));
  await h.start(); await h.act(oldNext);
  assert.equal(h.question(), 'Frage q1'); assert.equal(h.button('Nächste Frage'), undefined);
  await h.answer('q1'); await h.advance(); await h.answer('q2'); await h.advance();
  const oldRepeat = handler(h.button('Lektion wiederholen'));
  await h.route('#lesson-zwei'); await h.start(); await h.act(oldRepeat);
  assert.equal(h.question(), 'Frage q3'); assert.match(h.text(), /Frage 1 von 1/);
});
