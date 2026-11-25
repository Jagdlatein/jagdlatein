// Actual React/native answer callbacks with isolated DOM/router/storage only.
// Looped answer paths are not reported as hundreds of separate Node tests.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader, local, root: repo } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
const load = createLoader(), selection = load('lib/revier-moment-cases-server.js'), cases = selection.getRevierMomentCases();
const { getRevierMoment, getRevierMomentPreview } = load('lib/revier-moment-server.js');
const review = JSON.parse(fs.readFileSync(path.join(repo, 'data/reviews/revier-moment-simple-2026-11-25.json'), 'utf8'));
const wrap = value => ({ __esModule: true, default: value });
const tick = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };
const stamp = (item, index) => ({ ...item, dateKey: new Date(Date.UTC(2027, 0, 1 + index)).toISOString().slice(0, 10), displayDate: 'Synthetischer Testtag' });
function native(node) { assert.ok(node); const key = Object.keys(node).find(key => key.startsWith('__reactProps$')); assert.ok(key); assert.equal(typeof node[key].onClick, 'function'); return node[key].onClick; }

test('Exactly the independently reviewed60-ID block is selected, with no rewritten question or new factual review date', () => {
  const source = fs.readFileSync(path.join(repo, 'lib/revier-moment-cases-server.js'), 'utf8').replaceAll('\r\n', '\n');
  const blocks = [...source.matchAll(/export const REVIER_MOMENT_IDS = Object\.freeze\(\[[\s\S]*?\n\]\);/g)];
  assert.equal(blocks.length, 1); assert.equal(createHash('sha256').update(blocks[0][0]).digest('hex'), '3b13aa27028b612d026e5b54efd9ba183c2d396f6a3412f5cd41e8e0d6edeb06');
  assert.deepEqual(selection.REVIER_MOMENT_IDS, review.selectedQuestionIds); assert.equal(Object.isFrozen(selection.REVIER_MOMENT_IDS), true);
  assert.equal(cases.length, 60); assert.equal(new Set(cases.map(item => item.question.id)).size, 60);
  assert.equal(new Set(cases.map(item => item.categorySlug)).size, 11);
  const modules = load('lib/learning-curriculum.js').learningModules;
  for (const item of cases) {
    const owner = modules.find(course => course.id === item.topic.id), original = owner.questions.find(question => question.id === item.question.id);
    assert.equal(item.question.prompt, original.q); assert.deepEqual(item.question.options, original.answers); assert.deepEqual(item.question.correctIds, original.correct); assert.equal(item.question.explanation, original.explain);
    assert.equal(item.question.options.length, 4); assert.equal(item.question.correctIds.length, 1); assert.deepEqual([...original.countries].sort(), ['AT', 'CH', 'DE']); assert.notEqual(item.categorySlug, 'jagdrecht');
    assert.ok(item.question.prompt.trim().split(/\s+/).length <= 13); assert.ok(item.question.options.every(option => option.text.trim().split(/\s+/).length <= 9));
    assert.equal(Object.hasOwn(item.question, 'editorialSelectionOn'), false);
  }
  assert.equal(review.editorialSelectionOn, '2026-11-25'); assert.equal(review.replacedOriginalSelectionIds, 53); assert.equal(review.retainedOriginalSelectionIds, 7);
  for (const rejected of ['wissen-ausbau-anwendung-sicherheitszeichen-2026-q1', 'wissen-ausbau-ausruestungsplanung-schichten-2', 'wissen-orientierung-2', 'wissen-ausbau-feldraine-hecken-1', 'wissen-ausbau-biologie-wiederkaeuer-2026-fermentation-q1']) assert.equal(selection.REVIER_MOMENT_IDS.includes(rejected), false);
});

test('The current Swiss date has the reviewed simple Mauser question and the60-day rotation stays unchanged', () => {
  const today = getRevierMoment(new Date('2026-11-25T12:00:00Z'));
  assert.equal(today.question.id, 'wissen-ausbau-federaufbau-funktion-2026-pflege-q1');
  assert.equal(today.question.prompt, 'Welcher Vorgang bezeichnet den Ersatz alter durch neue Federn?');
  assert.equal(today.question.options.find(option => option.id === today.question.correctIds[0]).text, 'Mauser.');
  assert.equal(today.question.reviewedOn, '2026-10-16');
  assert.equal(today.href, '/kurse/wissen-ausbau-federaufbau-funktion-2026#lesson-pflege');
  const start = Date.UTC(2026, 10, 25, 12), days = Array.from({ length: 120 }, (_, index) => getRevierMoment(new Date(start + index * 86400000)));
  assert.equal(new Set(days.slice(0, 60).map(item => item.question.id)).size, 60);
  for (let index = 0; index < 60; index++) { assert.equal(days[index].question.id, days[index + 60].question.id); assert.notEqual(days[index].categorySlug, days[index + 1].categorySlug); }
});

