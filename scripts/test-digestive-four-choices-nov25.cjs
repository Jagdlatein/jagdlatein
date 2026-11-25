// Actual AnatomyExplorer -> DigestiveLearning -> native radios in an isolated
// DOM. No account, external request, real storage, custom viewer or persistence.
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, root: repo, local } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the existing isolated jsdom module.', { cause: error }); }
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const revision = '7dc3a12193323df00d1dc4fb2672176e299655cf';
const load = createLoader({ 'next/image': ({ priority, fill, ...props }) => React.createElement('img', props) });
const current = load('lib/digestive-learning.js'), review = load('data/reviews/digestive-four-choices-2026-11-25.json');
const expected = [
  ['wiederkaeuer-kammern', 0, 'Pansen, Netzmagen, Dünndarm und Labmagen'],
  ['wiederkaeuer-helfer', 1, 'Allein durch körpereigenen Magensaft, ohne mikrobielle Gärung'],
  ['schwein-pansen', 1, 'Ein mehrhöhliger Magen, weil seine Schleimhaut zusammengesetzt ist'],
  ['schwein-mikroben', 2, 'Im Dünndarm des Schweins werden Nährstoffe aufgenommen'],
];
function previous() {
  const source = execFileSync('git', ['show', `${revision}:lib/digestive-learning.js`], { cwd: repo, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: 'digestive-learning.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    assert.equal(id, '../public/lernen/koerper-kreislauf-2026/mediennachweise.json');
    return JSON.parse(execFileSync('git', ['show', `${revision}:public/lernen/koerper-kreislauf-2026/mediennachweise.json`], { cwd: repo, encoding: 'utf8' }).replace(/^\uFEFF/, ''));
  }, module, module.exports);
  return module.exports;
}
const before = previous();

test('The complete released two-topic/four-question export differs only by four exact fourth options, preserving every old source, photo, date and answer index', () => {
  assert.equal(current.digestiveTopics.length, 2);
  assert.deepEqual(current.digestiveTopics.flatMap(topic => topic.questions.map(question => [question.id, question.answer, question.choices[3]])), expected);
  assert.deepEqual(Object.keys(current).sort(), Object.keys(before).sort());
  for (const question of current.digestiveTopics.flatMap(topic => topic.questions)) {
    assert.equal(question.choices.length, 4); assert.equal(new Set(question.choices).size, 4);
    assert.ok(question.answer < 3); assert.notEqual(question.choices[3], question.choices[question.answer]);
  }
  assert.deepEqual(current.digestiveTopics.map(topic => ({ ...topic, questions: topic.questions.map(question => ({ ...question, choices: question.choices.slice(0, 3) })) })), before.digestiveTopics);
  for (const key of Object.keys(before).filter(key => typeof before[key] !== 'function' && key !== 'digestiveTopics')) assert.deepEqual(current[key], before[key], key);
  for (const topic of current.digestiveTopics) assert.equal(current.getDigestiveTopic(topic.id), topic);
  assert.equal(current.getDigestiveTopic('unknown'), current.digestiveTopics[0]);
  assert.equal(current.digestiveReviewedOn, '2026-10-13');
});

test('The dated comparison review retains three false positive-prompt alternatives and one true negative-prompt alternative with two independently read source families each', () => {
  assert.equal(review.checkedOn, '2026-11-25'); assert.equal(review.baselineCommit, revision);
  assert.equal(review.implementationScope.newQuestions, 0); assert.equal(review.implementationScope.sourceObjectsChanged, false); assert.equal(review.implementationScope.mediaChanged, false);
  assert.deepEqual(review.questions.map(item => [item.questionId, item.unchangedAnswerIndex, item.fourthChoice]), expected);
  assert.deepEqual(review.questions.map(item => item.newAlternativeTruth), [false, false, false, true]);
  const sources = new Map(review.sourcesActuallyRead.map(source => [source.id, source]));
  for (const item of review.questions) {
    assert.ok(item.questionDirection && item.whyPlausible && item.whyUnambiguous && item.claimLimit);
    assert.equal(new Set(item.sourceIds.map(id => { assert.ok(sources.has(id)); return sources.get(id).independenceGroup; })).size, item.independentFamilyCount);
    assert.ok(item.independentFamilyCount >= 2);
  }
  assert.match(review.questions.at(-1).questionDirection, /NEGATIVE/);
  assert.match(review.sourcesActuallyRead.find(item => item.id === 'minnesotaHtml').readScope, /403.*successful.*HTML/);
  for (const source of Object.values(current.digestiveSources)) assert.equal(source.reviewedOn, '2026-10-13');
  for (const topic of current.digestiveTopics) assert.equal(topic.reviewedOn, '2026-10-13');
});

