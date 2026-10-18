const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');

function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const requireLocal = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)), overrides, cache);
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(requireLocal, mod, mod.exports);
  return mod.exports;
}

const { getMyCoursesView } = load('lib/my-courses.js');
const catalog = [
  { id: 'reh', title: 'Rehwild Basics', description: 'Rehwild im Jahreslauf', href: '/kurse/reh', totalQuestions: 4, categorySlug: 'wildkunde', categoryTitle: 'Wildkunde' },
  { id: 'spur', title: 'Fährten & Spuren', description: 'Trittsiegel sicher vergleichen', href: '/kurse/spur', totalQuestions: 4, categorySlug: 'natur-revier', categoryTitle: 'Natur & Revier' },
  { id: 'waffe', title: 'Große Waffenkunde', description: 'Sicherheit und Kugelfang', href: '/kurse/waffe', totalQuestions: 6, categorySlug: 'waffen-sicherheit', categoryTitle: 'Waffen & Sicherheit' },
  { id: 'sprache', title: 'Jägersprache', description: 'Begriffe der Jagd', href: '/kurse/sprache', totalQuestions: 3, categorySlug: 'pruefung-sprache', categoryTitle: 'Prüfung & Sprache' },
  { id: 'wetter', title: 'Wetterkunde', description: 'Wind und Wolken', href: '/kurse/wetter', totalQuestions: 2, categorySlug: 'natur-revier', categoryTitle: 'Natur & Revier' },
];
const progress = [
  { course_id: 'spur', status: 'in_progress', answered_questions: 2, total_questions: 4, best_score: 0, updated_at: '2026-10-11T10:00:00Z' },
  { course_id: 'waffe', status: 'completed', answered_questions: 4, total_questions: 4, best_score: 1, updated_at: '2026-10-09T10:00:00Z', completed_at: '2026-10-09T10:00:00Z' },
  { course_id: 'sprache', status: 'completed', answered_questions: 3, total_questions: 3, best_score: 0, updated_at: '2026-10-09T10:00:00Z', completed_at: '2026-10-09T10:00:00Z' },
  { course_id: 'wetter', status: 'unknown', answered_questions: 1, total_questions: 2, best_score: 1, updated_at: '2026-10-12T10:00:00Z' },
  { course_id: 'retired', status: 'completed', answered_questions: 99, total_questions: 99, best_score: 99, updated_at: '2026-10-13T10:00:00Z', href: 'https://untrusted.invalid' },
];
const expectedMetrics = { total: 5, completed: 2, in_progress: 1, open: 2 };
const rowFor = (view, id) => view.rows.find(row => row.course.id === id);

test('Quiz-answer progress and correctness stay separate, including zero scores and historical totals', () => {
  const view = getMyCoursesView(catalog, progress);
  assert.deepEqual(view.metrics, expectedMetrics);
  assert.deepEqual(Object.fromEntries(['answered', 'total', 'percent', 'bestScore', 'bestPercent'].map(key => [key, rowFor(view, 'spur')[key]])),
    { answered: 2, total: 4, percent: 50, bestScore: null, bestPercent: null });
  const historical = rowFor(view, 'waffe');
  assert.equal(historical.course.totalQuestions, 6);
  assert.equal(historical.total, 4, 'Stored quiz totals must not be replaced with the newer catalog total');
  assert.equal(historical.percent, 100);
  assert.equal(historical.bestScore, 1);
  assert.equal(historical.bestPercent, 25);
  const zero = rowFor(view, 'sprache');
  assert.equal(zero.status, 'completed'); assert.equal(zero.percent, 100);
  assert.equal(zero.bestScore, 0); assert.equal(zero.bestPercent, 0);
});

test('No saved row is open; unknown states and retired course IDs cannot inflate current completion', () => {
  const view = getMyCoursesView(catalog, progress);
  const open = rowFor(view, 'reh');
  assert.equal(open.entry, null); assert.equal(open.status, 'open');
  assert.equal(open.answered, 0); assert.equal(open.total, 4); assert.equal(open.percent, 0);
  const unknown = rowFor(view, 'wetter');
  assert.equal(unknown.status, 'open'); assert.equal(unknown.answered, null); assert.equal(unknown.percent, null);
  assert.ok(!rowFor(view, 'retired'));
  const empty = getMyCoursesView(catalog, progress.filter(entry => entry.course_id === 'retired'));
  assert.deepEqual(empty.metrics, { total: 5, completed: 0, in_progress: 0, open: 5 });
  assert.ok(empty.rows.every(row => row.entry === null && row.percent === 0));
});

