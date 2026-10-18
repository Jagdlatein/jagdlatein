// Integration and editorial-boundary safeguards; not a substitute for reading sources.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { october18GrowthModules: added } = load('lib/learning-growth-oct18.js');
const { learningModules } = load('lib/learning-curriculum.js');
const cards = load('lib/learning-flashcards.js').getFlashcardExport().cards;

test('Every new course renders its actual page and source review before prerendering', () => {
  const { local } = require('./helpers/project-module.cjs');
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const pageLoad = createLoader({ 'next/router': { useRouter: () => ({ query: {}, asPath: '/kurse/test' }) }, 'next/head': () => null });
  const CoursePage = pageLoad('pages/kurse/[slug].js');
  for (const course of added) {
    const { props } = CoursePage.getStaticProps({ params: { slug: course.id } });
    const html = renderToStaticMarkup(React.createElement(CoursePage.default, props));
    assert.ok(html.includes(course.lessons[0].title));
    assert.ok(html.includes('Welche Aussagen wurden gegengeprüft?'));
    assert.ok(html.includes(course.sources[0].url.replaceAll('&', '&amp;')));
  }
});

test('Three narrow evidence-based courses add nine lessons and 36 distinct four-option questions', () => {
  assert.equal(added.length, 3);
  assert.equal(added.reduce((n, m) => n + m.lessons.length, 0), 9);
  assert.equal(added.reduce((n, m) => n + m.questions.length, 0), 36);
  const oldStems = new Set(learningModules.filter(m => !added.some(a => a.id === m.id)).flatMap(m => m.questions.map(q => q.q.trim().toLowerCase())));
  const newStems = new Set();
  for (const course of added) {
    assert.equal(course.reviewedOn, '2026-10-18');
    assert.equal(course.showCategoryDiagram, false);
    assert.equal(course.flashcardExpansion, true);
    const answerCounts = [0, 0, 0, 0];
    for (const lesson of course.lessons) {
      assert.ok(lesson.paragraphs.join(' ').length > 600, `${course.id}/${lesson.id}`);
      assert.ok(lesson.takeaway && lesson.exercise);
      assert.equal(course.questions.filter(q => q.lessonId === lesson.id).length, 4);
      assert.ok(lesson.evidence.length >= 1);
      for (const claim of lesson.evidence) {
        assert.ok(claim.claim.length > 30);
        assert.ok(new Set(claim.sources.map(s => s.url)).size >= 2);
        assert.ok(claim.sources.every(s => course.sources.some(original => original.url === s.url)));
      }
    }
    for (const q of course.questions) {
      const stem = q.q.trim().toLowerCase();
      assert.ok(!oldStems.has(stem) && !newStems.has(stem), q.q);
      newStems.add(stem);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.explain.length > 30);
      answerCounts[q.answer]++;
    }
    assert.deepEqual(answerCounts, [3, 3, 3, 3]);
  }
});

test('New knowledge stays findable in existing categories and yields standalone cards with visible answers and sources', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { getLearningCategoryByTitle } = load('lib/learning-categories.js');
  const { getLearningOverviewData } = load('lib/learning-overview-server.js');
  for (const course of added) {
    const hit = searchLearning({ query: course.title, type: 'course' }).results.find(r => r.id === `course:${course.id}`);
    assert.ok(hit, course.title);
    assert.ok(hit.href.startsWith(`/kurse/${course.id}`));
    assert.ok(!hit.questions && !hit.evidence && !hit.lessons);
    const category = getLearningCategoryByTitle(course.category);
    const summary = getLearningOverviewData(category.slug).modules.find(m => m.id === course.id);
    assert.ok(summary);
    assert.equal(summary.coverIndex, null, 'No unrelated cover photo');
    const deck = cards.filter(c => c.moduleId === course.id);
    assert.ok(deck.length >= 8, `${course.id}: ${deck.length}`);
    for (const card of deck) {
      assert.ok(card.answer && card.explanation && card.sources.length >= 2);
      assert.equal(card.reviewedOn, '2026-10-18');
      assert.ok(card.courseHref.startsWith(`/kurse/${course.id}#lesson-`));
      assert.ok(!card.options && !card.correct);
    }
  }
});

test('The new courses work in the existing expiring offline package without unrelated photos', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'unit-test-only-secret-not-a-credential';
  try {
    const now = Date.parse('2026-10-18T10:00:00Z');
    const { createOfflinePack } = load('lib/offline-learning-server.js');
    const pack = createOfflinePack({ courseIds: added.map(m => m.id), sounds: false }, { email: 'learner@example.invalid', trialUntil: '2026-10-20T10:00:00Z' }, now);
    assert.equal(pack.courses.length, 3);
    assert.equal(pack.photos.length, 0);
    assert.equal(pack.sounds.length, 0);
    assert.equal(pack.expiresAt, Date.parse('2026-10-20T10:00:00Z'));
    for (const course of pack.courses) {
      for (const lesson of course.lessons) {
        assert.ok(lesson.evidence.length >= 1);
        assert.ok(lesson.evidence.every(e => e.sources.length >= 2));
      }
    }
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET;
    else process.env.JL_SESSION_SECRET = previous;
  }
});
