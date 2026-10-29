const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const profileApi = load('lib/exam-profile.js');
const project = load('lib/exam-study-plan-server.js');
const data = project.getExamStudyPlanData({ asOf: '2026-10-29' });
const { getLegalDataset } = load('lib/regional-law-data.js');
const { buildRegionalLawBundle } = load('lib/regional-law-core.js');

function setup(initial = {}, options = {}) {
  const store = { profile: null, ready: true, persistence: 'device', ...initial };
  const slots = [], cleanups = []; let cursor = 0, pending = [], changed = false, tree;
  const calls = { save: [], clear: 0, open: [], close: 0, focus: [] };
  const hooks = { ...React,
    useState(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, input => { const value = typeof input === 'function' ? input(slots[index].value) : input; changed ||= !Object.is(value, slots[index].value); slots[index].value = value; }]; },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index]; },
    useEffect(fn, deps) { const index = cursor++; if (!slots[index] || !deps || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) { slots[index] = { deps }; pending.push(() => { cleanups[index]?.(); cleanups[index] = fn(); }); } },
  };
  const useProfile = () => ({ ...store,
    saveProfile(value) { calls.save.push(value); if (options.failSave) return false; if (options.commit !== false) store.profile = value; return true; },
    clearProfile() { calls.clear++; if (options.failClear) return false; if (options.commit !== false) store.profile = null; return true; },
  });
  function PageMenu({ children }) { return React.createElement('aside', null, children); }
  const api = createLoader({ react: hooks, '../lib/use-exam-profile': { __esModule: true, default: useProfile },
    './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() { calls.close++; }, openPageMenu(id) { calls.open.push(id); } },
    '../hooks/useSelectionPageStart': { __esModule: true, default: (scope, enabled) => ({ focusSelection(target) { if (enabled) calls.focus.push({ scope, target }); } }) },
  });
  const Component = api('components/ExamStudyPlan.js').default;
  function render() { for (let pass = 0; pass < 12; pass++) { cursor = 0; changed = false; tree = Component({ data }); const effects = pending; pending = []; effects.forEach(effect => effect()); if (!changed) return tree; } throw new Error('Plan did not settle'); }
  render();
  return { store, calls, PageMenu, render, get tree() { return tree; }, nodes: predicate => nodes(tree, predicate),
    control(id) { return nodes(tree, node => node.props?.id === id)[0]; },
    change(id, value) { this.control(id).props.onChange({ target: { value } }); render(); },
    save() { nodes(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }); render(); },
    clear() { nodes(tree, node => node.type === 'button' && text(node) === 'Prüfungsziel entfernen')[0].props.onClick(); render(); },
    update(value) { Object.assign(store, value); render(); },
    dispose() { cleanups.forEach(cleanup => cleanup?.()); },
  };
}

test('The plan contains exactly the canonical twelve learning categories and all51 exact target regions', () => {
  assert.deepEqual(data.categories, load('lib/learning-categories.js').learningCategoryDetails.map(({ slug, title, focus }) => ({ slug, title, focus })));
  assert.deepEqual(data.countries.map(country => [country.code, country.regions.map(region => [region.code, region.name])]), profileApi.examCountries.map(country => [country.code, country.regions.map(region => [region.code, region.name]) ]));
  assert.equal(data.countries.reduce((sum, country) => sum + country.regions.length, 0), 51);
  assert.ok(Buffer.byteLength(JSON.stringify(data)) < 100000);
});

test('Every region keeps existing readability and review gates and includes federal questions exactly once', () => {
  const before = JSON.stringify(profileApi.examCountries.map(country => getLegalDataset(country.code)));
  const national = {};
  for (const country of data.countries) {
    const dataset = getLegalDataset(country.code);
    for (const region of country.regions) {
      const bundle = buildRegionalLawBundle(dataset, region.code, { asOf: '2026-10-29' });
      const own = bundle.articles.filter(article => article.regionCode === region.code);
      assert.equal(region.articleCount, own.length);
      assert.equal(region.reviewedArticleCount, own.filter(article => article.learningReviewed).length);
      assert.equal(region.questionCount, bundle.questions.filter(question => question.regionCode === region.code).length);
      assert.equal(region.totalQuestionCount, bundle.questions.length);
      assert.equal(region.totalArticleCount, bundle.articles.length);
      assert.equal(region.includesFederal, bundle.includesFederal);
      assert.equal(new Set(bundle.questions.map(question => question.id)).size, bundle.questions.length);
      assert.equal(region.totalQuestionCount, region.questionCount + (country.federal?.questionCount || 0));
    }
    national[country.code] = country.regions.reduce((sum, region) => sum + region.questionCount, 0) + (country.federal?.questionCount || 0);
  }
  assert.deepEqual(national, { CH: 195, AT: 77, DE: 224 });
  assert.equal(before, JSON.stringify(profileApi.examCountries.map(country => getLegalDataset(country.code))));
});

