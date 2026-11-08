// Exact existing learning starts, ordinary rendered links and a real progress
// store with isolated storage doubles. No browser/account/user-data access.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const BASELINE = 'd5bb4f0cebe387c6875eea9f0e40071c84ef3b8b';
const RAW = 'data/exam-alignment/learning-goals-2026-11-01.json';
const oldText = file => execFileSync('git', ['show', `${BASELINE}:${file}`], { cwd: root, encoding: 'utf8' });
const oldRaw = JSON.parse(oldText(RAW)), currentRaw = JSON.parse(fs.readFileSync(path.join(root, RAW), 'utf8'));
const load = createLoader(), blueprint = load('lib/exam-blueprint-server.js').getExamBlueprintData();
const oldBlueprint = createLoader({ '../data/exam-alignment/learning-goals-2026-11-01.json': oldRaw })('lib/exam-blueprint-server.js').getExamBlueprintData();
const goalOf = data => data.categories.flatMap(category => category.goals).find(goal => goal.id === 'feld-mahdabstimmung');
const target = { moduleId: 'wissen-ausbau-mahd-wildtierrettung', lessonId: 'aenderung' };
const mapping = [
  { questionId: 'mahd', courseId: target.moduleId, lessonId: 'team' },
  { questionId: 'mahd', courseId: target.moduleId, lessonId: 'aenderung' },
  { questionId: 'hygienekette', courseId: 'wissen-ausbau-wildbretprozess', lessonId: 'trennung' },
  { questionId: 'hygienekette', courseId: 'wissen-ausbau-wildbretprozess', lessonId: 'kuehlweg' },
];

test('The entire old authored goal bank is exact after removing only one specifically validated complementary mowing lesson', () => {
  const restored = structuredClone(currentRaw), goal = goalOf(restored);
  assert.equal(goalOf(oldRaw).relatedLessons, undefined);
  assert.deepEqual(goal.relatedLessons, [target]);
  delete goal.relatedLessons;
  assert.deepEqual(restored, oldRaw);
  assert.equal(currentRaw.categories.flatMap(category => category.goals).length, 36);
  assert.equal(currentRaw.categories.find(category => category.slug === 'landwirtschaft-lebensraeume').caseQuestionId, 'mahd');
});

test('All existing projected goals, sources, cases and primary card/quiz destinations remain exact apart from the one additional lesson link', () => {
  const restored = structuredClone(blueprint), goal = goalOf(restored), course = load('lib/learning-curriculum.js').getLearningModule(target.moduleId);
  assert.deepEqual(goal.relatedLessons, [{ courseTitle: load('lib/learning-navigation-labels.js').getLearningNavigationLabel(course), lessonTitle: course.lessons.find(lesson => lesson.id === target.lessonId).title, href: `/kurse/${target.moduleId}#lesson-aenderung` }]);
  delete goal.relatedLessons;
  assert.deepEqual(restored, oldBlueprint);
  assert.equal(goal.href, `/kurse/${target.moduleId}#lesson-team`);
  assert.deepEqual(goal.sourceIds, goalOf(oldBlueprint).sourceIds);
  assert.deepEqual(blueprint.sources, oldBlueprint.sources);
});

test('Exactly four reviewed case links append to all nine complete published objects without changing any oral question or course assignment', () => {
  const file = 'lib/oral-exam-lesson-links-server.js', filename = path.join(root, file), previous = { exports: {} };
  const { code } = local('next/dist/build/swc').transformSync(oldText(file), { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.resolve(root, 'lib', path.extname(id) ? id : id + '.js')) : local(id), previous, previous.exports);
  const oldLinks = previous.exports.getOralExamLessonLinks(), links = load(file).getOralExamLessonLinks();
  assert.equal(oldLinks.length, 9); assert.equal(links.length, 13);
  assert.deepEqual(links.slice(0, 9), oldLinks);
  const questions = load('lib/oral-exam-trainer.js').oralExamQuestions;
  const expected = mapping.map(item => {
    const question = questions.find(question => question.id === item.questionId), course = load('lib/learning-curriculum.js').getLearningModule(item.courseId);
    assert.equal(question.course, course.id);
    const lesson = course.lessons.find(lesson => lesson.id === item.lessonId);
    assert.ok(lesson.paragraphs.length && lesson.exercise);
    return { ...item, title: lesson.title, href: `/kurse/${course.id}#lesson-${lesson.id}` };
  });
  assert.deepEqual(links.slice(9), expected);
  assert.equal(new Set(links.map(link => link.questionId)).size, 9);
  assert.equal(Buffer.byteLength(JSON.stringify({ lessonLinks: links })), 2709);
  assert.doesNotMatch(JSON.stringify(links), /"(?:model|sources|answers|criteria|rating|paragraphs)"\s*:/);
});

test('The existing country-aware goal projector resolves the precise same nonlegal reading destination for all three countries with no source or answer bodies', () => {
  const { projectExamLearningGoal } = load('lib/exam-learning-goal-server.js'), course = load('lib/learning-curriculum.js').getLearningModule(target.moduleId);
  for (const country of ['CH', 'AT', 'DE']) {
    const goal = projectExamLearningGoal(goalOf(currentRaw), { country, categorySlug: 'landwirtschaft-lebensraeume' });
    assert.equal(goal.regionalLaw, false);
    assert.equal(goal.relatedLessons.length, 1);
    const url = new URL(goal.relatedLessons[0].href, 'https://isolated.invalid');
    assert.equal(url.pathname, `/kurse/${course.id}`); assert.equal(url.hash, '#lesson-aenderung'); assert.equal(url.search, '');
    assert.equal(load('lib/learning-lesson-navigation.js').lessonIndexFromHash(course.lessons, url.hash), course.lessons.findIndex(lesson => lesson.id === 'aenderung'));
    assert.deepEqual(goal.selfCheck, goalOf(oldRaw).selfCheck);
    assert.doesNotMatch(JSON.stringify(goal), /"(?:paragraphs|model|answers|evidence|sources|reviewedOn)"\s*:/);
  }
});