test('All60public previews keep only four safe fields and one simple question CTA, without answer or source payload', () => {
  const Entry = load('components/RevierMomentEntry.js').default;
  for (const [index, item] of cases.entries()) {
    const preview = getRevierMomentPreview(stamp(item, index)); assert.deepEqual(Object.keys(preview), ['dateKey', 'displayDate', 'prompt', 'topicTitle']);
    assert.doesNotMatch(JSON.stringify(preview), /"options"|"correctIds"|"explanation"|"sourceIds"|"sources"|"reading"/);
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Entry, { preview })));
    try { const document = dom.window.document; assert.equal(document.querySelectorAll('a').length, 1); assert.equal(document.querySelector('a').getAttribute('href'), '/tagesquiz'); assert.match(document.querySelector('a').textContent, /Frage beantworten/); assert.match(document.body.textContent, /Wähle eine der vier Antworten/); assert.doesNotMatch(document.body.textContent, /Arbeitshypothese|Löse den Fall|Einordnung mit der/); assert.equal(document.querySelector('button,input,select,img,video'), null); } finally { dom.window.close(); }
  }
});

async function fixture() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://isolated.invalid/tagesquiz' }), saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value }); }
  for (const storage of ['localStorage', 'sessionStorage']) Object.defineProperty(dom.window, storage, { get() { throw Error('No personal storage in daily question tests'); } });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {}; dom.window.scrollTo = () => {};
  const router = { isReady: true, pathname: '/tagesquiz', asPath: '/tagesquiz', query: {} };
  const Component = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': wrap(({ children, href, prefetch, ...props }) => React.createElement('a', { href, ...props })), './LearningToolLayout': wrap(({ title, children }) => React.createElement('main', null, React.createElement('h1', null, title), children)) })('components/RevierMoment.js').default;
  const host = dom.window.document.getElementById('root'), root = local('react-dom/client').createRoot(host);
  return { host, async render(moment) { await React.act(async () => { root.render(React.createElement(Component, { moment })); await tick(); }); }, async invoke(handler) { await React.act(async () => { handler(); await tick(); }); }, async cleanup() { try { await React.act(async () => root.unmount()); dom.window.close(); } finally { for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(global, key, descriptor); else delete global[key]; } } } };
}
function initiallyBlind(host, item) {
  assert.equal(host.querySelector('h1').textContent, 'Reviermoment'); assert.equal(host.querySelector('#revierwissen-tagesfall-title').textContent, 'Deine Frage');
  assert.equal(host.querySelectorAll('.answerOptions button').length, 4); assert.equal(host.querySelectorAll('.answerOptions button:disabled').length, 0);
  assert.equal(host.querySelector('.quizFeedback'), null); assert.equal(host.querySelector('#moment-deeper-title'), null); assert.equal(host.querySelector('.answerCorrect,.answerWrong'), null);
  const source = host.querySelector('#reviermoment-quellen'); assert.equal(source.open, false); assert.equal(source.parentElement.lastElementChild, source);
  assert.equal(host.querySelectorAll('input,select,dialog').length, 0); assert.equal(host.querySelector('h3').textContent, item.question.prompt);
}
function explained(host, item) {
  assert.ok(host.querySelector('.quizFeedback').textContent.includes(item.question.explanation));
  assert.equal(host.querySelectorAll('.answerOptions button:disabled').length, 4);
  const reading = host.querySelector('section[aria-labelledby="moment-deeper-title"]'); assert.ok(reading);
  for (const paragraph of item.reading.paragraphs) assert.ok(reading.textContent.includes(paragraph));
  if (item.reading.takeaway) assert.ok(reading.textContent.includes(item.reading.takeaway));
  assert.equal(reading.querySelector('a').getAttribute('href'), item.href);
  assert.equal(host.querySelector('#reviermoment-quellen').open, false);
}

test('All240real answer paths start blind, grade exactly once and reveal the unchanged full explanation/lesson after the choice', async () => {
  const h = await fixture(); let paths = 0;
  try {
    for (const item of cases) for (const option of item.question.options) {
      await h.render(stamp(item, paths)); initiallyBlind(h.host, item);
      const button = [...h.host.querySelectorAll('.answerOptions button')].find(node => node.textContent === option.text), handler = native(button);
      await h.invoke(handler); explained(h.host, item);
      assert.equal(h.host.querySelectorAll('.answerCorrect').length, 1);
      assert.equal(h.host.querySelector('.answerCorrect').textContent.includes(item.question.options.find(value => value.id === item.question.correctIds[0]).text), true);
      assert.equal(h.host.querySelectorAll('.answerWrong').length, item.question.correctIds.includes(option.id) ? 0 : 1);
      const feedback = h.host.querySelector('.quizFeedback'), text = h.host.textContent; await h.invoke(handler); assert.equal(h.host.querySelector('.quizFeedback'), feedback); assert.equal(h.host.textContent, text); paths++;
    }
    assert.equal(paths, 240);
  } finally { await h.cleanup(); }
});

test('All60conscious skip paths reveal the right answer and full learning text without a learner selection', async () => {
  const h = await fixture(); let paths = 0;
  try {
    for (const [index, item] of cases.entries()) {
      await h.render(stamp(item, index)); initiallyBlind(h.host, item);
      const skip = [...h.host.querySelectorAll('button')].find(node => node.textContent === 'Weiß ich noch nicht'); await h.invoke(native(skip)); explained(h.host, item);
      assert.equal(h.host.querySelectorAll('.answerCorrect').length, 1); assert.equal(h.host.querySelectorAll('.answerWrong').length, 0); assert.match(h.host.querySelector('.quizFeedback').textContent, /Zum Nachlesen und Wiederholen/); assert.doesNotMatch(h.host.querySelector('.quizFeedback').textContent, /Richtig eingeordnet/); paths++;
    }
    assert.equal(paths, 60);
  } finally { await h.cleanup(); }
});