test('Search normalizes German aliases and intersects category and status without changing overall metrics', () => {
  for (const query of ['FÄHRTEN SPUREN', '  faehrten   spuren  ', 'Trittsiegel']) {
    const view = getMyCoursesView(catalog, progress, { query, category: 'natur-revier', status: 'in_progress' });
    assert.deepEqual(view.rows.map(row => row.course.id), ['spur']);
    assert.deepEqual(view.metrics, expectedMetrics);
  }
  for (const query of ['grosse', 'GROßE', 'waffen sicherheit']) {
    assert.deepEqual(getMyCoursesView(catalog, progress, { query, status: 'completed' }).rows.map(row => row.course.id), ['waffe']);
  }
  assert.deepEqual(getMyCoursesView(catalog, progress, { query: 'jaegersprache', category: 'pruefung-sprache' }).rows.map(row => row.course.id), ['sprache']);
  assert.equal(getMyCoursesView(catalog, progress, { query: 'faehrten', status: 'completed' }).rows.length, 0);
  assert.equal(getMyCoursesView(catalog, progress, { category: 'missing-category' }).rows.length, 0);
  assert.equal(getMyCoursesView(catalog, progress, { status: 'missing-status' }).rows.length, 0);
  assert.equal(getMyCoursesView(catalog, progress, { query: '', category: 'all', status: 'all' }).rows.length, catalog.length);
  assert.deepEqual(getMyCoursesView(catalog, progress, { query: 'no match' }).categories,
    getMyCoursesView(catalog, progress).categories, 'Clearing a category remains possible even when nothing matches');
});

test('Saved recency, alphabetical order and deterministic catalog ties never use a progress-owned URL', () => {
  const beforeCatalog = JSON.stringify(catalog), beforeProgress = JSON.stringify(progress);
  assert.deepEqual(getMyCoursesView(catalog, progress).rows.map(row => row.course.id), ['wetter', 'spur', 'waffe', 'sprache', 'reh']);
  assert.deepEqual(getMyCoursesView(catalog, progress, { sort: 'title' }).rows.map(row => row.course.id), ['spur', 'waffe', 'sprache', 'reh', 'wetter']);
  const malicious = [{ ...progress[0], href: 'https://untrusted.invalid', title: 'Replacement', updated_at: 'not a date' }];
  const view = getMyCoursesView(catalog, malicious);
  assert.deepEqual(view.rows.map(row => row.course.id), catalog.map(course => course.id));
  assert.strictEqual(rowFor(view, 'spur').course, catalog[1]);
  assert.equal(rowFor(view, 'spur').course.href, '/kurse/spur');
  assert.equal(rowFor(view, 'spur').course.title, 'Fährten & Spuren');
  assert.equal(JSON.stringify(catalog), beforeCatalog); assert.equal(JSON.stringify(progress), beforeProgress);
});

test('Malformed saved numbers omit bars or scores instead of coercing values or showing invalid percentages', () => {
  for (const invalid of [
    { answered_questions: -1 }, { answered_questions: 5 }, { answered_questions: 0.5 },
    { answered_questions: '2' }, { answered_questions: NaN },
    { total_questions: 0 }, { total_questions: -4 }, { total_questions: '4' }, { total_questions: Infinity },
    { status: 'completed', answered_questions: 3 },
  ]) {
    const row = getMyCoursesView(catalog, [{ ...progress[0], ...invalid }]).rows.find(item => item.course.id === 'spur');
    assert.equal(row.answered, null, JSON.stringify(invalid)); assert.equal(row.total, null);
    assert.equal(row.percent, null); assert.equal(row.bestScore, null); assert.equal(row.bestPercent, null);
  }
  for (const best_score of [-1, 5, 0.5, '1', NaN, Infinity, undefined]) {
    const row = rowFor(getMyCoursesView(catalog, [{ ...progress[1], best_score }]), 'waffe');
    assert.equal(row.percent, 100); assert.equal(row.bestScore, null); assert.equal(row.bestPercent, null);
  }
});

