// Structural and delivery checks. Independent source reading and editorial
// findings are recorded separately in data/reviews/; passing is no certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const { depthExpansionDatasets: datasets, depthExpansionModules: added } = load('lib/learning-expansion-oct17.js');
const { learningModules, learningQuestions, learningCategories } = load('lib/learning-curriculum.js');
const { QUESTIONS } = load('data/questions-full.js');
const { quizLearningPool } = load('lib/quiz-learning-scope.js');
const normalized = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const addedIds = new Set(added.map(module => module.id));

test('The third expansion contributes 18 courses, 72 lessons and 528 complete questions without padding counts', () => {
  assert.deepEqual(datasets.map(data => data.modules.length), [6, 6, 6]);
  assert.deepEqual(datasets.map(data => data.modules.reduce((sum, module) => sum + module.questions.length, 0)), [192, 192, 144]);
  assert.equal(added.length, 18);
  assert.equal(added.reduce((sum, module) => sum + module.lessons.length, 0), 72);
  const stems = new Set();
  const oldStems = new Set(QUESTIONS.filter(question => !added.some(module => question.learningHref === `/kurse/${module.id}`)).map(question => normalized(question.q)));
  for (const dataset of datasets) for (const module of dataset.modules) {
    assert.ok(learningCategories.includes(module.category));
    assert.equal(module.lessons.length, 4);
    const expectedPerLesson = dataset === datasets[2] ? 6 : 8;
    assert.equal(module.questions.length, expectedPerLesson * 4);
    const positions = [0, 0, 0, 0];
    const preparedModule = learningModules.find(item => item.id === module.id);
    assert.ok(preparedModule);
    assert.equal(preparedModule.flashcardExpansion, true);
    assert.equal(preparedModule.showCategoryDiagram, false);
    assert.equal(preparedModule.reviewedOn, '2026-10-17');
    for (const lesson of preparedModule.lessons) {
      assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.every(text => text.trim()));
      assert.ok(lesson.takeaway.trim() && lesson.exercise.trim());
      assert.equal(module.questions.filter(question => question.lessonId === lesson.id).length, expectedPerLesson);
      assert.ok(lesson.evidence.length > 0);
      for (const claim of lesson.evidence) {
        assert.ok(claim.claim.trim());
        assert.ok(new Set(claim.sources.map(source => source.url)).size >= 2);
        for (const source of claim.sources) assert.ok(module.sources.some(item => item.label === source.label && item.url === source.url));
      }
    }
    for (const question of module.questions) {
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(question.explain.trim());
      const stem = normalized(question.q);
      assert.ok(!stems.has(stem) && !oldStems.has(stem), 'Repeated stem: ' + question.q);
      stems.add(stem);
      positions[question.answer]++;
      const id = `${module.id}-${question.id}`;
      assert.ok(id.length <= 160);
      const prepared = learningQuestions.find(item => item.id === id);
      assert.ok(prepared && QUESTIONS.some(item => item.id === id));
      assert.equal(prepared.answers.find(answer => prepared.correct.includes(answer.id)).text, question.options[question.answer]);
      assert.equal(prepared.learningCategory, module.category);
      if (question.countries?.length < 3) {
        assert.equal(prepared.topic, 'Recht');
        assert.deepEqual(prepared.countries, question.countries);
        assert.ok(!quizLearningPool(QUESTIONS).some(item => item.id === id));
        for (const country of ['DE', 'AT', 'CH']) assert.equal(quizLearningPool(QUESTIONS, { country, topic: 'Recht' }).some(item => item.id === id), question.countries.includes(country));
      } else assert.ok(quizLearningPool(QUESTIONS, { topic: module.category }).some(item => item.id === id));
    }
    assert.deepEqual(positions, Array(4).fill(expectedPerLesson));
  }
  assert.equal(stems.size, 528);
  assert.equal(learningModules.filter(module => !addedIds.has(module.id)).length, 132, 'existing detailed courses remain');
});

test('New courses and exact lesson cards use existing discovery, source evidence and licensed category covers', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { getFlashcardExport, getFlashcardLessonSummary } = load('lib/learning-flashcards.js');
  const { getLearningMedia } = load('lib/learning-media.js');
  const allCards = getFlashcardExport().cards;
  for (const module of added) {
    const result = searchLearning({ query: module.title, type: 'course' }).results.find(item => item.id === `course:${module.id}`);
    assert.ok(result && result.href.startsWith(`/kurse/${module.id}`), module.id);
    for (const lesson of module.lessons) {
      const lessonResult = searchLearning({ query: lesson.title, type: 'course' }).results.find(item => item.id === `course:${module.id}`);
      assert.equal(lessonResult?.href, `/kurse/${module.id}#lesson-${encodeURIComponent(lesson.id)}`, lesson.title);
      const scoped = getFlashcardExport({ courseId: module.id, lessonId: lesson.id });
      assert.equal(scoped.selection.returnHref, `/kurse/${module.id}#lesson-${encodeURIComponent(lesson.id)}`);
      assert.ok(scoped.cards.every(card => card.moduleId === module.id && card.lessonId === lesson.id));
    }
    const cards = allCards.filter(card => card.moduleId === module.id);
    assert.ok(cards.length > 0);
    assert.equal(getFlashcardLessonSummary(module.id).total, cards.length);
    for (const card of cards) {
      const lesson = module.lessons.find(item => item.id === card.lessonId);
      assert.equal(card.reviewedOn, '2026-10-17');
      assert.equal(card.sourceScope, 'lesson');
      assert.ok(card.sources.length >= 2 && card.sources.every(source => lesson.evidence.some(claim => claim.sources.some(item => item.url === source.url))));
      assert.equal(card.learningHref, `/kurse/${module.id}#lesson-${encodeURIComponent(lesson.id)}`);
    }
    const cover = getLearningMedia(module);
    assert.ok(cover?.src && cover.credit && cover.creditUrl);
    assert.ok(fs.existsSync(path.join(root, 'public', cover.src)), cover.src);
  }
});

test('Every new course can be delivered in the existing eight-course offline packs with its evidence intact', () => {
  const { createOfflinePack } = load('lib/offline-learning-server.js');
  const { validateOfflinePack } = load('lib/offline-learning.js');
  const previousSecret = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'isolated-offline-depth-delivery-test';
  try {
    const now = Date.parse('2026-10-17T10:00:00Z');
    const access = { email: 'offline-depth@example.invalid', paidUntil: '2026-10-19T10:00:00Z' };
    const included = [];
    for (let offset = 0; offset < added.length; offset += 8) {
      const selected = added.slice(offset, offset + 8);
      const pack = createOfflinePack({ courseIds: selected.map(module => module.id), sounds: false }, access, now);
      assert.ok(validateOfflinePack(pack, now));
      assert.equal(pack.expiresAt, Date.parse(access.paidUntil));
      assert.deepEqual(pack.courses.map(module => module.id), selected.map(module => module.id));
      for (const module of pack.courses) {
        const original = learningModules.find(item => item.id === module.id);
        assert.deepEqual(module.lessons, original.lessons);
        assert.deepEqual(module.questions, original.questions);
        assert.deepEqual(module.sources, original.sources);
        included.push(module.id);
      }
    }
    assert.deepEqual(included, added.map(module => module.id));
  } finally {
    if (previousSecret === undefined) delete process.env.JL_SESSION_SECRET;
    else process.env.JL_SESSION_SECRET = previousSecret;
  }
});
