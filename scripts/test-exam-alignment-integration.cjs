const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { examCountries } = load('lib/exam-profile.js');
const { getExamStudyPlanData } = load('lib/exam-study-plan-server.js');
const { learningModules } = load('lib/learning-curriculum.js');
const { learningCategoryDetails } = load('lib/learning-categories.js');
const { getLearningNavigationLabel } = load('lib/learning-navigation-labels.js');
const { oralExamQuestions } = load('lib/oral-exam-trainer.js');
const { examReviewHref } = load('lib/exam-review-progress.js');
const { lessonHash, lessonIndexFromHash } = load('lib/learning-lesson-navigation.js');
const data = getExamStudyPlanData({ asOf: '2026-11-01' });
const expectedProfiles = examCountries.flatMap(country => country.regions.map(region => `${country.code}:${region.code}`));
const expectedSubjectCounts = new Map([['CH:ZH',7],['CH:BE',6],['CH:GR',5],['DE:BY',6],['DE:BB',6],['DE:HE',4]]);
const sourcePaths = ['ch', 'at', 'de'].map(country => `../data/exam-alignment/${country}-2026-11-01.json`);
let alignment;
function getAlignment() { return alignment ||= load('lib/exam-alignment-server.js').getExamAlignmentData(); }
function rawInputs() { return Object.fromEntries(sourcePaths.map(name => [name, JSON.parse(fs.readFileSync(path.resolve(root, 'lib', name), 'utf8'))])); }
function projectFixture(change) { const inputs = rawInputs(); change(inputs); return createLoader(inputs)('lib/exam-alignment-server.js').getExamAlignmentData(); }
function key(region) { return region ? `${region.country}:${region.region}` : null; }
function Link({ href, children, prefetch, ...props }) { return React.createElement('a', { href, ...props }, children); }
function escaped(value) { return renderToStaticMarkup(React.createElement('span', null, value)).replace(/^<span>|<\/span>$/g, ''); }

function setup(initial = {}, options = {}) {
  const store = { profile: null, ready: true, persistence: 'device', ...initial };
  const slots = [], cleanups = [], calls = { save: [], focus: [], close: 0 }; let cursor = 0, effects = [], changed = false, tree;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, input => { const next = typeof input === 'function' ? input(slots[i].value) : input; changed ||= !Object.is(next, slots[i].value); slots[i].value = next; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || !deps || deps.some((value, j) => !Object.is(value, slots[i].deps[j]))) { slots[i] = { deps }; effects.push(() => { cleanups[i]?.(); cleanups[i] = fn(); }); } },
  };
  const useProfile = () => ({ ...store,
    async saveProfile(profile) { calls.save.push(profile); await Promise.resolve(); if (options.failSave) return false; if (options.commit !== false) store.profile = profile; return true; },
    clearProfile() { store.profile = null; return true; },
  });
  const api = createLoader({ react: hooks, '../lib/use-exam-profile': { __esModule: true, default: useProfile },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() { calls.close++; }, openPageMenu() {} },
    '../hooks/useSelectionPageStart': { __esModule: true, default: (_, enabled) => ({ focusSelection(target) { if (enabled) calls.focus.push(target); } }) },
  });
  const Component = api('components/ExamStudyPlan.js').default;
  const Preparation = api('components/ExamRegionPreparation.js').default;
  const props = { data, examAlignment: getAlignment(), ...options.props };
  function render() { for (let pass = 0; pass < 12; pass++) { cursor = 0; changed = false; tree = Component(props); const pending = effects; effects = []; pending.forEach(fn => fn()); if (!changed) return tree; } throw new Error('Plan did not settle'); }
  render();
  return { store, calls, render, get tree() { return tree; },
    selection() { return nodes(tree, item => item.type === Preparation).map(item => item.props.region); },
    control(id) { return nodes(tree, item => item.props?.id === id)[0]; },
    change(id, value) { this.control(id).props.onChange({ target: { value } }); render(); },
    async save() { await nodes(tree, item => item.type === 'form')[0].props.onSubmit({ preventDefault() {} }); render(); },
    update(value) { Object.assign(store, value); render(); },
    dispose() { cleanups.forEach(fn => fn?.()); },
  };
}

