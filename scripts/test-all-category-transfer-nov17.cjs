// Preserve this historical view after the exact separately tested Guttation append.
const { guttationBaselineFixture } = require('./helpers/guttation-addition-nov25.cjs');
// This historical snapshot projects only the separately tested Nov25 fish-gill appendix.
const { fishGillBaselineFixture } = require('./helpers/fish-gill-addition-nov25.cjs');
// Keep the historical contract exact; the named Nov25 bird appendix has
// positive whole-corpus/card preservation in its own live-data suite.
const { woodpeckerFootBaselineFixture } = require('./helpers/woodpecker-foot-addition-nov25.cjs');
// Independent whole-object and UI integration checks. Only isolated progress
// stores are used; no real browser, account or personal learning data is read.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { insectRespirationBaselineFixture } = require('./helpers/insect-respiration-addition-nov25.cjs');
const { redDeerFlehmenBaselineFixture } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
// Keep this exact Nov17 inventory contract; the precisely named Nov25 appendix
// has independent positive current-curriculum and full-object preservation tests.
const revision = '69e4417ffc881e88432dfc04e3e444f1b1357659', load = createLoader(insectRespirationBaselineFixture(woodpeckerFootBaselineFixture(redDeerFlehmenBaselineFixture(fishGillBaselineFixture(guttationBaselineFixture())))));
function previousLoader() {
  const cache = new Map();
  return function read(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = name === 'data/learning-expansion-afternoon-2026-10-16.json' ? fs.readFileSync(filename, 'utf8') : execFileSync('git', ['show', `${revision}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (name.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? read(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  };
}
const old = previousLoader(), before = old('lib/exam-blueprint-server.js').getExamBlueprintData();
const blueprint = load('lib/exam-blueprint-server.js').getExamBlueprintData();
const transfers = load('lib/exam-transfer-goals-server.js'), additions = transfers.getExamTransferGoals();
const categories = load('lib/learning-categories.js').learningCategoryDetails;
const getCourse = load('lib/learning-curriculum.js').getLearningModule;
const clone = value => JSON.parse(JSON.stringify(value));
const datasets = ['ecology', 'practice', 'exam'].map(name => load(`data/exam-alignment/transfer-${name}-2026-11-17.json`));
const link = ({ href, children, prefetch, scroll, ...props }) => React.createElement('a', { href, ...props }, children);
const ui = createLoader({ 'next/link': { __esModule: true, default: link }, 'next/router': { useRouter: () => ({ isReady: true, query: {}, asPath: '/lernen/wildkunde' }) } });
const Goal = ui('components/ExamLearningGoals.js').ExamLearningGoal;

test('Each of the twelve categories gains exactly one transfer while all36 prior goal objects and source identities stay exact', () => {
  assert.equal(before.categories.flatMap(item => item.goals).length, 36);
  assert.equal(blueprint.categories.flatMap(item => item.goals).length, 48);
  assert.deepEqual(blueprint.categories.map(item => item.slug), categories.map(item => item.slug));
  const ids = blueprint.categories.flatMap(item => item.goals.map(goal => goal.id)); assert.equal(new Set(ids).size, 48);
  for (const previous of before.categories) {
    const current = blueprint.categories.find(item => item.slug === previous.slug), addition = additions.find(item => item.slug === previous.slug);
    assert.equal(current.goals.length, 4); assert.deepEqual(current.goals.slice(0, 3), previous.goals); assert.deepEqual(current.practiceCase, previous.practiceCase);
    assert.equal(current.goals[3].id, addition.goal.id); assert.equal(current.goals[3].caseText, addition.goal.caseText); assert.equal(current.goals[3].followUp, addition.goal.followUp);
  }
  assert.deepEqual(blueprint.sources.slice(0, before.sources.length), before.sources);
  const raw = 'data/exam-alignment/learning-goals-2026-11-01.json'; assert.equal(fs.readFileSync(path.join(root, raw), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `${revision}:${raw}`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
});

test('All198 full course objects,1794 cards,114 Wildjahr photographs and all three regional law datasets remain exact', () => {
  assert.deepEqual(load('lib/learning-curriculum.js').learningModules, old('lib/learning-curriculum.js').learningModules);
  const cards = load('lib/learning-flashcards.js').getFlashcards(); assert.equal(cards.length, 1794); assert.deepEqual(cards, old('lib/learning-flashcards.js').getFlashcards());
  assert.deepEqual(load('lib/wild-year-photographs.js').wildYearPhotographs, old('lib/wild-year-photographs.js').wildYearPhotographs);
  for (const country of ['CH', 'AT', 'DE']) assert.deepEqual(load('lib/regional-law-data.js').getLegalDataset(country), old('lib/regional-law-data.js').getLegalDataset(country));
});

test('Every new primary and related lesson contributes its real scoped citations and inherited date at the final source section', () => {
  const { getLessonReviewDate } = load('lib/learning-review-date.js');
  for (const { slug, goal: raw } of additions) {
    const goal = blueprint.categories.find(item => item.slug === slug).goals[3];
    const targets = [{ moduleId: raw.moduleId, lessonId: raw.lessonId }, ...raw.relatedLessons];
    assert.equal(goal.sourceContexts.length, targets.length); const allIds = new Set();
    targets.forEach((target, index) => {
      const course = getCourse(target.moduleId), lesson = course.lessons.find(item => item.id === target.lessonId), context = goal.sourceContexts[index];
      assert.equal(context.moduleId, course.id); assert.equal(context.lessonId, lesson.id); assert.equal(context.lessonTitle, lesson.title);
      const exact = (lesson.evidence || []).flatMap(item => item.sources || []);
      const actual = (exact.length ? exact : course.sources).filter(source => source.lessonIds === undefined || Array.isArray(source.lessonIds) && source.lessonIds.includes(lesson.id));
      assert.equal(context.sourceScope, exact.length ? 'lesson' : 'course');
      assert.deepEqual(context.sourceIds.map(id => blueprint.sources.find(source => source.id === id).url), [...new Set(actual.map(source => source.url))]);
      for (const id of context.sourceIds) { allIds.add(id); assert.equal(blueprint.sources.find(source => source.id === id).reviewedOn, getLessonReviewDate(lesson, course.reviewedOn)); }
    });
    assert.deepEqual(goal.sourceIds, [...allIds]);
    const course = getCourse(raw.moduleId), questions = course.questions.filter(item => item.lessonId === raw.lessonId);
    assert.ok(questions.length); assert.ok(questions.every(item => item.answers.length === 4 && item.correct.length === 1));
    if (slug !== 'jagdrecht') assert.equal(goal.lessonPractice, true);
    if (goal.cardHref) { const url = new URL(goal.cardHref, 'https://test.invalid'), selection = { courseId: url.searchParams.get('kurs'), lessonId: url.searchParams.get('lektion') }; const deck = load('lib/learning-flashcards.js').getFlashcardExport(selection, { withChoices: true }); assert.equal(deck.cards.length, goal.cardCount); assert.ok(deck.cards.every(card => card.lessonId === raw.lessonId && card.choices.length === 4)); }
  }
});

test('Every category root exposes its own small case entry; client props carry no answers or whole backend corpus', () => {
  const Tree = ui('components/LearningTopicTree.js').default;
  for (const category of categories) {
    const data = load('lib/learning-overview-server.js').getLearningOverviewData(category.slug), entry = data.examTransfer;
    assert.deepEqual(Object.keys(entry).sort(), ['caseText', 'href', 'title']);
    assert.deepEqual(entry, transfers.getCategoryExamTransfer(category.slug));
    assert.equal(new URL(entry.href, 'https://test.invalid').searchParams.get('kategorie'), category.slug);
    const html = renderToStaticMarkup(React.createElement(Tree, { category, groups: data.topicGroups, modules: data.modules, entries: data.subcategoryTools, examTransfer: entry }));
    assert.ok(html.includes(`data-category-transfer="${category.slug}"`)); assert.ok(html.includes('Aufgabe bearbeiten'));
    assert.equal((html.match(/data-category-transfer=/g) || []).length, 1);
    const result = load('lib/learning-search.js').searchLearning({ query: entry.title, category: category.slug, type: 'practice' }).results.find(item => item.id === `exam-transfer:${additions.find(item => item.slug === category.slug).goal.id}`);
    assert.ok(result); assert.equal(result.href, entry.href); assert.deepEqual(result.categories, [category.slug]);
    assert.deepEqual(Object.keys(result).sort(), ['categories', 'description', 'href', 'id', 'title', 'type']);
  }
  assert.equal(load('lib/learning-overview-server.js').getLearningOverviewData().examTransfer, undefined);
  for (const name of ['components/LearningOverview.js', 'components/LearningTopicTree.js', 'components/ExamLearningGoals.js']) assert.doesNotMatch(fs.readFileSync(path.join(root, name), 'utf8'), /import[^;]+(?:exam-transfer-goals-server|learning-curriculum|learning-flashcards|regional-law-data|transfer-.*json)/);
});

test('Self-control criteria remain behind a closed native disclosure for all48 goals, without hiding the actual task or new case', () => {
  for (const goal of blueprint.categories.flatMap(item => item.goals)) {
    const html = renderToStaticMarkup(React.createElement(Goal, { goal, profile: null }));
    assert.match(html, /<details class="goalSelfCheck"><summary>Selbstkontrolle<\/summary>/); assert.doesNotMatch(html, /<details[^>]*class="goalSelfCheck"[^>]*\bopen/);
    assert.ok(html.includes(goal.task.slice(0, 20))); assert.ok(html.indexOf('goalSelfCheck') > html.indexOf('<h4>'));
  }
});

test('The complete live search keeps every former result object and relative order, adding the twelve named tasks and one exact separately reviewed video', () => {
  const collect = api => { const first = api.searchLearning(), results = [...first.results]; for (let page = 2; page <= first.pages; page++) results.push(...api.searchLearning({ page }).results); return results; };
  const previous = collect(old('lib/learning-search.js')), current = collect(load('lib/learning-search.js'));
  const ids = new Set(additions.map(item => `exam-transfer:${item.goal.id}`));
  // A course remains one result when a lesson is appended; the separately
  // reviewed Auerhuhn film adds exactly this one new media result.
  const video = {
    id: 'entry:/lernen/wildtier-videofaelle?eintrag=auerhuhn-baum:video-auerhuhn-baum',
    title: 'Auerhahn auf einem Ast',
    description: 'Auerhuhn – Tetrao urogallus: Originalvideo mit drei erklärten Beobachtungsfragen. Stumme Aufnahme aus Schottland; weder Balzerfolg noch örtlicher Jagdstatus werden daraus bestimmt.',
    href: '/lernen/wildtier-videofaelle?eintrag=auerhuhn-baum', type: 'entry', categories: ['wildkunde', 'jagdpraxis'],
  };
  assert.deepEqual(current.filter(item => item.id === video.id), [video]);
  assert.equal(current.length, previous.length + 12 + 1); assert.deepEqual(current.filter(item => !ids.has(item.id) && item.id !== video.id), previous);
  assert.deepEqual(new Set(current.filter(item => ids.has(item.id)).map(item => item.id)), ids);
});

test('The new legal task keeps all51 exact profile routes and never invents a generic law check, card deck or region', () => {
  const goal = blueprint.categories.find(item => item.slug === 'jagdrecht').goals[3], { examCountries, examProfileLawHref } = load('lib/exam-profile.js'); let count = 0;
  assert.equal(goal.regionalLaw, true); assert.equal(goal.href, null); assert.equal(goal.quizHref, null); assert.equal(goal.cardHref, undefined);
  for (const country of examCountries) for (const region of country.regions) {
    const profile = { country: country.code, region: region.code }, html = renderToStaticMarkup(React.createElement(Goal, { goal, profile }));
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
    assert.ok(hrefs.includes(examProfileLawHref(profile))); assert.ok(hrefs.includes(examProfileLawHref(profile, 'uebung'))); count++;
  }
  assert.equal(count, 51);
  const html = renderToStaticMarkup(React.createElement(Goal, { goal, profile: { country: 'DE', region: 'ZH' } })); assert.doesNotMatch(html, /href="\/jagdrecht/);
});

test('Restoring old goal marks into the expanded catalog preserves every profile without writing storage or marking new tasks completed', () => {
  const model = load('lib/exam-goal-progress.js'), oldCatalog = model.buildExamGoalCatalog(before, null), catalog = model.buildExamGoalCatalog(blueprint, null);
  const entries = Object.fromEntries([...oldCatalog.profiles].map(([key, goals]) => [key, Object.fromEntries([...goals.keys()].slice(0, 2).map((id, index) => [id, index ? 'ueben' : 'erklaert']))]));
  let bytes = JSON.stringify({ version: 1, profiles: entries }), writes = 0;
  const win = { localStorage: { getItem: () => bytes, setItem(_key, value) { bytes = value; writes++; }, removeItem() { throw Error('Unexpected reset'); } }, addEventListener() {}, removeEventListener() {} };
  const store = model.createExamGoalProgressStore({ windowFor: () => win }); store.configure(oldCatalog); const off = store.subscribe(() => {});
  store.configure(catalog); assert.deepEqual(store.getSnapshot().entries, entries); assert.equal(writes, 0);
  for (const [key, goals] of catalog.profiles) { assert.equal(goals.size, 48); for (const { goal } of additions) assert.equal(store.getSnapshot().entries[key]?.[goal.id], undefined); }
  off();
});

test('Incomplete, duplicate, inherited, mismatched, injected or invented transfer metadata fails closed without mutating authored files', () => {
  const before = JSON.stringify(datasets), bad = change => { const next = clone(datasets); change(next); assert.throws(() => transfers.getExamTransferGoals(next)); };
  bad(next => next[0].categories.pop()); bad(next => next[0].categories[0].slug = next[0].categories[1].slug);
  bad(next => next[0].categories[0].goal.id = next[0].categories[1].goal.id);
  for (const field of ['title', 'task', 'caseText', 'followUp']) bad(next => next[0].categories[0].goal[field] = '');
  bad(next => next[0].categories[0].goal.href = '/api/admin'); bad(next => next[0].categories[0].goal.selfCheck = ['one']);
  bad(next => next[0].categories[0].goal.moduleId = 'invented'); bad(next => next[0].categories[0].goal.lessonId = 'invented');
  bad(next => next[0].categories[0].goal.regionalLaw = true); bad(next => delete next[2].categories.find(item => item.slug === 'jagdrecht').goal.regionalLaw);
  bad(next => next[0].categories[0].goal.relatedLessons = [{ moduleId: next[0].categories[0].goal.moduleId, lessonId: next[0].categories[0].goal.lessonId }]);
  const inherited = clone(datasets); inherited[0].categories[0].goal = Object.create(inherited[0].categories[0].goal); assert.throws(() => transfers.getExamTransferGoals(inherited));
  assert.equal(JSON.stringify(datasets), before);
});