test('Newest duplicate progress wins and missing data safely yields a current-course overview', () => {
  const duplicate = { ...progress[0], answered_questions: 3, updated_at: '2026-10-12T10:00:00Z' };
  for (const input of [[duplicate, progress[0]], [progress[0], duplicate]]) {
    assert.equal(rowFor(getMyCoursesView(catalog, input), 'spur').answered, 3);
  }
  assert.deepEqual(getMyCoursesView(null, null), { rows: [], metrics: { total: 0, completed: 0, in_progress: 0, open: 0 }, categories: [] });
  assert.deepEqual(getMyCoursesView(catalog, null).metrics, { total: 5, completed: 0, in_progress: 0, open: 5 });
});

test('Personal course metadata covers every current course using the established category mappings', () => {
  const { getMyCourseCatalog } = load('lib/my-course-catalog.js');
  const { courses } = load('lib/course-catalog.js');
  const { learningModules } = load('lib/learning-curriculum.js');
  const { miniCourseDetails } = load('lib/mini-course-details.js');
  const { learningCategoryDetails } = load('lib/learning-categories.js');
  const metadata = getMyCourseCatalog();
  assert.equal(metadata.length, courses.length);
  assert.equal(new Set(metadata.map(course => course.id)).size, courses.length);
  for (const course of metadata) {
    const original = courses.find(item => item.id === course.id);
    const module = learningModules.find(item => item.id === course.id);
    const category = learningCategoryDetails.find(item => module ? item.title === module.category : item.slug === miniCourseDetails[course.id]?.category);
    assert.ok(category, course.id);
    assert.deepEqual(Object.keys(course).sort(), ['id', 'title', 'description', 'href', 'totalQuestions', 'categorySlug', 'categoryTitle'].sort());
    assert.equal(course.href, original.href); assert.match(course.href, /^\/kurse\/[^/?#]+$/);
    assert.equal(course.description, original.description); assert.equal(course.totalQuestions, original.totalQuestions);
    assert.ok(Number.isInteger(course.totalQuestions) && course.totalQuestions > 0);
    assert.match(course.title, /^[\p{L}\p{N}]/u);
    assert.equal(course.categorySlug, category.slug); assert.equal(course.categoryTitle, category.title);
  }
  assert.equal(metadata.find(course => course.id === 'faehrten').categorySlug, 'natur-revier');
  assert.equal(metadata.find(course => course.id === 'fallenrecht').categorySlug, 'jagdrecht');
  assert.equal(metadata.find(course => course.id === 'wissen-gams-steinbock').categorySlug, 'wildkunde');
  assert.doesNotMatch(JSON.stringify(metadata), /"(?:questions|lessons|correct|paragraphs|countryNotes)":/);
});

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(textOf).join('');
  return typeof node === 'object' ? textOf(node.props?.children) : String(node);
}
function findAll(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => findAll(child, predicate));
  if (!node || typeof node !== 'object') return [];
  if (typeof node.type === 'function') return [...(predicate(node) ? [node] : []), ...findAll(node.type(node.props), predicate)];
  return [...(predicate(node) ? [node] : []), ...findAll(node.props?.children, predicate)];
}
function pageHarness({ courseCatalog = catalog, entries = progress, ...changes } = {}) {
  let cursor = 0, retries = 0;
  const states = [];
  const overview = { account: { email: 'learner@example.invalid', paid: true, admin: false }, progress: entries,
    accountError: null, progressError: null, loading: false, progressLoading: false,
    reload() { retries++; }, ...changes };
  const hooks = { ...React,
    useRef(initial) {
      const slot = cursor++;
      if (!(slot in states)) states[slot] = { current: initial };
      return states[slot];
    },
    useState(initial) {
      const slot = cursor++;
      if (!(slot in states)) states[slot] = typeof initial === 'function' ? initial() : initial;
      return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
    },
  };
  const Page = load('pages/meine-kurse.js', {
    react: hooks,
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    './LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../hooks/useAccountOverview': () => overview,
    '../lib/my-course-catalog': { getMyCourseCatalog() { throw new Error('The browser must use provided metadata'); } },
    '../lib/account-page': { getAccountPageProps() {} },
  }).default;
  function render() { cursor = 0; return Page({ catalog: courseCatalog }); }
  return { render, states, overview,
    html: () => renderToStaticMarkup(render()),
    articles: () => findAll(render(), node => node.type === 'article'),
    button: label => findAll(render(), node => node.type === 'button' && textOf(node) === label)[0],
    search: () => findAll(render(), node => node.type === 'input' && node.props.type === 'search')[0],
    select: label => findAll(findAll(render(), node => node.type === 'label' && textOf(node).startsWith(label))[0], node => node.type === 'select')[0],
    retries: () => retries,
  };
}

