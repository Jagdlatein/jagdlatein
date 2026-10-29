// Editorial scope and integration regressions, not scientific certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { additions, stripSensesAddition, stripSensesDataset, isSensesCard, sensesBaselineFixture } = require('./helpers/senses-learning-additions-oct29.cjs');
const raw = require('../data/learning-expansion-biology-2026-10-16.json');
const load = createLoader(), baselineLoad = createLoader(sensesBaselineFixture());
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const cards = load('lib/learning-flashcards.js').getFlashcards();
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('The complete biology dataset from 96eb237 remains exact after removing only these two appendices', () => {
  assert.equal(hash(stripSensesDataset(raw)), 'a0b1d587d1626cd98e1e86dc81c47bbb6b6a4280c7e0a37f601a384c8cdb90ad');
  assert.equal(raw.reviewedOn, '2026-10-16');
  for (const addition of additions) {
    const module = raw.modules.find(item => item.id === addition.courseId);
    assert.equal(module.reviewedOn, '2026-10-16');
    assert.equal(module.lessons.length, addition.oldLessons + 1);
    assert.equal(module.questions.length, addition.oldQuestions + 2);
    assert.equal(module.sources.length, addition.oldSources + addition.sourceURLs.length);
    assert.equal(module.lessons.at(-1).id, addition.lessonId);
  }
  const foreign = fs.readFileSync(path.join(__dirname, '../data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All existing full course objects and all existing card objects retain exact content and order', () => {
  assert.equal(learningModules.length, 198);
  assert.deepEqual(learningModules.map(stripSensesAddition), baselineLoad('lib/learning-curriculum.js').learningModules);
  const previous = baselineLoad('lib/learning-flashcards.js').getFlashcards();
  assert.deepEqual(cards.filter(card => !isSensesCard(card)), previous);
  assert.equal(cards.length, previous.length + 4);
  assert.deepEqual(cards.slice(0, 116), previous.slice(0, 116));
});

for (const addition of additions) {
  const { courseId, lessonId } = addition;
  const course = getLearningModule(courseId), lesson = course.lessons.at(-1);
  test(`${lessonId}: a complete short lesson has the true lesson date and exact scoped independent evidence`, () => {
    assert.equal(lesson.title, lessonId === 'gesichtsschleier' ? 'Gesichtsschleier' : 'Tapetum');
    assert.equal(lesson.reviewedOn, '2026-10-29');
    assert.equal(course.reviewedOn, '2026-10-16');
    assert.equal(lesson.flashcardExpansion, true);
    assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length, addition.words);
    assert.match(lesson.paragraphs.join(' '), /Eigene Denkübung/);
    assert.doesNotMatch(lesson.paragraphs.join(' '), /\d|Prozent|Metern|Zentimeter|Hertz|Frequenz/);
    assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
    const sources = course.sources.slice(-addition.sourceURLs.length);
    assert.deepEqual(sources.map(source => source.url), addition.sourceURLs);
    for (const source of sources) {
      assert.equal(source.checkedOn, '2026-10-29');
      assert.deepEqual(source.lessonIds, [lessonId]);
    }
    assert.equal(lesson.evidence.length, lessonId === 'gesichtsschleier' ? 3 : 2);
    for (const claim of lesson.evidence) {
      assert.ok(new Set(claim.sources.map(source => source.url)).size >= 2);
      assert.ok(claim.sources.every(source => addition.sourceURLs.includes(source.url)));
    }
    const text = lesson.paragraphs.join(' ');
    if (lessonId === 'gesichtsschleier') {
      assert.match(text, /gehaltenen amerikanischen Schleiereulen/);
      assert.match(text, /Bei diesen Verhaltenstesttieren wurde der Schleier nicht entfernt/);
      assert.match(text, /keine allgemeine Trefferquote/);
      assert.match(text, /keine Wiederholung dieses Experiments/);
      assert.match(text, /Federbüschel am Kopf, keine Ohröffnungen/);
      assert.match(text, /Eine gleiche Ohrenstellung sämtlicher Eulen wird hier nicht vorausgesetzt/);
    } else {
      assert.match(text, /reflektierende Schicht hinter der Netzhaut/);
      assert.match(text, /kein eigenes Licht/);
      assert.match(text, /in vollständiger Dunkelheit steht kein einfallendes Licht/);
      assert.match(text, /bei manchen Hunden fehlt es/);
      assert.match(text, /maß aber keine Sehfunktion/);
      assert.match(text, /Ein Augenfoto allein ersetzt diese fehlende Messung nicht/);
    }
  });

  test(`${lessonId}: two distinct own questions become two dated cards with complete answers and existing direct lesson links`, () => {
    const selected = course.questions.filter(question => question.lessonId === lessonId);
    assert.deepEqual(selected.map(question => question.id), addition.questionIds.map(id => `${courseId}-${id}`));
    assert.equal(new Set(selected.map(question => question.q)).size, 2);
    for (const question of selected) {
      assert.equal(learningModules.flatMap(module => module.questions).filter(item => item.q === question.q).length, 1);
      assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
      const [card] = cards.filter(item => item.id === `flash-${question.id}`);
      assert.ok(card); assert.equal(card.question, question.q);
      assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
      assert.equal(card.explanation, question.explain);
      assert.equal(card.reviewedOn, '2026-10-29'); assert.equal(card.sourceScope, 'lesson');
      assert.deepEqual(new Set(card.sources.map(source => source.url)), new Set(addition.sourceURLs));
      assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
      assert.equal(card.options, undefined);
    }
    const bank = load('data/questions-full.js').QUESTIONS;
    const { quizLearningPool } = load('lib/quiz-learning-scope.js');
    for (const country of ['DE', 'AT', 'CH']) for (const question of selected) {
      assert.ok(quizLearningPool(bank, { country, topic: course.category }).some(item => item.id === question.id));
    }
  });

  test(`${lessonId}: existing category, course delivery, search and offline packs expose the full addition without a new route`, () => {
    const where = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
    assert.equal(where.categorySlug, lessonId === 'gesichtsschleier' ? 'wildkunde' : 'hundewesen');
    const result = load('lib/learning-search.js').searchLearning({ query: lessonId === 'gesichtsschleier' ? 'Gesichtsschleier' : 'Tapetum', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.ok(result); assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`);
    assert.equal(result.lessonTitle, lesson.title);
    const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
    assert.deepEqual(props.module.lessons.at(-1), lesson);
    assert.equal(props.flashcards.lessons[lessonId], 2);
    const previous = process.env.JL_SESSION_SECRET;
    process.env.JL_SESSION_SECRET = 'isolated-senses-oct29-offline';
    try {
      const now = Date.parse('2026-10-29T10:00:00Z');
      const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-10-31T10:00:00Z' }, now);
      const { validateOfflinePack } = load('lib/offline-learning.js');
      assert.equal(validateOfflinePack(pack, now), true);
      assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
      assert.deepEqual(pack.courses[0].lessons, course.lessons);
      assert.deepEqual(pack.courses[0].questions, course.questions);
      assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
      assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-29');
    } finally {
      if (previous === undefined) delete process.env.JL_SESSION_SECRET;
      else process.env.JL_SESSION_SECRET = previous;
    }
  });

  test(`${lessonId}: the actual reader shows the full lesson before its final closed sources and dates only this lesson 29 October`, () => {
    const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
    let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? course.lessons.length - 1 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks,
      'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lessonId}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': () => ({}),
      './CourseProgressNotice': { __esModule: true, default: () => null },
    })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId) }));
    const sourceStart = html.indexOf('<details id="quellen"'); assert.ok(sourceStart > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
    for (const url of addition.sourceURLs) assert.ok(html.slice(sourceStart).includes(url.replaceAll('&', '&amp;')));
    assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
    assert.match(html.slice(sourceStart), /29\. Oktober 2026/);
    assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026/);
  });
}
