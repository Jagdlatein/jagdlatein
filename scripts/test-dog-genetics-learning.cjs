// Integration guards for the two bounded additions, not scientific certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const raw = require('../data/learning-dog-genetics-2026-10-24.json');
const { dogGeneticsModules: added, october18GrowthModules: historical } = load('lib/learning-growth-oct18.js');
const { learningModules, learningPaths } = load('lib/learning-curriculum.js');

test('The separately dated genetics addition preserves historical review dates and has mapped evidence for both actual lessons', () => {
  assert.equal(added.length, 2);
  assert.equal(historical.length, 3);
  assert.ok(historical.every(course => course.reviewedOn === '2026-10-18'));
  assert.equal(added.flatMap(course => course.lessons).length, 2);
  assert.equal(added.flatMap(course => course.questions).length, 6);
  assert.equal(raw.evidence.length, 2);
  for (const course of added) {
    assert.equal(course.reviewedOn, '2026-10-24');
    assert.equal(course.sourceReview.reviewedOn, '2026-10-24');
    assert.equal(course.category, 'Hundewesen');
    assert.equal(course.showCategoryDiagram, false);
    assert.ok(course.sourceReview.limitations.length >= 3);
    for (const lesson of course.lessons) {
      assert.ok(lesson.evidence.length);
      for (const evidence of lesson.evidence) {
        assert.ok(evidence.claim && new Set(evidence.sources.map(source => source.url)).size >= 2);
        assert.ok(evidence.sources.every(source => course.sources.some(original => original.url === source.url)));
      }
    }
  }
});

test('Both breed-specific courses appear in the existing Hundewesen branch, category, search and static course routes', () => {
  const { getLearningTopicLocation, validateLearningTopicTree } = load('lib/learning-topic-tree.js');
  const { getLearningOverviewData } = load('lib/learning-overview-server.js');
  const { searchLearning } = load('lib/learning-search.js');
  const Page = load('pages/kurse/[slug].js');
  validateLearningTopicTree(learningModules);
  const category = getLearningOverviewData('hundewesen');
  for (const course of added) {
    assert.deepEqual(getLearningTopicLocation(course.id), {
      categorySlug: 'hundewesen', groupId: 'koerper-sinne', groupTitle: 'Biologie & Körperfunktionen',
    });
    assert.ok(category.modules.some(item => item.id === course.id && item.coverIndex === null));
    assert.ok(learningPaths.find(path => path.id === 'vertiefung-hundewesen').moduleIds.includes(course.id));
    const query = course.title.startsWith('Labrador') ? 'Labrador DNM1' : 'Weimaraner HUU';
    assert.ok(searchLearning({ query, type: 'course' }).results.some(item => item.id === `course:${course.id}`));
    assert.ok(Page.getStaticPaths().paths.some(item => item.params.slug === course.id));
    assert.equal(Page.getStaticProps({ params: { slug: course.id } }).props.module.id, course.id);
  }
});

test('The real course pages show the teaching text before the closed final source review', () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const Page = createLoader({
    'next/router': { useRouter: () => ({ query: {}, asPath: '/kurse/test' }) },
    'next/head': () => null,
  })('pages/kurse/[slug].js');
  for (const course of added) {
    const props = Page.getStaticProps({ params: { slug: course.id } }).props;
    const html = renderToStaticMarkup(React.createElement(Page.default, props));
    assert.ok(html.includes(course.lessons[0].title));
    const teaching = html.indexOf(course.lessons[0].paragraphs[0].slice(0, 65));
    const review = html.indexOf('Welche Aussagen wurden gegengeprüft?');
    assert.ok(teaching >= 0 && review > teaching);
    assert.ok(html.includes(course.sources[0].url.replaceAll('&', '&amp;')));
    assert.ok(!/<details[^>]*\bopen(?:\s|[=>])/i.test(html));
  }
});

