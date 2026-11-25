// Actual shared-goal data and actual plan renderer; isolated SSR only.
// No customer account, browser storage, external API or network connection.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'C:/Users/Hanne/Documents/Codex/2026-10-03/referenced-chatgpt-conversation-this-is-an/work/dein-moment-qa/dom-deps/node_modules/jsdom');
const load = createLoader(), props = load('pages/lernen/pruefungsplan.js').getStaticProps().props;
const { getExamGoalOptions, readExamGoalFocus, examPlanGoalHref } = load('lib/exam-goal-focus.js');
const { examCountries, examProfileLawHref } = load('lib/exam-profile.js');
const { getCategoryExamTransfer, getExamTransferGoals } = load('lib/exam-transfer-goals-server.js');
const allGoals = props.examBlueprint.categories.flatMap(category => category.goals.map(goal => ({ category, goal })));
const wrap = value => ({ __esModule: true, default: value });

function render(query, profile = null, ready = true) {
  let calls = 0;
  const router = { isReady: ready, asPath: '/lernen/pruefungsplan?' + new URLSearchParams(query), query };
  const ui = createLoader({
    'next/head': () => null, 'next/router': { useRouter: () => router },
    'next/link': wrap(({ children, href, prefetch, scroll, ...rest }) => React.createElement('a', { href, ...rest }, children)),
    './LearningToolLayout': wrap(({ title, children }) => React.createElement('main', null, React.createElement('h1', { 'data-learning-page-start': '' }, title), children)),
    './PageMenu': { ...wrap(({ children }) => React.createElement('aside', { 'data-lower-menu': '' }, children)), closePageMenu() { calls++; }, openPageMenu() { calls++; } },
    '../components/PageMenu': { closePageMenu() { calls++; }, openPageMenu() { calls++; } },
    '../lib/use-exam-profile': wrap(() => ({ profile, ready: true, persistence: 'session', accountKey: null, saving: false, saveProfile() { assert.fail('Reading must not save a target'); }, clearProfile() { assert.fail('Reading must not clear a target'); } })),
    '../lib/use-exam-review-progress': wrap(() => ({ phase: 'ready', summary: { byCategory: {}, total: { answered: 0, due: 0, mistakes: 0 } } })),
  });
  const markup = renderToStaticMarkup(React.createElement(ui('components/ExamStudyPlan.js').default, props));
  assert.equal(calls, 0, 'Static reading must not trigger menu or navigation side effects');
  return new JSDOM(markup);
}

test('All48 real task URLs open exactly the intended complete goal, closed self-check and exact final source subset', () => {
  assert.equal(allGoals.length, 48);
  for (const { category, goal } of allGoals) {
    const href = examPlanGoalHref(category.slug, goal.id), parsed = new URL(href, 'https://test.invalid');
    assert.equal(parsed.pathname, '/lernen/pruefungsplan'); assert.equal(parsed.hash, '#exam-plan-learning');
    assert.deepEqual([...parsed.searchParams.keys()], ['kategorie', 'lernziel']);
    const dom = render(Object.fromEntries(parsed.searchParams));
    try {
      const document = dom.window.document, section = document.querySelector('section[aria-labelledby="exam-plan-learning"]');
      const goals = [...section.querySelectorAll('li.examGoal')]; assert.equal(goals.length, 1); assert.equal(goals[0].querySelector('h4').textContent, goal.title);
      assert.ok(goals[0].textContent.includes(goal.task)); if (goal.caseText) assert.ok(goals[0].textContent.includes(goal.caseText));
      assert.equal(goals[0].querySelector('details').open, false);
      for (const other of allGoals.filter(item => item.goal.id !== goal.id)) assert.ok(!section.textContent.includes(other.goal.task));
      const sources = document.getElementById('exam-plan-sources'); assert.ok(sources); assert.equal(sources.open, false); assert.equal(sources.parentElement.lastElementChild, sources);
      const actual = [...sources.querySelectorAll('section[aria-labelledby="exam-plan-goal-sources"] > ul > li > a')].map(node => node.getAttribute('href'));
      assert.deepEqual(actual, props.examBlueprint.sources.filter(source => goal.sourceIds.includes(source.id)).map(source => source.url));
      assert.equal(document.querySelectorAll('[data-lower-menu]').length, 1); assert.ok(document.querySelector('#exam-plan-goal'));
    } finally { dom.window.close(); }
  }
});