test('The unchanged real goal renderer adds one ordinary same-window link after the existing task and controls', () => {
  function Link({ href, children, prefetch, ...props }) { return React.createElement('a', { href, ...props }, children); }
  const { ExamLearningGoal } = createLoader({ 'next/link': { __esModule: true, default: Link } })('components/ExamLearningGoals.js');
  const render = goal => renderToStaticMarkup(React.createElement(ExamLearningGoal, { goal, profile: { country: 'AT', region: 'ST' } }));
  const before = render(goalOf(oldBlueprint)), after = render(goalOf(blueprint));
  const hrefs = text => [...text.matchAll(/href="([^"]*)"/g)].map(match => match[1].replace(/&amp;/g, '&'));
  assert.deepEqual(hrefs(after), [...hrefs(before), `/kurse/${target.moduleId}#lesson-aenderung`]);
  assert.match(after, /Zwischen Suche und Mahd bleibt Zeit/);
  assert.ok(after.indexOf(goalOf(currentRaw).task) < after.indexOf('#lesson-aenderung'));
  assert.doesNotMatch(after, /target="_blank"|<button|<dialog|<form|<input|<select/);
});

test('The actual v1 goal-progress store restores all existing profile IDs and mowing self-marks without implicit writes or new lesson-based storage keys', () => {
  const { buildExamGoalCatalog, createExamGoalProgressStore, EXAM_GOAL_PROGRESS_KEY } = load('lib/exam-goal-progress.js'), alignment = load('lib/exam-alignment-server.js').getExamAlignmentData();
  const oldCatalog = buildExamGoalCatalog(oldBlueprint, alignment), nextCatalog = buildExamGoalCatalog(blueprint, alignment);
  assert.deepEqual([...nextCatalog.profiles.keys()], [...oldCatalog.profiles.keys()]);
  for (const [profile, goals] of oldCatalog.profiles) assert.deepEqual([...nextCatalog.profiles.get(profile).keys()], [...goals.keys()]);
  const profiles = { 'CH:ZH': { 'feld-mahdabstimmung': 'erklaert' }, 'DE:BY': { 'feld-mahdabstimmung': 'ueben' }, 'AT:ST': { 'feld-mahdabstimmung': 'erklaert' } }, saved = JSON.stringify({ version: 1, profiles });
  const values = new Map([[EXAM_GOAL_PROGRESS_KEY, saved]]), writes = [];
  const win = { localStorage: { getItem: key => values.get(key) ?? null, setItem(key, value) { writes.push([key, value]); values.set(key, value); }, removeItem(key) { writes.push([key, null]); values.delete(key); } }, addEventListener() {}, removeEventListener() {} };
  const store = createExamGoalProgressStore({ windowFor: () => win }); store.configure(oldCatalog); const unsubscribe = store.subscribe(() => {});
  assert.equal(store.getSnapshot().phase, 'ready'); assert.deepEqual(store.getSnapshot().entries, profiles);
  store.configure(nextCatalog); assert.deepEqual(store.getSnapshot().entries, profiles); assert.deepEqual(writes, []); assert.equal(values.get(EXAM_GOAL_PROGRESS_KEY), saved);
  assert.equal(store.set('DE:BY', 'feld-mahdabstimmung', 'erklaert'), true); assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(values.get(EXAM_GOAL_PROGRESS_KEY)), { version: 1, profiles: { ...profiles, 'DE:BY': { 'feld-mahdabstimmung': 'erklaert' } } });
  assert.ok(!values.get(EXAM_GOAL_PROGRESS_KEY).includes('aenderung')); unsubscribe();
});

test('Full target course objects and existing question/renderer/progress sources and regional authored banks remain exact to the released baseline', () => {
  for (const [file, key, courseId] of [['lib/learning-expansion-nature.js', 'natureExpansionModules', target.moduleId], ['lib/learning-expansion-care.js', 'careExpansionModules', 'wissen-ausbau-wildbretprozess']]) {
    const previous = { exports: {} }, filename = path.join(root, file);
    const { code } = local('next/dist/build/swc').transformSync(oldText(file), { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.resolve(root, 'lib', path.extname(id) ? id : id + '.js')) : local(id), previous, previous.exports);
    assert.deepEqual(load(file)[key].find(course => course.id === courseId), previous.exports[key].find(course => course.id === courseId), courseId);
  }
  for (const file of ['lib/oral-exam-trainer.js', 'components/OralExamTrainer.js', 'components/ExamLearningGoals.js', 'lib/exam-goal-progress.js', 'lib/exam-learning-goal-server.js', 'lib/exam-blueprint-server.js', 'data/exam-alignment/ch-2026-11-01.json', 'data/exam-alignment/at-2026-11-01.json', 'data/exam-alignment/de-2026-11-01.json']) {
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n'), oldText(file).replace(/\r\n/g, '\n'), file);
  }
});
