const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js'))) : pr(id), mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const { QUESTIONS, filterQuestions } = load('data/questions-full.js');
const { learningModules, learningQuestions, learningCounts } = load('lib/learning-curriculum.js');
const { courses, miniCourses } = load('lib/course-catalog.js');
const { TERMS } = load('data/glossary-terms.js');
const { quizLearningPool, quizQuestionTopic } = load('lib/quiz-learning-scope.js');
const { quizContentCorrections, withdrawnQuizQuestions } = load('lib/quiz-content-review.js');
const byId = new Map(QUESTIONS.map(question => [question.id, question]));
function correctText(id) { const question = byId.get(id); assert.ok(question, id); return question.answers.filter(answer => question.correct.includes(answer.id)).map(answer => answer.text).join(' '); }
function has(id, pool) { return pool.some(question => question.id === id); }

test('The active quiz preserves unique stable IDs and complete, resolvable answers/explanations', () => {
  assert.equal(QUESTIONS.length, 231 + learningQuestions.length); assert.equal(byId.size, QUESTIONS.length);
  for (const question of QUESTIONS) {
    assert.ok(question.q.trim() && question.explain.trim(), question.id);
    assert.ok(Array.isArray(question.answers) && question.answers.length >= 2, question.id);
    assert.equal(new Set(question.answers.map(answer => answer.id)).size, question.answers.length, question.id);
    assert.equal(new Set(question.answers.map(answer => answer.text)).size, question.answers.length, question.id);
    assert.ok(question.answers.every(answer => answer.id && answer.text.trim()), question.id);
    assert.ok(question.correct.length > 0 && question.correct.every(id => question.answers.some(answer => answer.id === id)), question.id);
    assert.ok(question.countries.length > 0 && question.countries.every(country => ['DE', 'AT', 'CH'].includes(country)), question.id);
    if (question.source) assert.equal(new URL(question.source).protocol, 'https:', question.id);
  }
  assert.equal(Object.keys(withdrawnQuizQuestions).length, 97);
  for (const id of Object.keys(withdrawnQuizQuestions)) assert.ok(!byId.has(id), id + ': withdrawn record excluded');
});

