// Real routed parent -> ParasiteLearning -> native answer controls, with only
// isolated DOM/router/layout doubles. No account, storage or external request.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, root: repo, local } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the existing isolated jsdom module.', { cause: error }); }
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const revision = 'f1926db0ab56f51fab3a5666dc36b65e756c29d7';
const load = createLoader({ 'next/image': ({ priority, fill, ...props }) => React.createElement('img', props) });
const current = load('lib/parasite-learning.js'), review = load('data/reviews/parasite-four-choices-2026-11-25.json');
const expected = [
  ['trich-stadium', 0, 'Trichinelleneier, die mit verunreinigtem Futter aufgenommen werden'],
  ['trich-foto', 2, 'Ein möglicher Befall wäre dann auf den Darm begrenzt'],
  ['echino-rollen', 0, 'Fuchs und Nager sind beide Endwirte mit erwachsenen Würmern'],
  ['echino-ei', 1, 'Eine an einer Pflanze haftende Metazerkarie'],
  ['fasciola-schnecke-frage', 1, 'Sie ist ein Fehlzwischenwirt, in dem der beschriebene Zyklus endet'],
  ['fasciola-infektioes', 2, 'Eine frisch aus dem Ei geschlüpfte Larve vor dem Befall der Schnecke'],
];
function previous() {
  const source = execFileSync('git', ['show', `${revision}:lib/parasite-learning.js`], { cwd: repo, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: 'parasite-learning.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    assert.equal(id, '../public/lernen/koerper-kreislauf-2026/mediennachweise.json');
    return JSON.parse(execFileSync('git', ['show', `${revision}:public/lernen/koerper-kreislauf-2026/mediennachweise.json`], { cwd: repo, encoding: 'utf8' }).replace(/^\uFEFF/, ''));
  }, module, module.exports);
  return module.exports;
}
const before = previous();

test('Only six exact fourth choices differ from complete released topics; all old objects, source records, dates and answer indices stay exact', () => {
  assert.equal(current.parasiteTopics.length, 3);
  assert.deepEqual(current.parasiteTopics.flatMap(topic => topic.questions.map(question => [question.id, question.answer, question.choices[3]])), expected);
  for (const question of current.parasiteTopics.flatMap(topic => topic.questions)) {
    assert.equal(question.choices.length, 4); assert.equal(new Set(question.choices).size, 4);
    assert.ok(question.answer < 3); assert.notEqual(question.choices[3], question.choices[question.answer]);
  }
  const restored = current.parasiteTopics.map(topic => ({ ...topic, questions: topic.questions.map(question => ({ ...question, choices: question.choices.slice(0, 3) })) }));
  assert.deepEqual(restored, before.parasiteTopics);
  for (const key of Object.keys(before).filter(key => typeof before[key] !== 'function' && key !== 'parasiteTopics')) assert.deepEqual(current[key], before[key], key);
  for (const topic of before.parasiteTopics) assert.deepEqual(current.getParasiteTopic(topic.id), current.parasiteTopics.find(item => item.id === topic.id));
  assert.equal(current.parasiteReviewedOn, '2026-10-13');
  assert.deepEqual(current.getParasiteTopic('unknown'), current.parasiteTopics[0]);
});

test('The new review binds exactly six false comparisons to actually read independent source families without replacing old source or photo dates', () => {
  assert.equal(review.checkedOn, '2026-11-25'); assert.equal(review.baselineCommit, revision);
  assert.equal(review.implementationScope.newQuestions, 0); assert.equal(review.implementationScope.sourceObjectsChanged, false); assert.equal(review.preservation.noNewMedia, true);
  assert.deepEqual(review.questions.map(item => [item.questionId, item.unchangedAnswerIndex, item.fourthChoice]), expected);
  const sources = new Map(review.sourcesActuallyRead.map(source => [source.id, source]));
  for (const item of review.questions) {
    assert.ok(item.whyPlausible && item.whyUnambiguouslyFalseHere && item.claimLimit);
    assert.equal(new Set(item.sourceIds.map(id => { assert.ok(sources.has(id)); return sources.get(id).independenceGroup; })).size, item.sourceFamilyCount);
    assert.ok(item.sourceFamilyCount >= 2);
  }
  assert.match(review.unavailableSourceNotCounted.reason, /403.*HTML.*not counted/);
  for (const source of Object.values(current.parasiteSources)) assert.equal(source.reviewedOn, '2026-10-13');
  for (const topic of current.parasiteTopics) assert.equal(topic.reviewedOn, '2026-10-13');
});

