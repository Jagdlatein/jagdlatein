// Checks reuse, references, neutral photo presentation and the local schedule.
// These tests do not constitute a new scientific or legal content review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const localRequire = createRequire(path.join(root, 'package.json'));
const swc = localRequire('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.')
    ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)))
    : localRequire(id), mod, mod.exports);
  cache.set(filename, mod.exports);
  return mod.exports;
}

test('A compact deck reuses 110 course questions and six documented photos across eleven non-legal categories', () => {
  const { getFlashcards, getFlashcardExport, flashcardCategories } = load('lib/learning-flashcards.js');
  const cards = getFlashcards();
  assert.equal(cards.length, 116);
  assert.equal(cards.filter(card => card.kind === 'photo').length, 6);
  assert.equal(flashcardCategories.length, 11);
  assert.ok(!flashcardCategories.some(category => category.id === 'jagdrecht'));
  assert.equal(new Set(cards.map(card => card.id)).size, cards.length);
  for (const category of flashcardCategories) assert.equal(category.count, category.id === 'wildkunde' ? 16 : 10);
  assert.deepEqual(JSON.parse(JSON.stringify(getFlashcardExport())).cards, cards);
  for (const card of cards) {
    assert.match(card.id, /^[a-z][a-z0-9-]{1,159}$/);
    assert.ok(card.question && card.answer && card.explanation && card.sources.length >= 1);
    assert.equal(card.courseHref, card.learningHref);
    assert.ok(!('correct' in card) && !('answers' in card) && !('options' in card));
  }
});

test('Question, stable correct answer, explanation, editorial date and source links are inherited without rewriting', () => {
  const { learningModules } = load('lib/learning-curriculum.js');
  const { lessonHash } = load('lib/learning-lesson-navigation.js');
  for (const card of load('lib/learning-flashcards.js').getFlashcards().filter(card => card.kind !== 'photo')) {
    const module = learningModules.find(item => item.id === card.moduleId);
    const question = module.questions.find(item => `flash-${item.id}` === card.id);
    const lesson = module.lessons.find(item => item.id === question.lessonId);
    assert.equal(card.question, question.q);
    assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
    assert.equal(card.explanation, question.explain);
    assert.equal(card.context, module.title);
    assert.equal(card.lessonTitle, lesson.title);
    assert.equal(card.reviewedOn, module.reviewedOn);
    assert.equal(question.countries.length, 3);
    assert.notEqual(question.topic, 'Recht');
    assert.equal(card.courseHref, `/kurse/${module.id}${lessonHash(lesson.id)}`);
    assert.doesNotMatch(card.question, /^Welche (?:Aussage|Beschreibung|Formulierung|Notiz|Zuordnung|Antwort|Ergänzung|Folge)\b/i);
    assert.doesNotMatch(card.question, /\b(?:falsch|unzutreffend|unbelegt|zu weitgehend|nicht bewirken|nicht belegt|allein nicht schließen|allein noch nicht sicher)\b/i);
    const exactSources = card.sourceScope === 'lesson' ? lesson.evidence.flatMap(item => item.sources) : module.sources;
    for (const source of card.sources) assert.ok(exactSources.some(item => item.url === source.url && item.label === source.label));
  }
});

test('Photo cards identify only the documented taxon and retain original licenses, credits and neutral front alt text', () => {
  const { wildlifePhotographs } = load('lib/wildlife-photographs.js');
  for (const card of load('lib/learning-flashcards.js').getFlashcards().filter(card => card.kind === 'photo')) {
    const slug = card.id.slice('flash-photo-'.length);
    const photo = wildlifePhotographs[slug];
    assert.equal(card.question, 'Welche Wildart zeigt dieses Foto?');
    assert.equal(card.answer, photo.name);
    assert.equal(card.image.alt, 'Tierfoto für diese Bestimmungskarte');
    assert.equal(card.sourceScope, 'photo');
    assert.equal(card.reviewedOn, photo.checkedAt);
    for (const key of ['src', 'width', 'height', 'author', 'credit', 'creditUrl', 'license', 'licenseUrl', 'modifications']) assert.equal(card.image[key], photo[key]);
    assert.equal(photo.aiGenerated, false);
    assert.match(card.image.license, /^CC BY-SA (?:2\.0|2\.5|3\.0|4\.0)$/);
    assert.ok(fs.existsSync(path.join(root, 'public', card.image.src)));
    assert.equal(card.learningHref, `/wildkunde/${slug}`);
    assert.ok(!card.explanation.includes('Jahre') && !card.explanation.includes('Monat'));
  }
});