function ssr(profile, options = {}) {
  const useProfile = () => ({ profile, ready: true, persistence: 'device', ...options.profile });
  // The real menu portals after hydration. Render its supplied children here
  // so SSR assertions also see the existing selection form, without a browser.
  const api = createLoader({ 'next/link': { __esModule: true, default: Link }, '../lib/use-exam-profile': { __esModule: true, default: useProfile },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} },
  });
  return renderToStaticMarkup(React.createElement(api('components/ExamStudyPlan.js').default, { data, examAlignment: getAlignment(), ...options.props }));
}
function preparationHtml(markup) {
  const heading = markup.indexOf('id="exam-plan-regional-exam"');
  if (heading < 0) return '';
  return markup.slice(markup.lastIndexOf('<section', heading), markup.indexOf('</section>', heading) + '</section>'.length);
}

test('The build-time adapter projects exactly all51 canonical profiles with bounded presentation fields and no fallback record', () => {
  const projected = getAlignment();
  assert.deepEqual(Object.keys(projected).sort(), ['learningCatalog', 'regions']);
  assert.deepEqual(projected.regions.map(key), expectedProfiles); assert.equal(new Set(projected.regions.map(key)).size, 51);
  const regionKeys = ['country', 'region', 'status', 'summary', 'formats', 'focus', 'moduleIds', 'limits', 'sources'].sort();
  for (const region of projected.regions) {
    assert.deepEqual(Object.keys(region).sort(), expectedSubjectCounts.has(key(region)) ? [...regionKeys,'subjectAreas'].sort() : regionKeys); assert.ok(['confirmed', 'partial', 'special'].includes(region.status));
    assert.ok(region.summary && region.limits.length && region.focus.length);
    const sources = new Map(region.sources.map(source => [source.id, source])); assert.equal(sources.size, region.sources.length);
    for (const source of region.sources) {
      assert.deepEqual(Object.keys(source).sort(), ['id', 'title', 'url', 'publisher', 'section', 'kind', 'reviewedOn'].sort());
      const url = new URL(source.url); assert.equal(url.protocol, 'https:'); assert.equal(url.username, ''); assert.equal(url.password, '');
      assert.ok(source.title && source.publisher && source.section); assert.match(source.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    }
    if (region.status !== 'confirmed') assert.deepEqual(region.formats, [], key(region));
    for (const format of region.formats) {
      assert.deepEqual(Object.keys(format).sort(), ['label', 'sourceIds']);
      const evidence = format.sourceIds.map(id => sources.get(id)); assert.ok(evidence.every(Boolean));
      assert.ok(evidence.some(source => ['norm', 'norm-copy'].includes(source.kind))); assert.ok(evidence.some(source => source.kind === 'independent-explanation'));
      assert.ok(new Set(evidence.map(source => source.publisher)).size >= 2, key(region));
    }
    for (const focus of region.focus) { assert.deepEqual(Object.keys(focus).sort(), ['detail', 'label', 'moduleIds', 'sourceIds']); assert.ok(focus.label && focus.detail); for (const id of focus.sourceIds) assert.ok(sources.has(id)); }
    if (expectedSubjectCounts.has(key(region))) {
      assert.equal(region.status,'confirmed');assert.equal(region.subjectAreas.length,expectedSubjectCounts.get(key(region)));
      assert.equal(new Set(region.subjectAreas.map(area=>area.id)).size,region.subjectAreas.length);
      for(const area of region.subjectAreas){
        assert.deepEqual(Object.keys(area).sort(),['goals','id','label','limit','sourceIds']);assert.ok(area.id&&area.label&&area.limit&&area.goals.length);
        const evidence=area.sourceIds.map(id=>sources.get(id));assert.ok(evidence.every(Boolean));
        assert.ok(evidence.some(source=>['norm','norm-copy'].includes(source.kind)));assert.ok(evidence.some(source=>source.kind==='independent-explanation'));assert.ok(new Set(evidence.map(source=>source.publisher)).size>=2);
        for(const goal of area.goals){assert.ok(goal.id&&goal.title&&goal.task&&goal.selfCheck);assert.equal(typeof goal.regionalLaw,'boolean');if(goal.regionalLaw){assert.equal(goal.href,null);assert.equal(goal.quizHref,null);}else{assert.match(goal.href,/^\/kurse\/[^#]+#lesson-/);}}
      }
    }
  }
  assert.equal(projected.regions.filter(region=>region.subjectAreas).length,6);assert.equal(projected.regions.reduce((sum,region)=>sum+(region.subjectAreas?.length||0),0),34);
  const serialized = JSON.stringify(projected);
  assert.doesNotMatch(serialized, /candidateFormats|readStatus|blocked|officialText|correctIndex|correctIds|"answers"|"questions"|"choices"|"prompt"|"model"|"transcript"|"lessons"/);
});

test('Every offered learning/quiz/review/optional oral link resolves to real shared content and the exact course quiz hash', () => {
  const projected = getAlignment(), selectedIds = new Set(projected.regions.flatMap(region => [...region.moduleIds, ...region.focus.flatMap(focus => focus.moduleIds)]));
  assert.deepEqual(Object.keys(projected.learningCatalog).sort(), [...selectedIds].sort()); let oralLinks = 0;
  for (const [id, item] of Object.entries(projected.learningCatalog)) {
    assert.deepEqual(Object.keys(item).sort(), ['id', 'title', 'href', 'quizHref', 'categorySlug', 'categoryTitle', 'oralHref', 'reviewHref'].sort());
    const course = learningModules.find(module => module.id === id); assert.ok(course, id);
    const category = learningCategoryDetails.find(category => category.title === course.category); assert.ok(category); assert.notEqual(category.slug, 'jagdrecht');
    assert.equal(item.id, id); assert.equal(item.title, getLearningNavigationLabel(course)); assert.equal(item.categorySlug, category.slug); assert.equal(item.categoryTitle, category.title);
    const href = new URL(item.href, 'https://jagdlatein.test'); assert.equal(href.pathname, `/kurse/${id}`); assert.equal(href.hash, lessonHash(course.lessons[0].id)); assert.equal(lessonIndexFromHash(course.lessons, href.hash), 0);
    if(id==='wissen-waffensicherheit') {
      assert.equal(item.quizHref,null);
      assert.ok(course.questions.some(question=>question.countries.length!==3 || [...question.countries].sort().join(',')!=='AT,CH,DE' || question.topic==='Recht'));
    } else {
      assert.ok(course.questions.every(question=>[...question.countries].sort().join(',')==='AT,CH,DE' && question.topic!=='Recht'),id);
      assert.equal(item.quizHref, `/kurse/${id}#wissenscheck`);
    }
    assert.equal(item.reviewHref, examReviewHref('gemischt', category.slug));
    const matchingOral = oralExamQuestions.find(question => question.course === course.id && question.categorySlug === category.slug);
    assert.equal(item.oralHref, matchingOral ? `/lernen/pruefungsgespraech?kategorie=${category.slug}&eintrag=${encodeURIComponent(matchingOral.id)}` : null, id);
    if (item.oralHref) {
      oralLinks++;
      const href = new URL(item.oralHref, 'https://jagdlatein.test'); assert.equal(href.pathname, '/lernen/pruefungsgespraech');
      assert.deepEqual([...href.searchParams.keys()], ['kategorie', 'eintrag']);
      const question = oralExamQuestions.find(question => question.id === href.searchParams.get('eintrag'));
      assert.ok(question); assert.equal(question.course, course.id); assert.equal(question.categorySlug, category.slug); assert.notEqual(question.categorySlug, 'jagdrecht');
    }
  }
  assert.deepEqual(Object.values(projected.learningCatalog).filter(item=>item.quizHref===null).map(item=>item.id),['wissen-waffensicherheit']);
  assert.ok(oralLinks > 0, 'existing exact course-bound oral questions must produce positive Erklären links');
  assert.ok(oralLinks < Object.keys(projected.learningCatalog).length, 'a shared category must not invent a course-bound oral question');
  for (const region of projected.regions) for (const id of [...region.moduleIds, ...region.focus.flatMap(focus => focus.moduleIds)]) assert.ok(learningModules.find(module => module.id === id).countries.includes(region.country));
  assert.match(fs.readFileSync(path.join(root, 'components/LearningCourse.js'), 'utf8'), /id="wissenscheck"/);
});

test('Erklären never substitutes a question from the same category when the exact course binding is absent or mismatched', () => {
  const catalog = getAlignment().learningCatalog;
  assert.ok(catalog['wissen-gams-steinbock']); assert.equal(catalog['wissen-gams-steinbock'].oralHref, null);
  assert.ok(oralExamQuestions.some(question => question.categorySlug === catalog['wissen-gams-steinbock'].categorySlug), 'the category has other questions, so this catches category-only fallback');
  assert.equal(catalog['wissen-rehwild-jahreslauf'].oralHref, '/lernen/pruefungsgespraech?kategorie=wildkunde&eintrag=kitzfund');
  const withoutRoe = oralExamQuestions.filter(question => question.course !== 'wissen-rehwild-jahreslauf');
  assert.ok(withoutRoe.some(question => question.categorySlug === 'wildkunde'));
  const removed = createLoader({ './oral-exam-trainer': { oralExamQuestions: withoutRoe } })('lib/exam-alignment-server.js').getExamAlignmentData();
  assert.equal(removed.learningCatalog['wissen-rehwild-jahreslauf'].oralHref, null);
  const wrongCategory = oralExamQuestions.map(question => question.course === 'wissen-rehwild-jahreslauf' ? { ...question, categorySlug: 'hundewesen' } : question);
  const mismatched = createLoader({ './oral-exam-trainer': { oralExamQuestions: wrongCategory } })('lib/exam-alignment-server.js').getExamAlignmentData();
  assert.equal(mismatched.learningCatalog['wissen-rehwild-jahreslauf'].oralHref, null);
  assert.equal(mismatched.learningCatalog['wissen-kugelfang'].oralHref, catalog['wissen-kugelfang'].oralHref);
});

test('The adapter copies only intentional metadata and rejects missing/duplicate profiles, unbacked formats and invalid learning targets', () => {
  const inputs = rawInputs(), before = JSON.stringify(inputs), modulesBefore = JSON.stringify(learningModules);
  const own = createLoader(inputs)('lib/exam-alignment-server.js').getExamAlignmentData();
  assert.deepEqual(own, getAlignment()); assert.equal(JSON.stringify(inputs), before); assert.equal(JSON.stringify(learningModules), modulesBefore);
  const extraFields = projectFixture(data => { const region = data[sourcePaths[0]].regions[0]; region.candidateFormats = [{ label: 'Do not project' }]; region.questions = [{ answer: 'private answer' }]; region.sources[0].transcript = 'Do not project full source text'; });
  assert.doesNotMatch(JSON.stringify(extraFields), /Do not project|private answer|candidateFormats|questions|transcript/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions.pop()), /Prüfungsregionen/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions[0].region = 'UNKNOWN'), /Prüfungsregionen/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions.push(data[sourcePaths[0]].regions[0])), /Prüfungsregionen/);
  assert.throws(() => projectFixture(data => { const region = data[sourcePaths[0]].regions.find(region => region.formats.length); region.status = 'partial'; }), /Prüfungsform/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions[0].moduleIds.push('missing-course')), /Lernstart/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions[0].moduleIds.push('wissen-jagdrecht-ch')), /regionaler Rechtsstart/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions[0].focus[0].sourceIds.push('missing-source')), /Quellenzuordnung/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions[0].sources[0].kind = 'blocked'), /Quellennachweis/);
  assert.throws(() => projectFixture(data => data[sourcePaths[0]].regions[0].sources[0].url = 'http://example.invalid/norm'), /Quellennachweis/);
  assert.throws(() => projectFixture(data => { const region = data[sourcePaths[0]].regions.find(region => region.formats.length); region.sources.forEach(source => { source.publisher = 'Dieselbe Institution'; }); }), /Doppelbeleg/);
  assert.throws(() => projectFixture(data => { const region=data[sourcePaths[2]].regions.find(region=>region.subjectAreas?.length);region.subjectAreas[0].sourceIds=region.subjectAreas[0].sourceIds.filter(id=>region.sources.find(source=>source.id===id).kind==='norm'); }), /Fachbezug/);
  assert.throws(() => projectFixture(data => { const region=data[sourcePaths[2]].regions.find(region=>region.subjectAreas?.length);region.subjectAreas[1].id=region.subjectAreas[0].id; }), /doppelter Fachbezug/);
  assert.throws(() => projectFixture(data => { const region=data[sourcePaths[2]].regions.find(region=>region.subjectAreas?.length);region.subjectAreas[0].goals[0].lessonId='missing-lesson'; }), /Lektionsbezug/);
  assert.throws(() => projectFixture(data => { const area=data[sourcePaths[2]].regions.find(region=>region.subjectAreas?.length).subjectAreas[0];const partial=data[sourcePaths[2]].regions.find(region=>region.status==='partial');partial.subjectAreas=[{...area,sourceIds:[]}]; }), /Fachbezug/);
});

