// Independent adapter checks: no account, browser storage or live API is read.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const baseline = 'b9ed55f832c73b5cb7805759ed0b0809267e7e20';
const load = createLoader();
const { learningModules } = load('lib/learning-curriculum.js');
const { getLearningCategoryByTitle } = load('lib/learning-categories.js');
const { quizQuestionTopic, quizQuestionCountries, quizJurisdictionQuestions } = load('lib/quiz-learning-scope.js');
const { unpackDailyReviewCatalog } = load('lib/daily-review-catalog.js');
const api = load('lib/daily-review-pool.js');
const excluded = ['wissen-ausbau-wildkameras-datenschutzlaender-2', 'wissen-ausbau-wildkameras-bilderzugriff-1'];
const provenance = new Map(learningModules.flatMap(course => course.questions.map(question => [question.id, { course, question, lesson: course.lessons.find(lesson => lesson.id === question.lessonId) }])));
const shared = question => {
  const countries = quizQuestionCountries(question);
  return quizQuestionTopic(question) !== 'Recht' && Array.isArray(countries) && countries.length === 3 && ['DE', 'AT', 'CH'].every(country => countries.includes(country));
};
function before() {
  const source = execFileSync('git', ['show', `${baseline}:lib/daily-review-pool.js`], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: path.join(root, 'lib/daily-review-pool.js'), disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.join('lib', path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
  return module.exports;
}
function expectedSources(course, lesson) {
  const evidence = (lesson.evidence || []).flatMap(item => item.sources || []);
  const candidates = (evidence.length ? evidence : course.sources).filter(source => source.lessonIds === undefined || Array.isArray(source.lessonIds) && source.lessonIds.includes(lesson.id));
  const result = new Map();
  for (const source of candidates) result.set(source.url, { label: source.label, url: source.url });
  return [...result.values()];
}
function question(id, lessonId = 'lesson-a', changes = {}) {
  return { id, q: `Own synthetic prompt ${id}`, lessonId, topic: 'Wildkunde', countries: ['DE', 'AT', 'CH'], answers: ['a', 'b', 'c', 'd'].map(id => ({ id, text: `Own synthetic option ${id}` })), correct: ['a'], explain: 'Own synthetic explanation; no factual teaching claim.', ...changes };
}
function course({ sources = [], lessons, questions } = {}) {
  return { id: 'own-source-scope-course', category: 'Wildkunde', title: 'Own source-scope fixture', countries: ['DE', 'AT', 'CH'],
    lessons: lessons || [{ id: 'lesson-a', title: 'Own synthetic lesson A', paragraphs: ['Own paragraph A1.', 'Own paragraph A2.'], takeaway: 'Own takeaway A.', exercise: 'Own exercise A.' }, { id: 'lesson-ab', title: 'Own synthetic lesson AB', paragraphs: ['Own paragraph AB.'] }],
    questions: questions || [question('own-source-question-a'), question('own-source-question-ab', 'lesson-ab')], sources };
}
const source = (id, lessonIds) => ({ label: `Own source ${id}`, url: `https://example.invalid/own-source-${id}`, ...(lessonIds === undefined ? {} : { lessonIds }) });
const fixture = courses => createLoader({ './learning-curriculum': { learningModules: courses } })('lib/daily-review-pool.js');

test('The old adapter independently reproduces exactly two CH jurisdiction leaks; no other IDs or full learning fields change', () => {
  const old = before().getDailyReviewPool(), current = api.getDailyReviewPool();
  assert.deepEqual(old.filter(item => !current.some(next => next.id === item.id)).map(item => item.id), excluded);
  assert.deepEqual(current.filter(item => !old.some(previous => previous.id === item.id)), []);
  for (const id of excluded) {
    assert.ok(old.some(item => item.id === id)); assert.equal(current.some(item => item.id === id), false);
    const authored = provenance.get(id).question;
    assert.deepEqual(authored.countries, ['DE', 'AT', 'CH']); assert.notEqual(authored.topic, 'Recht');
    assert.deepEqual(quizJurisdictionQuestions[id], ['CH']); assert.equal(quizQuestionTopic(authored), 'Recht');
  }
  assert.deepEqual(current.map(({ sources, ...item }) => item), old.filter(item => !excluded.includes(item.id)).map(({ sources, ...item }) => item));
  for (const item of current) { const { course, lesson } = provenance.get(item.id); assert.deepEqual(item.sources, expectedSources(course, lesson), item.id); }
});

test('The complete maintained pool, API and packed catalog agree with effective shared question scope and retain source order', () => {
  const expected = learningModules.flatMap(course => getLearningCategoryByTitle(course.category)?.slug === 'jagdrecht' ? [] : course.questions.filter(shared).map(question => question.id));
  const pool = api.getDailyReviewPool(); assert.ok(pool.length > 2000); assert.deepEqual(pool.map(item => item.id), expected);
  assert.equal(new Set(expected).size, expected.length);
  assert.deepEqual(api.getDailyReviewCatalog(), pool.map(({ id, category }) => ({ id, category })));
  assert.deepEqual(unpackDailyReviewCatalog(api.getPackedDailyReviewCatalog()), api.getDailyReviewCatalog());
  assert.ok(api.getDailyReviewCatalog().every(item => Object.keys(item).sort().join(',') === 'category,id'));
  for (const item of pool) {
    const { course, question, lesson } = provenance.get(item.id);
    assert.equal(shared(question), true, item.id); assert.notEqual(course.category, 'Jagdrecht');
    assert.equal(item.q, question.q); assert.deepEqual(item.answers, question.answers); assert.deepEqual(item.correct, question.correct); assert.equal(item.explain, question.explain);
    assert.deepEqual(item.reading.paragraphs, lesson.paragraphs); assert.equal(item.reading.title, lesson.title); assert.equal(item.reading.paragraph, lesson.paragraphs.find(value => typeof value === 'string' && value.trim()));
    if (lesson.takeaway) assert.equal(item.reading.takeaway, lesson.takeaway);
    if (lesson.exercise) assert.equal(item.reading.exercise, lesson.exercise);
    assert.deepEqual(api.getDailyReviewQuestions([item.id]), [item]);
  }
});

test('Regional IDs are rejected individually and inside otherwise valid batches instead of returning their answers', () => {
  const valid = api.getDailyReviewPool()[0].id;
  for (const id of excluded) for (const ids of [[id], [valid, id], [id, valid]]) assert.throws(() => api.getDailyReviewQuestions(ids), /Wiederholungsfragen/);
  const synthetic = fixture([course({ questions: [question('own-shared'), question(excluded[0]), question(excluded[1]), question('own-explicit-law', 'lesson-a', { topic: 'Jagdrecht' }), question('own-country-law', 'lesson-a', { countries: ['AT'] })] })]);
  assert.deepEqual(synthetic.getDailyReviewPool().map(item => item.id), ['own-shared']);
  assert.throws(() => synthetic.getDailyReviewQuestions(['own-shared', excluded[0]]), /Wiederholungsfragen/);
});

test('New optical and temperature sources stay with their own new lessons and cannot redate or recertify older questions', () => {
  const old = new Map(before().getDailyReviewPool().map(item => [item.id, item])), current = api.getDailyReviewPool();
  for (const [courseId, lessonId] of [['wissen-optik', 'fernglas-einstellungen'], ['wissen-wildbrethygiene', 'messort-temperatur']]) {
    const authored = learningModules.find(course => course.id === courseId), specific = authored.sources.filter(source => Array.isArray(source.lessonIds) && source.lessonIds.includes(lessonId)).map(source => source.url);
    assert.equal(specific.length, 3, courseId);
    const relevant = current.filter(item => provenance.get(item.id).course.id === courseId), newQuestions = relevant.filter(item => provenance.get(item.id).lesson.id === lessonId), olderQuestions = relevant.filter(item => provenance.get(item.id).lesson.id !== lessonId);
    assert.equal(newQuestions.length, 2); assert.ok(olderQuestions.length > 0);
    for (const item of newQuestions) {
      assert.equal(item.sourceScope, 'lesson'); assert.deepEqual(new Set(item.sources.map(source => source.url)), new Set(specific));
    }
    for (const item of olderQuestions) {
      assert.ok(old.get(item.id).sources.some(source => specific.includes(source.url)), 'The historical broad-source bug is actually exercised');
      assert.ok(item.sources.every(source => !specific.includes(source.url)), item.id);
      assert.equal(item.sourceScope, 'course'); assert.equal(Object.hasOwn(item, 'reviewedOn'), false);
      assert.deepEqual(item.reading, old.get(item.id).reading); assert.equal(item.explain, old.get(item.id).explain);
    }
  }
});

test('Course-source scope is exact: unscoped and matching arrays are retained; foreign, empty and malformed restrictions cannot match by substring', () => {
  const sources = [source('general'), source('a', ['lesson-a']), source('ab', ['lesson-ab']), source('both', ['lesson-a', 'lesson-ab']), source('none', []), source('foreign', ['foreign']), source('string', 'lesson-a'), source('substring', 'prefix-lesson-a-suffix'), source('null', null), source('object', { includes: () => true })];
  const api = fixture([course({ sources })]), pool = api.getDailyReviewPool();
  assert.deepEqual(pool[0].sources.map(item => item.url), [source('general').url, source('a').url, source('both').url]);
  assert.deepEqual(pool[1].sources.map(item => item.url), [source('general').url, source('ab').url, source('both').url]);
  assert.ok(pool.every(item => item.sourceScope === 'course'));
  const foreignOnly = fixture([course({ sources: [source('foreign-only', ['missing']), source('no-lessons', [])] })]);
  assert.ok(foreignOnly.getDailyReviewPool().every(item => item.sources.length === 0), 'No global fallback is invented after an empty exact match');
});

test('Lesson evidence takes precedence, deduplicates in authored order and keeps full reading; empty evidence uses only eligible course sources', () => {
  const lessons = course().lessons;
  lessons[0] = { ...lessons[0], evidence: [{ claim: 'Own synthetic claim A', sources: [source('evidence-1'), source('evidence-2')] }, { claim: 'Own second claim', sources: [{ ...source('evidence-1'), label: 'Own corrected source label' }] }] };
  lessons[1] = { ...lessons[1], evidence: [{ claim: 'Own empty synthetic evidence', sources: [] }] };
  const authored = course({ lessons, sources: [source('general'), source('only-a', ['lesson-a']), source('only-ab', ['lesson-ab'])] }), pool = fixture([authored]).getDailyReviewPool();
  assert.deepEqual(pool[0].sources, [{ label: 'Own corrected source label', url: source('evidence-1').url }, { label: source('evidence-2').label, url: source('evidence-2').url }]);
  assert.equal(pool[0].sourceScope, 'lesson'); assert.deepEqual(pool[0].reading.paragraphs, lessons[0].paragraphs); assert.equal(pool[0].reading.takeaway, lessons[0].takeaway); assert.equal(pool[0].reading.exercise, lessons[0].exercise);
  assert.equal(pool[1].sourceScope, 'course'); assert.deepEqual(pool[1].sources.map(item => item.url), [source('general').url, source('only-ab').url]);
  const conflicting = course({ sources: [source('course-general')], lessons: [{ ...lessons[0], evidence: [{ claim: 'Own conflicting scope fixture', sources: [source('foreign-evidence', ['lesson-ab']), source('string-evidence', 'lesson-a')] }] }], questions: [question('own-conflicting-evidence')] });
  const scoped = fixture([conflicting]).getDailyReviewPool()[0];
  assert.equal(scoped.sourceScope, 'lesson'); assert.deepEqual(scoped.sources, [], 'Ineligible lesson evidence does not borrow global course sources');
});

test('Filtering effective jurisdictions and source restrictions never mutates frozen authored questions, lesson bodies or source metadata', () => {
  const authored = course({ sources: [source('general'), source('specific', ['lesson-a'])], questions: [question('own-frozen-shared'), question(excluded[0])] });
  const before = JSON.stringify(authored);
  function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  freeze(authored);
  const fresh = fixture([authored]); assert.deepEqual(fresh.getDailyReviewPool().map(item => item.id), ['own-frozen-shared']);
  assert.equal(JSON.stringify(authored), before); assert.deepEqual(unpackDailyReviewCatalog(fresh.getPackedDailyReviewCatalog()), fresh.getDailyReviewCatalog());
});