test('The course page combines its search/category/status controls and both empty/reset actions recover the overview', () => {
  const h = pageHarness();
  assert.equal(h.articles().length, 5);
  h.search().props.onChange({ target: { value: ' FAeHRTEN Spuren ' } });
  h.select('Kategorie').props.onChange({ target: { value: 'natur-revier' } });
  h.button('Begonnen 1').props.onClick();
  assert.equal(h.articles().length, 1);
  assert.match(textOf(h.articles()[0]), /Fährten & Spuren/);
  assert.match(h.html(), /1 von 5 Kursen passen zu deiner Auswahl/);
  assert.match(h.html(), /Kurse insgesamt/);
  h.button('Abgeschlossen 2').props.onClick();
  assert.equal(h.articles().length, 0);
  assert.match(h.html(), /Keine passenden Kurse/);
  assert.match(h.html(), /0 von 5 Kursen passen zu deiner Auswahl/);
  h.button('Alle Kurse anzeigen').props.onClick();
  assert.equal(h.articles().length, 5);
  assert.equal(h.search().props.value, '');
  assert.equal(h.select('Kategorie').props.value, 'all');
  assert.equal(h.select('Reihenfolge').props.value, 'recent');
  h.search().props.onChange({ target: { value: 'unfindbar' } });
  h.button('Auswahl zurücksetzen').props.onClick();
  assert.equal(h.articles().length, 5);
  assert.match(h.html(), /5 von 5 Kursen stehen in deiner Übersicht/);
});

test('The course page keeps answer completion distinct from correctness and uses only catalog course destinations', () => {
  const h = pageHarness();
  const html = h.html();
  assert.match(html, /alle Quizfragen beantwortet/);
  assert.match(html, /Balken zeigt deinen gespeicherten Fragenfortschritt/);
  const historical = h.articles().find(article => textOf(article).includes('Große Waffenkunde'));
  assert.match(textOf(historical), /4 von 4 Quizfragen beantwortet/);
  assert.match(textOf(historical), /1 \/ 4 \(25 % richtig\)/);
  const zero = h.articles().find(article => textOf(article).includes('Jägersprache'));
  assert.match(textOf(zero), /0 \/ 3 \(0 % richtig\)/);
  const bars = findAll(h.render(), node => node.type === 'progress');
  assert.ok(bars.every(bar => bar.props.value >= 0 && bar.props.value <= bar.props.max && bar.props.max > 0));
  assert.ok(bars.every(bar => bar.props['aria-label'].startsWith('Gespeicherte Quizfragen beantwortet: ')));
  assert.doesNotMatch(html, /untrusted\.invalid|retired/);
  h.select('Reihenfolge').props.onChange({ target: { value: 'title' } });
  assert.deepEqual(h.articles().map(article => textOf(findAll(article, node => node.type === 'h2')[0])),
    ['Fährten & Spuren', 'Große Waffenkunde', 'Jägersprache', 'Rehwild Basics', 'Wetterkunde']);
});

test('Course results update immediately and only explicit search moves focus to the summary', () => {
  const h = pageHarness();
  const calls = [];
  const region = findAll(h.render(), node => node.props?.id === 'my-course-results')[0];
  region.props.ref.current = { focus: options => calls.push(['focus', options]), scrollIntoView: options => calls.push(['scroll', options]) };
  h.search().props.onChange({ target: { value: 'faehrten' } });
  assert.equal(h.articles().length, 1, 'No submit or additional click is required to filter courses');
  h.select('Kategorie').props.onChange({ target: { value: 'natur-revier' } });
  assert.deepEqual(calls, []);
  let prevented = false;
  findAll(h.render(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { block: 'start', behavior: 'auto' }]]);
  assert.equal(h.search().props.enterKeyHint, 'search');
  assert.equal(h.search().props['aria-controls'], 'my-course-results');
  assert.equal(region.props.tabIndex, -1);
});