test('A draft and an accepted-but-uncommitted save preserve the confirmed regional row until the actual profile changes', async () => {
  const h = setup({ profile: { country: 'AT', region: 'NOE' } }, { commit: false });
  try {
    assert.deepEqual(h.selection().map(key), ['AT:NOE']);
    h.change('exam-plan-country', 'DE'); h.change('exam-plan-region', 'BY');
    assert.deepEqual(h.selection().map(key), ['AT:NOE']); assert.equal(h.calls.save.length, 0);
    await h.save(); assert.deepEqual(h.calls.save, [{ country: 'DE', region: 'BY' }]);
    assert.deepEqual(h.selection().map(key), ['AT:NOE']); assert.equal(h.calls.focus.length, 0);
    h.update({ profile: { country: 'DE', region: 'BY' } });
    assert.deepEqual(h.selection().map(key), ['DE:BY']); assert.equal(h.calls.focus.length, 1);
  } finally { h.dispose(); }
});

test('Failed saves and external committed profile updates keep the regional preparation tied to the real profile, never to a dirty draft', async () => {
  const h = setup({ profile: { country: 'CH', region: 'ZH' } }, { failSave: true });
  try {
    h.change('exam-plan-country', 'AT'); h.change('exam-plan-region', 'NOE'); await h.save();
    assert.deepEqual(h.selection().map(key), ['CH:ZH']); assert.match(text(h.tree), /konnte nicht übernommen/); assert.equal(h.calls.focus.length, 0);
    h.update({ profile: { country: 'DE', region: 'BY' } });
    assert.deepEqual(h.selection().map(key), ['DE:BY']); assert.equal(h.control('exam-plan-country').props.value, 'AT'); assert.equal(h.control('exam-plan-region').props.value, 'NOE');
  } finally { h.dispose(); }
});

