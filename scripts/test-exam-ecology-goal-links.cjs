// Exact existing-goal links and isolated progress restoration; no browser or
// live account/storage access. This change adds no factual teaching text.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const BASELINE = 'e6b1d550d550e14a5571fa4caf43284758fe0c37';
const RAW = 'data/exam-alignment/learning-goals-2026-11-01.json';
const readBaseline = file => execFileSync('git', ['show', `${BASELINE}:${file}`], { cwd: root, encoding: 'utf8' });
const baseline = JSON.parse(readBaseline(RAW));
const current = JSON.parse(fs.readFileSync(path.join(root, RAW), 'utf8'));
const targets = [
  { moduleId: 'wissen-lebensraeume-biotopverbund', lessonId: 'biotop-biozoenose' },
  { moduleId: 'wissen-lebensraeume-biotopverbund', lessonId: 'habitat-nische' },
];
const findGoal = data => data.categories.find(category => category.slug === 'natur-revier').goals.find(goal => goal.id === 'natur-biotopnetz');
const before = findGoal(baseline), after = findGoal(current);
const load = createLoader();
const blueprint = load('lib/exam-blueprint-server.js').getExamBlueprintData();
const oldBlueprint = createLoader({ '../data/exam-alignment/learning-goals-2026-11-01.json': baseline })('lib/exam-blueprint-server.js').getExamBlueprintData();
const projectedGoal = data => data.categories.find(category => category.slug === 'natur-revier').goals.find(goal => goal.id === after.id);

test('The historical two-link ecology appendix preserves every old object when the later exact mowing link is separately isolated', () => {
  assert.ok(before && after);
  assert.equal(before.relatedLessons, undefined);
  assert.deepEqual(after.relatedLessons, targets);
  const restored = structuredClone(current);
  delete findGoal(restored).relatedLessons;
  const mowing = restored.categories.flatMap(category => category.goals).filter(goal => goal.id === 'feld-mahdabstimmung');
  assert.equal(mowing.length, 1);
  assert.deepEqual(mowing[0].relatedLessons, [{ moduleId: 'wissen-ausbau-mahd-wildtierrettung', lessonId: 'aenderung' }]);
  delete mowing[0].relatedLessons;
  assert.deepEqual(restored, baseline);
  assert.equal(current.categories.find(category => category.slug === 'natur-revier').caseQuestionId, 'monitoring');
  assert.equal(current.categories.flatMap(category => category.goals).length, 36);
});

test('Actual blueprint keeps every primary projection, source list, practice case and card destination exact apart from these compact related links', () => {
  const restored = structuredClone(blueprint), goal = projectedGoal(restored);
  assert.equal(goal.href, '/kurse/wissen-lebensraeume-biotopverbund#lesson-biotop-netz');
  assert.deepEqual(goal.relatedLessons.map(item => item.href), targets.map(item => `/kurse/${item.moduleId}#lesson-${item.lessonId}`));
  for (const item of goal.relatedLessons) assert.deepEqual(Object.keys(item).sort(), ['courseTitle', 'href', 'lessonTitle']);
  delete goal.relatedLessons;
  const mowing = restored.categories.flatMap(category => category.goals).filter(goal => goal.id === 'feld-mahdabstimmung');
  assert.equal(mowing.length, 1);
  const mowingCourse = load('lib/learning-curriculum.js').getLearningModule('wissen-ausbau-mahd-wildtierrettung');
  assert.deepEqual(mowing[0].relatedLessons, [{ courseTitle: load('lib/learning-navigation-labels.js').getLearningNavigationLabel(mowingCourse), lessonTitle: mowingCourse.lessons.find(lesson => lesson.id === 'aenderung').title, href: '/kurse/wissen-ausbau-mahd-wildtierrettung#lesson-aenderung' }]);
  delete mowing[0].relatedLessons;
  assert.deepEqual(restored, oldBlueprint);
  assert.equal(goal.cardHref, projectedGoal(oldBlueprint).cardHref);
  assert.equal(goal.cardCount, projectedGoal(oldBlueprint).cardCount);
  assert.deepEqual(goal.sourceIds, projectedGoal(oldBlueprint).sourceIds);
  assert.deepEqual(blueprint.sources, oldBlueprint.sources);
});

test('Existing country-aware projector resolves both exact nonlegal lessons for CH, AT and DE without mutating the goal or supplying answer bodies', () => {
  const { projectExamLearningGoal } = load('lib/exam-learning-goal-server.js');
  const { getLearningModule } = load('lib/learning-curriculum.js');
  const { lessonHash, lessonIndexFromHash } = load('lib/learning-lesson-navigation.js');
  const course = getLearningModule(after.moduleId), saved = JSON.stringify(after);
  for (const country of ['CH', 'AT', 'DE']) {
    const goal = projectExamLearningGoal(after, { country, categorySlug: 'natur-revier' });
    assert.equal(goal.regionalLaw, false);
    assert.equal(goal.id, before.id);
    assert.equal(goal.task, before.task);
    assert.deepEqual(goal.selfCheck, before.selfCheck);
    for (const [index, target] of targets.entries()) {
      const lessons = course.lessons.filter(lesson => lesson.id === target.lessonId);
      assert.equal(lessons.length, 1);
      assert.ok(lessons[0].paragraphs.length);
      assert.equal(goal.relatedLessons[index].lessonTitle, lessons[0].title);
      const href = `/kurse/${course.id}${lessonHash(lessons[0].id)}`;
      assert.equal(goal.relatedLessons[index].href, href);
      assert.equal(lessonIndexFromHash(course.lessons, new URL(href, 'https://isolated.invalid').hash), course.lessons.indexOf(lessons[0]));
    }
    assert.doesNotMatch(JSON.stringify(goal), /"(?:paragraphs|evidence|questions|answers|model|correct|reviewedOn)"\s*:/);
  }
  assert.equal(JSON.stringify(after), saved);
});

