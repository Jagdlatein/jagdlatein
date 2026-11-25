const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'), load = createLoader();
const { projectExamStudyPlanPageProps: project } = load('lib/exam-study-plan-page-props.js');
const raw = {
  data: load('lib/exam-study-plan-server.js').getExamStudyPlanData(),
  reviewCatalog: load('lib/daily-review-pool.js').getPackedDailyReviewCatalog(),
  examAlignment: load('lib/exam-alignment-server.js').getExamAlignmentData(),
  examBlueprint: load('lib/exam-blueprint-server.js').getExamBlueprintData(),
};
const projected = project(raw), summaryKeys = ['articleCount', 'reviewedArticleCount', 'questionCount', 'lawTitle', 'officialUrl'];
const without = (value, omitted) => Object.fromEntries(Object.entries(value).filter(([key]) => !omitted.includes(key)));
function freezeDeep(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freezeDeep); Object.freeze(value); } return value; }
const bytes = value => Buffer.byteLength(JSON.stringify(value));
const wrap = value => ({ __esModule: true, default: value });

test('Only known unused summary fields and inactive starts are omitted; all original arrays, goal/source contexts and dates stay exact', () => {
  const before = JSON.stringify(raw); freezeDeep(raw); const value = project(raw);
  assert.equal(JSON.stringify(raw), before);
  assert.deepEqual(Object.keys(value), Object.keys(raw)); assert.equal(value.reviewCatalog, raw.reviewCatalog); assert.equal(value.examBlueprint, raw.examBlueprint);
  assert.equal(value.data.categories, raw.data.categories); assert.equal(value.examAlignment.learningCatalog, raw.examAlignment.learningCatalog);
  assert.equal(value.data.countries.length, 3); assert.equal(value.examAlignment.regions.length, 51);
  let regionSummaries = 0, detailed = 0, ordinary = 0;
  for (let countryIndex = 0; countryIndex < raw.data.countries.length; countryIndex++) {
    const oldCountry = raw.data.countries[countryIndex], country = value.data.countries[countryIndex];
    assert.equal(country.code, oldCountry.code); assert.equal(country.regions.length, oldCountry.regions.length);
    assert.deepEqual(country.federal, oldCountry.federal === null ? null : without(oldCountry.federal, summaryKeys));
    for (let index = 0; index < oldCountry.regions.length; index++) {
      regionSummaries++; assert.deepEqual(country.regions[index], without(oldCountry.regions[index], summaryKeys));
      assert.equal(country.regions[index].sources, oldCountry.regions[index].sources); assert.equal(country.regions[index].examResources, oldCountry.regions[index].examResources);
    }
  }
  assert.equal(regionSummaries, 51);
  for (let index = 0; index < raw.examAlignment.regions.length; index++) {
    const region = raw.examAlignment.regions[index], actual = value.examAlignment.regions[index];
    if (region.subjectAreas?.length) {
      detailed++; assert.deepEqual(actual, without(region, ['focus', 'moduleIds'])); assert.equal(actual.subjectAreas, region.subjectAreas);
    } else { ordinary++; assert.equal(actual, region); assert.equal(actual.focus, region.focus); assert.equal(actual.moduleIds, region.moduleIds); }
    assert.equal(actual.sources, region.sources); assert.equal(actual.formats, region.formats); assert.equal(actual.limits, region.limits);
  }
  assert.equal(detailed, 9); assert.equal(ordinary, 42);
  assert.equal(value.examBlueprint.categories.flatMap(category => category.goals).length, 48);
  assert.equal(value.examBlueprint.sources.length, 202); assert.equal(Object.keys(value.examAlignment.learningCatalog).length, 17);
});

test('Unknown future fields, null federal rows and missing optional fields survive without mutation or invented fallbacks', () => {
  const future = { data: { futureData: 'keep', categories: [], countries: [
    { code: 'CH', federal: null, futureCountry: { value: 'keep' }, regions: [{ code: 'ZH', articleCount: 3, totalArticleCount: 8, futureRegion: { value: 'keep' } }] },
    { code: 'DE', federal: { name: 'Bund', articleCount: 4, lawTitle: 'unused', futureFederal: 'keep', sources: [] }, regions: [] },
    { code: 'AT', regions: [], futureNoFederal: true },
  ] }, examAlignment: { learningCatalog: { existing: 'keep' }, futureAlignment: 'keep', regions: [
    { country: 'CH', region: 'ZH', subjectAreas: [{ goals: [] }], focus: ['unused'], moduleIds: ['unused'], futureDetailed: 'keep' },
    { country: 'CH', region: 'BE', subjectAreas: [], focus: ['keep'], moduleIds: ['keep'], futureOrdinary: 'keep' },
  ] }, futureTop: { value: 'keep' } };
  freezeDeep(future); const value = project(future);
  assert.equal(value.futureTop, future.futureTop); assert.equal(value.data.futureData, 'keep');
  assert.equal(value.data.countries[0].futureCountry, future.data.countries[0].futureCountry);
  assert.equal(value.data.countries[0].federal, null); assert.equal(value.data.countries[0].regions[0].futureRegion, future.data.countries[0].regions[0].futureRegion);
  assert.equal(value.data.countries[0].regions[0].totalArticleCount, 8); assert.ok(!Object.hasOwn(value.data.countries[0].regions[0], 'articleCount'));
  assert.equal(value.data.countries[1].federal.futureFederal, 'keep'); assert.ok(!Object.hasOwn(value.data.countries[2], 'federal'));
  assert.equal(value.examAlignment.futureAlignment, 'keep'); assert.equal(value.examAlignment.learningCatalog, future.examAlignment.learningCatalog);
  assert.equal(value.examAlignment.regions[0].futureDetailed, 'keep'); assert.ok(!Object.hasOwn(value.examAlignment.regions[0], 'focus'));
  assert.equal(value.examAlignment.regions[1], future.examAlignment.regions[1]);
  for (const empty of [null, undefined, [], 'not-props']) assert.equal(project(empty), empty);
  assert.deepEqual(project({ futureOnly: true }), { futureOnly: true });
  assert.deepEqual(project({ data: null, examAlignment: null }), { data: null, examAlignment: null });
});