test('Unready, absent, malformed or unavailable profiles produce no regional fallback; legacy data props remain usable', () => {
  for (const initial of [{ profile: null }, { profile: { country: 'AT', region: 'NOE' }, ready: false }, { profile: { country: 'AT', region: 'ZZ' } }, { profile: { country: 'DE', region: ['BY'] } }]) {
    const h = setup(initial); try { assert.deepEqual(h.selection(), []); } finally { h.dispose(); }
  }
  const missing = setup({ profile: { country: 'AT', region: 'NOE' } }, { props: { examAlignment: { ...getAlignment(), regions: getAlignment().regions.filter(region => key(region) !== 'AT:NOE') } } });
  try { assert.deepEqual(missing.selection(), []); } finally { missing.dispose(); }
  const legacy = ssr({ country: 'AT', region: 'NOE' }, { props: { examAlignment: undefined } });
  assert.doesNotMatch(legacy, /exam-plan-regional-exam|exam-plan-framework-sources/); assert.match(legacy, /Regionales Recht|Dein Lernweg|exam-plan-sources/);
});

test('Actual SSR for every selected profile renders only its preparation and keeps all source material closed at the very end', () => {
  const projected = getAlignment();
  for (const region of projected.regions) {
    const markup = ssr({ country: region.country, region: region.region }), preparation = preparationHtml(markup);
    assert.ok(preparation, key(region)); assert.equal((markup.match(/id="exam-plan-regional-exam"/g) || []).length, 1);
    assert.ok(preparation.includes(escaped(region.summary)), key(region));
    for (const limit of region.limits) assert.ok(preparation.includes(escaped(limit)), `${key(region)}: ${limit}`);
    if (region.status === 'partial') assert.match(preparation, /Prüfungsrahmen noch im Abgleich/);
    if (region.status === 'special') assert.match(preparation, /Besonderer Prüfungsrahmen/);
    if (region.status === 'confirmed') for (const format of region.formats) assert.ok(preparation.includes(escaped(format.label)));
    assert.doesNotMatch(preparation, /https:\/\/|Originalquellen|Abschnittsabgleich|<details/);
    const sourceStart = markup.indexOf('id="exam-plan-sources"'); assert.ok(sourceStart > markup.indexOf('Praxis und örtliche Vorgaben'));
    const opening = markup.slice(markup.lastIndexOf('<details', sourceStart), markup.indexOf('>', sourceStart) + 1); assert.doesNotMatch(opening, /\sopen(?:\s|=|>)/);
    for (const source of region.sources) { assert.ok(markup.indexOf(escaped(source.title), sourceStart) > sourceStart); assert.ok(markup.indexOf(escaped(source.url), sourceStart) > sourceStart); }
    const uniqueForeign = projected.regions.find(other => key(other) !== key(region) && other.summary !== region.summary && !region.summary.includes(other.summary));
    if (uniqueForeign) assert.ok(!preparation.includes(escaped(uniqueForeign.summary)), key(region));
    assert.equal((markup.match(/<form\b/g) || []).length, 1); assert.doesNotMatch(preparation, /<form|<select|<input|<button|target="_blank"/);
  }
});

test('SSG passes the compact projection, keeps existing data compatible and erases all build-only banks from its client transform', () => {
  const props = load('pages/lernen/pruefungsplan.js').getStaticProps().props;
  assert.deepEqual(props.examAlignment, getAlignment()); assert.deepEqual(props.data, getExamStudyPlanData());
  const filename = path.join(root, 'pages/lernen/pruefungsplan.js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /exam-alignment-server|exam-study-plan-server|regional-law-data|learning-curriculum|oral-exam-trainer|data\/exam-alignment/);
});
