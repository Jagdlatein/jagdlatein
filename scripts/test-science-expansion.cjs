const { practiceKnowledgeBaselineFixture } = require('./helpers/practice-knowledge-additions-oct29.cjs');
const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { examKnowledgeBaselineFixture } = require('./helpers/exam-knowledge-additions-oct29.cjs');
const { plantEnergyBaselineFixture } = require('./helpers/plant-energy-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
// Structure, integration and concrete editorial regressions. Source reading is
// separately recorded in data/reviews/; these checks are not scientific review.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader: createLinkedProjectLoader } = require('./helpers/project-module.cjs');
const createLoader = overrides => createLinkedProjectLoader(practiceKnowledgeBaselineFixture(linkedExamBaselineFixture(overrides)));
const load = createLoader(examKnowledgeBaselineFixture(plantEnergyBaselineFixture(adiposeBaselineFixture())));
const { scienceExpansionDatasets: datasets, scienceExpansionModules: added } = load('lib/learning-science-expansion.js');
const { learningCategories, learningModules, learningQuestions } = load('lib/learning-curriculum.js');
const { QUESTIONS } = load('data/questions-full.js');
const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const woodCourseId = 'wissen-ausbau-oekologie-holzaufbau-2026';
const woodLessonId = 'gefaessverteilung';
const birdCourseId = 'wissen-ausbau-biologie-vogelkoerper-2026';
const birdLessonId = 'gegenstrom';
const cropCourseId = 'wissen-ausbau-biologie-verdauungsvergleich-2026';
const cropLessonId = 'kropfmilch';
const fishCourseId = 'wissen-ausbau-oekologie-tierbewegungen-2026';
const fishLessonId = 'seitenliniensinn';
const owlLessonId = 'gewoelle';
const scopedLesson = (moduleId, lessonId) => moduleId === woodCourseId && lessonId === woodLessonId || moduleId === birdCourseId && lessonId === birdLessonId || moduleId === cropCourseId && [cropLessonId, owlLessonId].includes(lessonId) || moduleId === fishCourseId && lessonId === fishLessonId;
const scopedDate = moduleId => [cropCourseId, fishCourseId].includes(moduleId) ? '2026-10-27' : '2026-10-24';

test('The eighteen historical science courses retain 576 questions and add seven precisely scoped dated questions', () => {
  assert.equal(datasets.length, 3);
  assert.equal(added.length, 18);
  assert.equal(added.reduce((count, module) => count + module.questions.length, 0), 583);
  assert.deepEqual([...new Set(added.map(module => module.category))].sort(), [...learningCategories].sort());
  const stems = new Set();
  const oldStems = new Set(learningModules.filter(module => !added.some(x => x.id === module.id)).flatMap(module => module.questions.map(question => normalize(question.q))));
  for (const module of added) {
    assert.ok(learningModules.some(item => item.id === module.id), module.id);
    assert.equal(module.lessons.length, module.id === cropCourseId ? 6 : [woodCourseId, birdCourseId, fishCourseId].includes(module.id) ? 5 : 4, module.id);
    assert.equal(module.questions.length, module.id === cropCourseId ? 36 : [woodCourseId, birdCourseId, fishCourseId].includes(module.id) ? 33 : 32, module.id);
    assert.equal(module.reviewedOn, '2026-10-16');
    assert.equal(module.flashcardExpansion, true);
    assert.ok(new Set(module.sources.map(source => source.organization)).size >= 2, module.id);
    const counts = [0, 0, 0, 0];
    for (const lesson of module.lessons) {
      assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.join(' ').length > 500, module.id + '/' + lesson.id);
      assert.ok(lesson.takeaway && lesson.exercise);
      const newScopedLesson = scopedLesson(module.id, lesson.id);
      assert.equal(module.questions.filter(question => question.lessonId === lesson.id).length, newScopedLesson ? module.id === cropCourseId ? 2 : 1 : 8, module.id + '/' + lesson.id);
      if (newScopedLesson) assert.equal(lesson.reviewedOn, scopedDate(module.id));
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
      if (module.id === woodCourseId && question.lessonId === woodLessonId) {
        assert.equal(question.id, 'gefaessverteilung-ringporige-eiche');
        assert.equal(question.answer, 2);
      } else if (module.id === birdCourseId && question.lessonId === birdLessonId) {
        assert.equal(question.id, 'gegenstrom-waermerichtung');
        assert.equal(question.answer, 1);
      } else if (module.id === cropCourseId && question.lessonId === cropLessonId) {
        assert.ok(['kropfmilch-zellherkunft', 'kropfmilch-beide-eltern'].includes(question.id));
        assert.equal(question.answer, question.id === 'kropfmilch-zellherkunft' ? 2 : 0);
      } else if (module.id === fishCourseId && question.lessonId === fishLessonId) {
        assert.equal(question.id, 'seitenliniensinn-wasserbewegung');
        assert.equal(question.answer, 0);
      } else if (module.id === cropCourseId && question.lessonId === owlLessonId) {
        assert.ok(['gewoelle-muskelmagen', 'gewoelle-rueckweg'].includes(question.id));
        assert.equal(question.answer, question.id === 'gewoelle-muskelmagen' ? 1 : 3);
      } else counts[question.answer]++;
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
      assert.equal(card.reviewedOn, scopedLesson(module.id, lesson.id) ? scopedDate(module.id) : '2026-10-16');
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
