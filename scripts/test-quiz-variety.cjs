const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const load = createLoader();
const { QUESTIONS, filterQuestions } = load('data/questions-full.js');
const { reviewedQuizDuplicateGroups, variedQuizPool } = load('lib/quiz-question-variety.js');
const { quizLearningPool, quizLearningOptions, quizQuestionTopic } = load('lib/quiz-learning-scope.js');
const key = q => q.q.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

test('Reviewed equivalent questions remain addressable but appear only once in every new mixed round', () => {
  const raw = new Map(QUESTIONS.map(q => [q.id, q]));
  for (const group of reviewedQuizDuplicateGroups) {
    const records = group.map(id => raw.get(id));
    assert.ok(records.every(Boolean));
    assert.equal(new Set(records.map(key)).size, 1, 'changed questions require a new equivalence review');
    for (const country of ['DE', 'AT', 'CH']) assert.equal(quizLearningPool(QUESTIONS, { country }).filter(q => group.includes(q.id)).length, 1);
  }
  const all = quizLearningPool(QUESTIONS);
  assert.equal(QUESTIONS.filter(q => quizQuestionTopic(q) !== 'Recht').length - all.length, 13);
  const generated = filterQuestions({ count: QUESTIONS.length });
  for (const group of reviewedQuizDuplicateGroups) assert.equal(generated.filter(q => group.includes(q.id)).length, 1);
});

test('Filtering precedes deduplication so every selected topic keeps its own available member and exact count', () => {
  const options = quizLearningOptions(QUESTIONS);
  assert.equal(options.commonOptions.total, quizLearningPool(QUESTIONS).length);
  for (const { name, count } of options.commonOptions.topics) {
    const selected = quizLearningPool(QUESTIONS, { topic: name });
    assert.equal(selected.length, count);
    assert.ok(selected.every(q => quizQuestionTopic(q) === name));
    for (const group of reviewedQuizDuplicateGroups) {
      const available = QUESTIONS.filter(q => quizQuestionTopic(q) === name && group.includes(q.id));
      if (available.length) assert.equal(selected.filter(q => group.includes(q.id)).length, 1);
    }
  }
  for (const country of options.countryOptions) assert.equal(country.count, quizLearningPool(QUESTIONS, { country: country.code, topic: 'Recht' }).length);
});

test('Quiz setup uses all existing shared learning categories and every detailed question keeps its precise course category', () => {
  const { learningCategories } = load('lib/learning-categories.js');
  const { learningModules } = load('lib/learning-curriculum.js');
  const { PACK_INFO } = load('data/questions-full.js');
  const options = quizLearningOptions(QUESTIONS);
  assert.deepEqual(options.commonOptions.topics.map(topic => topic.name), learningCategories.filter(category => category !== 'Jagdrecht'));
  for (const module of learningModules) for (const q of module.questions) {
    assert.equal(q.learningCategory, module.category);
    assert.equal(quizQuestionTopic(q), q.topic === 'Recht' || module.category === 'Jagdrecht' || ['wissen-waffensicherheit-4', 'wissen-ausbau-wildkameras-datenschutzlaender-2', 'wissen-ausbau-wildkameras-bilderzugriff-1', 'wissen-ausbau-rechtsquellen-regionen-1', 'wissen-ausbau-rechtsquellen-grund-1', 'wissen-ausbau-rechtsquellen-person-2'].includes(q.id) ? 'Recht' : module.category);
  }
  for (const topic of options.commonOptions.topics) assert.ok(PACK_INFO.topics.includes(topic.name));
  assert.ok(quizLearningPool(QUESTIONS, { topic: 'Wald & Pflanzen' }).every(q => q.learningCategory === 'Wald & Pflanzen'));
  assert.ok(quizLearningPool(QUESTIONS, { topic: 'Ausrüstung & Technik' }).every(q => q.learningCategory === 'Ausrüstung & Technik'));
});

test('Legacy topic links still select their original non-legal records and law never leaks through a category alias', () => {
  for (const topic of ['Federwild', 'Hege/Naturschutz', 'Waffen & Schuss', 'Prüfungsvorbereitung']) {
    const pool = quizLearningPool(QUESTIONS, { topic });
    assert.ok(pool.length > 0); assert.ok(pool.every(q => q.topic === topic && quizQuestionTopic(q) !== 'Recht'));
  }
  for (const country of ['DE', 'AT', 'CH']) {
    assert.deepEqual(quizLearningPool(QUESTIONS, { country, topic: 'Jagdrecht' }), quizLearningPool(QUESTIONS, { country, topic: 'Recht' }));
    for (const topic of ['Wildkunde', 'Waffen & Sicherheit', 'Wildbret & Gesundheit', 'Hege/Naturschutz']) assert.ok(!quizLearningPool(QUESTIONS, { country, topic }).some(q => quizQuestionTopic(q) === 'Recht'));
  }
});