test('Only issuer originals are projected, including narrow Hamburg/Genf paths, never Hessian association mirrors', () => {
  for (const value of ['https://ljv-hessen.de/download/hessische-jagdverordnung-hjagdv/', 'https://ljv-hessen.de/download/hessisches-jagdgesetz-hjagdg/', 'https://www.juris.de/other/', 'https://silgeneve.ch/other/', 'http://www.ris.bka.gv.at/a', 'https://www.ris.bka.gv.at.evil.test/a', 'https://user:pass@www.ris.bka.gv.at/a', '//www.ris.bka.gv.at/a', 'bad']) assert.equal(project.isExamPlanOfficialUrl(value), false);
  for (const value of ['https://www.juris.de/bsha/document/jlr-NNLHH0000699C', 'https://silgeneve.ch/legis/data/a', 'https://www.ris.bka.gv.at/a', 'https://www.kaerntner-jaegerschaft.at/sites/default/files/a.pdf']) assert.equal(project.isExamPlanOfficialUrl(value), true);
  let sources = 0;
  for (const country of data.countries) for (const region of [...country.regions, country.federal].filter(Boolean)) {
    for (const source of region.sources) { sources++; assert.equal(project.isExamPlanOfficialUrl(source.url), true); assert.ok(source.title && source.publisher); assert.match(source.reviewedOn, /^2026-10-2[34]$/); }
    for (const resource of region.examResources) { assert.ok(['official-catalog', 'official-sample', 'exam-rules'].includes(resource.kind)); assert.equal(project.isExamPlanOfficialUrl(resource.url), true); assert.ok(resource.notes); }
  }
  assert.ok(sources > 150);
  const serialized = JSON.stringify(data);
  assert.doesNotMatch(serialized, /officialText|correctIndex|correctIds|"choices"|"prompt"|association-catalog|ljv-hessen\.de/);
});

test('Projected source dates and resource fields are exact old records; no current exam or catalog date is invented', () => {
  for (const country of data.countries) {
    const raw = getLegalDataset(country.code);
    for (const region of [...country.regions, country.federal && { ...country.federal, code: 'BUND' }].filter(Boolean)) {
      const old = raw.regions.find(item => item.code === region.code);
      for (const resource of region.examResources) assert.deepEqual(resource, old.examResources.find(item => item.url === resource.url && item.kind === resource.kind));
      for (const source of region.sources) assert.ok(old.articles.some(article => article.reviewedOn === source.reviewedOn && article.sources.some(item => item.kind === 'law' && item.title === source.title && item.url === source.url && item.publisher === source.publisher)));
    }
  }
  const gr = data.countries.find(country => country.code === 'CH').regions.find(region => region.code === 'GR');
  assert.match(gr.examResources[0].notes, /Version 2019|Stand 2019/);
});

test('Restoration waits for readiness and never silently saves a target or opens a second window', () => {
  const h = setup({ ready: false, persistence: 'unknown' });
  try {
    assert.equal(h.control('exam-plan-country').props.disabled, true);
    assert.equal(h.control('exam-plan-country').props.value, '');
    h.update({ ready: true, persistence: 'device', profile: { country: 'AT', region: 'NOE' } });
    assert.equal(h.control('exam-plan-country').props.value, 'AT'); assert.equal(h.control('exam-plan-region').props.value, 'NOE');
    assert.deepEqual(h.calls.save, []); assert.equal(h.calls.focus.length, 0); assert.equal(h.calls.open.length, 0);
    assert.equal(h.nodes(node => node.type === 'dialog').length, 0);
    assert.match(text(h.tree), /Niederösterreich · Österreich/);
  } finally { h.dispose(); }
});

