// Selection/provenance regression only. No new factual review date is implied.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const ids = JSON.parse(fs.readFileSync(path.join(root, 'data/revierduell-question-ids-v1.json'), 'utf8'));
const { getDuellBank } = load('lib/revierduell-server.js');
const { getDailyReviewPool } = load('lib/daily-review-pool.js');
const { learningModules } = load('lib/learning-curriculum.js');
const { getLessonReviewDate } = load('lib/learning-review-date.js');
const { quizQuestionCountries, quizQuestionTopic } = load('lib/quiz-learning-scope.js');
const bank = getDuellBank(), pool = getDailyReviewPool();
const additions = ids.slice(57);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const categories = [
  'wildkunde', 'natur-revier', 'hundewesen', 'waffen-sicherheit', 'jagdpraxis',
  'wildbret-gesundheit', 'wald-pflanzen', 'landwirtschaft-lebensraeume',
  'pruefung-sprache', 'ausruestung-technik', 'tierschutz-verantwortung',
].sort();

function sourceFor(id) {
  const maintained = pool.filter(question => question.id === id);
  const owners = learningModules.filter(course => course.questions.some(question => question.id === id));
  assert.equal(maintained.length, 1, `${id}: unique maintained question`);
  assert.equal(owners.length, 1, `${id}: unique course owner`);
  const course = owners[0], question = course.questions.find(value => value.id === id);
  const lesson = course.lessons.find(value => value.id === question.lessonId);
  assert.ok(lesson, `${id}: current original lesson exists`);
  return { maintained: maintained[0], course, question, lesson };
}

test('Revierduell expansion preserves all 57 original IDs in exact order and appends 53 references', () => {
  assert.equal(ids.length, 110); assert.equal(additions.length, 53); assert.equal(new Set(ids).size, 110);
  assert.equal(hash(ids.slice(0, 57)), '1d077514dfa7a100c997dbf12a3b8ad8ae01aa35da3dbbd47d8d35b09586a680');
  assert.ok(ids.every(id => typeof id === 'string' && /^[a-z][a-z0-9-]{1,159}$/.test(id)));
  assert.deepEqual(bank.map(question => question.id), ids, 'server follows explicit reference order');
});

test('Revierduell expansion supplies ten original questions in each of eleven nonlegal topics', () => {
  const counts = {};
  for (const question of bank) counts[question.categorySlug] = (counts[question.categorySlug] || 0) + 1;
  assert.deepEqual(Object.keys(counts).sort(), categories);
  assert.ok(Object.values(counts).every(value => value === 10));
  assert.equal(counts.jagdrecht, undefined);
  const prompts = bank.map(question => question.prompt.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase());
  assert.equal(new Set(prompts).size, bank.length, 'no duplicate prompts to fill a topic');
});

test('Revierduell expansion retains literal prompts, four original options, correct ID and original explanations', () => {
  for (const projected of bank) {
    const { maintained, question } = sourceFor(projected.id);
    assert.equal(projected.prompt, question.q); assert.equal(projected.prompt, maintained.q);
    assert.equal(projected.explanation, question.explain); assert.equal(projected.explanation, maintained.explain);
    assert.deepEqual(projected.options, question.answers); assert.deepEqual(projected.options, maintained.answers);
    assert.deepEqual(projected.correctIds, question.correct); assert.equal(projected.correctIds.length, 1);
    assert.equal(projected.options.length, 4); assert.equal(new Set(projected.options.map(option => option.id)).size, 4);
    assert.ok(projected.options.every(option => option.text.trim() && typeof option.id === 'string'));
    assert.ok(projected.options.some(option => option.id === projected.correctIds[0]));
  }
});

test('Revierduell expansion remains common DACH knowledge with real course and lesson context', () => {
  for (const id of additions) {
    const projected = bank.find(question => question.id === id), { maintained, course, question, lesson } = sourceFor(id);
    assert.notEqual(quizQuestionTopic(question), 'Recht');
    assert.deepEqual([...quizQuestionCountries(question)].sort(), ['AT', 'CH', 'DE']);
    assert.equal(projected.courseTitle, course.title); assert.equal(projected.categorySlug, maintained.category);
    assert.equal(projected.href, maintained.href); assert.match(projected.href, /^\/kurse\/[a-z0-9-]+#lesson-/);
    assert.ok(projected.href.includes(course.id)); assert.ok(lesson.paragraphs.some(paragraph => typeof paragraph === 'string' && paragraph.trim()));
  }
});

test('Revierduell expansion preserves inherited source scope, exact HTTPS references and lesson/course dates', () => {
  for (const projected of bank) {
    const { maintained, course, lesson } = sourceFor(projected.id);
    assert.equal(projected.sourceScope, maintained.sourceScope);
    assert.ok(['lesson', 'course'].includes(projected.sourceScope));
    assert.equal(projected.reviewedOn, getLessonReviewDate(lesson, course.reviewedOn));
    assert.match(projected.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(projected.sources.length > 0);
    assert.deepEqual(projected.sources.map(source => ({ label: source.title, url: source.url })), maintained.sources);
    assert.ok(projected.sources.every(source => source.title.trim() && /^https:\/\//.test(source.url)));
  }
});

test('Revierduell expansion excludes unshown media, app-meta joke distractors and the three original exclusions', () => {
  for (const id of [
    'wissen-federwild-beobachtung-vogel-lamellen-funktion',
    'wissen-vertiefung-jagdhunderassen-pointer-setter-1',
    'wissen-ausbau-biologie-hundesinne-2026-sehen-q4',
    'wissen-nachsuche-2',
    'wissen-pruefungslernen-2',
    'wissen-ausbau-revierpraxis-groessen-einheiten-2026-q1',
    'wissen-vertiefung-tierwohl-empfindung-round6-2026-wissen-vertiefung-tierwohl-empfindung-round6-2026-q4',
  ]) assert.ok(!ids.includes(id), `${id}: excluded by selection review`);
  for (const id of additions) {
    const question = bank.find(value => value.id === id);
    assert.doesNotMatch([question.prompt, question.explanation, ...question.options.map(option => option.text)].join('\n'), /\b(?:Film|Video|Quizstand)\b|siehe (?:oben|Abbildung)|wie (?:oben|im Bild) gezeigt/i);
  }
});

test('Revierduell expansion adds the reviewed functional replacements without creating a second text bank', () => {
  for (const id of [
    'wissen-jagdhunde-aufgaben-ausbildung-hund-q3',
    'wissen-ausbau-revierpraxis-groessen-einheiten-2026-q6',
    'wissen-ausbau-revierpraxis-groessen-einheiten-2026-q15',
    'wissen-vertiefung-tierwohl-empfindung-round6-2026-wissen-vertiefung-tierwohl-empfindung-round6-2026-q3',
  ]) assert.ok(additions.includes(id));
  assert.ok(ids.every(id => typeof id === 'string'), 'the production selection stores references only');
});
