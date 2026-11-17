const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const data = load('data/exam-alignment/transfer-practice-2026-11-17.json');
const review = load('data/reviews/transfer-practice-learning-2026-11-17.json');
const { getLearningModule } = load('lib/learning-curriculum.js');
const { projectExamLearningGoal } = load('lib/exam-learning-goal-server.js');
const { getDailyReviewPool } = load('lib/daily-review-pool.js');
const baseline = '69e4417ffc881e88432dfc04e3e444f1b1357659';
const expected = [
  ['hundewesen', 'hund-suchprotokoll-transfer', 'wissen-vertiefung-hunde-nase-spur-laut', 'wissen-vertiefung-hunde-nase-spur-laut-fundkontrolle'],
  ['wildbret-gesundheit', 'wildbret-toxinbefund-transfer', 'wissen-ausbau-revierpraxis-lebensmittelbakterien-2026', 'vorgebildete-toxine'],
  ['ausruestung-technik', 'technik-punktwolke-transfer', 'wissen-wachstum-gps-wald-2026', 'streuung'],
  ['tierschutz-verantwortung', 'verantwortung-wahlzugang-transfer', 'wissen-vertiefung-tierwohl-empfindung-round6-2026', 'wahl-kontrolle'],
];

test('Exactly four separate transfer goals add one new named objective per assigned category with three criteria and two real further lessons', () => {
  assert.deepEqual(Object.keys(data), ['categories']);
  assert.deepEqual(data.categories.map(item => [item.slug, item.goal.id, item.goal.moduleId, item.goal.lessonId]), expected);
  assert.equal(new Set(data.categories.map(item => item.goal.id)).size, 4);
  const old = load('data/exam-alignment/learning-goals-2026-11-01.json');
  const oldIds = new Set(old.categories.flatMap(item => item.goals.map(goal => goal.id)));
  for (const { goal } of data.categories) {
    assert.ok(!oldIds.has(goal.id));
    assert.deepEqual(Object.keys(goal).sort(), ['id', 'title', 'task', 'selfCheck', 'moduleId', 'lessonId', 'caseText', 'followUp', 'relatedLessons'].sort());
    assert.equal(goal.selfCheck.length, 3); assert.equal(new Set(goal.selfCheck).size, 3);
    assert.ok(goal.selfCheck.every(value => value.startsWith('Ich ') && value.length > 50));
    assert.ok(goal.task.length > 150 && goal.caseText.length > 180 && goal.followUp.length > 100);
    assert.match(goal.caseText, /^Eigener Papierfall:/);
    assert.equal(goal.relatedLessons.length, 2);
    assert.equal(new Set(goal.relatedLessons.map(value => `${value.moduleId}/${value.lessonId}`)).size, 2);
    assert.ok(goal.relatedLessons.every(value => value.moduleId !== goal.moduleId || value.lessonId !== goal.lessonId));
  }
});

test('Each real primary lesson has complete text and unchanged four-choice DACH questions that are already in the short-review pool', () => {
  const pool = getDailyReviewPool();
  for (const { goal } of data.categories) {
    const course = getLearningModule(goal.moduleId), lesson = course.lessons.find(item => item.id === goal.lessonId);
    assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.every(value => value.length > 140));
    assert.ok(lesson.takeaway && lesson.exercise);
    const questions = course.questions.filter(item => item.lessonId === goal.lessonId);
    assert.ok(questions.length > 0);
    for (const question of questions) {
      assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(value => value.text)).size, 4);
      assert.equal(question.correct.length, 1); assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
      assert.notEqual(question.topic, 'Recht');
      const short = pool.find(value => value.id === question.id);
      assert.ok(short); assert.equal(short.q, question.q); assert.equal(short.explain, question.explain);
      assert.deepEqual(short.answers, question.answers); assert.deepEqual(short.correct, question.correct);
      assert.deepEqual(short.reading.paragraphs, lesson.paragraphs);
    }
  }
});