async function fixture(topicId = 'trichinellen') {
  const url = id => `/lernen/wildbret-fallwerkstatt?bereich=parasiten&thema=${id}#wildbret-parasiten`;
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'https://jagdlatein.test' + url(topicId) });
  const { window } = dom, saved = new Map(), frames = new Map(); let frame = 0;
  window.requestAnimationFrame = callback => { frames.set(++frame, callback); return frame; };
  window.cancelAnimationFrame = id => frames.delete(id); window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  const router = { isReady: true, asPath: url(topicId), query: { bereich: 'parasiten', thema: topicId } }, requests = [];
  router.push = async (...args) => { requests.push(args); return true; };
  const innerLoad = createLoader({
    'next/router': { useRouter: () => router },
    'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { href, ...props }, children),
    'next/image': ({ priority, fill, ...props }) => React.createElement('img', props),
    './LearningToolLayout': { __esModule: true, default: ({ title, children }) => React.createElement('main', null, React.createElement('h1', { 'data-learning-page-start': true, tabIndex: -1 }, title), children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-isolated-menu': true }, children), openPageMenu() {}, closePageMenu() {} },
  });
  const Page = innerLoad('components/GameMeatCases.js').default, { createRoot } = local('react-dom/client');
  const host = window.document.getElementById('test-root'), root = createRoot(host); let disposed = false, unmounted = false;
  async function render() { await React.act(async () => root.render(React.createElement(Page))); const jobs = [...frames.values()]; frames.clear(); for (const callback of jobs) callback(); }
  const f = { window, host, router, requests,
    get article() { return host.querySelector('#wildbret-parasiten'); },
    field(questionId) { return [...this.article.querySelectorAll('fieldset')].find(field => field.querySelector('input')?.name === questionId); },
    handler(input) { return input[Object.keys(input).find(key => key.startsWith('__reactProps'))].onChange; },
    async select(questionId, index) { const input = this.field(questionId).querySelectorAll('input[type="radio"]')[index]; assert.ok(input); await React.act(async () => input.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); },
    async route(id, ready = true) { router.asPath = url(id); router.query = { bereich: 'parasiten', thema: id }; router.isReady = ready; window.history.replaceState(null, '', router.asPath); await render(); },
    async unmount() { if (unmounted) return; unmounted = true; await React.act(async () => root.unmount()); assert.equal(frames.size, 0); },
    async dispose() { if (disposed) return; disposed = true; await this.unmount(); window.close(); for (const [key, value] of saved) { if (value) Object.defineProperty(global, key, value); else delete global[key]; } },
  };
  await render(); return f;
}

for (const topic of current.parasiteTopics) test(`The actual ready-routed ${topic.id} child has two blind four-answer questions; fourth answers use the exact old correction and explanation`, async () => {
  const f = await fixture(topic.id);
  try {
    assert.equal(f.article.querySelector('h2').textContent, topic.title);
    assert.equal(f.article.querySelectorAll('fieldset').length, 2); assert.equal(f.article.querySelectorAll('input[type="radio"]').length, 8);
    assert.equal(f.article.querySelector('[role="status"]'), null);
    for (const question of topic.questions) {
      const field = f.field(question.id);
      assert.deepEqual([...field.querySelectorAll('label')].map(label => label.textContent), question.choices);
      assert.equal(field.querySelectorAll('input:checked').length, 0);
      await f.select(question.id, 3);
      assert.equal(f.field(question.id).querySelector('[role="status"] strong').textContent, `Passend ist: ${question.choices[question.answer]}`);
      assert.equal(f.field(question.id).querySelector('[role="status"] p').textContent, question.explanation);
      await f.select(question.id, question.answer);
      assert.equal(f.field(question.id).querySelector('[role="status"] strong').textContent, 'Das passt.');
      assert.equal(f.field(question.id).querySelector('[role="status"] p').textContent, question.explanation);
    }
    const evidence = f.article.lastElementChild; assert.equal(evidence.tagName, 'DETAILS'); assert.equal(evidence.open, false);
    assert.ok(f.article.textContent.includes(topic.limit)); assert.equal(f.requests.length, 0);
  } finally { await f.dispose(); }
});

test('Actual child replacement and unmount retain independent answers; old radio callbacks cannot answer a new topic or a later visit', async () => {
  const f = await fixture(), first = current.parasiteTopics[0].questions[0];
  const stale = f.handler(f.field(first.id).querySelectorAll('input')[3]);
  try {
    await f.select(first.id, 3); assert.ok(f.field(first.id).querySelector('[role="status"]'));
    await f.route('fuchsbandwurm'); assert.equal(f.article.querySelector('[role="status"]'), null);
    await React.act(async () => stale()); assert.equal(f.article.querySelector('[role="status"]'), null);
    await f.route('trichinellen'); assert.equal(f.article.querySelector('[role="status"]'), null);
    await React.act(async () => stale()); assert.equal(f.article.querySelector('[role="status"]'), null);
    const last = f.handler(f.field(first.id).querySelectorAll('input')[3]);
    // An actual page unmount leaves its browser environment alive. Keep that
    // environment until the retained callback has been exercised, then close it.
    await f.unmount(); await React.act(async () => last()); assert.equal(f.requests.length, 0); assert.equal(f.host.textContent, '');
  } finally { await f.dispose(); }
});

test('Unready and invalid parent selections do not substitute a parasite quiz, and genuine direct child SSR keeps all six fourth choices blind', async () => {
  const f = await fixture();
  try { await f.route('fuchsbandwurm', false); assert.equal(f.article, null); await f.route('unknown'); assert.equal(f.article, null); assert.equal(f.requests.length, 0); }
  finally { await f.dispose(); }
  const Component = load('components/ParasiteLearning.js').default;
  for (const topic of current.parasiteTopics) {
    const html = renderToStaticMarkup(React.createElement(Component, { selectedId: topic.id, hideSelector: true }));
    const dom = new JSDOM(html);
    assert.equal(dom.window.document.querySelectorAll('fieldset input[type="radio"]').length, 8);
    assert.equal(dom.window.document.querySelector('[role="status"]'), null); dom.window.close();
  }
});
