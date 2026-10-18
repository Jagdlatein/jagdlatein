const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { makeDentitionQuestions } = load('lib/dentition-questions.js');
const { dentitionProfiles } = load('lib/wildlife-dentition.js');
const { answerOrder } = load('lib/answer-order.js');
const { createResearchRound, currentResearchQuestion, researchRoundReducer, gradeResearchQuestion } = load('lib/research-question-round.js');
const right = question => question.options.find(option => question.correctIds.includes(option.id));

test('Every sourced profile has16 distinct, finite, correctly gradeable checks with the original scope and provenance', () => {
  const ids = new Set();
  for (const profile of dentitionProfiles) {
    const questions = makeDentitionQuestions(profile);
    assert.equal(questions.length, 16, profile.slug);
    assert.ok(new Set(questions.map(q => q.skill)).size >= 5, profile.slug);
    assert.equal(questions.filter(q => q.correctIds[0] === 't0').length, 4);
    for (const question of questions) {
      assert.ok(!ids.has(question.id), question.id); ids.add(question.id);
      assert.equal(question.format, 'single'); assert.equal(question.context, profile.scope); assert.deepEqual(question.sourceIds, profile.sourceIds);
      assert.equal(question.options.length, 4); assert.equal(new Set(question.options.map(o => o.id)).size, 4); assert.equal(new Set(question.options.map(o => o.text)).size, 4);
      assert.doesNotMatch(`${question.prompt} ${question.explanation} ${question.options.map(o => o.text).join(' ')}`, /undefined|NaN|Infinity/);
      assert.ok(question.explanation.length > 35); assert.equal(question.correctIds.length, 1);
      assert.equal(gradeResearchQuestion(question, [right(question).id]).correct, true);
      for (const option of question.options.filter(o => o.id !== right(question).id)) assert.equal(gradeResearchQuestion(question, [option.id]).correct, false);
      if (question.correctIds[0] === 'n0') for (const option of question.options) assert.ok(Number.isInteger(parseInt(option.text)) && parseInt(option.text) >= 0);
    }
  }
});

test('Counting distinguishes jaws, one side, both sides and individual tooth classes on an asymmetric teaching fixture', () => {
  // Arithmetic-only fixture, deliberately no wildlife name: not a new animal formula.
  const profile = { slug: 'rechenbeispiel', formula: { I: [2, 3], C: [0, 1], P: [1, 2], M: [3, 2] }, count: { upper: 6, lower: 8, total: 28 }, sourceIds: ['existing-notation'], scope: 'Rechenbeispiel, keine Tierart.', note: '' };
  const questions = makeDentitionQuestions(profile);
  const expected = [28, 12, 2, 16, 14, 6, 8, 3, 2, 2, 1, 4];
  questions.slice(0, 12).forEach((q, i) => assert.equal(parseInt(right(q).text), expected[i], q.id));
  assert.match(right(questions[12]).text, /^Schneidezähne$/); assert.match(right(questions[13]).text, /^Eckzähne$/);
  assert.equal(right(questions[14]).text, '1 Prämolar auf einer Oberkieferseite und 2 auf einer Unterkieferseite.');
  assert.match(right(questions[15]).text, /Referenz/);
});

test('Numeric answers for every real profile follow the published formula; zero values are retained as valid answers', () => {
  let zeroAnswers = 0;
  for (const profile of dentitionProfiles) {
    const f = profile.formula;
    const expected = [profile.count.total, 2 * profile.count.upper, f.M[1], 2 * profile.count.lower, profile.count.upper + profile.count.lower, profile.count.upper, profile.count.lower, f.M[0], f.P[1], f.I[0], f.C[1], f.P[1] + f.M[1]];
    makeDentitionQuestions(profile).slice(0, 12).forEach((question, i) => {
      assert.equal(parseInt(right(question).text), expected[i], `${profile.slug}:${question.id}`);
      if (expected[i] === 0) zeroAnswers++;
    });
  }
  assert.ok(zeroAnswers > 0, 'Real formulas include meaningful zero entries, not blank/missing values');
});

test('Published variants stay explicitly scoped to the displayed base formula, never an age or specimen diagnosis', () => {
  const variantProfiles = dentitionProfiles.filter(p => p.variants?.length);
  assert.ok(variantProfiles.length > 0);
  for (const profile of variantProfiles) {
    const questions = makeDentitionQuestions(profile);
    assert.ok(questions.every(q => q.prompt.includes('Grundform')), profile.slug);
    assert.equal(parseInt(right(questions[0]).text), profile.count.total);
    const scopeQuestion = questions.find(q => q.id.endsWith('-geltungsbereich'));
    assert.ok(scopeQuestion.explanation.includes(profile.scope)); assert.ok(scopeQuestion.explanation.includes(profile.note));
    assert.doesNotMatch(right(scopeQuestion).text, /Alter|immer genau|Größe/);
  }
});

test('Correct answer positions still vary with existing seeded option mixing; generation has no random side effects', () => {
  for (const profile of dentitionProfiles) {
    const first = makeDentitionQuestions(profile); assert.deepEqual(makeDentitionQuestions(profile), first);
    for (const question of first) {
      const positions = new Set(Array.from({ length: 24 }, (_, seed) => answerOrder(question.options, question.id, seed).map(i => question.options[i].id).indexOf(question.correctIds[0])));
      assert.ok(positions.size > 1, question.id);
    }
  }
});

test('The16-question bank fits two existing eight-question rounds with no duplicates or lost questions', () => {
  const questions = makeDentitionQuestions(dentitionProfiles[0]); let state = createResearchRound(questions, 19); const seen = new Set();
  for (let round = 0; round < 2; round++) {
    assert.equal(state.ids.length, 8);
    for (let i = 0; i < 8; i++) {
      const question = currentResearchQuestion(state); assert.ok(!seen.has(question.id)); seen.add(question.id);
      state = researchRoundReducer(state, { type: 'answer', generation: state.generation, questionId: question.id, ids: question.correctIds });
      assert.equal(state.answers[question.id].correct, true);
      state = researchRoundReducer(state, { type: 'next', generation: state.generation, questionId: question.id });
    }
    assert.equal(state.finished, true);
    if (round === 0) state = researchRoundReducer(state, { type: 'continue', generation: state.generation, seed: 20 });
  }
  assert.equal(seen.size, questions.length); assert.equal(state.remaining.length, 0);
});

test('Incomplete or inconsistent formulas do not generate plausible-looking but unsupported answers', () => {
  assert.deepEqual(makeDentitionQuestions(null), []); assert.deepEqual(makeDentitionQuestions({ formula: {} }), []);
  const p = dentitionProfiles[0];
  for (const formula of [{}, { ...p.formula, M: [3] }, { ...p.formula, I: [-1, 3] }, { ...p.formula, P: [1.5, 2] }, { ...p.formula, C: ['0', 1] }]) assert.deepEqual(makeDentitionQuestions({ ...p, formula }), []);
  assert.deepEqual(makeDentitionQuestions({ ...p, count: { ...p.count, total: p.count.total + 1 } }), []);
  assert.deepEqual(makeDentitionQuestions({ ...p, count: { ...p.count, upper: p.count.upper + 1 } }), []);
  assert.deepEqual(makeDentitionQuestions({ ...p, sourceIds: [] }), []);
  assert.deepEqual(makeDentitionQuestions({ ...p, sourceIds: 'not-an-array' }), []);
});
