const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const questions = load('data/questions-full.js').QUESTIONS;
const scope = load('lib/quiz-learning-scope.js');
const server = load('lib/revierduell-server.js');
const references = load('data/revierduell-question-ids-v1.json');
const selectedId = references[0];
function alteredQuiz(change) {
  const copy = structuredClone(questions);
  change(copy.find(question => question.id === selectedId), copy);
  return createLoader({ '../data/questions-full': { QUESTIONS: copy } })('lib/revierduell-server.js');
}
const unavailable = action => assert.throws(action, /DUELL_REVIEWED_BANK_UNAVAILABLE/);

test('All110 duell questions use the canonical quiz wording, four answer IDs/texts, solution and explanation', () => {
  const bank = server.getDuellBank();
  assert.equal(bank.length, 110);
  for (const question of bank) {
    const matches = questions.filter(item => item.id === question.id);
    assert.equal(matches.length, 1);
    assert.equal(question.prompt, matches[0].q);
    assert.deepEqual(question.options, matches[0].answers.map(({ id, text }) => ({ id, text })));
    assert.deepEqual(question.correctIds, matches[0].correct);
    assert.equal(question.explanation, matches[0].explain);
    assert.equal(question.options.length, 4);
  }
});

test('Every selected quiz ID remains available for all three countries and its actual learning category', () => {
  const bank = server.getDuellBank();
  for (const country of ['CH', 'AT', 'DE']) {
    const common = new Set(scope.quizLearningPool(questions, { country, topic: 'Alle' }).map(item => item.id));
    for (const question of bank) {
      const canonical = questions.find(item => item.id === question.id);
      assert.ok(common.has(question.id));
      assert.ok(scope.quizLearningPool(questions, { country, topic: scope.quizQuestionTopic(canonical) }).some(item => item.id === question.id));
    }
  }
});

test('Missing and duplicate canonical quiz IDs cannot fall back to course-only questions', () => {
  unavailable(() => alteredQuiz((item, copy) => copy.splice(copy.indexOf(item), 1)).getDuellBank());
  unavailable(() => alteredQuiz((item, copy) => copy.push(structuredClone(item))).getDuellBank());
  unavailable(() => createLoader({ '../data/questions-full': { QUESTIONS: [] } })('lib/revierduell-server.js').getDuellBank());
});

test('Canonical question, answer and explanation changes require agreeing course context before publication', () => {
  for (const change of [
    item => { item.q += ' Synthetic replacement.'; },
    item => { item.explain += ' Synthetic replacement.'; },
    item => { item.answers[0].text += ' Synthetic replacement.'; },
    item => { item.correct = [item.answers.find(answer => !item.correct.includes(answer.id)).id]; },
    item => { item.answers.reverse(); },
  ]) unavailable(() => alteredQuiz(change).getDuellBank());
});

test('Canonical legal or non-neutral country scope cannot adopt a neutral course context', () => {
  unavailable(() => alteredQuiz(item => { item.topic = 'Recht'; item.learningCategory = 'Jagdrecht'; }).getDuellBank());
  for (const countries of [['DE'], ['CH', 'AT'], ['CH', 'CH', 'DE'], null]) {
    unavailable(() => alteredQuiz(item => { item.countries = countries; }).getDuellBank());
  }
});

test('Canonical category changes cannot inherit a different topic from the course catalogue', () => {
  unavailable(() => alteredQuiz(item => { item.topic = 'Hundewesen'; item.learningCategory = 'Hundewesen'; }).getDuellBank());
});

test('A quiz-variety exclusion is respected even when the question still exists in the course pool', () => {
  const restricted = createLoader({ './quiz-learning-scope': {
    ...scope,
    quizLearningPool: (...args) => scope.quizLearningPool(...args).filter(question => question.id !== selectedId),
  } })('lib/revierduell-server.js');
  unavailable(() => restricted.getDuellBank());
});

test('Canonical incidental fields never enter the public duell projection', () => {
  const marked = alteredQuiz(item => {
    item.syntheticPrivate = 'CANONICAL_PRIVATE_FIXTURE';
    for (const answer of item.answers) answer.syntheticPrivate = 'CANONICAL_PRIVATE_FIXTURE';
  }).getDuellBank();
  assert.doesNotMatch(JSON.stringify(marked), /CANONICAL_PRIVATE_FIXTURE|syntheticPrivate/);
  assert.deepEqual(marked, server.getDuellBank());
});
