const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { getRevierMomentCases } = load('lib/revier-moment-cases-server.js');
const { getRevierMoment, getRevierMomentPreview } = load('lib/revier-moment-server.js');
const { getDailyReviewPool } = load('lib/daily-review-pool.js');
const { learningModules } = load('lib/learning-curriculum.js');
const { getLearningCategoryByTitle } = load('lib/learning-categories.js');
const { categoryPracticeLinks } = load('lib/learning-category-practice-server.js');
const { QUESTIONS } = load('data/questions-full.js');
const { quizLearningPool } = load('lib/quiz-learning-scope.js');
const ui = createLoader({
  'next/router': { useRouter: () => ({ isReady: true, pathname: '/tagesquiz', asPath: '/tagesquiz', query: {} }) },
  'next/link': { __esModule: true, default: ({ href, prefetch, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  './LearningToolLayout': { __esModule: true, default: ({ category, children }) => React.createElement('main', { 'data-layout-category': category }, children) },
});
const Component = ui('components/RevierMoment.js').default;
const stamp = item => ({ dateKey: '2026-11-17', displayDate: '17. November 2026', ...item });
const htmlFor = item => renderToStaticMarkup(React.createElement(Component, { moment: stamp(item) }));

test('All 60 actual daily cases retain their real course category in supported review and quiz targets', () => {
  const cases = getRevierMomentCases(), categories = new Set();
  assert.equal(cases.length, 60);
  for (const item of cases) {
    const course = learningModules.find(course => course.id === item.topic.id);
    const category = getLearningCategoryByTitle(course.category);
    const inherited = getDailyReviewPool().find(question => question.id === item.question.id);
    assert.notEqual(category.slug, 'jagdrecht');
    assert.equal(item.categorySlug, inherited.category);
    assert.equal(item.categorySlug, category.slug);
    assert.deepEqual(Object.keys(item.practice).sort(), ['categorySlug', 'quizHref', 'reviewHref']);
    assert.equal(item.practice.categorySlug, category.slug);
    const targets = categoryPracticeLinks(category);
    assert.equal(item.practice.reviewHref, targets.reviewHref);
    assert.equal(item.practice.quizHref, targets.quizHref);
    assert.ok(quizLearningPool(QUESTIONS, { topic: category.title }).length > 0);
    const html = htmlFor(item);
    assert.ok(html.includes(`data-layout-category="${category.slug}"`));
    assert.ok(html.includes(`href="${item.practice.reviewHref}"`));
    assert.ok(html.includes(`href="${item.practice.quizHref}"`));
    assert.doesNotMatch(html, /href="\/lernen\/fuenf-minuten"|href="\/quiz-app"|country=|kategorie=jagdrecht/);
    assert.equal((html.match(/class="answerOption"/g) || []).length, 4);
    categories.add(category.slug);
  }
  assert.equal(categories.size, 11);
});

test('Wrong or malformed category metadata removes inferred targets instead of substituting a different pool', () => {
  const original = getRevierMomentCases()[0];
  for (const patch of [
    { categorySlug: 'jagdrecht' }, { categorySlug: ['wildkunde'] }, { categorySlug: 'unknown' },
    { practice: null }, { practice: { ...original.practice, categorySlug: 'jagdpraxis' } },
    { practice: { categorySlug: original.categorySlug } },
  ]) {
    const html = htmlFor({ ...original, ...patch });
    assert.doesNotMatch(html, /aria-label="Passend weiterlernen"/);
    assert.doesNotMatch(html, /href="\/lernen\/fuenf-minuten|href="\/quiz-app/);
    assert.equal((html.match(/class="answerOption"/g) || []).length, 4);
  }
  assert.doesNotMatch(htmlFor({ ...original, categorySlug: 'jagdrecht' }), /data-layout-category=/);
});

test('Only exact local supported URLs survive; query/hash/region changes and external addresses add no alternate navigation', () => {
  const original = getRevierMomentCases()[0];
  for (const field of ['reviewHref', 'quizHref']) for (const invalid of [
    'https://example.invalid/redirect', '//example.invalid/redirect',
    `${original.practice[field]}&country=AT`, `${original.practice[field]}#other`,
    field === 'reviewHref' ? '/lernen/fuenf-minuten?kategorie=jagdrecht' : '/quiz-app?topic=Recht&country=DE',
    [original.practice[field]],
  ]) {
    const html = htmlFor({ ...original, practice: { ...original.practice, [field]: invalid } });
    assert.equal(html.includes(`href="${original.practice[field]}"`), false, field);
    const other = field === 'reviewHref' ? 'quizHref' : 'reviewHref';
    assert.ok(html.includes(`href="${original.practice[other]}"`));
    assert.doesNotMatch(html, /example\.invalid|country=|#other|kategorie=jagdrecht/);
  }
});

test('The server rejects source-category corruption and does not invent an unsupported quiz', () => {
  const altered = structuredClone(getDailyReviewPool());
  altered.find(question => question.id === getRevierMomentCases()[0].question.id).category = 'jagdpraxis';
  assert.throws(() => createLoader({ './daily-review-pool': { getDailyReviewPool: () => altered } })('lib/revier-moment-cases-server.js').getRevierMomentCases(), /Fragenvorrat/);
  const reviewOnly = createLoader({ '../data/questions-full': { QUESTIONS: [] } })('lib/revier-moment-cases-server.js').getRevierMomentCases();
  for (const item of reviewOnly) {
    assert.deepEqual(Object.keys(item.practice).sort(), ['categorySlug', 'reviewHref']);
    const html = htmlFor(item);
    assert.ok(html.includes(`href="${item.practice.reviewHref}"`));
    assert.doesNotMatch(html, /href="\/quiz-app|unused-card|SyntheticSecret/);
  }
});

test('The public teaser retains exactly four old fields and cannot expose category targets or private incidental data', () => {
  const moment = getRevierMoment(new Date('2026-11-17T12:00:00Z'));
  moment.practice.privateAccount = 'SyntheticSecret';
  const preview = getRevierMomentPreview(moment);
  assert.deepEqual(Object.keys(preview), ['dateKey', 'displayDate', 'prompt', 'topicTitle']);
  assert.deepEqual(preview, { dateKey: moment.dateKey, displayDate: moment.displayDate, prompt: moment.question.prompt, topicTitle: moment.topic.title });
  assert.doesNotMatch(JSON.stringify(preview), /categorySlug|practice|reviewHref|quizHref|SyntheticSecret|correctIds|options/);
});
