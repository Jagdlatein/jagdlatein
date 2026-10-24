// These checks protect scope and integration, not biological correctness.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader, local } = require('./helpers/project-module.cjs');
const raw = require('../data/learning-roe-premolar-2026-10-24.json');
const load = createLoader();
const { roePremolarModules: added, october18GrowthModules: historical } = load('lib/learning-growth-oct18.js');
const { learningModules, learningPaths } = load('lib/learning-curriculum.js');
const { getWildlifeLearningGuide: guide } = load('lib/wildlife-learning-guide.js');
const { getWildlifeStudyContent } = load('lib/wildlife-study-content.js');
const courseId = 'wissen-rehwild-milchpraemolar-2026';

test('One separately dated Rehwild form lesson adds one question without age numbers, renumbering or a repeated uncertainty course', () => {
  assert.equal(added.length, 1);
  const course = added[0];
  assert.equal(course.id, courseId);
  assert.equal(course.lessons.length, 1);
  assert.equal(course.questions.length, 1);
  assert.equal(course.reviewedOn, '2026-10-24');
  assert.equal(course.sourceReview.reviewedOn, '2026-10-24');
  assert.ok(historical.every(item => item.reviewedOn === '2026-10-18'));
  const lesson = course.lessons[0];
  assert.match(lesson.paragraphs[0], /hinterste.*drei Milchprämolaren.*Unterkieferseite.*dreiteilige Krone/);
  assert.match(lesson.paragraphs[0], /bleibender Ersatz.*zweiteilige Krone/);
  const words = lesson.paragraphs.join(' ').split(/\s+/).length;
  assert.ok(words >= 80 && words <= 150, words);
  const teaching = [...lesson.paragraphs, lesson.title, lesson.takeaway, ...course.questions.flatMap(q => [q.q, ...q.options, q.explain])].join(' ');
  assert.doesNotMatch(teaching, /\d|\b[Pp][34]\b|Rotwild|Rothirsch|Zementring|Zementannulation/);
  assert.equal(course.sources.length, 2);
  assert.ok(course.sources.some(source => source.url.startsWith('https://www.gr.ch/') && source.organization.includes('2017')));
  assert.ok(course.sources.some(source => source.url.startsWith('https://cdn.forestresearch.gov.uk/') && source.organization.includes('1992')));
  assert.ok(course.sourceReview.limitations.some(limit => /keine neue Datenerhebung/.test(limit)));
  for (const claim of lesson.evidence) {
    assert.equal(new Set(claim.sources.map(source => source.url)).size, 2);
    assert.ok(claim.sources.every(source => course.sources.some(original => original.url === source.url)));
  }
  const existing = learningModules.find(item => item.id === 'wissen-ausbau-zahnalter-beweisgrenzen-2026');
  assert.equal(existing.reviewedOn, '2026-10-16');
  assert.equal(existing.lessons.length, 4);
  assert.equal(existing.questions.length, 16);
});

test('Only Rehwild adds a fourth target; its old entries and historical other guides remain exact except the explicit later Biber card count', () => {
  const species = load('lib/european-wildlife-discovery.js').europeanWildlife;
  const targets = guide('rehwild');
  assert.equal(targets.length, 4);
  assert.deepEqual(targets.slice(0, 3), [
    { moduleId: 'wissen-rehwild-jahreslauf', title: 'Rehwild im Jahreslauf verstehen', description: 'Verbinde Körpermerkmale, Fortpflanzung und Lebensraumnutzung zu einem nachvollziehbaren Beobachtungsbild.', flashcardCount: 0, href: '/kurse/wissen-rehwild-jahreslauf', scope: 'species', label: 'Vertiefung zur Art' },
    { moduleId: 'wissen-vertiefung-wild-hirsche-vergleichen', title: 'Reh, Rot-, Dam- und Sikawild im Vergleich', description: 'Körperbau, Jahresmerkmale, Nahrung und räumliche Nutzung der vier Hirscharten systematisch auseinanderhalten.', flashcardCount: 2, href: '/kurse/wissen-vertiefung-wild-hirsche-vergleichen', scope: 'species', label: 'Vertiefung zur Art' },
    { moduleId: 'wissen-ausbau-biologie-wiederkaeuer-2026', title: 'Wiederkäuer: Aus Pflanzenfasern werden Nährstoffe', description: 'Fermentation, Energie, mikrobielles Protein und die Entwicklung des Vormagensystems verständlich verbinden.', flashcardCount: 31, href: '/kurse/wissen-ausbau-biologie-wiederkaeuer-2026', scope: 'foundation', label: 'Biologische Grundlagen' },
  ]);
  assert.equal(targets[3].moduleId, courseId);
  assert.equal(targets[3].scope, 'species');
  assert.equal(targets[3].flashcardCount, 1);
  assert.equal(targets[3].title, added[0].title);
  assert.equal(targets[3].description, added[0].description);
  const unaffected = species.filter(item => item.slug !== 'rehwild').map(item => ({ slug: item.slug, targets: guide(item.slug) }));
  assert.equal(unaffected.length, 113);
  assert.equal(unaffected.find(item => item.slug === 'biber').targets.find(target => target.moduleId === 'wissen-biber-schneidezaehne-2026').flashcardCount, 3);
  const historical = unaffected.map(item => item.slug === 'biber' ? { ...item, targets: item.targets.map(target => target.moduleId === 'wissen-biber-schneidezaehne-2026' ? { ...target, flashcardCount: 2 } : target) } : item);
  // Before this addition, all fields and their ordering were captured from HEAD
  // 1577eda. Normalize only the later authorized Biber card-count increase;
  // preserve every other field, order and the original complete-object hash.
  assert.equal(createHash('sha256').update(JSON.stringify(historical)).digest('hex'), 'eb86cb3dfd5c857edaccd36a045f0eb6ee0689e8ea944d8495342c0e5be72b49');
  for (const item of unaffected) {
    assert.ok(!item.targets.some(target => target.moduleId === courseId), item.slug);
    assert.equal(getWildlifeStudyContent(item.slug, courseId), null, item.slug);
  }
  assert.ok(!JSON.stringify(targets[3]).includes('questions'));
});