test('Six distinct original questions retain their correct answers through quiz rotation and daily review', () => {
  const { QUESTIONS } = load('data/questions-full.js');
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  const { getDailyReviewPool } = load('lib/daily-review-pool.js');
  const pool = new Set(quizLearningPool(QUESTIONS, { topic: 'Hundewesen' }).map(question => question.id));
  const daily = getDailyReviewPool();
  const oldStems = new Set(learningModules.filter(course => !added.some(item => item.id === course.id))
    .flatMap(course => course.questions.map(question => question.q.trim().toLocaleLowerCase('de'))));
  const stems = new Set();
  const correctPositions = new Set();
  for (const course of added) {
    const prepared = learningModules.find(item => item.id === course.id);
    for (const question of course.questions) {
      const stem = question.q.trim().toLocaleLowerCase('de');
      assert.ok(!oldStems.has(stem) && !stems.has(stem), question.q);
      stems.add(stem);
      assert.equal(new Set(question.options).size, 4);
      const actual = prepared.questions.find(item => item.id === `${course.id}-${question.id}`);
      assert.ok(actual && pool.has(actual.id));
      assert.equal(actual.answers.find(answer => actual.correct.includes(answer.id)).text, question.options[question.answer]);
      correctPositions.add(actual.answers.findIndex(answer => actual.correct.includes(answer.id)));
      const review = daily.find(item => item.id === actual.id);
      assert.ok(review?.reading && review.sourceScope === 'lesson');
    }
  }
  assert.ok(correctPositions.size > 1, 'The same displayed position must not always be correct');
});

test('The existing card exporter keeps five standalone cards with visible answers, lesson sources and exact review dates', () => {
  const { getFlashcards } = load('lib/learning-flashcards.js');
  const cards = getFlashcards().filter(card => added.some(course => course.id === card.moduleId));
  assert.equal(cards.length, 5);
  for (const course of added) assert.ok(cards.filter(card => card.moduleId === course.id).length >= 2);
  for (const card of cards) {
    assert.equal(card.reviewedOn, '2026-10-24');
    assert.ok(card.answer && card.explanation && card.sources.length >= 2);
    assert.equal(card.sourceScope, 'lesson');
    assert.ok(card.courseHref.startsWith(`/kurse/${card.moduleId}#lesson-`));
    assert.ok(!card.options && !card.correct);
  }
});

test('Both courses retain their evidence and dates in the existing expiring offline package without unrelated photos', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'unit-test-only-secret-not-a-credential';
  try {
    const { createOfflinePack } = load('lib/offline-learning-server.js');
    const now = Date.parse('2026-10-24T10:00:00Z');
    const pack = createOfflinePack({ courseIds: added.map(course => course.id), sounds: false },
      { email: 'learner@example.invalid', trialUntil: '2026-10-26T10:00:00Z' }, now);
    assert.equal(pack.courses.length, 2);
    assert.equal(pack.photos.length, 0);
    assert.equal(pack.sounds.length, 0);
    assert.equal(pack.expiresAt, Date.parse('2026-10-26T10:00:00Z'));
    for (const course of pack.courses) {
      assert.equal(course.reviewedOn, '2026-10-24');
      assert.ok(course.lessons.every(lesson => lesson.evidence.length && lesson.evidence.every(item => item.sources.length >= 2)));
    }
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET;
    else process.env.JL_SESSION_SECRET = previous;
  }
});

test('Breed routes receive only their exact genetics reading material and all other breeds receive none', async () => {
  const route = load('pages/lernen/jagdhunde/[rasse].js');
  const { dogBreeds } = load('lib/dog-compass.js');
  const assignments = {
    labrador: 'wissen-labrador-dnm1-eic-testgrenzen-2026',
    weimaraner: 'wissen-weimaraner-slc2a9-huu-testgrenzen-2026',
  };
  function readingOnly(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      assert.ok(!['questions', 'options', 'answers', 'answer', 'correct', 'explain', 'modules', 'objectives', 'exercise'].includes(key), key);
      readingOnly(item);
    }
  }
  for (const profile of dogBreeds) {
    const { props } = await route.getStaticProps({ params: { rasse: profile.id } });
    if (!Object.hasOwn(assignments, profile.id)) {
      assert.equal(Object.hasOwn(props, 'healthKnowledge'), false, profile.id);
      continue;
    }
    const original = raw.modules.find(course => course.id === assignments[profile.id]);
    const knowledge = props.healthKnowledge;
    assert.deepEqual(Object.keys(knowledge).sort(), ['breedId', 'courseId', 'lessons', 'limitations', 'reviewedOn', 'scope', 'sources']);
    assert.equal(knowledge.breedId, profile.id);
    assert.equal(knowledge.courseId, original.id);
    assert.equal(knowledge.reviewedOn, raw.reviewedOn);
    assert.equal(knowledge.scope, original.sourceReview.scope);
    assert.deepEqual(knowledge.limitations, original.sourceReview.limitations);
    assert.deepEqual(knowledge.sources, original.sources.map(({ label, url, organization }) => ({ label, url, organization })));
    for (const lesson of knowledge.lessons) {
      const authored = original.lessons.find(item => item.id === lesson.id);
      assert.deepEqual(lesson.paragraphs, authored.paragraphs);
      assert.equal(lesson.takeaway, authored.takeaway);
      assert.deepEqual(lesson.evidence, raw.evidence.find(item => item.moduleId === original.id && item.lessonId === lesson.id).claims);
    }
    readingOnly(props);
    const serialized = JSON.stringify(props);
    for (const course of raw.modules.filter(item => item.id !== original.id)) {
      assert.ok(!serialized.includes(course.id));
      assert.ok(!serialized.includes(course.lessons[0].paragraphs[0]));
    }
  }
});

