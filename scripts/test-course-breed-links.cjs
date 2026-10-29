const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { examKnowledgeBaselineFixture } = require('./helpers/exam-knowledge-additions-oct29.cjs');
const { plantEnergyBaselineFixture } = require('./helpers/plant-energy-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
const { flightFeatherBaselineFixture } = require('./helpers/flight-feather-additions-oct27.cjs');
const { firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
// Navigation projection and unchanged corpus checks, not a new genetics review.
const { digestiveIgnitionBaselineFixture } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const { fishLateralLineBaselineFixture } = require('./helpers/fish-lateral-line-addition.cjs');
const test = require('node:test'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs'), path = require('node:path');
const { createLoader: createLinkedProjectLoader, local, root } = require('./helpers/project-module.cjs');
const createLoader = overrides => createLinkedProjectLoader(linkedExamBaselineFixture(overrides));
const { stripFeatherGrowthAddition, isFeatherGrowthCard } = require('./helpers/learning-additions-oct27.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader(examKnowledgeBaselineFixture(plantEnergyBaselineFixture(adiposeBaselineFixture(flightFeatherBaselineFixture(firearmTermsBaselineFixture(digestiveIgnitionBaselineFixture(fishLateralLineBaselineFixture())))))));
const { getCourseBreedLink, getDogBreedKnowledgeAssignment } = load('lib/dog-breed-routing.js');
const { learningModules } = load('lib/learning-curriculum.js');
const { dogBreeds } = load('lib/dog-compass.js');
const route = load('pages/lernen/jagdhunde/[rasse].js');
const { createDogBreedTopics, default: Profile } = load('components/DogBreedProfile.js');
const { resolveTopicSection } = load('components/TopicSectionReader.js');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = [
  { breedId: 'labrador', name: 'Labrador Retriever', courseId: 'wissen-labrador-dnm1-eic-testgrenzen-2026', lessonId: 'dnm1-befund-und-beobachtung' },
  { breedId: 'weimaraner', name: 'Weimaraner', courseId: 'wissen-weimaraner-slc2a9-huu-testgrenzen-2026', lessonId: 'huu-veranlagung-und-steinbefund' },
];
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}

test('Only the two existing exact course/lesson assignments produce a link across all198 courses and their real lessons', () => {
  assert.equal(learningModules.length, 198);
  const actual = [];
  for (const module of learningModules) for (const lesson of module.lessons) {
    const link = getCourseBreedLink(module.id, lesson.id);
    const assignment = expected.find(item => item.courseId === module.id && item.lessonId === lesson.id);
    assert.deepEqual(link, assignment ? { breedId: assignment.breedId, name: assignment.name, href: `/lernen/jagdhunde/${assignment.breedId}#gesundheit-${assignment.lessonId}` } : null);
    if (link) actual.push({ courseId: module.id, lessonId: lesson.id, breedId: link.breedId });
  }
  assert.deepEqual(actual, expected.map(({ courseId, lessonId, breedId }) => ({ courseId, lessonId, breedId })));
  for (const assignment of expected) {
    for (const bad of [undefined, null, '', [], [assignment.lessonId], 'constructor', `prefix-${assignment.lessonId}`, assignment.lessonId + '-suffix']) assert.equal(getCourseBreedLink(assignment.courseId, bad), null);
    for (const bad of [undefined, null, '', [], [assignment.courseId], 'constructor', `prefix-${assignment.courseId}`, assignment.courseId + '-suffix']) assert.equal(getCourseBreedLink(bad, assignment.lessonId), null);
    assert.equal(getCourseBreedLink(assignment.courseId, expected.find(item => item !== assignment).lessonId), null);
  }
});

test('All59 existing breed objects and complete static profile payloads remain exact, including source dates and reading-only genetics', async () => {
  assert.equal(dogBreeds.length, 59);
  assert.equal(hash(dogBreeds), '2d2f136a233d606e00a386358b775bd56e2e5f2448eed05679a4e374556c0542');
  const payloads = await Promise.all(dogBreeds.map(async breed => ({ id: breed.id, ...await route.getStaticProps({ params: { rasse: breed.id } }) })));
  assert.equal(hash(payloads), 'f755876bed845d9266aad30ab2877a2e96a19038961c29b6e6f938c9911100fd');
  for (const item of payloads) {
    const assignment = getDogBreedKnowledgeAssignment(item.id);
    assert.deepEqual(assignment, expected.find(entry => entry.breedId === item.id) || null);
    assert.equal(Boolean(item.props.healthKnowledge), Boolean(assignment));
    if (assignment) {
      assert.equal(item.props.healthKnowledge.courseId, assignment.courseId);
      assert.deepEqual(item.props.healthKnowledge.lessons.map(lesson => lesson.id), [assignment.lessonId]);
    }
    assert.doesNotMatch(JSON.stringify(item.props), /"(?:questions|options|answers|answer|correct|explain)":/);
  }
  for (const input of [undefined, null, '', [], ['labrador'], 'constructor', 'Labrador', 'labrador-suffix']) assert.equal(getDogBreedKnowledgeAssignment(input), null);
  const copy = getDogBreedKnowledgeAssignment('labrador'); copy.breedId = 'weimaraner'; copy.lessonId = 'invalid';
  assert.deepEqual(getDogBreedKnowledgeAssignment('labrador'), expected[0]);
});

test('Each destination resolves to its real existing genetics topic and preserves the profile-to-course quiz link', async () => {
  for (const assignment of expected) {
    const { props } = await route.getStaticProps({ params: { rasse: assignment.breedId } });
    const link = getCourseBreedLink(assignment.courseId, assignment.lessonId), target = new URL(link.href, 'https://example.invalid');
    const groups = createDogBreedTopics(props.profile, props.tasks, props.contextSources, props.healthKnowledge);
    const selected = resolveTopicSection(groups, target.hash, 'jagdhund-themen');
    assert.equal(selected.kind, 'topic'); assert.equal(selected.group.id, 'gesundheit-genetik'); assert.equal(selected.topic.id, `gesundheit-${assignment.lessonId}`);
    const html = renderToStaticMarkup(selected.topic.render());
    const sourceStart = html.indexOf('<details');
    for (const paragraph of props.healthKnowledge.lessons[0].paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
    assert.ok(sourceStart > 0); assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
    const layout = Profile(props), reader = nodes(layout, node => node.type?.name === 'TopicSectionReader')[0];
    const quiz = nodes(reader.props.menuFooter, node => node.props?.href === `/kurse/${assignment.courseId}#wissenscheck`);
    assert.equal(quiz.length, 1); assert.equal(quiz[0].props.children, 'Diese Genetik-Lektion üben');
    assert.equal(target.pathname, `/lernen/jagdhunde/${props.profile.id}`);
  }
});

test('The real course page shows one short same-window breed link only in its existing lower menu, before complete unchanged reading and final closed sources', () => {
  const wrap = value => ({ __esModule: true, default: value });
  const renderLoad = createLoader({
    'next/router': { useRouter: () => ({ isReady: true, asPath: '/kurse/test' }) },
    'next/link': wrap(({ href, children, prefetch, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...props }, children)),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
    './PageMenu': { ...wrap(({ title, children }) => React.createElement('aside', { 'data-lower-menu': title }, children)), closePageMenu() {} },
    '../hooks/useCourseProgress': () => ({}), './CourseProgressNotice': wrap(() => null),
  });
  const Course = renderLoad('components/LearningCourse.js').default;
  for (const assignment of expected) {
    const module = learningModules.find(item => item.id === assignment.courseId);
    const html = renderToStaticMarkup(React.createElement(Course, { module }));
    const start = html.indexOf('<aside data-lower-menu="Lektion wählen"'), end = html.indexOf('</aside>', start);
    const lower = html.slice(start, end);
    assert.equal((html.match(/data-course-breed=/g) || []).length, 1);
    assert.ok(lower.includes(`data-course-breed="${assignment.breedId}"`));
    assert.ok(lower.includes(`href="/lernen/jagdhunde/${assignment.breedId}#gesundheit-${assignment.lessonId}"`));
    assert.match(lower, />Rassenprofil<\/a>/);
    assert.ok(!lower.match(/data-course-breed[^>]*target=/));
    const sourceStart = html.indexOf('<details id="quellen"');
    for (const paragraph of module.lessons[0].paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
    assert.ok(sourceStart > end); assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
    assert.doesNotMatch(html, /<dialog/);
  }
  const Links = renderLoad('components/CourseBreedLinks.js').default;
  for (const module of learningModules.filter(item => !expected.some(entry => entry.courseId === item.id))) assert.equal(Links({ moduleId: module.id, lessonId: module.lessons[0].id }), null);
  assert.equal(Links({}), null); assert.equal(Links({ moduleId: expected[0].courseId, lessonId: 'another-lesson' }), null);
});

test('The complete curriculum, all cards and existing course SSG payload shape remain unchanged', () => {
  assert.equal(hash(learningModules.map(stripFeatherGrowthAddition)), '2db74f0237e7983eacefd03a86abe19c071e73ebabb83b8da0fd59785b732cd8');
  const cards = load('lib/learning-flashcards.js').getFlashcards();
  assert.equal(hash(cards.filter(card => !isFeatherGrowthCard(card))), 'e01e7e45482cc7eac2d3ab980cd40a0188eabae531e90d712276ccab5bdd44c6');
  const page = load('pages/kurse/[slug].js');
  for (const module of learningModules) assert.deepEqual(Object.keys(page.getStaticProps({ params: { slug: module.id } }).props).sort(), ['module', 'flashcards', 'wildlifeLinks', 'miniCourseLinks', 'glossaryLinks', 'oralExamLinks'].sort());
  const geneticsCards = cards.filter(card => expected.some(item => item.courseId === card.moduleId));
  assert.equal(geneticsCards.length, 5);
  for (const card of geneticsCards) {
    const course = new URL(card.courseHref, 'https://example.invalid');
    assert.equal(course.hash, `#lesson-${card.lessonId}`);
    const link = getCourseBreedLink(card.moduleId, card.lessonId);
    assert.ok(link); assert.equal(link.breedId, expected.find(item => item.courseId === card.moduleId).breedId);
  }
});

test('The browser mapping imports no curriculum, breed corpus or answer bank, and the static profile server assignments are removed from its client transform', () => {
  const tiny = fs.readFileSync(path.join(root, 'lib/dog-breed-routing.js'), 'utf8');
  assert.doesNotMatch(tiny, /\bimport\b|\brequire\s*\(|localStorage|fetch\s*\(/);
  const filename = path.join(root, 'pages/lernen/jagdhunde/[rasse].js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, isServerCompiler: false, disableNextSsg: false,
    pagesDir: path.join(root, 'pages'), jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'es6' } });
  assert.match(code, /__N_SSG/);
  assert.doesNotMatch(code, /dog-compass|learning-dog-genetics|dog-breed-routing|getDogBreedKnowledgeAssignment|getStaticProps/);
});