test('The existing paid reader endpoint returns only the exact Rehwild lesson and no answers or foreign content', async () => {
  let accesses = 0;
  const route = createLoader({ '../../../../lib/account-access': { requirePaidAccount: async () => { accesses++; } } })('app/api/lernen/artenwissen/route.js');
  const run = art => route.GET(new Request(`https://jagdlatein.test/api/lernen/artenwissen?art=${art}&kurs=${courseId}`));
  const response = await run('rehwild');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  const content = await response.json();
  assert.equal(content.species, 'rehwild');
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
  for (const slug of ['rotwild', 'damwild', 'biber']) assert.equal((await run(slug)).status, 404);
  assert.equal(accesses, 4);
});

test('All exact paragraphs and limits render under the lower Rehwild topic menu before the closed supplementary sources', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const target = guide('rehwild')[3];
  const content = getWildlifeStudyContent('rehwild', courseId);
  const state = { key: `rehwild:${courseId}`, content, error: '', status: 200 };
  const Component = createLoader({ react: { ...React, useState: () => [state, () => {}], useEffect() {} } })('components/WildlifeStudyContent.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { slug: 'rehwild', target }));
  const sourceStart = html.indexOf('Ergänzende Fachquellen und Prüfstand');
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  assert.ok(sourceStart > 0);
  for (const paragraph of content.lessons[0].paragraphs) assert.ok(html.slice(0, sourceStart).includes(escape(paragraph)));
  for (const note of content.scopeNotes) assert.ok(html.slice(0, sourceStart).includes(escape(note)));
  assert.ok(html.includes('2026-10-24'));
  for (const source of content.sources) assert.ok(html.includes(source.url));
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  const Layout = load('components/WildlifePortraitLayout.js').default;
  const tree = Layout({ slug: 'rehwild', title: 'Rehwild', children: React.createElement('p', null, 'Existing portrait') });
  function find(node) {
    if (Array.isArray(node)) return node.map(find).find(Boolean);
    if (!node || typeof node !== 'object') return null;
    return node.props?.groups ? node : find(node.props?.children);
  }
  const reader = find(tree);
  const { resolveTopicSection } = load('components/TopicSectionReader.js');
  const selection = resolveTopicSection(reader.props.groups, `#art-lerntext-${courseId}`);
  assert.equal(selection.kind, 'topic');
  assert.equal(selection.topic.render().props.target.moduleId, courseId);
});

test('The existing category, search, quiz and card mechanisms expose the one new form question with its actual sources', () => {
  const { getLearningTopicLocation, validateLearningTopicTree } = load('lib/learning-topic-tree.js');
  const { getLearningOverviewData } = load('lib/learning-overview-server.js');
  const { searchLearning } = load('lib/learning-search.js');
  const { getFlashcards } = load('lib/learning-flashcards.js');
  const { QUESTIONS } = load('data/questions-full.js');
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  validateLearningTopicTree(learningModules);
  const location = getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wildkunde');
  assert.equal(location.groupId, 'koerperbau-atmung');
  assert.ok(getLearningOverviewData('wildkunde').modules.some(module => module.id === courseId && module.coverIndex === null));
  assert.ok(learningPaths.find(path => path.id === 'vertiefung-wildkunde').moduleIds.includes(courseId));
  for (const query of ['Rehwild Milchprämolar', 'Rehwild dreiteilig']) assert.ok(searchLearning({ query, type: 'course' }).results.some(result => result.id === `course:${courseId}`), query);
  const prepared = learningModules.find(module => module.id === courseId);
  const question = added[0].questions[0];
  const otherStems = new Set(learningModules.filter(module => module.id !== courseId).flatMap(module => module.questions.map(q => q.q.trim().toLocaleLowerCase('de'))));
  assert.ok(!otherStems.has(question.q.trim().toLocaleLowerCase('de')));
  const actual = prepared.questions[0];
  assert.ok(quizLearningPool(QUESTIONS, { topic: 'Wildkunde' }).some(q => q.id === actual.id));
  assert.equal(actual.answers.find(answer => actual.correct.includes(answer.id)).text, question.options[question.answer]);
  const cards = getFlashcards().filter(card => card.moduleId === courseId);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].answer, question.options[question.answer]);
  assert.equal(cards[0].sources.length, 2);
  assert.equal(cards[0].sourceScope, 'lesson');
  assert.equal(cards[0].reviewedOn, '2026-10-24');
  assert.equal(getFlashcards().filter(card => card.moduleId === 'wissen-ausbau-zahnalter-beweisgrenzen-2026').length, 14);
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const Page = createLoader({ 'next/router': { useRouter: () => ({ query: {}, asPath: `/kurse/${courseId}` }) }, 'next/head': () => null })('pages/kurse/[slug].js');
  const props = Page.getStaticProps({ params: { slug: courseId } }).props;
  const html = renderToStaticMarkup(React.createElement(Page.default, props));
  assert.ok(html.includes(prepared.lessons[0].title));
  assert.ok(html.includes('Welche Aussagen wurden gegengeprüft?'));
  assert.ok(html.includes(prepared.sources[1].url));
});