test('The real page applies this one projection and retains the existing 400000-byte budget without a new API or client import', () => {
  const pageProps = load('pages/lernen/pruefungsplan.js').getStaticProps().props;
  assert.deepEqual(pageProps, projected); assert.ok(bytes(pageProps) < 400000, 'Existing uncompressed 400000-byte props budget stays unchanged');
  assert.ok(bytes(pageProps) < bytes(raw), 'A real data reduction, not a raised budget');
  assert.deepEqual(Object.keys(pageProps), ['data', 'reviewCatalog', 'examAlignment', 'examBlueprint']);
  const filename = path.join(root, 'pages/lernen/pruefungsplan.js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /exam-study-plan-page-props|exam-study-plan-server|exam-alignment-server|exam-blueprint-server|daily-review-pool/);
  assert.doesNotMatch(JSON.stringify(pageProps), /"answers"|"correct"|"paragraphs"|"explain"|"takeaway"|"lessons"/);
});

function makeRenderer({ query = {}, profile = null, routerReady = true, profileReady = true } = {}) {
  let sideEffects = 0;
  const router = { isReady: routerReady, asPath: '/lernen/pruefungsplan?' + new URLSearchParams(query), query };
  const ui = createLoader({
    'next/router': { useRouter: () => router },
    'next/link': wrap(({ children, href, prefetch, scroll, ...props }) => React.createElement('a', { href, ...props }, children)),
    './LearningToolLayout': wrap(({ children, title }) => React.createElement('main', null, React.createElement('h1', null, title), children)),
    './PageMenu': { ...wrap(({ children }) => React.createElement('aside', null, children)), closePageMenu() { sideEffects++; }, openPageMenu() { sideEffects++; } },
    '../lib/use-exam-profile': wrap(() => ({ profile, ready: profileReady, persistence: 'session', accountKey: null, saving: false,
      saveProfile() { throw Error('No account write permitted'); }, clearProfile() { throw Error('No account removal permitted'); } })),
    '../lib/use-exam-review-progress': wrap(() => ({ phase: 'ready', summary: { byCategory: {}, total: { answered: 0, due: 0, mistakes: 0 } } })),
  });
  const Component = ui('components/ExamStudyPlan.js').default;
  return props => { const html = renderToStaticMarkup(React.createElement(Component, props)); assert.equal(sideEffects, 0); return html; };
}

test('All51 profiles, all48 focused tasks, invalid/unready entries and no-blueprint fallback retain 107 exactly identical actual SSR outputs', () => {
  const profiles = load('lib/exam-profile.js').examCountries.flatMap(country => country.regions.map(region => ({ country: country.code, region: region.code })));
  const common = raw.examBlueprint.categories.flatMap(category => category.goals.map(goal => ({ category, goal })));
  const cases = [
    { name: 'bare-no-profile' }, { name: 'router-not-ready', routerReady: false }, { name: 'profile-not-ready', profileReady: false },
    { name: 'unknown-category', query: { kategorie: 'missing' } }, { name: 'empty-goal', query: { kategorie: 'wildkunde', lernziel: '' } },
    { name: 'multiple-goal', query: { kategorie: 'wildkunde', lernziel: ['one', 'two'] } }, { name: 'invalid-state', query: { stand: 'missing' } },
    ...profiles.map(profile => ({ name: `${profile.country}:${profile.region}`, profile })),
    ...common.map(({ category, goal }) => ({ name: goal.id, profile: { country: 'CH', region: 'ZH' }, query: { kategorie: category.slug, lernziel: goal.id } })),
  ];
  for (const options of cases) { const render = makeRenderer(options); assert.equal(render(projected), render(raw), options.name); }
  const render = makeRenderer({ profile: profiles[0] });
  assert.equal(render({ ...projected, examBlueprint: undefined }), render({ ...raw, examBlueprint: undefined }));
  assert.equal(cases.length + 1, 107);
});
