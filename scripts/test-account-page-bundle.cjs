// Local compiler and synthetic account rendering; no real account is read.
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
const loadPushModule = require('./helpers/project-module.cjs').createLoader();
const pageFile = path.join(root, 'pages/konto.js');
const styles = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };

function transform(filename, clientPage = false) {
  return swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: !clientPage, isServerCompiler: !clientPage,
    isPageFile: clientPage, pagesDir: path.join(root, 'pages'),
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022',
      transform: { react: { runtime: 'automatic' } } },
    module: { type: clientPage ? 'es6' : 'commonjs' },
  }).code;
}

function loadCatalog() {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', transform(filename))(id => {
      if (!id.startsWith('.')) return pr(id);
      return load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`));
    }, mod, mod.exports);
    return mod.exports;
  }
  return load(path.join(root, 'lib/course-catalog.js')).courses;
}

function pageFixture({ signedIn = true, courses = [], overview = {} } = {}) {
  const calls = [];
  const accountPageModule = { exports: {} };
  const accountPageFile = path.join(root, 'lib/account-page.js');
  new Function('require', 'module', 'exports', transform(accountPageFile))(id => {
    assert.equal(id, './account-access');
    return { readRequestAccountSession(req) { calls.push('identity'); assert.equal(req.synthetic, true);
      return signedIn ? { email: 'learner@example.invalid' } : null; } };
  }, accountPageModule, accountPageModule.exports);
  const account = { email: 'learner@example.invalid', paid: true, admin: false, accessType: 'paid', ...overview.account };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', transform(pageFile))(id => {
    if (id === 'react' || id === 'react/jsx-runtime') return pr(id);
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === '../lib/account-page') return accountPageModule.exports;
    if (id === '../lib/course-catalog') { calls.push('catalog'); return { courses }; }
    if (id === '../hooks/useAccountOverview') return () => ({ account, progress: overview.progress || [],
      loading: false, progressLoading: false, accountError: null, progressError: null, reload() {}, ...overview });
    if (id === '../components/AccountLayout') return { __esModule: true,
      default: ({ children }) => React.createElement(React.Fragment, null, children), AccountError: () => null, ProgressError: () => null };
    if (id === '../styles/Account.module.css') return styles;
    if (id === '../lib/offline-learning') return { clearOfflineLearning() {} };
    if (id === '../lib/daily-review') return { clearReviewHistory() { return true; } };
    if (id === '../components/WebPushPreferences') return loadPushModule('components/WebPushPreferences.js');
    if (id === '../components/NativePushPreferences') return loadPushModule('components/NativePushPreferences.js');
    if (id === '../lib/firebase-web-push') return loadPushModule('lib/firebase-web-push.js');
    if (id === '../lib/native-push-preferences') return loadPushModule('lib/native-push-preferences.js');
    throw Error(`Unexpected page dependency: ${id}`);
  }, mod, mod.exports);
  const headers = {};
  const context = { req: { synthetic: true }, res: { setHeader(name, value) { headers[name.toLowerCase()] = value; } },
    resolvedUrl: '/konto?quelle=lernbereich' };
  return { calls, headers, run: () => mod.exports.getServerSideProps(context),
    render: props => renderToStaticMarkup(React.createElement(mod.exports.default, props)) };
}

test('The actual account identity guard redirects before importing or serializing the course catalog', async () => {
  const f = pageFixture({ signedIn: false });
  assert.deepEqual(f.calls, [], 'Importing the account page itself must not load the full catalog.');
  const result = await f.run();
  assert.equal(result.redirect.destination, '/login?next=%2Fkonto%3Fquelle%3Dlernbereich');
  assert.equal(result.redirect.permanent, false);
  assert.equal(f.headers['cache-control'], 'private, no-store, max-age=0');
  assert.deepEqual(f.calls, ['identity']);
  assert.equal(result.props, undefined);
});

test('Every production course retains exactly its identifier, displayed name and destination in server props', async () => {
  const courses = loadCatalog(); const f = pageFixture({ courses });
  assert.ok(courses.length > 20, 'Compare the real complete course catalog, not a tiny substitute.');
  const result = await f.run();
  assert.deepEqual(result.props.courses, courses.map(({ id, title, href }) => ({ id, title, href })));
  assert.ok(result.props.courses.every(course => Object.keys(course).sort().join(',') === 'href,id,title'));
  assert.equal(f.headers['cache-control'], 'private, no-store, max-age=0');
  assert.deepEqual(f.calls, ['identity', 'catalog']);
  const serialized = JSON.stringify(result.props);
  for (const field of ['questions', 'lessons', 'description', 'correctAnswer', 'countryNotes'])
    assert.equal(serialized.includes(`"${field}":`), false, `Account props must not transmit ${field}.`);
});

test('The course summary and latest begun course stay correct using the minimal server props', async () => {
  const courses = [{ id: 'finished', title: 'Abgeschlossener Kurs', href: '/kurse/finished', questions: ['not-for-account'] },
    { id: 'continuing', title: '🦌 Aktueller Kurs', href: '/kurse/continuing', lessons: ['not-for-account'] },
    { id: 'remaining', title: 'Noch offener Kurs', href: '/kurse/remaining' }];
  const f = pageFixture({ courses, overview: { progress: [
    { course_id: 'finished', status: 'completed', updated_at: '2026-10-14T09:00:00Z' },
    { course_id: 'continuing', status: 'in_progress', updated_at: '2026-10-14T10:00:00Z' },
    { course_id: 'unknown', status: 'in_progress', updated_at: '2026-10-14T11:00:00Z', href: 'https://untrusted.invalid' },
  ] } });
  const result = await f.run(); const html = f.render(result.props);
  assert.match(html, /<strong>Aktueller Kurs<\/strong>/);
  assert.match(html, /href="\/kurse\/continuing"[^>]*>Kurs weiterlernen/);
  for (const label of ['Abgeschlossen', 'Begonnen', 'Noch offen'])
    assert.ok(html.includes(`<strong>1</strong><span>${label}</span>`), label);
  assert.doesNotMatch(html, /untrusted\.invalid|not-for-account/);
});

test('A missing or expired account response still hides private overview and course progress', () => {
  const f = pageFixture({ courses: [{ id: 'private', title: 'Former private course', href: '/kurse/private' }],
    overview: { account: null, accountError: { status: 401 }, progress: [{ course_id: 'private', status: 'in_progress' }] } });
  const html = f.render({ courses: [{ id: 'private', title: 'Former private course', href: '/kurse/private' }] });
  assert.doesNotMatch(html, /learner@example|Former private course|Kurs weiterlernen|Meine Kurse/);
  assert.deepEqual(f.calls, [], 'Rendering never loads the course catalog or weakens the account API check.');
});

test('Next removes server catalog imports from the actual account browser module and its relative dependency graph', () => {
  const clientCode = transform(pageFile, true);
  assert.match(clientCode, /__N_SSP/);
  assert.doesNotMatch(clientCode, /course-catalog|learning-curriculum|getServerSideProps/);
  const visited = new Set();
  function walk(filename, source = null) {
    if (visited.has(filename)) return;
    visited.add(filename);
    assert.doesNotMatch(filename.replaceAll('\\', '/'), /\/(?:course-catalog|learning-curriculum)\.js$/);
    if (!/\.[cm]?[jt]sx?$/.test(filename)) return;
    const code = source || fs.readFileSync(filename, 'utf8');
    const relativeImports = [...code.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)].map(match => match[1]);
    for (const id of relativeImports) {
      const target = path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`);
      if (fs.existsSync(target)) walk(target);
    }
  }
  walk(pageFile, clientCode);
  assert.ok(visited.size > 10, 'Check relative layout, account hook and offline dependencies as well as the page.');
});