test('Every existing transfer entry and central search result now points to its exact existing task, without changing the task catalog', () => {
  const entries = getExamTransferGoals(); assert.equal(entries.length, 12);
  for (const { slug, goal } of entries) {
    const summary = getCategoryExamTransfer(slug), url = new URL(summary.href, 'https://test.invalid');
    assert.equal(url.searchParams.get('kategorie'), slug); assert.equal(url.searchParams.get('lernziel'), goal.id);
    assert.deepEqual(Object.keys(summary).sort(), ['caseText', 'href', 'title']);
    const result = load('lib/learning-search.js').searchLearning({ query: goal.title, category: slug, type: 'practice' }).results.find(item => item.id === `exam-transfer:${goal.id}`);
    assert.ok(result); assert.equal(result.href, summary.href); assert.equal(result.title, goal.title);
  }
});

test('A focused law goal keeps exact selected regional destinations for all51 targets and offers none without a valid target', () => {
  const goal = props.examBlueprint.categories.find(category => category.slug === 'jagdrecht').goals.at(-1);
  const query = { kategorie: 'jagdrecht', lernziel: goal.id }; let count = 0;
  for (const country of examCountries) for (const region of country.regions) {
    count++; const profile = { country: country.code, region: region.code }, dom = render(query, profile);
    try {
      const entry = dom.window.document.querySelector('li.examGoal');
      const hrefs = [...entry.querySelectorAll('a')].map(node => node.getAttribute('href'));
      assert.ok(hrefs.includes(examProfileLawHref(profile))); assert.ok(hrefs.includes(examProfileLawHref(profile, 'uebung')));
      assert.ok(!hrefs.includes(goal.href)); assert.ok(!entry.textContent.includes('Kurscheck'));
    } finally { dom.window.close(); }
  }
  assert.equal(count, 51);
  for (const profile of [null, { country: 'DE', region: 'ZH' }]) {
    const dom = render(query, profile);
    try { const entry = dom.window.document.querySelector('li.examGoal'); assert.ok(![...entry.querySelectorAll('a')].some(node => node.getAttribute('href').startsWith('/jagdrecht/'))); assert.match(entry.textContent, /Wähle dein Prüfungsziel/); }
    finally { dom.window.close(); }
  }
});

test('Task metadata is a small public projection; malformed, duplicate, foreign and incompatible selections fail closed', () => {
  const choices = getExamGoalOptions(props.examBlueprint, props.data.categories, 'alle'); assert.equal(choices.length, 48);
  assert.ok(choices.every(choice => Object.keys(choice).sort().join(',') === 'categorySlug,id,title'));
  assert.equal(readExamGoalFocus(undefined, choices), 'alle'); assert.equal(readExamGoalFocus('alle', choices), 'alle');
  for (const value of ['', [], [choices[0].id], 'missing-id', '../escape', {}, null]) assert.equal(readExamGoalFocus(value, choices), null);
  for (const category of props.data.categories) {
    const scoped = getExamGoalOptions(props.examBlueprint, props.data.categories, category.slug); assert.equal(scoped.length, 4);
    assert.ok(scoped.every(item => item.categorySlug === category.slug));
    const other = choices.find(item => item.categorySlug !== category.slug); assert.equal(readExamGoalFocus(other.id, scoped), null);
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  for (const change of [value => value.categories.push(clone(value.categories[0])), value => value.categories[0].goals[0].id = value.categories[1].goals[0].id, value => value.categories[0].slug = 'unknown', value => value.categories[0].goals[0].id = 'https://outside.invalid']) {
    const altered = clone(props.examBlueprint); change(altered); assert.deepEqual(getExamGoalOptions(altered, props.data.categories, 'alle'), []);
  }
  for (const [category, id] of [['unknown', choices[0].id], ['wildkunde', '../escape'], ['wildkunde', ''], ['wildkunde', ['injected-id']]]) assert.equal(examPlanGoalHref(category, id), null);
});
