// Structural integration and scope checks; these do not certify biological accuracy.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const raw = require('../data/learning-beaver-incisors-2026-10-24.json');
const load = createLoader();
const { beaverIncisorModules: added, october18GrowthModules: historical } = load('lib/learning-growth-oct18.js');
const { learningModules, learningPaths } = load('lib/learning-curriculum.js');
const { getWildlifeLearningGuide: guide } = load('lib/wildlife-learning-guide.js');
const { getWildlifeStudyContent } = load('lib/wildlife-study-content.js');
const courseId = 'wissen-biber-schneidezaehne-2026';

test('The original short Biber lesson retains its two questions and evidence beside one narrow followup lesson', () => {
  assert.equal(added.length, 1);
  const course = added[0];
  assert.equal(course.id, courseId);
  assert.equal(course.lessons.length, 2);
  assert.equal(course.questions.length, 3);
  assert.equal(course.reviewedOn, '2026-10-24');
  assert.equal(course.sourceReview.reviewedOn, '2026-10-24');
  assert.ok(historical.every(item => item.reviewedOn === '2026-10-18'));
  const words = course.lessons[0].paragraphs.join(' ').split(/\s+/).length;
  assert.ok(words >= 130 && words <= 170, words);
  const teaching = [...course.lessons[0].paragraphs, ...course.questions.flatMap(q => [q.q, ...q.options, q.explain])].join(' ');
  assert.doesNotMatch(teaching, /\d|\b(?:Eisen|Ferrihydrit|Nanometer|Mikrometer|Millimeter|Härtewert|Wachstumsrate|Verschleißrate|Farbursache)\b/i);
  assert.ok(course.sourceReview.limitations.some(limit => /keine.*Abriebversuchs/.test(limit)));
  assert.equal(course.sources.length, 4);
  assert.ok(course.sources.some(source => source.url.startsWith('https://www.lfu.bayern.de/')));
  assert.ok(course.sources.some(source => source.url.startsWith('https://fvo.si/') && source.supports.includes('Originalvolltext')));
  for (const claim of course.lessons[0].evidence) {
    assert.equal(new Set(claim.sources.map(source => source.url)).size, 2);
    assert.ok(claim.sources.every(source => course.sources.some(original => original.url === source.url)));
  }
});

test('Only Biber gains its own third target and retains the two existing foundational texts', () => {
  const species = load('lib/european-wildlife-discovery.js').europeanWildlife;
  const targets = guide('biber');
  assert.deepEqual(targets.map(target => target.moduleId), [courseId, 'wissen-ausbau-wildtiergenetik-2026', 'wissen-ausbau-anwendung-biologische-ebenen-2026']);
  assert.equal(targets[0].scope, 'species');
  assert.equal(targets[0].flashcardCount, 3);
  assert.equal(targets[0].title, added[0].title);
  assert.equal(targets[0].description, added[0].description);
  for (const item of species.filter(item => item.slug !== 'biber')) {
    assert.ok(!guide(item.slug).some(target => target.moduleId === courseId), item.slug);
    assert.equal(getWildlifeStudyContent(item.slug, courseId), null, item.slug);
    assert.ok(guide(item.slug).length <= (['rotwild', 'rehwild'].includes(item.slug) ? 4 : 3), item.slug);
  }
  assert.ok(!JSON.stringify(targets[0]).includes('questions'));
});

test('The existing paid species endpoint serves the authored Biber text without quiz keys or unrelated modules', async () => {
  let accesses = 0;
  const route = createLoader({ '../../../../lib/account-access': { requirePaidAccount: async () => { accesses++; } } })('app/api/lernen/artenwissen/route.js');
  const run = art => route.GET(new Request(`https://jagdlatein.test/api/lernen/artenwissen?art=${art}&kurs=${courseId}`));
  const response = await run('biber');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  const content = await response.json();
  assert.equal(content.species, 'biber');
  assert.equal(content.moduleId, courseId);
  assert.equal(content.reviewedOn, '2026-10-24');
  assert.deepEqual(content.lessons[0].paragraphs, raw.modules[0].lessons[0].paragraphs);
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
  for (const slug of ['nutria', 'bisam', 'rotwild']) assert.equal((await run(slug)).status, 404);
  assert.equal(accesses, 4);
});

test('The existing portrait reader exposes all paragraphs and scope under its lower-menu leaf with sources closed at the end', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const target = guide('biber')[0];
  const content = getWildlifeStudyContent('biber', courseId);
  const state = { key: `biber:${courseId}`, content, error: '', status: 200 };
  const Component = createLoader({ react: { ...React, useState: () => [state, () => {}], useEffect() {} } })('components/WildlifeStudyContent.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { slug: 'biber', target }));
  const sourceStart = html.indexOf('Ergänzende Fachquellen und Prüfstand');
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  assert.ok(sourceStart > 0);
  for (const paragraph of content.lessons[0].paragraphs) assert.ok(html.slice(0, sourceStart).includes(escape(paragraph)));
  for (const note of content.scopeNotes) assert.ok(html.slice(0, sourceStart).includes(escape(note)));
  assert.ok(html.includes('2026-10-24'));
  for (const source of content.sources) assert.ok(html.includes(source.url.replaceAll('&', '&amp;')));
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  const Layout = load('components/WildlifePortraitLayout.js').default;
  const tree = Layout({ slug: 'biber', title: 'Biber', children: React.createElement('p', null, 'Existing portrait') });
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

test('The same course is discoverable in Wildkunde, search and the shared quiz; its original two cards remain beside the new card', () => {
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
  for (const query of ['Biber Schneidezähne', 'Biber Dentin']) assert.ok(searchLearning({ query, type: 'course' }).results.some(result => result.id === `course:${courseId}`), query);
  const prepared = learningModules.find(module => module.id === courseId);
  const otherStems = new Set(learningModules.filter(module => module.id !== courseId).flatMap(module => module.questions.map(question => question.q.trim().toLocaleLowerCase('de'))));
  const pool = new Set(quizLearningPool(QUESTIONS, { topic: 'Wildkunde' }).map(question => question.id));
  const positions = new Set();
  for (const question of added[0].questions.slice(0, 2)) {
    assert.ok(!otherStems.has(question.q.trim().toLocaleLowerCase('de')));
    const actual = prepared.questions.find(item => item.id === `${courseId}-${question.id}`);
    assert.ok(pool.has(actual.id));
    assert.equal(actual.answers.find(answer => actual.correct.includes(answer.id)).text, question.options[question.answer]);
    positions.add(actual.answers.findIndex(answer => actual.correct.includes(answer.id)));
  }
  assert.equal(positions.size, 2);
  const cards = getFlashcards().filter(card => card.moduleId === courseId);
  assert.equal(cards.length, 3);
  for (const card of cards) {
    assert.ok(card.answer && card.explanation && card.sources.length === 2);
    assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.reviewedOn, '2026-10-24');
  }
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const Page = createLoader({ 'next/router': { useRouter: () => ({ query: {}, asPath: `/kurse/${courseId}` }) }, 'next/head': () => null })('pages/kurse/[slug].js');
  const props = Page.getStaticProps({ params: { slug: courseId } }).props;
  const html = renderToStaticMarkup(React.createElement(Page.default, props));
  assert.ok(html.includes(prepared.lessons[0].title));
  assert.ok(html.includes('Welche Aussagen wurden gegengeprüft?'));
  assert.ok(html.includes(prepared.sources[1].url));
});