test('Explanations do not refer to omitted multiple-choice options; the original quiz remains untouched', () => {
  const { learningModules } = load('lib/learning-curriculum.js');
  const module = learningModules.find(item => item.id === 'wissen-vertiefung-hunde-vorstehrassen');
  const question = module.questions.find(item => item.q === 'Welche Kombination bezeichnet Varietäten innerhalb eines gemeinsamen FCI-Standards?');
  assert.match(question.explain, /Die drei anderen Paare/);
  const cards = load('lib/learning-flashcards.js').getFlashcards();
  assert.ok(!cards.some(card => card.id === `flash-${question.id}`));
  assert.equal(cards.length, 116, 'another existing card fills the category place');
  for (const card of cards) assert.doesNotMatch(card.explanation, /\b(?:die\s+(?:(?:zwei|drei|vier)\s+)?(?:anderen|übrigen)\b|(?:erste|zweite|dritte|vierte)\s+(?:Antwort|Option)|(?:Antwort|Option)\s+[A-D]\b)/i);
});

test('Review parser safely discards malformed state, impossible dates and forged intervals', () => {
  const { parseFlashcardReview } = load('lib/flashcard-review.js');
  for (const input of [null, undefined, '', '{', [], { version: 2, cards: {} }, { version: 1, cards: [] }, 'x'.repeat(350001)]) assert.deepEqual(parseFlashcardReview(input), { version: 1, cards: {} });
  const good = { rating: 'known', reviewedAt: 100, dueAt: 86400100, intervalDays: 1 };
  const state = { version: 1, cards: {
    'flash-good': good, 'bad id': good,
    'flash-forged': { ...good, dueAt: 0 }, 'flash-nan': { ...good, reviewedAt: NaN },
    'flash-infinity': { ...good, reviewedAt: Infinity }, 'flash-wrong': { ...good, intervalDays: 365 },
  } };
  assert.deepEqual(parseFlashcardReview(state), { version: 1, cards: { 'flash-good': good } });
  assert.deepEqual(parseFlashcardReview(JSON.stringify({ version: 1, cards: { 'flash-good': good } })), { version: 1, cards: { 'flash-good': good } });
});

test('Known ratings use 1, 3, 7, 14 and 30 days; again resets the sequence and stale callbacks are ignored', () => {
  const { rateFlashcardReview, getFlashcardRating } = load('lib/flashcard-review.js');
  let state = { version: 1, cards: {} }, now = 100000;
  for (const days of [1, 3, 7, 14, 30, 30]) {
    now += 100;
    const previous = JSON.stringify(state);
    const next = rateFlashcardReview(state, 'flash-example', 'known', now);
    assert.equal(JSON.stringify(state), previous, 'does not mutate its input');
    state = next;
    assert.equal(getFlashcardRating(state, 'flash-example').intervalDays, days);
    assert.equal(state.cards['flash-example'].dueAt, now + days * 86400000);
    assert.deepEqual(rateFlashcardReview(state, 'flash-example', 'known', now), state);
    assert.deepEqual(rateFlashcardReview(state, 'flash-example', 'again', now - 1), state);
  }
  state = rateFlashcardReview(state, 'flash-example', 'again', ++now);
  assert.equal(state.cards['flash-example'].intervalDays, 0);
  assert.equal(state.cards['flash-example'].dueAt, now + 600000);
  state = rateFlashcardReview(state, 'flash-example', 'known', ++now);
  assert.equal(state.cards['flash-example'].intervalDays, 1);
  assert.equal(getFlashcardRating(state, 'missing'), null);
});

test('Due selection excludes unseen and future cards, includes the exact due instant, and rejects invalid rating input', () => {
  const { rateFlashcardReview, getDueCards } = load('lib/flashcard-review.js');
  let state = rateFlashcardReview(null, 'flash-first', 'again', 1000);
  state = rateFlashcardReview(state, 'flash-later', 'known', 2000);
  const cards = [{ id: 'flash-later' }, { id: 'flash-unseen' }, { id: 'flash-first' }];
  assert.deepEqual(getDueCards(cards, state, 600999), []);
  assert.deepEqual(getDueCards(cards, state, 601000).map(card => card.id), ['flash-first']);
  assert.deepEqual(getDueCards(cards, state, 86402000).map(card => card.id), ['flash-first', 'flash-later']);
  assert.deepEqual(getDueCards(cards, state, NaN), []);
  assert.deepEqual(rateFlashcardReview(state, 'invalid id', 'known', 3000), state);
  for (const invalidId of [undefined, null, {}, []]) assert.deepEqual(rateFlashcardReview(state, invalidId, 'known', 3000), state);
  assert.deepEqual(rateFlashcardReview(state, 'flash-first', 'other', 3000), state);
});