test('All detailed questions link to existing lessons, courses and country notes', () => {
  const added = [...load('lib/learning-afternoon-expansion.js').afternoonModules,
    ...load('lib/learning-knowledge-growth.js').knowledgeGrowthModules,
    ...load('lib/learning-science-expansion.js').scienceExpansionModules,
    ...load('lib/learning-expansion-oct17.js').depthExpansionModules,
    ...load('lib/learning-growth-oct18.js').october18GrowthModules,
    ...load('lib/learning-exam-expansion-oct18.js').examExpansionModules,
    ...load('lib/learning-round2-oct18.js').round2ExpansionModules,
    ...load('lib/learning-round3-oct18.js').round3ExpansionModules,
    ...load('lib/learning-round4-oct18.js').round4ExpansionModules,
    ...load('lib/learning-round5-oct18.js').round5ExpansionModules,
    ...load('lib/learning-round6-oct18.js').round6ExpansionModules];
  const addedIds = new Set(added.map(module => module.id));
  const existing = learningModules.filter(module => !addedIds.has(module.id));
  // Count the complete named groups against fixed editorial inventories, rather
  // than deriving a desired total from the same actual array being checked.
  // Since the original84-course snapshot: five reviewed standalone courses and
  // the dog-airflow, two learning-process and one seed-mast appendix add exactly
  // 5 courses,10 lessons and19 questions.
  const existingGroups = [
    ['lib/learning-wildlife.js', 'wildlifeModules', 8, 24, 64],
    ['lib/learning-practice.js', 'practiceModules', 16, 48, 128],
    ['lib/learning-expansion-nature.js', 'natureExpansionModules', 12, 73, 146],
    ['lib/learning-expansion-practice.js', 'practiceExpansionModules', 12, 72, 144],
    ['lib/learning-expansion-care.js', 'careExpansionModules', 12, 72, 144],
    ['lib/learning-deepening-nature.js', 'natureDeepeningModules', 4, 24, 32],
    ['lib/learning-deepening-practice.js', 'practiceDeepeningModules', 5, 36, 44],
    ['lib/learning-deepening-care.js', 'careDeepeningModules', 4, 24, 32],
    ['lib/learning-dog-depth.js', 'dogDepthModules', 5, 32, 63],
    ['lib/learning-wildlife-depth.js', 'wildlifeDepthModules', 6, 30, 60],
    ['lib/learning-growth-oct18.js', 'dogGeneticsModules', 2, 2, 6],
    ['lib/learning-growth-oct18.js', 'redDeerVoiceModules', 1, 1, 2],
    ['lib/learning-growth-oct18.js', 'beaverIncisorModules', 1, 2, 3],
    ['lib/learning-growth-oct18.js', 'roePremolarModules', 1, 1, 1],
  ];
  const groupedIds = [], expectedExisting = { modules: 0, lessons: 0, questions: 0 };
  for (const [file, exportName, modules, lessons, questions] of existingGroups) {
    const group = load(file)[exportName];
    assert.equal(group.length, modules, exportName);
    assert.equal(group.reduce((sum, module) => sum + module.lessons.length, 0), lessons, exportName);
    assert.equal(group.reduce((sum, module) => sum + module.questions.length, 0), questions, exportName);
    groupedIds.push(...group.map(module => module.id));
    expectedExisting.modules += modules; expectedExisting.lessons += lessons; expectedExisting.questions += questions;
  }
  assert.deepEqual(expectedExisting, { modules: 89, lessons: 441, questions: 869 });
  assert.equal(new Set(groupedIds).size, expectedExisting.modules);
  assert.deepEqual(existing.map(module => module.id), groupedIds);
  assert.equal(courses.length, learningModules.length + miniCourses.length); assert.equal(miniCourses.length, 34); assert.equal(existing.length, expectedExisting.modules);
  assert.equal(existing.reduce((sum, module) => sum + module.lessons.length, 0), expectedExisting.lessons);
  assert.equal(existing.reduce((sum, module) => sum + module.questions.length, 0), expectedExisting.questions);
  assert.equal(learningCounts.lessons, expectedExisting.lessons + added.reduce((sum, module) => sum + module.lessons.length, 0));
  assert.equal(learningQuestions.length, expectedExisting.questions + added.reduce((sum, module) => sum + module.questions.length, 0));
  assert.equal(new Set(courses.map(course => course.id)).size, courses.length);
  for (const module of learningModules) {
    const lessons = new Set(module.lessons.map(lesson => lesson.id));
    assert.equal(lessons.size, module.lessons.length, module.id);
    assert.ok(module.sources.length > 0 && module.sources.every(source => source.label && new URL(source.url).protocol === 'https:'), module.id);
    for (const country of module.countries) assert.ok(module.countryNotes[country], module.id + ':' + country);
    for (const question of module.questions) {
      assert.ok(lessons.has(question.lessonId), question.id); assert.equal(question.learningHref, `/kurse/${module.id}`);
      assert.ok(byId.has(question.id), question.id); assert.ok(question.explain.trim(), question.id);
    }
  }
});

test('Germany-specific Trichinen procedure stays in German law and names its concrete household-use case', () => {
  const id = 'DE-hygiene-trichinen', question = byId.get(id);
  assert.equal(quizQuestionTopic(question), 'Recht'); assert.deepEqual(question.countries, ['DE']);
  assert.match(question.q, /Deutschland/); assert.match(question.q, /eigenen häuslichen Verbrauch/);
  assert.match(correctText(id), /amtliche.*Trichinenuntersuchung/i); assert.match(correctText(id), /Freigabe/);
  assert.equal(question.source, 'https://www.gesetze-im-internet.de/tier-lmhv/__2b.html');
  assert.ok(has(id, quizLearningPool(QUESTIONS, { country: 'DE', topic: 'Recht' })));
  for (const country of ['DE', 'AT', 'CH']) {
    assert.ok(!has(id, quizLearningPool(QUESTIONS, { country, topic: 'Alle' })));
    assert.ok(!has(id, quizLearningPool(QUESTIONS, { country, topic: 'Wildbrethygiene' })));
    if (country !== 'DE') assert.ok(!has(id, quizLearningPool(QUESTIONS, { country, topic: 'Recht' })));
  }
});

