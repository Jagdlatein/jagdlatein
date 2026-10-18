// Technical integration safeguards, distinct from the source/peer reviews in data/reviews.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const load = createLoader();
const { examExpansionModules: added } = load('lib/learning-exam-expansion-oct18.js');
const { learningModules, learningPaths } = load('lib/learning-curriculum.js');
const cards = load('lib/learning-flashcards.js').getFlashcardExport().cards;

test('Three new subject courses contain twelve substantial lessons and 48 unique explained questions', () => {
  assert.equal(added.length, 3);
  const oldStems = new Set(learningModules.filter(m => !added.some(a => a.id === m.id)).flatMap(m => m.questions.map(q => q.q.trim().toLowerCase())));
  const stems = new Set();
  for (const course of added) {
    assert.equal(course.lessons.length, 4);
    assert.equal(course.questions.length, 16);
    assert.equal(course.reviewedOn, '2026-10-18');
    assert.equal(course.showCategoryDiagram, false);
    assert.equal(course.flashcardExpansion, true);
    const counts = [0, 0, 0, 0];
    for (const lesson of course.lessons) {
      assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.join(' ').length > 600, `${course.id}/${lesson.id}`);
      assert.ok(lesson.takeaway && lesson.exercise);
      assert.equal(course.questions.filter(q => q.lessonId === lesson.id).length, 4);
      assert.ok(lesson.evidence.length >= 1);
      for (const item of lesson.evidence) {
        assert.ok(item.claim.length > 30);
        assert.ok(new Set(item.sources.map(s => s.url)).size >= 2);
        assert.ok(item.sources.every(s => course.sources.some(original => original.url === s.url)));
      }
    }
    for (const question of course.questions) {
      const stem = question.q.trim().toLowerCase();
      assert.ok(!oldStems.has(stem) && !stems.has(stem), question.q);
      stems.add(stem);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(question.explain.length > 30);
      counts[question.answer]++;
    }
    assert.deepEqual(counts, [4, 4, 4, 4]);
  }
  assert.equal(stems.size, 48);
});

test('Each real course page renders its knowledge text, lesson controls, sources and source review', () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const pageLoad = createLoader({ 'next/router': { useRouter: () => ({ query: {}, asPath: '/kurse/test' }) }, 'next/head': () => null });
  const Page = pageLoad('pages/kurse/[slug].js');
  for (const course of added) {
    const { props } = Page.getStaticProps({ params: { slug: course.id } });
    const html = renderToStaticMarkup(React.createElement(Page.default, props));
    assert.ok(html.includes(course.lessons[0].title));
    assert.ok(html.includes('Welche Aussagen wurden gegengeprüft?'));
    assert.ok(html.includes(course.sources[0].url.replaceAll('&', '&amp;')));
    assert.ok(html.includes('Lektion auswählen'));
  }
});

test('New material participates in search, category paths, shared quiz and standalone source-backed cards', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { getLearningCategoryByTitle } = load('lib/learning-categories.js');
  const { getLearningOverviewData } = load('lib/learning-overview-server.js');
  const { QUESTIONS } = load('data/questions-full.js');
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const course of added) {
    const category = getLearningCategoryByTitle(course.category);
    const hit = searchLearning({ query: course.title, type: 'course' }).results.find(r => r.id === `course:${course.id}`);
    assert.ok(hit && hit.href.startsWith(`/kurse/${course.id}`));
    const summary = getLearningOverviewData(category.slug).modules.find(m => m.id === course.id);
    assert.ok(summary && summary.coverIndex === null);
    assert.ok(!summary.questions && !summary.lessons && !summary.evidence);
    if (/\bVertiefung\b/.test(course.level || '')) assert.ok(learningPaths.find(p => p.id === `vertiefung-${category.slug}`).moduleIds.includes(course.id));
    const prepared = learningModules.find(m => m.id === course.id);
    const pool = new Set(quizLearningPool(QUESTIONS, { topic: course.category }).map(q => q.id));
    assert.ok(prepared.questions.every(q => pool.has(q.id)), course.id);
    const deck = cards.filter(c => c.moduleId === course.id);
    assert.ok(deck.length >= 12, `${course.id}: ${deck.length} usable cards`);
    assert.ok(course.lessons.every(l => deck.some(c => c.lessonId === l.id)));
    for (const card of deck) {
      assert.ok(card.answer && card.explanation && card.sources.length >= 2);
      assert.equal(card.reviewedOn, '2026-10-18');
      assert.ok(card.courseHref.startsWith(`/kurse/${course.id}#lesson-`));
      assert.ok(!card.options && !card.correct);
    }
  }
});

test('All additions remain in the existing expiring offline format without decorative photos', () => {
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
    assert.ok(pack.courses.every(c => c.lessons.every(l => l.evidence.length >= 1)));
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET;
    else process.env.JL_SESSION_SECRET = previous;
  }
});