test('The real existing goal renderer exposes just two ordinary internal lesson links, preserving the primary reading, course quiz and card controls', () => {
  function Link({ href, children, prefetch, ...props }) { return React.createElement('a', { href, ...props }, children); }
  const ui = createLoader({ 'next/link': { __esModule: true, default: Link } })('components/ExamLearningGoals.js');
  const render = goal => renderToStaticMarkup(React.createElement(ui.ExamLearningGoal, { goal, profile: { country: 'CH', region: 'ZH' } }));
  const markup = render(projectedGoal(blueprint)), oldMarkup = render(projectedGoal(oldBlueprint));
  const hrefs = text => [...text.matchAll(/href="([^"]*)"/g)].map(match => match[1].replace(/&amp;/g, '&'));
  const expected = targets.map(item => `/kurse/${item.moduleId}#lesson-${item.lessonId}`);
  const links = hrefs(markup), oldLinks = hrefs(oldMarkup);
  assert.deepEqual(links, [...oldLinks, ...expected]);
  assert.equal(links.length, oldLinks.length + 2);
  assert.match(markup, /Biotop und Biozönose/);
  assert.match(markup, /Habitat und Nische/);
  assert.doesNotMatch(markup, /target="_blank"|<form|<button|<input|<select|<dialog/);
  assert.ok(markup.indexOf(after.task) < markup.indexOf(expected[0]));
  assert.ok(markup.includes('Kernfläche, Trittstein und verbindende Struktur'));
});

test('Actual v1 progress store restores existing profile/goal marks and keeps them through catalog replacement with no implicit storage write', () => {
  const { buildExamGoalCatalog, createExamGoalProgressStore, EXAM_GOAL_PROGRESS_KEY } = load('lib/exam-goal-progress.js');
  const alignment = load('lib/exam-alignment-server.js').getExamAlignmentData();
  const oldCatalog = buildExamGoalCatalog(oldBlueprint, alignment), newCatalog = buildExamGoalCatalog(blueprint, alignment);
  assert.deepEqual([...newCatalog.profiles.keys()], [...oldCatalog.profiles.keys()]);
  for (const [profile, oldGoals] of oldCatalog.profiles) assert.deepEqual([...newCatalog.profiles.get(profile).keys()], [...oldGoals.keys()]);
  const profiles = { 'CH:ZH': { 'natur-biotopnetz': 'erklaert' }, 'AT:ST': { 'natur-biotopnetz': 'ueben' }, 'DE:BY': { 'natur-biotopnetz': 'erklaert' } };
  const original = JSON.stringify({ version: 1, profiles }), values = new Map([[EXAM_GOAL_PROGRESS_KEY, original]]), writes = [];
  const fakeWindow = { localStorage: { getItem: key => values.get(key) ?? null, setItem(key, value) { writes.push([key, value]); values.set(key, value); }, removeItem(key) { writes.push([key, null]); values.delete(key); } }, addEventListener() {}, removeEventListener() {} };
  const store = createExamGoalProgressStore({ windowFor: () => fakeWindow });
  store.configure(oldCatalog);
  const unsubscribe = store.subscribe(() => {});
  assert.equal(store.getSnapshot().phase, 'ready');
  assert.deepEqual(store.getSnapshot().entries, profiles);
  store.configure(newCatalog);
  assert.deepEqual(store.getSnapshot().entries, profiles);
  assert.deepEqual(writes, []);
  assert.equal(values.get(EXAM_GOAL_PROGRESS_KEY), original);
  assert.equal(store.set('CH:ZH', after.id, 'ueben'), true);
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(values.get(EXAM_GOAL_PROGRESS_KEY)), { version: 1, profiles: { ...profiles, 'CH:ZH': { 'natur-biotopnetz': 'ueben' } } });
  assert.ok(!values.get(EXAM_GOAL_PROGRESS_KEY).includes('biotop-biozoenose'));
  assert.ok(!values.get(EXAM_GOAL_PROGRESS_KEY).includes('habitat-nische'));
  unsubscribe();
});

test('No server helper, renderer, progress implementation or regional alignment file changes are needed for these links', () => {
  for (const file of ['lib/exam-learning-goal-server.js', 'lib/exam-blueprint-server.js', 'components/ExamLearningGoals.js', 'lib/exam-goal-progress.js', 'data/exam-alignment/ch-2026-11-01.json', 'data/exam-alignment/at-2026-11-01.json', 'data/exam-alignment/de-2026-11-01.json']) {
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n'), readBaseline(file).replace(/\r\n/g, '\n'), file);
  }
});
