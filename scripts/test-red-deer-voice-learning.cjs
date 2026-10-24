// These checks protect integration and documented scope, not scientific correctness.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const raw = require('../data/learning-red-deer-voice-2026-10-24.json');
const load = createLoader();
const { redDeerVoiceModules: added, october18GrowthModules: historical } = load('lib/learning-growth-oct18.js');
const { learningModules, learningPaths } = load('lib/learning-curriculum.js');
const { getWildlifeLearningGuide: guide } = load('lib/wildlife-learning-guide.js');
const { getWildlifeStudyContent } = load('lib/wildlife-study-content.js');
const courseId = 'wissen-rotwild-stimme-formanten-2026';

test('One separately dated short lesson carries bounded evidence and two original questions without changing historical dates', () => {
  assert.equal(added.length, 1);
  const course = added[0];
  assert.equal(course.id, courseId);
  assert.equal(course.lessons.length, 1);
  assert.equal(course.questions.length, 2);
  assert.equal(course.reviewedOn, '2026-10-24');
  assert.equal(course.sourceReview.reviewedOn, '2026-10-24');
  assert.ok(historical.every(item => item.reviewedOn === '2026-10-18'));
  const teaching = course.lessons[0].paragraphs.join(' ');
  const words = teaching.split(/\s+/).length;
  assert.ok(words >= 180 && words <= 240, words);
  assert.doesNotMatch(teaching, /\d|\bHz\b|\bkHz\b|\bkg\b/);
  assert.ok(course.sourceReview.limitations.some(limit => /keine vollständige PDF-Lektüre/.test(limit)));
  assert.ok(course.sourceReview.limitations.some(limit => /keine unabhängige Wiederholung/.test(limit)));
  for (const claim of course.lessons[0].evidence) {
    assert.ok(claim.claim && new Set(claim.sources.map(source => source.url)).size >= 2);
    assert.ok(claim.sources.every(source => course.sources.some(original => original.url === source.url)));
  }
});

test('Rotwild alone gains an exact fourth target while its three existing topics and all other species limits remain intact', () => {
  const species = load('lib/european-wildlife-discovery.js').europeanWildlife;
  const targets = guide('rotwild');
  assert.deepEqual(targets.map(target => target.moduleId), [
    'wissen-rotwild-sozialverhalten', 'wissen-vertiefung-wild-hirsche-vergleichen',
    'wissen-ausbau-biologie-wiederkaeuer-2026', courseId,
  ]);
  assert.equal(targets[3].scope, 'species');
  assert.equal(targets[3].title, added[0].title);
  assert.equal(targets[3].description, added[0].description);
  assert.equal(targets[3].flashcardCount, 2);
  for (const item of species.filter(item => item.slug !== 'rotwild')) {
    assert.ok(guide(item.slug).length <= 3, item.slug);
    assert.ok(!guide(item.slug).some(target => target.moduleId === courseId), item.slug);
    assert.equal(getWildlifeStudyContent(item.slug, courseId), null, item.slug);
  }
  assert.ok(!JSON.stringify(targets[3]).includes('questions'));
});

test('The existing species endpoint serves the exact authored lesson only for Rotwild without quiz keys or other courses', async () => {
  let accesses = 0;
  const route = createLoader({ '../../../../lib/account-access': { requirePaidAccount: async () => { accesses++; } } })('app/api/lernen/artenwissen/route.js');
  const run = art => route.GET(new Request(`https://jagdlatein.test/api/lernen/artenwissen?art=${art}&kurs=${courseId}`));
  const response = await run('rotwild');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  const content = await response.json();
  assert.equal(content.species, 'rotwild');
  assert.equal(content.moduleId, courseId);
  assert.equal(content.reviewedOn, '2026-10-24');
  assert.deepEqual(content.lessons[0].paragraphs, raw.modules[0].lessons[0].paragraphs);
  assert.equal(content.lessons[0].takeaway, raw.modules[0].lessons[0].takeaway);
  assert.deepEqual(content.lessons[0].evidence, added[0].lessons[0].evidence);
  assert.deepEqual(content.sources, raw.modules[0].sources);
  assert.equal(content.scopeNotes.length, 1);
  function readingOnly(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!['questions', 'options', 'answers', 'correct', 'answer', 'explain', 'modules'].includes(key), key);
      readingOnly(child);
    }
  }
  readingOnly(content);
  assert.equal((await run('rehwild')).status, 404);
  assert.equal((await run('damwild')).status, 404);
  assert.equal(accesses, 3);
});

