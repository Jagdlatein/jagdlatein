const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const wrap = value => ({ __esModule: true, default: value });
const question = (id, source) => ({ frage: `Frage ${id}`, antworten: [{ text: `Richtig ${id}`, richtig: true }, { text: `Falsch ${id}`, richtig: false }], ...(source ? { source } : {}) });
const sample = { courseId: 'source-test', questions: [question('eins', 'https://example.invalid/eins'), question('zwei'), question('drei', 'https://example.invalid/drei')], details: { title: 'Isolierter Kurs', description: 'Lerntext zuerst', category: { slug: 'wildkunde', title: 'Wildkunde' }, modules: [{ id: 'wissen-test', title: 'Bestehende Vertiefung' }] }, children: React.createElement('p', null, 'Vollständiger bestehender Lerntext') };

async function fixture(t) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://jagdlatein.invalid/kurse/source-test' });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const calls = [];
  const load = createLoader({ 'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props, prefetch: undefined }, children),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
    './LearningPhoto': { LearningCover: () => null },
    '../hooks/useCourseProgress': (courseId, progress) => { calls.push({ courseId, ...progress }); return {}; },
  });
  const Component = load('components/MiniCourse.js').default;
  const root = local('react-dom/client').createRoot(document.getElementById('root'));
  const act = callback => React.act(async () => { callback(); await Promise.resolve(); });
  t.after(async () => { await act(() => root.unmount()); dom.window.close(); for (const [key, value] of saved) value ? Object.defineProperty(globalThis, key, value) : delete globalThis[key]; });
  const render = props => act(() => root.render(React.createElement(Component, { ...props, key: props.courseId })));
  const button = text => [...document.querySelectorAll('button')].find(node => node.textContent === text);
  const click = async text => { const node = button(text); assert.ok(node, text); assert.equal(node.disabled, false); await act(() => node.click()); };
  const evidence = () => document.querySelector('[data-mini-question-sources]');
  function finalPanel() {
    const panel = evidence(); assert.ok(panel); assert.equal(panel.open, false);
    assert.equal(document.querySelector('main').lastElementChild, panel);
    assert.ok(document.getElementById('mini-related-title').parentElement.compareDocumentPosition(panel) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
    return panel;
  }
  await render(sample);
  return { dom, render, click, button, evidence, finalPanel, calls, act };
}

test('A question source is supplementary, closed and last after an actual answer; learning and feedback come first', async t => {
  const s = await fixture(t); assert.equal(s.evidence(), null);
  assert.match(document.querySelector('[aria-label="Lerninhalt"]').textContent, /Vollständiger bestehender Lerntext/);
  await s.click('Falsch eins');
  const feedback = document.querySelector('[aria-live="polite"]'); assert.match(feedback.textContent, /Richtig eins/); assert.equal(feedback.querySelector('a'), null);
  const panel = s.finalPanel(); assert.equal(panel.querySelector('a').href, sample.questions[0].source);
  assert.equal(panel.querySelector('a').rel, 'noopener noreferrer'); assert.equal(panel.querySelector('a').target, '_blank');
  assert.equal(s.calls.at(-1).answeredQuestions, 1); assert.equal(s.calls.at(-1).score, 0);
});

test('Opening evidence survives an ordinary rerender but question changes cannot carry an open or unrelated source forward', async t => {
  const s = await fixture(t); await s.click('Richtig eins'); s.evidence().open = true;
  await s.render(sample); assert.equal(s.evidence().open, true);
  await s.click('Nächste Frage'); assert.equal(s.evidence(), null);
  await s.click('Richtig zwei'); assert.equal(s.evidence(), null);
  await s.click('Nächste Frage'); await s.click('Richtig drei');
  const panel = s.finalPanel(); assert.deepEqual([...panel.querySelectorAll('a')].map(node => node.href), [sample.questions[2].source]);
  assert.equal(panel.textContent.includes(sample.questions[0].frage), false);
});

test('Completion collects all original question/source pairs once and restart returns to a closed, unanswered view', async t => {
  const s = await fixture(t);
  for (let index = 0; index < sample.questions.length; index++) {
    await s.click(sample.questions[index].antworten[0].text);
    if (s.evidence()) s.evidence().open = true;
    await s.click(index === sample.questions.length - 1 ? 'Ergebnis ansehen' : 'Nächste Frage');
  }
  const panel = s.finalPanel(); assert.deepEqual([...panel.querySelectorAll('a')].map(node => node.href), sample.questions.filter(item => item.source).map(item => item.source));
  assert.equal(document.querySelector('[aria-labelledby="mini-result-title"]').querySelector('a[href^="https:"]'), null);
  assert.match(document.getElementById('mini-related-title').parentElement.textContent, /Bestehende Vertiefung/);
  await s.click('Mini-Kurs wiederholen'); assert.equal(s.evidence(), null); assert.equal(s.calls.at(-1).answeredQuestions, 0);
  await s.click('Richtig eins'); s.finalPanel();
});

test('A source-free course produces no empty evidence window, even at completion', async t => {
  const s = await fixture(t); const props = { ...sample, courseId: 'source-free', questions: [question('ohne')] };
  await s.render(props); assert.equal(s.evidence(), null); await s.click('Richtig ohne'); assert.equal(s.evidence(), null);
  await s.click('Ergebnis ansehen'); assert.equal(s.evidence(), null); assert.ok(document.getElementById('mini-result-title'));
});

test('All 34 actual mini courses keep their 122 questions, original source pairs and existing related-course links', async t => {
  const s = await fixture(t), load = createLoader();
  const { miniCourses } = load('lib/course-catalog.js'); let count = 0;
  assert.equal(miniCourses.length, 34);
  for (const course of miniCourses) {
    const page = load(`pages/kurse/${course.id}.js`), props = page.default(page.getStaticProps().props).props;
    await s.render(props); assert.equal(s.evidence(), null);
    for (let index = 0; index < props.questions.length; index++) {
      const item = props.questions[index]; await s.click(item.antworten.find(answer => answer.richtig).text);
      if (item.source) assert.equal(s.finalPanel().querySelector('a').href, item.source); else assert.equal(s.evidence(), null);
      await s.click(index === props.questions.length - 1 ? 'Ergebnis ansehen' : 'Nächste Frage'); count++;
    }
    const expected = props.questions.filter(item => item.source).map(item => item.source);
    assert.deepEqual([...(s.evidence()?.querySelectorAll('a') || [])].map(node => node.href), expected);
    if (expected.length) s.finalPanel();
    for (const module of props.details.modules) assert.ok(document.querySelector(`a[href="/kurse/${module.id}"]`));
    assert.equal(s.calls.at(-1).answeredQuestions, props.questions.length); assert.equal(s.calls.at(-1).score, props.questions.length);
  }
  assert.equal(count, 122);
});