test('Current German Jagdschein reliability procedure distinguishes Waffenbehörde and Jagdbehörde', () => {
  const id = 'JL-110', question = byId.get(id);
  assert.match(question.q, /Waffenbehörde/); assert.match(correctText(id), /Jagdbehörde.*Zuverlässigkeit/);
  assert.match(question.explain, /Auskunft der Waffenbehörde/); assert.match(question.explain, /persönlicher Eignung/);
  assert.equal(question.source, 'https://www.gesetze-im-internet.de/bjagdg/__17.html');
  assert.ok(has(id, quizLearningPool(QUESTIONS, { country: 'DE', topic: 'Recht' })));
  assert.ok(!has(id, quizLearningPool(QUESTIONS, { country: 'CH', topic: 'Recht' })));
});

test('Dentalplatte is a particular anatomical structure; Schwarzwild reproduction has no fixed universal season', () => {
  assert.match(byId.get('JL-1090').q, /Dentalplatte/);
  assert.match(correctText('JL-1090'), /zahnfreie Fläche im oberen Vordergebiss/);
  assert.match(byId.get('JL-1090').explain, /nicht das gesamte Gebiss/);
  assert.match(correctText('JL-1083'), /auch außerhalb/);
  assert.match(byId.get('JL-1083').explain, /jeder Jahreszeit/);
  assert.match(byId.get('JL-1083').explain, /Variabilität/);
});

test('Wildverbiss does not diagnose a fixed population and a Rotwild question is absent from Federwild', () => {
  assert.match(byId.get('JL-1227').explain, /keine bestimmte Wilddichte/);
  assert.match(byId.get('JL-1227').explain, /Vergleichsflächen/);
  const id = 'JL-1093'; assert.equal(byId.get(id).topic, 'Rotwild');
  assert.ok(has(id, filterQuestions({ country: 'AT', topic: 'Rotwild', count: 1000 })));
  assert.ok(!has(id, filterQuestions({ country: 'DE', topic: 'Federwild', count: 1000 })));
  assert.equal(byId.get(id).source, 'https://www.wildtierportal.bayern.de/wildtiere_bayern/087879/index.php');
});

test('Glossary has unique stable entries; corrected definitions agree with reviewed quiz meanings', () => {
  assert.equal(TERMS.length, 72); assert.equal(new Set(TERMS.map(term => term.slug)).size, TERMS.length);
  assert.equal(new Set(TERMS.map(term => term.term)).size, TERMS.length);
  for (const term of TERMS) assert.ok(term.slug && term.term.trim() && term.def.trim());
  const termById = new Map(TERMS.map(term => [term.slug, term]));
  assert.match(termById.get('ranzzeit').def, /Rehwild.*Brunft beziehungsweise Blattzeit/);
  assert.match(termById.get('gewaff').def, /Haderer im Oberkiefer.*Unterkiefer/);
  assert.match(termById.get('zuwarten').def, /keine pauschale Wartezeit/);
  assert.match(termById.get('federwild').def, /Art und Region/);
});
test('Fuchslosung is described as elongated with a tapered end, with no unsafe certain identification', () => {
  const id = 'DE-wk-fuchs-losung', question = byId.get(id);
  assert.match(correctText(id), /Längliche Stücke/); assert.match(correctText(id), /zugespitztem Ende/);
  assert.ok(!correctText(id).includes('Kegelförmig'));
  assert.match(question.explain, /beweisen die Art nicht/); assert.match(question.explain, /nicht anfassen/);
  assert.match(question.explain, /Pflanzenreste/);
  assert.equal(question.source, 'https://www.waldwissen.net/de/lebensraum-wald/tiere-im-wald/wildtierkot-erkennen');
});