test('Changing the country and region remains a draft until explicit save; focus follows the actual profile commit', () => {
  const h = setup({ profile: { country: 'CH', region: 'ZH' } }, { commit: false });
  try {
    h.change('exam-plan-country', 'DE'); assert.equal(h.control('exam-plan-region').props.value, '');
    h.change('exam-plan-region', 'BY'); assert.deepEqual(h.calls.save, []);
    assert.match(text(h.tree), /Zürich · Schweiz/); assert.doesNotMatch(text(h.tree), /Bayern · Deutschland/);
    h.save(); assert.deepEqual(h.calls.save, [{ country: 'DE', region: 'BY' }]); assert.equal(h.calls.focus.length, 0); assert.equal(h.calls.close, 0);
    h.update({ profile: { country: 'DE', region: 'BY' } });
    assert.match(text(h.tree), /Bayern · Deutschland/); assert.equal(h.calls.focus.length, 1); assert.equal(h.calls.close, 1);
    assert.ok(h.nodes(node => node.props?.href === '/jagdrecht/de?region=BY&ansicht=uebung').length);
  } finally { h.dispose(); }
});

test('An external profile update preserves a dirty draft and invalidates old context handlers', () => {
  const h = setup({ profile: { country: 'CH', region: 'ZH' } });
  try {
    h.change('exam-plan-country', 'AT'); h.change('exam-plan-region', 'NOE');
    const oldSave = h.nodes(node => node.type === 'form')[0].props.onSubmit;
    h.update({ profile: { country: 'DE', region: 'BY' } });
    assert.equal(h.control('exam-plan-country').props.value, 'AT'); assert.equal(h.control('exam-plan-region').props.value, 'NOE');
    oldSave({ preventDefault() {} }); assert.equal(h.calls.save.length, 0);
    h.save(); assert.deepEqual(h.calls.save, [{ country: 'AT', region: 'NOE' }]);
  } finally { h.dispose(); }
});

test('Editing a new draft supersedes an accepted pending focus request before a late profile commit', () => {
  const h = setup({ profile: { country: 'CH', region: 'ZH' } }, { commit: false });
  try {
    h.change('exam-plan-country', 'AT'); h.change('exam-plan-region', 'NOE'); h.save();
    h.change('exam-plan-region', 'S');
    h.update({ profile: { country: 'AT', region: 'NOE' } });
    assert.equal(h.control('exam-plan-region').props.value, 'S');
    assert.equal(h.calls.close, 0); assert.equal(h.calls.focus.length, 0);
  } finally { h.dispose(); }
});

test('Old draft handlers are blocked before rerender and all saved callbacks stop at actual unmount', () => {
  const h = setup({ profile: { country: 'CH', region: 'ZH' } });
  const oldCountry = h.control('exam-plan-country').props.onChange;
  const oldRegion = h.control('exam-plan-region').props.onChange;
  const oldSave = h.nodes(node => node.type === 'form')[0].props.onSubmit;
  oldCountry({ target: { value: 'AT' } }); oldRegion({ target: { value: 'BE' } }); oldSave({ preventDefault() {} });
  assert.equal(h.calls.save.length, 0); h.render(); assert.equal(h.control('exam-plan-region').props.value, '');
  h.change('exam-plan-region', 'NOE');
  const save = h.nodes(node => node.type === 'form')[0].props.onSubmit;
  const clear = h.nodes(node => node.type === 'button' && text(node) === 'Prüfungsziel entfernen')[0].props.onClick;
  const open = h.nodes(node => node.type === 'button' && text(node) === 'Prüfungsziel ändern')[0].props.onClick;
  h.dispose(); save({ preventDefault() {} }); clear(); open();
  assert.equal(h.calls.save.length, 0); assert.equal(h.calls.clear, 0); assert.equal(h.calls.open.length, 0);
});

test('A failed commit retains the original target; session-only commits and explicit removal are honestly described', () => {
  const failed = setup({ profile: { country: 'CH', region: 'ZH' } }, { failSave: true });
  try { failed.change('exam-plan-country', 'AT'); failed.change('exam-plan-region', 'NOE'); failed.save(); assert.match(text(failed.tree), /Zürich · Schweiz/); assert.match(text(failed.tree), /konnte nicht übernommen/); assert.equal(failed.calls.focus.length, 0); } finally { failed.dispose(); }
  const session = setup({ profile: { country: 'CH', region: 'ZH' }, persistence: 'session' });
  try { assert.match(text(session.tree), /nur in dieser Sitzung/); session.clear(); assert.equal(session.store.profile, null); assert.equal(session.control('exam-plan-country').props.value, ''); assert.equal(session.calls.clear, 1); assert.equal(session.calls.focus.length, 1); } finally { session.dispose(); }
});