test('The existing projector resolves course and lesson URLs, bounded related lessons and optional real cards for CH AT DE without answer leakage', () => {
  for (const { slug, goal } of data.categories) {
    const projected = projectExamLearningGoal(goal, { categorySlug: slug });
    assert.equal(projected.id, goal.id); assert.equal(projected.regionalLaw, false); assert.equal(projected.lessonPractice, true);
    assert.equal(projected.href, `/kurse/${goal.moduleId}#lesson-${goal.lessonId}`);
    assert.equal(projected.quizHref, `/kurse/${goal.moduleId}#wissenscheck`);
    assert.equal(projected.caseText, goal.caseText); assert.equal(projected.followUp, goal.followUp);
    assert.deepEqual(projected.selfCheck, goal.selfCheck); assert.equal(projected.relatedLessons.length, 2);
    for (const country of ['CH', 'AT', 'DE']) assert.deepEqual(projectExamLearningGoal(goal, { country, categorySlug: slug }), projected);
    for (const [index, target] of goal.relatedLessons.entries()) {
      assert.equal(projected.relatedLessons[index].href, `/kurse/${target.moduleId}#lesson-${target.lessonId}`);
      const course = getLearningModule(target.moduleId); assert.ok(course.lessons.some(item => item.id === target.lessonId));
      assert.notEqual(course.category, 'Jagdrecht');
    }
    assert.ok(!['questions', 'answers', 'correct', 'explain', 'paragraphs', 'sources'].some(key => Object.hasOwn(projected, key)));
    const course = getLearningModule(goal.moduleId), beforeAnswer = [goal.task, goal.caseText, ...goal.selfCheck].join(' ');
    for (const question of course.questions.filter(item => item.lessonId === goal.lessonId)) {
      const correct = question.answers.find(item => question.correct.includes(item.id)).text;
      assert.ok(!beforeAnswer.includes(correct), goal.id);
    }
  }
});

test('Visible boundaries keep every task a paper transfer without treatment, field manipulation, product release or survey guarantees', () => {
  const goals = Object.fromEntries(data.categories.map(item => [item.slug, item.goal]));
  assert.match(goals.hundewesen.task, /ohne Hund, Wild oder Geruchsstoffe/);
  assert.match(goals.hundewesen.followUp, /weder jede Anzeige erklärt noch eine feste Fehlerquote/);
  assert.match(goals['wildbret-gesundheit'].task, /S\.-aureus-Enterotoxine/);
  assert.match(goals['wildbret-gesundheit'].task, /weder ein Zeit-Temperatur-Verfahren noch eine Speisefreigabe oder eine Behandlungsanweisung/);
  assert.match(goals['ausruestung-technik'].task, /keine Vermessung/); assert.match(goals['ausruestung-technik'].task, /keine Revier- oder Grundstücksgrenze/);
  assert.match(goals['tierschutz-verantwortung'].task, /kein Tier versuchsweise ein/);
  assert.match(goals['tierschutz-verantwortung'].task, /keine Diagnose oder Tierwohlgarantie/);
  for (const goal of Object.values(goals)) assert.doesNotMatch([goal.task, goal.caseText, goal.followUp].join(' '), /\d|°C|Medikament|Dosierung|Minuten|Stunden|Prozent|Schock/);
});

test('The new source review names actually read independent roles without inventing a fresh whole-course date or experimental replication', () => {
  assert.equal(review.reviewedOn, '2026-11-17'); assert.equal(review.baselineCommit, baseline);
  assert.deepEqual(review.goals.map(item => item.id), expected.map(item => item[1]));
  for (const entry of review.goals) {
    assert.ok(entry.sources.length >= 2 && new Set(entry.sources.map(item => item.organization)).size >= 2);
    assert.ok(entry.visibleBoundary.length > 60 && entry.claimScope.length > 100);
    for (const source of entry.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(source.actuallyRead && source.role && source.limits);
    }
  }
  assert.match(review.goals[0].sources[0].limits, /keine allgemeine Jagdhunde-Fehlerquote/i);
  assert.match(review.goals[1].sources[0].limits, /nicht auf jedes Toxin|Keine.*Zeit.*keine Übertragung auf jedes Toxin/);
  assert.match(review.goals[2].sources[0].limits, /nicht zwei unabhängige Nachweise/);
  assert.match(review.goals[2].sources[2].role, /keine Replikation/);
  assert.match(review.goals[3].sources[1].role, /andere.*Autorengruppe/);
});

test('All existing 36 goals and four complete teaching-source files stay byte-exact against the released baseline; protected foreign content stays untouched', () => {
  const oldFile = 'data/exam-alignment/learning-goals-2026-11-01.json';
  const preserved = [oldFile, 'lib/learning-dog-depth.js', 'data/learning-expansion-field-science-2026-10-17.json',
    'data/learning-growth-field-2026-10-18.json', 'data/learning-round6-biology-2026-10-18.json'];
  for (const relative of preserved) {
    const before = execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root });
    assert.equal(fs.readFileSync(path.join(root, relative), 'utf8').replaceAll('\r\n', '\n'), before.toString('utf8').replaceAll('\r\n', '\n'), relative);
  }
  assert.equal(load(oldFile).categories.flatMap(item => item.goals).length, 36);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});