test('Actual quiz entry pages retain each legacy topic, its exact pool and the resulting start link', async () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const entryLoader = createLoader({ 'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) });
  const Page = entryLoader('app/quiz-app/page.jsx').default;
  const ordinary = await Page({ searchParams: Promise.resolve({}) });
  assert.equal(ordinary.props.commonOptions.topics.length, 11);
  for (const topic of ['Federwild', 'Rehwild', 'Hege/Naturschutz', 'Waffen & Schuss', 'Prüfungsvorbereitung']) {
    const page = await Page({ searchParams: Promise.resolve({ country: 'CH', topic }) });
    assert.equal(page.props.initialTopic, topic);
    const option = page.props.commonOptions.topics.find(item => item.name === topic);
    assert.deepEqual(option, { name: topic, count: quizLearningPool(QUESTIONS, { topic }).length });
    assert.equal(page.props.commonOptions.topics.length, 12);
    const html = renderToStaticMarkup(page);
    assert.ok(html.includes(`href="/quiz-app/run?topic=${encodeURIComponent(topic)}"`), topic);
    assert.ok(html.includes(`value="${topic.replace(/&/g, '&amp;')}" selected=""`), topic);
    assert.ok(html.includes(`aus ${option.count} verfügbaren Fragen`), topic);
    assert.ok(!html.includes('Für welches Land möchtest du Recht üben?'));
  }
  const law = await Page({ searchParams: { country: 'CH', topic: 'Jagdrecht' } });
  assert.equal(law.props.initialTopic, 'Recht');
  assert.equal(law.props.commonOptions.topics.length, 11);
  assert.ok(renderToStaticMarkup(law).includes('href="/quiz-app/run?country=CH&amp;topic=Recht"'));
  const invalid = await Page({ searchParams: { topic: 'invented-topic' } });
  assert.equal(invalid.props.initialTopic, 'Alle');
  assert.equal(invalid.props.commonOptions.topics.length, 11);
  assert.equal(ordinary.props.commonOptions.topics.length, 11, 'request-specific topic must not mutate another request');
});

test('The ranked server accepts every shared category and selects from its exact pool without touching scores', () => {
  const { roundQuestions } = createLoader({ './quiz-api': { quizDatabase: () => { throw new Error('database must not be used'); } } })('lib/ranked-quiz-server.js');
  for (const { name } of quizLearningOptions(QUESTIONS).commonOptions.topics) {
    const expected = new Set(quizLearningPool(QUESTIONS, { topic: name }).map(q => q.id));
    const round = roundQuestions('CH', name);
    assert.equal(round.length, Math.min(10, expected.size));
    assert.equal(new Set(round.map(q => q.id)).size, round.length);
    assert.ok(round.every(q => expected.has(q.id) && q.explain && q.correct.length && q.answers.some(a => q.correct.includes(a.id))));
  }
  assert.throws(() => roundQuestions('CH', 'invented-topic'), /Ungültiges/);
});

test('Unreviewed equal generic prompts and changed reviewed prompts are retained rather than guessed equivalent', () => {
  const questions = [{ id: 'new-a', q: 'Welche Aussage ist richtig?' }, { id: 'new-b', q: 'Welche Aussage ist richtig?' },
    { id: 'JL-109', q: 'Was bedeutet Drall im Lauf?' }, { id: 'JL-1031', q: 'Welche neue Eigenschaft wird geprüft?' }];
  assert.deepEqual(variedQuizPool(questions), questions);
});

test('An old saved question and answer ID are not rewritten or removed by variety selection', () => {
  const saved = QUESTIONS.find(q => q.id === 'JL-1031');
  assert.ok(saved); assert.deepEqual(saved.correct, ['c']);
  assert.ok(saved.answers.some(answer => answer.id === 'c'));
  const before = JSON.stringify(QUESTIONS);
  for (const topic of ['Alle', 'Waffen', 'Waffen & Schuss', 'Recht']) quizLearningPool(QUESTIONS, { topic });
  assert.equal(JSON.stringify(QUESTIONS), before);
});