test('The existing portrait reader shows all authored paragraphs and scope before the closed sources, using its exact lower-menu leaf', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const target = guide('rotwild').find(target => target.moduleId === courseId);
  const content = getWildlifeStudyContent('rotwild', courseId);
  const state = { key: `rotwild:${courseId}`, content, error: '', status: 200 };
  const Component = createLoader({ react: { ...React, useState: () => [state, () => {}], useEffect() {} } })('components/WildlifeStudyContent.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { slug: 'rotwild', target }));
  const sourceStart = html.indexOf('Ergänzende Fachquellen und Prüfstand');
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  assert.ok(sourceStart > 0);
  for (const paragraph of content.lessons[0].paragraphs) assert.ok(html.slice(0, sourceStart).includes(escape(paragraph)));
  for (const note of content.scopeNotes) assert.ok(html.slice(0, sourceStart).includes(escape(note)));
  assert.ok(html.includes('2026-10-24'));
  assert.ok(html.includes(content.sources[0].url));
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  const Layout = load('components/WildlifePortraitLayout.js').default;
  const tree = Layout({ slug: 'rotwild', title: 'Rotwild', children: React.createElement('p', null, 'Existing portrait') });
  function find(node) {
    if (Array.isArray(node)) return node.map(find).find(Boolean);
    if (!node || typeof node !== 'object') return null;
    return node.props?.groups ? node : find(node.props?.children);
  }
  const reader = find(tree);
  const { resolveTopicSection } = load('components/TopicSectionReader.js');
  const selection = resolveTopicSection(reader.props.groups, `#art-lerntext-${courseId}`);
  assert.equal(selection.kind, 'topic');
  const selected = selection.topic.render();
  assert.equal(selected.type.name, 'WildlifeStudyContent');
  assert.equal(selected.props.target.moduleId, courseId);
});

test('The course is searchable in its existing category and produces correct shared quiz questions and two sourced cards', () => {
  const { getLearningTopicLocation, validateLearningTopicTree } = load('lib/learning-topic-tree.js');
  const { getLearningOverviewData } = load('lib/learning-overview-server.js');
  const { searchLearning } = load('lib/learning-search.js');
  const { getFlashcards } = load('lib/learning-flashcards.js');
  const { QUESTIONS } = load('data/questions-full.js');
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  validateLearningTopicTree(learningModules);
  assert.equal(getLearningTopicLocation(courseId).categorySlug, 'wildkunde');
  assert.ok(getLearningOverviewData('wildkunde').modules.some(module => module.id === courseId && module.coverIndex === null));
  assert.ok(learningPaths.find(path => path.id === 'vertiefung-wildkunde').moduleIds.includes(courseId));
  assert.ok(searchLearning({ query: 'Rotwild Formanten', type: 'course' }).results.some(result => result.id === `course:${courseId}`));
  const prepared = learningModules.find(module => module.id === courseId);
  const otherStems = new Set(learningModules.filter(module => module.id !== courseId).flatMap(module => module.questions.map(question => question.q.trim().toLocaleLowerCase('de'))));
  const pool = new Set(quizLearningPool(QUESTIONS, { topic: 'Wildkunde' }).map(question => question.id));
  const positions = new Set();
  for (const question of added[0].questions) {
    assert.ok(!otherStems.has(question.q.trim().toLocaleLowerCase('de')));
    const actual = prepared.questions.find(item => item.id === `${courseId}-${question.id}`);
    assert.ok(pool.has(actual.id));
    assert.equal(actual.answers.find(answer => actual.correct.includes(answer.id)).text, question.options[question.answer]);
    positions.add(actual.answers.findIndex(answer => actual.correct.includes(answer.id)));
  }
  assert.equal(positions.size, 2);
  const cards = getFlashcards().filter(card => card.moduleId === courseId);
  assert.equal(cards.length, 2);
  for (const card of cards) {
    assert.ok(card.answer && card.explanation && card.sources.length >= 2);
    assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.reviewedOn, '2026-10-24');
  }
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const Page = createLoader({ 'next/router': { useRouter: () => ({ query: {}, asPath: `/kurse/${courseId}` }) }, 'next/head': () => null })('pages/kurse/[slug].js');
  const props = Page.getStaticProps({ params: { slug: courseId } }).props;
  const html = renderToStaticMarkup(React.createElement(Page.default, props));
  assert.ok(html.includes(prepared.lessons[0].title));
  assert.ok(html.includes('Welche Aussagen wurden gegengeprüft?'));
  assert.ok(html.includes(prepared.sources[0].url));
});
