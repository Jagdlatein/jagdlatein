// Structure, integration and concrete editorial regressions. Source reading is
// separately recorded in data/reviews/; these checks are not scientific review.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { scienceExpansionDatasets: datasets, scienceExpansionModules: added } = load('lib/learning-science-expansion.js');
const { learningCategories, learningModules, learningQuestions } = load('lib/learning-curriculum.js');
const { QUESTIONS } = load('data/questions-full.js');
const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

test('The second expansion adds eighteen detailed courses with 576 explained questions in the existing categories', () => {
  assert.equal(datasets.length, 3);
  assert.equal(added.length, 18);
  assert.deepEqual([...new Set(added.map(module => module.category))].sort(), [...learningCategories].sort());
  const stems = new Set();
  const oldStems = new Set(learningModules.filter(module => !added.some(x => x.id === module.id)).flatMap(module => module.questions.map(question => normalize(question.q))));
  for (const module of added) {
    assert.ok(learningModules.some(item => item.id === module.id), module.id);
    assert.equal(module.lessons.length, 4, module.id);
    assert.equal(module.questions.length, 32, module.id);
    assert.equal(module.reviewedOn, '2026-10-16');
    assert.equal(module.flashcardExpansion, true);
    assert.ok(new Set(module.sources.map(source => source.organization)).size >= 2, module.id);
    const counts = [0, 0, 0, 0];
    for (const lesson of module.lessons) {
      assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.join(' ').length > 500, module.id + '/' + lesson.id);
      assert.ok(lesson.takeaway && lesson.exercise);
      assert.equal(module.questions.filter(question => question.lessonId === lesson.id).length, 8, module.id + '/' + lesson.id);
      assert.ok(lesson.evidence.length);
      for (const claim of lesson.evidence) {
        assert.ok(claim.claim.length > 30);
        assert.ok(new Set(claim.sources.map(source => source.url)).size >= 2);
        assert.ok(claim.sources.every(source => module.sources.some(item => item.url === source.url)));
      }
    }
    for (const question of module.questions) {
      const stem = normalize(question.q);
      assert.ok(!stems.has(stem) && !oldStems.has(stem), 'Duplicate: ' + question.q);
      stems.add(stem);
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
      assert.ok(question.explain.length > 30);
      counts[question.answer]++;
      const prepared = learningQuestions.find(item => item.id === `${module.id}-${question.id}`);
      assert.ok(prepared && QUESTIONS.some(item => item.id === prepared.id), question.id);
      assert.equal(prepared.answers.find(answer => prepared.correct.includes(answer.id)).text, question.options[question.answer]);
      if (question.countries?.length < 3) {
        assert.equal(prepared.topic, 'Recht');
        assert.deepEqual(prepared.countries, question.countries);
      }
    }
    assert.deepEqual(counts, [8, 8, 8, 8], module.id);
  }
});

test('New knowledge is discoverable and eligible lesson cards retain exact lesson evidence and a direct return path', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { getFlashcardExport, getFlashcardLessonSummary } = load('lib/learning-flashcards.js');
  const allCards = getFlashcardExport().cards;
  for (const module of added) {
    assert.ok(searchLearning({ query: module.title, type: 'course' }).results.some(item => item.href.startsWith('/kurse/' + module.id)), module.id);
    const summary = getFlashcardLessonSummary(module.id);
    const cards = allCards.filter(card => card.moduleId === module.id);
    assert.equal(summary.total, cards.length);
    for (const card of cards) {
      const lesson = module.lessons.find(item => item.id === card.lessonId);
      assert.ok(lesson && summary.lessons[lesson.id] > 0);
      assert.equal(card.sourceScope, 'lesson');
      assert.equal(card.reviewedOn, '2026-10-16');
      assert.ok(card.sources.length >= 2);
      assert.ok(card.sources.every(source => lesson.evidence.some(claim => claim.sources.some(item => item.url === source.url))));
      assert.equal(getFlashcardExport({ courseId: module.id, lessonId: lesson.id }).selection.returnHref, `/kurse/${module.id}#lesson-${lesson.id}`);
    }
    if (module.category !== 'Jagdrecht') assert.ok(summary.total > 0, module.id);
  }
});

test('The legacy roe-deer question asks about development rather than a universal June birth date', () => {
  const question = QUESTIONS.find(item => item.id === 'JL-1041');
  assert.match(question.q, /zeitlichen Effekt/);
  assert.deepEqual(question.correct, ['b']);
  assert.match(question.answers.find(answer => answer.id === 'b').text, /verzögert.*Embryonalentwicklung/);
  assert.match(question.explain, /keinen vollständigen Entwicklungsstillstand/);
  assert.doesNotMatch(question.q, /Warum setzt/);
  assert.ok(!question.answers.some(answer => /optimierte Geburt|maximal günstig/i.test(answer.text)));
});