test('Showing more courses is bounded and changing any filter or sort restarts the first twelve results', () => {
  const many = Array.from({ length: 30 }, (_, index) => ({ ...catalog[0], id: `course-${index}`,
    title: `Kurs ${String(index + 1).padStart(2, '0')}`, description: index < 20 ? 'Zielthema Wildkunde' : 'Anderes Thema', href: `/kurse/course-${index}` }));
  const started = many.slice(0, 3).map(course => ({ course_id: course.id, status: 'in_progress', answered_questions: 1,
    total_questions: 4, best_score: 0, updated_at: '2026-10-12T10:00:00Z' }));
  const h = pageHarness({ courseCatalog: many, entries: started });
  assert.equal(h.articles().length, 12);
  h.button('Weitere Kurse anzeigen').props.onClick();
  assert.equal(h.articles().length, 24);
  h.button('Weitere Kurse anzeigen').props.onClick();
  assert.equal(h.articles().length, 30);
  assert.equal(h.button('Weitere Kurse anzeigen'), undefined);
  h.search().props.onChange({ target: { value: 'Zielthema' } });
  assert.equal(h.articles().length, 12);
  assert.match(h.html(), /12 von 20 passenden Kursen angezeigt/);
  h.button('Weitere Kurse anzeigen').props.onClick();
  assert.equal(h.articles().length, 20);
  h.select('Reihenfolge').props.onChange({ target: { value: 'title' } });
  assert.equal(h.articles().length, 12);
  h.button('Weitere Kurse anzeigen').props.onClick();
  h.select('Kategorie').props.onChange({ target: { value: 'wildkunde' } });
  assert.equal(h.articles().length, 12);
  h.button('Begonnen 3').props.onClick();
  assert.equal(h.articles().length, 3);
  h.button('Auswahl zurücksetzen').props.onClick();
  assert.equal(h.articles().length, 12);
  assert.match(h.html(), /12 von 30 passenden Kursen angezeigt/);
});

test('Loading or failed personal data never displays a misleading empty or completed course overview', () => {
  for (const [changes, message] of [[{ loading: true }, /Dein Konto wird geladen/],
    [{ progressLoading: true }, /Kursfortschritt wird geladen/],
    [{ accountError: { status: 401 } }, /Bitte bestätige deine Anmeldung/],
    [{ progressError: { status: 503 } }, /Dein Kursfortschritt ist gerade nicht erreichbar/]]) {
    const h = pageHarness(changes);
    assert.match(h.html(), message);
    assert.equal(h.articles().length, 0);
    assert.doesNotMatch(h.html(), /<progress|Dein Lernen im Überblick|Keine passenden Kurse|Bestes Ergebnis/);
    if (changes.progressError) {
      h.button('Erneut versuchen').props.onClick();
      assert.equal(h.retries(), 1);
    }
  }
});

test('Server rendering keeps the existing private identity guard and builds metadata only for signed-in users', () => {
  let signedIn = false, catalogCalls = 0;
  const headers = {};
  const page = load('pages/meine-kurse.js', {
    './account-access': { readRequestAccountSession() { return signedIn ? { email: 'learner@example.invalid' } : null; } },
    '../lib/my-course-catalog': { getMyCourseCatalog() { catalogCalls++; return catalog; } },
  });
  const context = { req: { cookies: {} }, res: { setHeader(name, value) { headers[name] = value; } },
    resolvedUrl: '/meine-kurse?thema=Gams' };
  const unsigned = page.getServerSideProps(context);
  assert.equal(unsigned.redirect.destination, '/login?next=%2Fmeine-kurse%3Fthema%3DGams');
  assert.equal(unsigned.redirect.permanent, false);
  assert.equal(catalogCalls, 0);
  assert.match(headers['Cache-Control'], /private, no-store/);
  signedIn = true;
  const signed = page.getServerSideProps(context);
  assert.strictEqual(signed.props.catalog, catalog);
  assert.equal(catalogCalls, 1);
  assert.match(headers['Cache-Control'], /private, no-store/);
});