test('The reading uses the canonical category names once and the selection controls live only in the lower PageMenu', () => {
  const h = setup({ profile: { country: 'AT', region: 'NOE' } });
  try {
    assert.equal(h.tree.props.headingOnly, true);
    const menu = h.nodes(node => node.type === h.PageMenu); assert.equal(menu.length, 1);
    assert.equal(nodes(menu[0], node => node.type === 'select').length, 2);
    assert.equal(h.nodes(node => node.type === 'select').length, 2);
    assert.equal(h.nodes(node => node.type === 'input' && node.props?.type === 'search').length, 0);
    for (const category of data.categories) { const links = h.nodes(node => node.props?.href === `/lernen/${category.slug}`); assert.equal(links.length, 1); assert.equal(text(links[0]), category.title); }
    for (const href of ['/quiz-app', '/lernen/pruefungsgespraech', '/lernen/lernkarten', '/lernen/wildjahr', '/lernen/spurenwerkstatt']) assert.equal(h.nodes(node => node.props?.href === href).length, 1);
  } finally { h.dispose(); }
});

test('Actual SSR puts complete orientation before closed final original sources and preserves their old catalog limitations', () => {
  const useProfile = () => ({ profile: { country: 'CH', region: 'GR' }, ready: true, persistence: 'device' });
  const ssr = createLoader({ '../lib/use-exam-profile': { __esModule: true, default: useProfile }, 'next/link': ({ href, children }) => React.createElement('a', { href }, children) });
  const html = renderToStaticMarkup(React.createElement(ssr('components/ExamStudyPlan.js').default, { data }));
  assert.ok(html.indexOf('Dein Lernweg') < html.indexOf('exam-plan-sources'));
  assert.ok(html.indexOf('Praxis und örtliche Vorgaben') < html.indexOf('exam-plan-sources'));
  assert.match(html, /<details[^>]*id="exam-plan-sources"/); assert.doesNotMatch(html, /<details[^>]*open/);
  assert.match(html, /Version 2019/); assert.match(html, /23\.10\.2026/); assert.match(html, /kein amtlicher Originalkatalog/);
  assert.match(html, /weder eine Prüfungszulassung noch eine Jagdberechtigung/);
});

test('Reusable profile summaries only link to the selected law and plan; they neither navigate nor save', () => {
  for (const profile of [null, { country: 'AT', region: 'NOE' }, { country: 'DE', region: 'BE' }]) {
    let actions = 0;
    const Summary = createLoader({ '../lib/use-exam-profile': { __esModule: true, default: () => ({ profile, ready: true, persistence: 'session', saveProfile() { actions++; }, clearProfile() { actions++; } }) } })('components/ExamProfileSummary.js').default;
    const tree = Summary({}); assert.equal(actions, 0);
    assert.equal(nodes(tree, node => ['select', 'input', 'button', 'dialog'].includes(node.type)).length, 0);
    assert.equal(nodes(tree, node => node.props?.href === '/lernen/pruefungsplan').length, 1);
    if (profile) { assert.equal(nodes(tree, node => node.props?.href === profileApi.examProfileLawHref(profile)).length, 1); assert.match(text(tree), /nur diese Sitzung/); }
  }
});

test('The SSG page passes only the compact projection and the client transform excludes all legal banks and answer fields', () => {
  const page = load('pages/lernen/pruefungsplan.js');
  assert.deepEqual(page.getStaticProps().props.data, data);
  const filename = path.join(root, 'pages/lernen/pruefungsplan.js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /exam-study-plan-server|regional-law-data|officialText|correctIndex/);
  const source = fs.readFileSync(path.join(root, 'components/ExamStudyPlan.js'), 'utf8');
  assert.doesNotMatch(source, /fetch\(|localStorage|window\.location|router\.push|regional-law-data|exam-study-plan-server/);
});

test('The existing access boundary also protects the new plan without weakening authentication or payment checks', async () => {
  const { NextRequest } = local('next/server');
  const { middleware } = createLoader({ './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account_session', readAccountSessionEdge: async () => null } })('middleware.js');
  const response = await middleware(new NextRequest('https://jagdlatein.test/lernen/pruefungsplan'));
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.pathname, '/preise'); assert.equal(location.searchParams.get('next'), '/lernen/pruefungsplan');
});
