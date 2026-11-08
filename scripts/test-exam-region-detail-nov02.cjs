const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { stripLenticelDataset } = require('./helpers/lenticel-addition-nov08.cjs');

const BASELINE = '8b12ce6253ce9bc090aad2c47bd660e5b2280002';
const countries = ['ch', 'at', 'de'];
const filenames = countries.map(country => `data/exam-alignment/${country}-2026-11-01.json`);
const sourcePaths = filenames.map(filename => `../${filename}`);
const selected = new Map([['CH:AR', 9], ['AT:NOE', 4], ['AT:ST', 7]]);
const previousDetailed = ['CH:ZH', 'CH:BE', 'CH:GR', 'DE:BY', 'DE:BB', 'DE:HE'];
const key = region => `${region.country}:${region.region}`;
const currentJson = filename => JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8').replace(/^\uFEFF/, ''));
const baselineCache = new Map();
function baselineText(filename) {
  if (!baselineCache.has(filename)) baselineCache.set(filename, execFileSync('git', ['show', `${BASELINE}:${filename}`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  return baselineCache.get(filename);
}
const baselineJson = filename => JSON.parse(baselineText(filename));
const rows = () => filenames.flatMap(filename => currentJson(filename).regions);
const beforeRows = () => filenames.flatMap(filename => baselineJson(filename).regions);
const createLoader = (overrides = {}) => createProjectLoader({
  'next/router': { useRouter: () => ({ isReady: true, query: {}, asPath: '/lernen/pruefungsplan' }) },
  ...overrides,
});
const load = createLoader();
const { getLearningModule } = load('lib/learning-curriculum.js');
const { lessonHash, lessonIndexFromHash } = load('lib/learning-lesson-navigation.js');
const { examProfileLawHref } = load('lib/exam-profile.js');
const projected = () => createLoader()('lib/exam-alignment-server.js').getExamAlignmentData();
const selectedRows = () => rows().filter(region => selected.has(key(region)));
function projectFixture(change) {
  const values = Object.fromEntries(sourcePaths.map((name, index) => [name, currentJson(filenames[index])]));
  change(values);
  return createLoader(values)('lib/exam-alignment-server.js').getExamAlignmentData();
}
function targetRow(values, country, region) {
  return values[sourcePaths[countries.indexOf(country.toLowerCase())]].regions.find(item => item.region === region);
}
const commonQuestion = question => [...question.countries].sort().join(',') === 'AT,CH,DE' && question.topic !== 'Recht';
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
function Link({ href, prefetch, children, ...props }) { return React.createElement('a', { href, ...props }, children); }
const escaped = text => renderToStaticMarkup(React.createElement('span', null, text)).replace(/^<span>|<\/span>$/g, '');
const hrefs = markup => [...markup.matchAll(/href="([^"]*)"/g)].map(match => match[1].replace(/&amp;/g, '&'));
function planHtml(profile) {
  const api = createLoader({
    'next/link': { __esModule: true, default: Link },
    '../lib/use-exam-profile': { __esModule: true, default: () => ({ profile, ready: true, persistence: 'device' }) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} },
  });
  return renderToStaticMarkup(React.createElement(api('components/ExamStudyPlan.js').default, {
    data: load('lib/exam-study-plan-server.js').getExamStudyPlanData(),
    examAlignment: projected(),
    examBlueprint: load('lib/exam-blueprint-server.js').getExamBlueprintData(),
  }));
}

test('Exactly three regional rows gain twenty bounded subject goals; all other forty-eight rows equal the published baseline', () => {
  const before = beforeRows(), after = rows();
  assert.equal(before.length, 51); assert.equal(after.length, 51);
  assert.deepEqual(after.map(key), before.map(key));
  const changed = after.filter(region => JSON.stringify(region) !== JSON.stringify(before.find(item => key(item) === key(region))));
  assert.deepEqual(changed.map(key).sort(), [...selected.keys()].sort());
  assert.equal(after.filter(region => !selected.has(key(region))).length, 48);
  for (const region of after.filter(region => !selected.has(key(region)))) assert.deepEqual(region, before.find(item => key(item) === key(region)), key(region));
  assert.equal(changed.flatMap(region => region.subjectAreas).reduce((sum, area) => sum + area.goals.length, 0), 20);
  for (const region of changed) {
    assert.equal(region.status, 'confirmed');
    assert.equal(region.subjectAreas.length, selected.get(key(region)));
    assert.ok(region.subjectAreas.every(area => area.goals.length === 1));
  }
});

test('All previous fifty-one regional statements and the six existing detailed subject objects remain exact', () => {
  const before = beforeRows(), after = rows();
  const statement = region => Object.fromEntries(Object.entries(region).filter(([name]) => !['sources', 'subjectAreas'].includes(name)));
  for (const region of after) assert.deepEqual(statement(region), statement(before.find(item => key(item) === key(region))), key(region));
  for (const profile of previousDetailed) assert.deepEqual(after.find(region => key(region) === profile).subjectAreas, before.find(region => key(region) === profile).subjectAreas, profile);
  for (const filename of filenames) {
    const prior = baselineJson(filename), current = currentJson(filename);
    assert.deepEqual(Object.fromEntries(Object.entries(current).filter(([name]) => name !== 'regions')), Object.fromEntries(Object.entries(prior).filter(([name]) => name !== 'regions')));
  }
});

test('Austrian sources only append four precise new evidence records; only the two actually reread AR source records change', () => {
  const before = beforeRows();
  const expectedNew = new Map([
    ['AT:NOE', ['noe-ris-subjects-20261102', 'noe-jagdverband-subjects-20261102']],
    ['AT:ST', ['st-ris-subjects-20261102', 'st-jaegerschaft-subjects-20261102']],
  ]);
  for (const region of rows()) {
    const previous = before.find(item => key(item) === key(region));
    if (expectedNew.has(key(region))) {
      assert.deepEqual(region.sources.slice(0, previous.sources.length), previous.sources, key(region));
      const added = region.sources.slice(previous.sources.length);
      assert.deepEqual(added.map(source => source.id), expectedNew.get(key(region)));
      assert.deepEqual(added.map(source => source.kind), ['norm', 'independent-explanation']);
      assert.ok(added.every(source => source.reviewedOn === '2026-11-02'));
    } else if (key(region) === 'CH:AR') {
      assert.deepEqual(region.sources.map(source => source.id), ['ch-ar-norm', 'ch-ar-pjv']);
      assert.equal(previous.sources.length, 2); assert.equal(region.sources.length, 2);
      for (const source of region.sources) {
        const old = previous.sources.find(item => item.id === source.id);
        assert.deepEqual(Object.fromEntries(Object.entries(source).filter(([name]) => !['section', 'reviewedOn'].includes(name))), Object.fromEntries(Object.entries(old).filter(([name]) => !['section', 'reviewedOn'].includes(name))));
        assert.equal(source.reviewedOn, '2026-11-02');
        assert.notEqual(source.section, old.section);
      }
    } else assert.deepEqual(region.sources, previous.sources, key(region));
  }
});

test('Every new regional subject retains its exact norm-and-independent-source pair and a visible own-learning boundary', () => {
  const pairs = new Map([
    ['CH:AR', ['ch-ar-norm', 'ch-ar-pjv']],
    ['AT:NOE', ['noe-ris-subjects-20261102', 'noe-jagdverband-subjects-20261102']],
    ['AT:ST', ['st-ris-subjects-20261102', 'st-jaegerschaft-subjects-20261102']],
  ]);
  const goalIds = [];
  for (const region of selectedRows()) {
    const sources = new Map(region.sources.map(source => [source.id, source]));
    assert.equal(sources.size, region.sources.length);
    for (const area of region.subjectAreas) {
      assert.deepEqual(area.sourceIds, pairs.get(key(region)));
      assert.ok(typeof area.limit === 'string' && area.limit.trim());
      assert.match(area.limit, /keine|kein|weder|qualifizierter Ausbildung/i);
      const evidence = area.sourceIds.map(id => sources.get(id));
      assert.deepEqual(evidence.map(source => source.kind), ['norm', 'independent-explanation']);
      assert.equal(new Set(evidence.map(source => source.publisher)).size, 2);
      for (const source of evidence) { const url = new URL(source.url); assert.equal(url.protocol, 'https:'); assert.equal(url.username, ''); assert.equal(url.password, ''); assert.ok(source.section); }
      for (const goal of area.goals) { assert.ok(goal.caseText && goal.followUp); assert.equal(goal.selfCheck.length, 3); goalIds.push(goal.id); }
    }
  }
  assert.equal(goalIds.length, 20); assert.equal(new Set(goalIds).size, 20);
});

test('All twenty projected goals and their related starts resolve to the exact existing lesson object and never a first-lesson fallback', () => {
  const actual = projected();
  for (const region of selectedRows()) {
    const target = actual.regions.find(item => key(item) === key(region));
    for (const area of region.subjectAreas) for (const authored of area.goals) {
      const goal = target.subjectAreas.find(item => item.id === area.id).goals.find(item => item.id === authored.id);
      const course = getLearningModule(authored.moduleId), lesson = course.lessons.find(item => item.id === authored.lessonId);
      assert.ok(course.countries.includes(region.country)); assert.ok(lesson.paragraphs.length);
      assert.equal(goal.lessonTitle, lesson.title); assert.equal(goal.task, authored.task); assert.deepEqual(goal.selfCheck, authored.selfCheck);
      assert.equal(goal.caseText, authored.caseText); assert.equal(goal.followUp, authored.followUp);
      assert.equal(goal.regionalLaw, authored.regionalLaw);
      if (authored.regionalLaw) { assert.equal(goal.href, null); assert.equal(goal.quizHref, null); }
      else {
        const url = new URL(goal.href, 'https://jagdlatein.test');
        assert.equal(url.pathname, `/kurse/${course.id}`); assert.equal(url.hash, lessonHash(lesson.id));
        assert.equal(lessonIndexFromHash(course.lessons, url.hash), course.lessons.indexOf(lesson));
      }
      const related = authored.relatedLessons || [];
      assert.equal((goal.relatedLessons || []).length, related.length);
      for (const [index, target] of related.entries()) {
        const relatedCourse = getLearningModule(target.moduleId), relatedLesson = relatedCourse.lessons.find(item => item.id === target.lessonId);
        assert.ok(relatedLesson && relatedCourse.countries.includes(region.country));
        assert.equal(goal.relatedLessons[index].href, `/kurse/${relatedCourse.id}${lessonHash(relatedLesson.id)}`);
        assert.equal(goal.relatedLessons[index].lessonTitle, relatedLesson.title);
      }
    }
  }
});

test('New lesson practice and whole-course checks obey the actual DACH question scope, including all three mixed-course weapons goals', () => {
  const actual = projected(); let legal = 0, practice = 0, whole = 0, weapons = 0;
  for (const region of selectedRows()) {
    const target = actual.regions.find(item => key(item) === key(region));
    for (const area of region.subjectAreas) for (const authored of area.goals) {
      const goal = target.subjectAreas.find(item => item.id === area.id).goals.find(item => item.id === authored.id);
      const course = getLearningModule(authored.moduleId), questions = course.questions.filter(question => question.lessonId === authored.lessonId);
      const expectedPractice = !goal.regionalLaw && questions.length > 0 && questions.every(commonQuestion);
      assert.equal(goal.lessonPractice, expectedPractice);
      assert.equal(goal.quizHref, !goal.regionalLaw && course.questions.every(commonQuestion) ? `/kurse/${course.id}#wissenscheck` : null);
      legal += Number(goal.regionalLaw); practice += Number(goal.lessonPractice); whole += Number(Boolean(goal.quizHref));
      if (authored.moduleId === 'wissen-waffensicherheit') { weapons++; assert.equal(goal.lessonPractice, true); assert.equal(goal.quizHref, null); }
    }
  }
  assert.equal(legal, 3); assert.equal(practice, 17); assert.equal(whole, 14); assert.equal(weapons, 3);
});

test('The real regional projector rejects missing independent evidence, shared publishers and partial status for each of the new profiles', () => {
  for (const profile of selected.keys()) {
    const [country, region] = profile.split(':');
    assert.throws(() => projectFixture(values => { const row = targetRow(values, country, region); row.subjectAreas[0].sourceIds = row.subjectAreas[0].sourceIds.filter(id => row.sources.find(source => source.id === id).kind === 'norm'); }), /Fachbezug/);
    assert.throws(() => projectFixture(values => { const row = targetRow(values, country, region); const ids = row.subjectAreas[0].sourceIds; for (const source of row.sources.filter(source => ids.includes(source.id))) source.publisher = 'One publisher'; }), /Doppelbeleg/);
    assert.throws(() => projectFixture(values => { targetRow(values, country, region).status = 'partial'; }), /Prüfungsform|Fachbezug/);
    assert.throws(() => projectFixture(values => { targetRow(values, country, region).subjectAreas[0].sourceIds.push('unread-source'); }), /Quellenzuordnung/);
  }
});

test('Unknown lesson targets, malformed own cases and duplicated new goal or subject IDs cannot become publishable detail rows', () => {
  for (const profile of selected.keys()) {
    const [country, region] = profile.split(':');
    assert.throws(() => projectFixture(values => { targetRow(values, country, region).subjectAreas[0].goals[0].lessonId = 'missing-lesson'; }), /Lektionsbezug/);
    assert.throws(() => projectFixture(values => { targetRow(values, country, region).subjectAreas[0].goals[0].caseText = {}; }), /Lernfall/);
    assert.throws(() => projectFixture(values => { targetRow(values, country, region).subjectAreas[0].goals[0].selfCheck = ['Valid', null]; }), /Prüfungslernziel/);
    assert.throws(() => projectFixture(values => { const areas = targetRow(values, country, region).subjectAreas; areas[1].id = areas[0].id; }), /doppelter Fachbezug/);
    assert.throws(() => projectFixture(values => { const areas = targetRow(values, country, region).subjectAreas; areas[1].goals[0].id = areas[0].goals[0].id; }), /doppeltes regionales Lernziel/);
  }
});

test('New legal-method goals render only the exact confirmed canton or state reader and exercise; shared biology stays shared', () => {
  const actual = projected();
  const api = createLoader({ 'next/link': { __esModule: true, default: Link } });
  const Component = api('components/ExamLearningGoals.js').ExamLearningGoal;
  for (const region of actual.regions.filter(item => selected.has(key(item)))) {
    const legal = region.subjectAreas.flatMap(area => area.goals).filter(goal => goal.regionalLaw);
    assert.equal(legal.length, 1);
    const markup = renderToStaticMarkup(React.createElement(Component, { goal: legal[0], profile: region }));
    assert.deepEqual(hrefs(markup), [examProfileLawHref(region), examProfileLawHref(region, 'uebung')]);
    assert.doesNotMatch(markup, /\/kurse\/wissen-jagdrecht|region=BUND|\?land=/);
    for (const invalid of [null, { country: region.country, region: 'UNKNOWN' }, { country: ['CH'], region: 'AR' }]) {
      const fallback = renderToStaticMarkup(React.createElement(Component, { goal: legal[0], profile: invalid }));
      assert.deepEqual(hrefs(fallback), []); assert.match(fallback, /Prüfungsziel im unteren Menü/);
    }
    for (const goal of region.subjectAreas.flatMap(area => area.goals).filter(goal => !goal.regionalLaw)) assert.ok(goal.href.startsWith('/kurse/'));
  }
});

test('Actual complete-plan SSR shows all new own cases, follow-up questions and boundaries before one closed final source section', () => {
  const alignment = projected();
  for (const region of alignment.regions.filter(item => selected.has(key(item)))) {
    const markup = planHtml({ country: region.country, region: region.region });
    const sourceStart = markup.indexOf('id="exam-plan-sources"');
    assert.ok(sourceStart > markup.indexOf('id="exam-plan-field"'));
    assert.equal((markup.match(/id="exam-plan-sources"/g) || []).length, 1);
    const opening = markup.slice(markup.lastIndexOf('<details', sourceStart), markup.indexOf('>', sourceStart) + 1);
    assert.doesNotMatch(opening, /\sopen(?:\s|=|>)/);
    assert.match(markup.slice(markup.lastIndexOf('</details>') + '</details>'.length), /^(?:<\/[a-z][a-z0-9]*>)*$/);
    const learning = markup.slice(0, sourceStart), sources = markup.slice(sourceStart);
    assert.match(learning, /keine Zählung amtlicher Hauptfächer/);
    for (const area of region.subjectAreas) {
      assert.ok(learning.includes(escaped(area.label))); assert.ok(learning.includes(escaped(area.limit)));
      for (const goal of area.goals) {
        for (const value of [goal.title, goal.task, goal.caseText, goal.followUp, ...goal.selfCheck]) assert.ok(learning.includes(escaped(value)), `${key(region)}: ${value}`);
      }
      for (const id of area.sourceIds) { const source = region.sources.find(item => item.id === id); assert.ok(sources.includes(escaped(source.url))); assert.ok(sources.includes(escaped(source.section))); }
    }
    assert.match(learning, /Eigener Übungsfall:/); assert.match(learning, /Nachfrage:/); assert.match(sources, /konkreten Lernziele sind eigene didaktische Vorschläge/);
    for (const other of alignment.regions.filter(item => selected.has(key(item)) && key(item) !== key(region))) for (const area of other.subjectAreas) assert.ok(!learning.includes(`id="exam-subject-${area.id}"`));
  }
});

test('Regional-law datasets and their release gates remain exact; preparation assignments approve no new question', () => {
  for (const filename of ['data/jagdrecht-regional/ch.json', 'data/jagdrecht-regional/at.json', 'data/jagdrecht-regional/de.json']) assert.deepEqual(currentJson(filename), baselineJson(filename), filename);
  for (const filename of ['lib/regional-law-data.js', 'lib/regional-law-core.js', 'lib/jagdrecht-reader.js']) assert.equal(fs.readFileSync(path.join(root, filename), 'utf8').replace(/\r\n/g, '\n'), baselineText(filename).replace(/\r\n/g, '\n'), filename);
});

test('Every tracked course source, shared goal bank and oral case bank stays exact apart from the separately tested Nov 8 appendices; the foreign afternoon file is excluded', () => {
  const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', BASELINE, '--', 'lib', 'data'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
  // The search ranking utility has a separate index-fidelity regression; it is
  // not an authored course bank. Keep all course data and oral questions here.
  const curriculumFiles = tracked.filter(filename => /^(?:lib\/learning[^/]*\.js|data\/learning[^/]*\.json|lib\/oral-exam-trainer\.js|data\/exam-alignment\/learning-goals-2026-11-01\.json)$/.test(filename) && !['data/learning-expansion-afternoon-2026-10-16.json', 'lib/learning-search.js'].includes(filename));
  assert.ok(curriculumFiles.length > 60);
  for (const filename of curriculumFiles) {
    const current = fs.readFileSync(path.join(root, filename), 'utf8').replace(/\r\n/g, '\n');
    if (filename === 'data/exam-alignment/learning-goals-2026-11-01.json') {
      const actual = JSON.parse(current), baseline = JSON.parse(baselineText(filename));
      const goals = actual.categories.flatMap(category => category.goals);
      const matches = goals.filter(goal => goal.id === 'natur-biotopnetz');
      assert.equal(matches.length, 1);
      const goal = matches[0];
      assert.deepEqual(goal.relatedLessons, [
        { moduleId: 'wissen-lebensraeume-biotopverbund', lessonId: 'biotop-biozoenose' },
        { moduleId: 'wissen-lebensraeume-biotopverbund', lessonId: 'habitat-nische' },
      ]);
      const baselineGoal = baseline.categories.flatMap(category => category.goals).find(item => item.id === goal.id);
      // First preserve all existing goal text, primary selection and criteria;
      // only the two exact independently tested supplemental links are new.
      for (const key of ['id', 'title', 'task', 'selfCheck', 'moduleId', 'lessonId']) assert.deepEqual(goal[key], baselineGoal[key]);
      delete goal.relatedLessons;
      const mowing = goals.filter(item => item.id === 'feld-mahdabstimmung');
      assert.equal(mowing.length, 1);
      assert.deepEqual(mowing[0].relatedLessons, [{ moduleId: 'wissen-ausbau-mahd-wildtierrettung', lessonId: 'aenderung' }]);
      const baselineMowing = baseline.categories.flatMap(category => category.goals).find(item => item.id === mowing[0].id);
      for (const key of ['id', 'title', 'task', 'selfCheck', 'moduleId', 'lessonId']) assert.deepEqual(mowing[0][key], baselineMowing[key]);
      delete mowing[0].relatedLessons;
      assert.deepEqual(actual, baseline, filename);
      continue;
    }
    if (filename === 'lib/learning-wildlife.js') {
      const { stripEcologyConceptAddition } = require('./helpers/ecology-concepts-addition-nov08.cjs');
      const exported = source => {
        const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
        const module = { exports: {} }; new Function('module', 'exports', code)(module, module.exports); return module.exports;
      };
      const actual = exported(current);
      assert.deepEqual({ ...actual, wildlifeModules: actual.wildlifeModules.map(stripEcologyConceptAddition) }, { ...exported(baselineText(filename)) }, filename);
      continue;
    }
    if (filename === 'data/learning-expansion-ecology-2026-10-16.json') {
      // Keep every old object exact; only the separately tested Nov 8 appendix is projected.
      assert.deepEqual(stripLenticelDataset(JSON.parse(current)), JSON.parse(baselineText(filename)), filename);
      continue;
    }
    if (filename === 'data/learning-expansion-biology-2026-10-16.json') {
      const { stripBroodPatchDataset } = require('./helpers/brood-patch-addition-nov08.cjs');
      const { stripDigestionAbsorptionDataset } = require('./helpers/digestion-absorption-addition-nov08.cjs');
      assert.deepEqual(stripBroodPatchDataset(stripDigestionAbsorptionDataset(JSON.parse(current))), JSON.parse(baselineText(filename)), filename);
      continue;
    }
    if (filename === 'data/learning-exam-habitat-2026-10-18.json') {
      const { stripRootAbsorptionDataset } = require('./helpers/root-absorption-additions-nov08.cjs');
      assert.deepEqual(stripRootAbsorptionDataset(JSON.parse(current)), JSON.parse(baselineText(filename)), filename);
      continue;
    }
    if (filename === 'data/learning-expansion-wildlife-dogs-2026-10-16.json') {
      const { stripFeatherFieldsDataset } = require('./helpers/feather-fields-additions-nov08.cjs');
      assert.deepEqual(stripFeatherFieldsDataset(JSON.parse(current)), JSON.parse(baselineText(filename)), filename);
      continue;
    }
    if (filename === 'data/learning-expansion-field-science-2026-10-17.json') {
      const { stripFoodSporesToxinsDataset } = require('./helpers/food-spores-toxins-additions-nov08.cjs');
      assert.deepEqual(stripFoodSporesToxinsDataset(JSON.parse(current)), JSON.parse(baselineText(filename)), filename);
      continue;
    }
    if (filename === 'lib/learning-wildlife-depth.js' || filename === 'lib/learning-expansion-nature.js') {
      const exported = source => {
        const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
        const module = { exports: {} };
        new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.resolve(path.dirname(path.join(root, filename)), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
        return module.exports;
      };
      const actual = exported(current), prior = exported(baselineText(filename));
      if (filename === 'lib/learning-wildlife-depth.js') {
        const { stripMarmotHibernationAddition } = require('./helpers/marmot-hibernation-addition-nov08.cjs');
        assert.deepEqual({ ...actual, wildlifeDepthModules: actual.wildlifeDepthModules.map(stripMarmotHibernationAddition) }, { ...prior }, filename);
      } else {
        const { stripForestRegenerationAddition } = require('./helpers/forest-regeneration-additions-nov08.cjs');
        assert.deepEqual({ ...actual, natureExpansionModules: actual.natureExpansionModules.map(stripForestRegenerationAddition) }, { ...prior }, filename);
      }
      continue;
    }
    assert.equal(current, baselineText(filename).replace(/\r\n/g, '\n'), filename);
  }
});
