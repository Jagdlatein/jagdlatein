const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');

const load = createLoader();
const data = load('data/exam-alignment/transfer-exam-2026-11-17.json');
const original = load('data/exam-alignment/learning-goals-2026-11-01.json');
const { getLearningModule } = load('lib/learning-curriculum.js');
const { getLearningCategoryByTitle } = load('lib/learning-categories.js');
const { projectExamLearningGoal } = load('lib/exam-learning-goal-server.js');
const { quizQuestionCountries, quizQuestionTopic } = load('lib/quiz-learning-scope.js');
const { examCountries, examProfileLawHref } = load('lib/exam-profile.js');
const { lessonHash } = load('lib/learning-lesson-navigation.js');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const ui = createLoader({ 'next/link': { __esModule: true, default: ({ href, prefetch, children, ...props }) => React.createElement('a', { href, ...props }, children) } });
const { ExamLearningGoal } = ui('components/ExamLearningGoals.js');
const shared = value => Array.isArray(value) && value.length === 3 && ['CH', 'AT', 'DE'].every(country => value.includes(country));
const expected = new Map([
  ['waffen-sicherheit', ['wissen-vertiefung-gehoerschutz-passform-2026', 'kommunikation']],
  ['jagdpraxis', ['wissen-ausbau-notruf-revier-2026', 'dialog']],
  ['jagdrecht', ['wissen-vertiefung-rechtsfassung-pruefen-2026', 'fassung']],
  ['pruefung-sprache', ['wissen-vertiefung-antwortsicherheit-feedback-2026', 'korrektur']],
]);

test('Four new transfer cases use different exact existing lessons and retain the original 36 authored goals', () => {
  assert.deepEqual(Object.keys(data), ['categories']);
  assert.deepEqual(data.categories.map(item => item.slug), [...expected.keys()]);
  const before = JSON.stringify(data);
  const oldIds = new Set(original.categories.flatMap(category => category.goals.map(goal => goal.id)));
  assert.equal(oldIds.size, 36);
  assert.equal(new Set(data.categories.map(item => item.goal.id)).size, 4);
  for (const { slug, goal } of data.categories) {
    assert.equal(oldIds.has(goal.id), false, goal.id);
    assert.deepEqual([goal.moduleId, goal.lessonId], expected.get(slug));
    assert.equal(goal.selfCheck.length, 3);
    assert.ok(goal.selfCheck.every(item => typeof item === 'string' && item.length > 35));
    assert.equal(goal.relatedLessons.length, 2);
    assert.equal(new Set(goal.relatedLessons.map(item => `${item.moduleId}/${item.lessonId}`)).size, 2);
    assert.ok(goal.caseText.length > 120 && goal.followUp.length > 50 && goal.task.length > 100);
    for (const field of ['answers', 'correct', 'explanation', 'reviewedOn', 'sources', 'country', 'region']) assert.equal(Object.hasOwn(goal, field), false, `${goal.id}: ${field}`);
    const course = getLearningModule(goal.moduleId);
    assert.equal(getLearningCategoryByTitle(course.category).slug, slug);
    assert.ok(shared(course.countries));
    const lesson = course.lessons.find(item => item.id === goal.lessonId);
    assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.every(item => typeof item === 'string' && item.length));
    const questions = course.questions.filter(item => item.lessonId === goal.lessonId);
    assert.ok(questions.length >= 2);
    assert.ok(questions.every(question => question.answers.length === 4 && new Set(question.answers.map(answer => answer.text)).size === 4 && question.correct.length === 1));
    if (slug !== 'jagdrecht') assert.ok(questions.every(question => shared(quizQuestionCountries(question)) && quizQuestionTopic(question) !== 'Recht'));
    const projected = projectExamLearningGoal(goal, { categorySlug: slug });
    assert.equal(projected.caseText, goal.caseText);
    assert.equal(projected.followUp, goal.followUp);
    assert.equal(projected.relatedLessons.length, 2);
    for (let index = 0; index < goal.relatedLessons.length; index++) {
      const target = goal.relatedLessons[index], related = getLearningModule(target.moduleId);
      const targetLesson = related.lessons.find(item => item.id === target.lessonId);
      assert.ok(targetLesson && shared(related.countries));
      assert.notEqual(getLearningCategoryByTitle(related.category).slug, 'jagdrecht');
      assert.equal(projected.relatedLessons[index].href, `/kurse/${related.id}${lessonHash(targetLesson.id)}`);
    }
  }
  assert.equal(JSON.stringify(data), before);
});