async function fixture(topicId = 'wiederkaeuer-verdauung', initialReady = true) {
  const url = id => `/lernen/anatomie?bereich=verdauung&thema=${id}#anatomie-verdauung`;
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'https://jagdlatein.test' + url(topicId) });
  const { window } = dom, saved = new Map(), frames = new Map(); let frame = 0;
  window.requestAnimationFrame = callback => { frames.set(++frame, callback); return frame; };
  window.cancelAnimationFrame = id => frames.delete(id); window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  const router = { isReady: initialReady, asPath: url(topicId), query: { bereich: 'verdauung', thema: topicId } }, requests = [];
  router.push = async (...args) => { requests.push(args); return true; };
  const innerLoad = createLoader({
    'next/router': { useRouter: () => router },
    'next/image': ({ priority, fill, ...props }) => React.createElement('img', props),
    'next/script': () => { throw new Error('The digestive path must not open or load the model viewer'); },
    './LearningToolLayout': { __esModule: true, default: ({ title, children }) => React.createElement('main', null, React.createElement('h1', { 'data-learning-page-start': true, tabIndex: -1 }, title), children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-isolated-menu': true }, children), openPageMenu() {}, closePageMenu() {} },
  });
  const Page = innerLoad('components/AnatomyExplorer.js').default, { createRoot } = local('react-dom/client');
  const host = window.document.getElementById('test-root'), root = createRoot(host); let disposed = false, unmounted = false;
  async function render() { await React.act(async () => root.render(React.createElement(Page))); const jobs = [...frames.values()]; frames.clear(); for (const callback of jobs) callback(); }
  const f = { window, host, router, requests,
    get article() { return host.querySelector('#anatomie-verdauung'); },
    field(questionId) { return [...this.article.querySelectorAll('fieldset')].find(field => field.querySelector('input')?.name === questionId); },
    handler(input, eventName = 'onChange') { return input[Object.keys(input).find(key => key.startsWith('__reactProps'))][eventName]; },
    async select(questionId, index) { const input = this.field(questionId).querySelectorAll('input[type="radio"]')[index]; assert.ok(input); await React.act(async () => input.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); },
    async route(id, ready = true) { router.asPath = url(id); router.query = { bereich: 'verdauung', thema: id }; router.isReady = ready; window.history.replaceState(null, '', router.asPath); await render(); },
    async unmount() { if (unmounted) return; unmounted = true; await React.act(async () => root.unmount()); assert.equal(frames.size, 0); },
    async dispose() { if (disposed) return; disposed = true; await this.unmount(); window.close(); for (const [key, value] of saved) { if (value) Object.defineProperty(global, key, value); else delete global[key]; } },
  };
  await render(); return f;
}

for (const topic of current.digestiveTopics) test(`The actual ready-routed ${topic.id} path keeps both questions blind then grades all four native choices with their exact old explanation`, async () => {
  const f = await fixture(topic.id);
  try {
    assert.equal(f.article.querySelector('h2').textContent, topic.title);
    assert.equal(f.article.querySelectorAll('fieldset').length, 2); assert.equal(f.article.querySelectorAll('input[type="radio"]').length, 8);
    assert.equal(f.article.querySelector('[role="status"]'), null); assert.equal(f.host.querySelector('model-viewer'), null);
    for (const question of topic.questions) {
      const field = f.field(question.id);
      assert.deepEqual([...field.querySelectorAll('label')].map(label => label.textContent), question.choices);
      assert.equal(field.querySelectorAll('input:checked').length, 0);
      for (const index of [3, 0, 1, 2]) {
        await f.select(question.id, index);
        assert.equal(f.field(question.id).querySelector('[role="status"] strong').textContent, index === question.answer ? 'Das passt.' : `Passend ist: ${question.choices[question.answer]}`);
        assert.equal(f.field(question.id).querySelector('[role="status"] p').textContent, question.explanation);
        assert.equal([...f.field(question.id).querySelectorAll('input')].findIndex(input => input.checked), index);
      }
    }
    const evidence = f.article.lastElementChild; assert.equal(evidence.tagName, 'DETAILS'); assert.equal(evidence.open, false);
    assert.ok(f.article.textContent.includes(topic.limit)); assert.equal(f.requests.length, 0);
  } finally { await f.dispose(); }
});

test('The negative pig question deliberately rejects the true new absorption statement and still accepts only the old over-generalisation at index2', async () => {
  const f = await fixture('schwarzwild-verdauung'), question = current.digestiveTopics[1].questions[1];
  try {
    assert.equal(question.prompt, 'Welche Aussage ist fachlich zu pauschal?'); assert.equal(question.answer, 2);
    await f.select(question.id, 3); assert.equal(f.field(question.id).querySelector('[role="status"] strong').textContent, `Passend ist: ${question.choices[2]}`);
    await f.select(question.id, 2); assert.equal(f.field(question.id).querySelector('[role="status"] strong').textContent, 'Das passt.');
    assert.equal(f.field(question.id).querySelector('[role="status"] p').textContent, before.digestiveTopics[1].questions[1].explanation);
  } finally { await f.dispose(); }
});

test('Actual digestive child replacement and unmount retain independent answers; old callbacks cannot answer another topic or a later visit', async () => {
  const f = await fixture(), first = current.digestiveTopics[0].questions[0], stale = f.handler(f.field(first.id).querySelectorAll('input')[3]);
  try {
    await f.select(first.id, 3); assert.ok(f.field(first.id).querySelector('[role="status"]'));
    await f.route('schwarzwild-verdauung'); assert.equal(f.article.querySelector('[role="status"]'), null);
    await React.act(async () => stale()); assert.equal(f.article.querySelector('[role="status"]'), null);
    await f.route('wiederkaeuer-verdauung'); assert.equal(f.article.querySelector('[role="status"]'), null);
    await React.act(async () => stale()); assert.equal(f.article.querySelector('[role="status"]'), null);
    const last = f.handler(f.field(first.id).querySelectorAll('input')[3]);
    await f.unmount(); await React.act(async () => last()); assert.equal(f.requests.length, 0); assert.equal(f.host.textContent, '');
  } finally { await f.dispose(); }
});

test('Unready or invalid URLs cannot expose or operate the retained reader; rollback preserves its answers and sources, while initial invalid entry stays empty and a real topic commit starts blind', async () => {
  const first = current.digestiveTopics[0], second = current.digestiveTopics[1], [answered, unanswered] = first.questions;
  const f = await fixture();
  try {
    await f.select(answered.id, answered.answer);
    const article = f.article, source = article.lastElementChild; source.open = true;
    const oldAnswer = f.handler(f.field(unanswered.id).querySelectorAll('input')[3]);
    const oldMenu = f.handler(f.host.querySelector(`[data-menu-choice="${second.id}"]`), 'onClick');
    function assertRetainedAndHidden() {
      assert.ok(f.article === article, 'A temporary invalid/unready target keeps the same confirmed reader');
      const owner = f.article.parentElement;
      assert.equal(owner.hidden, true); assert.equal(owner.hasAttribute('inert'), true);
      assert.equal(owner.getAttribute('aria-hidden'), 'true'); assert.equal(owner.style.display, 'none');
      assert.equal(f.field(unanswered.id).querySelectorAll('[role="status"]').length, 0);
      assert.equal(f.field(answered.id).querySelectorAll('input')[answered.answer].checked, true);
      assert.ok(f.article.lastElementChild === source); assert.equal(source.open, true);
    }
    await f.route(second.id, false); assertRetainedAndHidden();
    const unreadyAnswer = f.handler(f.field(unanswered.id).querySelectorAll('input')[3]);
    const unreadyMenu = f.handler(f.host.querySelector(`[data-menu-choice="${second.id}"]`), 'onClick');
    await React.act(async () => { oldAnswer(); unreadyAnswer(); oldMenu(); unreadyMenu(); });
    assertRetainedAndHidden(); assert.equal(f.requests.length, 0);
    await f.route('unknown'); assertRetainedAndHidden();
    const invalidAnswer = f.handler(f.field(unanswered.id).querySelectorAll('input')[3]);
    await React.act(async () => { oldAnswer(); invalidAnswer(); oldMenu(); });
    assertRetainedAndHidden(); assert.equal(f.requests.length, 0);
    // A ready-invalid page may deliberately offer a fresh recovery menu. The
    // old learning/menu handlers never gain that new origin's authority.
    await f.route(first.id);
    assert.ok(f.article === article); assert.equal(f.article.parentElement.hidden, false);
    assert.equal(f.article.parentElement.hasAttribute('inert'), false); assert.equal(f.article.parentElement.hasAttribute('aria-hidden'), false);
    assert.equal(f.article.parentElement.style.display, ''); assert.equal(source.open, true);
    assert.equal(f.field(answered.id).querySelectorAll('input')[answered.answer].checked, true);
    await React.act(async () => { oldAnswer(); unreadyAnswer(); invalidAnswer(); oldMenu(); });
    assert.equal(f.field(unanswered.id).querySelectorAll('[role="status"]').length, 0); assert.equal(f.requests.length, 0);
    await f.select(unanswered.id, unanswered.answer); assert.ok(Boolean(f.field(unanswered.id).querySelector('[role="status"]')));
    await f.route(second.id);
    assert.ok(f.article !== article); assert.equal(f.article.parentElement.hidden, false);
    assert.equal(f.article.querySelectorAll('[role="status"]').length, 0); assert.equal(f.article.querySelectorAll('input:checked').length, 0);
    assert.equal(f.article.lastElementChild.open, false); assert.equal(f.requests.length, 0);
  } finally { await f.dispose(); }
  for (const [id, ready] of [[first.id, false], ['unknown', true]]) {
    const initial = await fixture(id, ready);
    try { assert.equal(Boolean(initial.article), false); assert.equal(initial.requests.length, 0); }
    finally { await initial.dispose(); }
  }
  const Component = load('components/DigestiveLearning.js').default;
  for (const topic of current.digestiveTopics) {
    const html = renderToStaticMarkup(React.createElement(Component, { selectedId: topic.id, hideSelector: true })), dom = new JSDOM(html);
    assert.equal(dom.window.document.querySelectorAll('fieldset input[type="radio"]').length, 8);
    assert.equal(dom.window.document.querySelector('[role="status"]'), null); dom.window.close();
  }
});