test('Only the matching breed adds its genetics branch, reads the same paragraphs and ends with its own scoped sources', async () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const { createDogBreedTopics, default: DogBreedProfile } = load('components/DogBreedProfile.js');
  const { resolveTopicSection } = load('components/TopicSectionReader.js');
  const route = load('pages/lernen/jagdhunde/[rasse].js');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  for (const breedId of ['labrador', 'weimaraner']) {
    const { props } = await route.getStaticProps({ params: { rasse: breedId } });
    const { profile, tasks, contextSources, healthKnowledge } = props;
    const base = createDogBreedTopics(profile, tasks, contextSources);
    const groups = createDogBreedTopics(profile, tasks, contextSources, healthKnowledge);
    assert.equal(groups.length, 2);
    const ids = groups.flatMap(group => [group.id, ...group.topics.map(topic => topic.id)]);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(groups[1].id, 'gesundheit-genetik');
    assert.equal(groups[1].title, 'Gesundheit & Genetik');
    assert.deepEqual(groups[0].topics.map(topic => topic.id), base[0].topics.map(topic => topic.id));
    for (let i = 0; i < base[0].topics.length; i++)
      assert.equal(renderToStaticMarkup(groups[0].topics[i].render()), renderToStaticMarkup(base[0].topics[i].render()), 'All five existing profile topics retain their original text, sources and dates');
    const lesson = healthKnowledge.lessons[0];
    const topic = groups[1].topics[0];
    assert.equal(resolveTopicSection(groups, `#gesundheit-${lesson.id}`).topic, topic);
    assert.equal(resolveTopicSection(groups, '#gesundheit-genetik').group, groups[1]);
    const tree = topic.render();
    assert.equal(React.Children.toArray(tree.props.children).at(-1).type.name, 'HealthSources');
    const html = renderToStaticMarkup(tree);
    const sourceStart = html.indexOf('<details');
    assert.ok(sourceStart > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(escape(paragraph)));
    assert.ok(html.slice(0, sourceStart).includes(escape(lesson.takeaway)));
    assert.ok(html.slice(0, sourceStart).includes(escape(healthKnowledge.scope)));
    assert.ok(html.includes(healthKnowledge.reviewedOn));
    for (const source of healthKnowledge.sources) assert.ok(html.includes(escape(source.url)));
    assert.ok(!html.includes('fci.be'));
    assert.doesNotMatch(html, /<details[^>]*\bopen(?:\s|[=>])/i);
    const layout = DogBreedProfile(props);
    const reader = layout.props.children;
    assert.equal(reader.type.name, 'TopicSectionReader');
    const footer = React.Children.toArray(reader.props.menuFooter.props.children);
    assert.equal(footer[0].props.children.props.href, `/kurse/${healthKnowledge.courseId}#wissenscheck`);
    assert.equal(footer[1].props.children.props.href, '/lernen/jagdhunde');
    const other = await route.getStaticProps({ params: { rasse: breedId === 'labrador' ? 'weimaraner' : 'labrador' } });
    assert.equal(createDogBreedTopics(other.props.profile, other.props.tasks, other.props.contextSources, healthKnowledge).length, 1, 'Foreign props cannot add a branch to another breed');
  }
});

test('The real browser build strips the genetics dataset and all server-only question data from the breed route', () => {
  const filename = path.join(root, 'pages/lernen/jagdhunde/[rasse].js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, isPageFile: true, isServerCompiler: false, disableNextSsg: false,
    pagesDir: path.join(root, 'pages'),
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'es6' },
  });
  assert.match(code, /__N_SSG/);
  assert.doesNotMatch(code, /learning-dog-genetics|learning-curriculum|healthModuleId|dataset\.modules|record\.claims|getStaticProps|getStaticPaths/);
  const client = fs.readFileSync(path.join(root, 'components/DogBreedProfile.js'), 'utf8');
  assert.doesNotMatch(client, /import.*(?:learning-dog-genetics|learning-curriculum|learning-growth|dog-compass|dog-breed-expansion)/);
});