test('Existing four-option lessons are reused; no transfer case adds a quiz bank or promises complete exam coverage', () => {
  for (const { slug, goal } of data.categories) {
    const projected = projectExamLearningGoal(goal, { categorySlug: slug });
    if (slug === 'jagdrecht') {
      assert.equal(goal.regionalLaw, true);
      assert.equal(projected.regionalLaw, true);
      assert.equal(projected.lessonPractice, false);
      assert.equal(projected.href, null);
      assert.equal(projected.quizHref, null);
      assert.equal(projected.cardHref, undefined);
    } else {
      assert.equal(projected.regionalLaw, false);
      assert.equal(projected.lessonPractice, true);
      assert.equal(projected.href, `/kurse/${goal.moduleId}${lessonHash(goal.lessonId)}`);
      assert.equal(projected.quizHref, `/kurse/${goal.moduleId}#wissenscheck`);
    }
    const raw = JSON.stringify(goal);
    assert.doesNotMatch(raw, /Erfolgsgarantie|amtliche Prüfungsfrage|100\s*%|volle Prüfungsabdeckung/);
    assert.doesNotMatch(JSON.stringify(projected), /"answers"|"correct"|"paragraphs"|"questions"/);
  }
  assert.match(data.categories.find(item => item.slug === 'waffen-sicherheit').goal.task, /ohne Waffen oder Lärmbelastung/);
  assert.match(data.categories.find(item => item.slug === 'jagdpraxis').goal.task, /ohne einen echten Notruf zu wählen/);
});

test('The legal transfer always uses the confirmed exact profile and never a generic course check, in all 51 examination regions', () => {
  const goal = projectExamLearningGoal(data.categories.find(item => item.slug === 'jagdrecht').goal, { categorySlug: 'jagdrecht' });
  let count = 0;
  for (const country of examCountries) for (const region of country.regions) {
    const profile = { country: country.code, region: region.code };
    const html = renderToStaticMarkup(React.createElement(ExamLearningGoal, { goal, profile }));
    assert.ok(html.includes(`href="${examProfileLawHref(profile)}"`));
    assert.ok(html.includes(`href="${examProfileLawHref(profile, 'uebung').replaceAll('&', '&amp;')}"`));
    assert.doesNotMatch(html, /href="\/kurse\/wissen-vertiefung-rechtsfassung-pruefen-2026/);
    assert.doesNotMatch(html, /href="\/lernen\/lernkarten|href="\/lernen\/fuenf-minuten|#wissenscheck/);
    count++;
  }
  assert.equal(count, 51);
  for (const profile of [null, { country: 'CH', region: 'NOE' }, { country: 'DE', region: 'unknown' }]) {
    const html = renderToStaticMarkup(React.createElement(ExamLearningGoal, { goal, profile }));
    assert.match(html, /Wähle dein Prüfungsziel/);
    assert.doesNotMatch(html, /href="\/jagdrecht\//);
  }
});

test('Invalid course, lesson, category and regional related-link metadata cannot invent learning starts', () => {
  const source = data.categories[0].goal;
  for (const patch of [
    { moduleId: 'not-a-course' }, { lessonId: 'not-a-lesson' },
    { relatedLessons: [{ moduleId: 'not-a-course', lessonId: 'kommunikation' }] },
    { relatedLessons: [{ moduleId: 'wissen-vertiefung-rechtsfassung-pruefen-2026', lessonId: 'fassung' }] },
  ]) assert.throws(() => projectExamLearningGoal({ ...source, ...patch }, { categorySlug: 'waffen-sicherheit' }));
  assert.throws(() => projectExamLearningGoal(source, { categorySlug: 'jagdpraxis' }));
  assert.throws(() => projectExamLearningGoal({ ...source, selfCheck: [] }));
});
