// Technical safeguards and the concrete editorial corrections from peer review.
// These assertions do not replace the source reading in data/reviews/.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { knowledgeGrowthModules: added } = load('lib/learning-knowledge-growth.js');
const { learningModules, learningQuestions } = load('lib/learning-curriculum.js');
const { learningCategories } = load('lib/learning-categories.js');

test('Eighteen substantive additions cover all twelve existing categories with 72 lessons and 288 explained questions', () => {
  assert.equal(added.length, 18);
  assert.deepEqual([...new Set(added.map(x => x.category))].sort(), [...learningCategories].sort());
  assert.equal(new Set(learningModules.map(x => x.id)).size, learningModules.length);
  assert.equal(new Set(learningQuestions.map(x => x.id)).size, learningQuestions.length);
  const stems = [];
  for (const module of added) {
    assert.equal(module.lessons.length, 4, module.id);
    assert.equal(module.questions.length, 16, module.id);
    assert.equal(module.reviewedOn, '2026-10-16');
    assert.ok(new Set(module.sources.map(x => x.organization)).size >= 2);
    const counts = [0, 0, 0, 0];
    for (const lesson of module.lessons) {
      assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.join(' ').length > 500, `${module.id}/${lesson.id}`);
      assert.ok(lesson.takeaway && lesson.exercise);
      assert.equal(module.questions.filter(x => x.lessonId === lesson.id).length, 4);
      for (const claim of lesson.evidence) {
        assert.ok(claim.claim.length > 30);
        assert.ok(new Set(claim.sources.map(x => x.url)).size >= 2);
        for (const source of claim.sources) assert.ok(module.sources.some(x => x.url === source.url && x.label === source.label));
      }
    }
    for (const q of module.questions) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4, `${module.id}/${q.id}`);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
      assert.ok(q.explain.length > 30);
      counts[q.answer]++;
      stems.push(q.q.trim().toLowerCase());
    }
    assert.deepEqual(counts, [4, 4, 4, 4], module.id);
  }
  assert.equal(new Set(stems).size, stems.length, 'No duplicate stems in the authored expansion');
});

test('New lessons are searchable at the exact existing course/lesson and receive a licensed category cover', () => {
  const search = load('lib/learning-search.js').searchLearning;
  const { getLearningOverviewData } = load('lib/learning-overview-server.js');
  const { getLearningCategoryByTitle } = load('lib/learning-categories.js');
  const { lessonHash } = load('lib/learning-lesson-navigation.js');
  for (const module of added) {
    const data = getLearningOverviewData(getLearningCategoryByTitle(module.category).slug);
    const summary = data.modules.find(x => x.id === module.id);
    assert.ok(summary && data.covers[summary.coverIndex]?.src, module.id);
    assert.ok(!summary.questions && !summary.lessons && !summary.evidence);
    const hits = search({ query: module.title, type: 'course' }).results;
    assert.ok(hits.some(x => x.href.startsWith(`/kurse/${module.id}`)), module.id);
    assert.ok(lessonHash(module.lessons[0].id).startsWith('#lesson-'));
  }
});

test('Regional protection questions remain scoped and method-estimated age is not presented as a proven birth age', () => {
  const legal = learningModules.find(x => x.id === 'wissen-ausbau-schutzgebietspruefung-2026');
  legal.questions.slice(0, 12).forEach((q, i) => assert.deepEqual(q.countries, [['DE', 'AT', 'CH'][Math.floor(i / 4)]]));
  const age = added.find(x => x.id === 'wissen-ausbau-zahnalter-beweisgrenzen-2026');
  assert.match(age.lessons.find(x => x.id === 'kalibrierung').paragraphs[0], /Zementannulation/);
  assert.match(age.questions.find(x => x.id === 'kalibrierung-q1').explain, /Fehler/);
  assert.doesNotMatch(age.questions.find(x => x.id === 'kalibrierung-q1').explain, /tatsächlichem Alter/);
  const hev = added.find(x => x.id === 'wissen-ausbau-hepatitis-e-2026').questions.find(x => x.id === 'q11');
  assert.match(hev.q, /Fleischproduktgruppe/);
  assert.ok(!hev.options.some(x => /bloße Kühlung/.test(x)));
});
