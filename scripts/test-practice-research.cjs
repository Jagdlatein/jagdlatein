const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const sharp = pr('sharp');
const { setup } = require('./helpers/field-reader-fixture.cjs');
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const req = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ query: {}, isReady: true }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...props }, children);
    if (id === 'next/head') return ({ children }) => children;
    if (id === 'next/image') return ({ priority, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, cache);
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(req, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const data = load('lib/practice-research-server.js').getPracticeResearchData();
function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}

test('Every dossier keeps original source roles, study scope, explicit practice interpretation and complete source mappings', () => {
  const categoryIds = new Set(load('lib/learning-categories.js').learningCategoryDetails.map(item => item.slug));
  assert.equal(data.topics.length, 3);
  assert.equal(new Set(data.topics.map(topic => topic.id)).size, 3);
  for (const topic of data.topics) {
    assert.ok(topic.findings.length >= 2 && topic.sources.length >= 2);
    assert.match(topic.practice.lead, /Redaktionelle Ableitung/);
    assert.ok(topic.studyScope.length > 100 && topic.limits.length >= 3);
    assert.ok(topic.categories.every(id => categoryIds.has(id)));
    const sources = new Map(topic.sources.map(source => [source.id, source]));
    assert.equal(sources.size, topic.sources.length);
    for (const finding of topic.findings) for (const id of finding.sourceIds) assert.ok(sources.has(id), `${topic.id}: ${id}`);
    for (const source of topic.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.match(source.publishedOn, /^\d{4}-\d{2}(?:-\d{2})?$/);
      assert.ok(source.kind && typeof source.supports === 'string' && source.supports.length > 30 && source.independence.length > 30);
    }
  }
  const spring = data.topics.find(topic => topic.id === 'rehwild-fruehling');
  assert.match(spring.sources.find(source => source.id === 'kauffert-2025').independence, /keine unabhängige Replikation/);
  assert.match(data.topics.find(topic => topic.id === 'wild-und-stoerung').publicationState, /2017 und 2018/);
});

test('Dossiers keep teaching text and practice directly accessible while evidence and review remain in the closed final block', t => {
  for (const topic of data.topics) {
    const router = { query: { thema: topic.id }, isReady: true };
    const Page = load('components/ResearchForPractice.js', { 'next/router': { useRouter: () => router } }).default;
    const html = renderToStaticMarkup(React.createElement(Page, data));
    const dossier = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
    assert.equal((dossier.match(/<button/g) || []).length, 0);
    const h = setup('components/ResearchForPractice.js', router.query, { props: data });
    t.after(() => h.dispose());
    const menu = find(h.tree, node => node.props?.title === 'Wissen fürs Revier – Thema wählen');
    assert.ok(menu);
    const menuHTML = renderToStaticMarkup(menu.props.children);
    assert.ok(menuHTML.includes('<legend>Thema</legend>'));
    assert.doesNotMatch(html, /<select|Praxisthema auswählen/);
    assert.doesNotMatch(html, /aria-label="In diesem Thema"/);
    assert.ok(menuHTML.includes('60 Fragen mit Erklärungen'));
    assert.ok(html.includes('20 Fragen im Thema'));
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.match(html, /id="revierwissen-inhalt"/);
    assert.ok(html.includes(topic.title));
    for (const finding of topic.findings) assert.ok(html.includes(finding.text));
    for (const step of topic.practice.steps) assert.ok(html.includes(step));
    for (const source of topic.sources) assert.ok(html.includes(source.title.replaceAll('&', '&amp;')));
    assert.ok(html.indexOf('Was du im Revier damit anfangen kannst') < html.indexOf('Was die Untersuchungen zeigen'));
    assert.match(html, /keine Aufnahme aus/);
    assert.match(html, /Für die Webanzeige proportional verkleinert/);
    assert.doesNotMatch(dossier, /Fachlicher Abgleich|class="sourceLinks"/);
    assert.ok(html.indexOf('id="revierwissen-fragen"') < html.indexOf('<summary>Quellen und Prüfstand</summary>'));
    assert.match(html, /<details class="sources"><summary>Quellen und Prüfstand<\/summary>/);
  }
});

test('Shared URL selection validates values, preserves other context and follows restored browser query state', async t => {
  const calls = [];
  const h = setup('components/ResearchForPractice.js', { ref: 'lernen' }, { props: data, router: { pathname: '/lernen/wissen-fuers-revier', asPath: '/lernen/wissen-fuers-revier?ref=lernen#revierwissen-inhalt' } });
  t.after(() => h.dispose());
  const router = h.router;
  router.push = (...args) => { calls.push(args); return Promise.resolve(true); };
  const selection = () => find(h.render(), node => node.type?.name === 'MenuChoice');
  assert.equal(selection().props.value, data.topics[0].id);
  selection().props.onChange({ target: { value: 'javascript:alert(1)' } });
  assert.equal(calls.length, 0);
  router.isReady = false;
  selection().props.onChange({ target: { value: data.topics[1].id } });
  assert.equal(calls.length, 0);
  router.isReady = true;
  selection().props.onChange({ target: { value: data.topics[1].id } });
  assert.deepEqual(calls[0], [{ pathname: router.pathname, query: { ref: 'lernen', thema: data.topics[1].id }, hash: 'revierwissen-inhalt' }, undefined, { shallow: true, scroll: false }]);
  router.query = { thema: data.topics[1].id }; assert.equal(selection().props.value, data.topics[1].id);
  router.query = { thema: data.topics[2].id }; assert.equal(selection().props.value, data.topics[2].id);
  router.query = { thema: data.topics[1].id }; assert.equal(selection().props.value, data.topics[1].id);
  router.query = { thema: ['wildkameras', 'wild-und-stoerung'] }; assert.equal(selection().props.value, '');
  router.query = { thema: 'unknown' }; assert.equal(selection().props.value, '');
  router.push = () => Promise.reject(Object.assign(new Error('cancelled'), { cancelled: true }));
  await selection().props.onChange({ target: { value: data.topics[2].id } });
});

test('Only the two licensed, unchanged, decoded photographs reach the browser and keep modification credits', async () => {
  const originals = load('lib/wildlife-photographs.js').wildlifePhotographs;
  assert.deepEqual(Object.keys(data.photos).sort(), ['rehwild', 'rotwild']);
  for (const [key, photo] of Object.entries(data.photos)) {
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src));
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.width, photo.width); assert.equal(meta.height, photo.height);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), originals[key].sha256);
    assert.equal(originals[key].aiGenerated, false);
    assert.ok(photo.credit && photo.licenseUrl && photo.creditUrl && photo.modifications);
    assert.equal(photo.originalUrl, undefined);
  }
});

test('Dossiers are discoverable in existing categories and deep search lands on the matching topic', () => {
  const experiences = load('lib/learning-experiences.js').learningExperiences;
  const card = experiences.find(item => item.href === '/lernen/wissen-fuers-revier');
  assert.ok(card.featured);
  assert.ok(['wildkunde', 'natur-revier', 'jagdpraxis'].every(id => card.categories.includes(id)));
  const search = load('lib/learning-search.js').searchLearning;
  for (const [query, id] of [['Wildkamera Fotozahl', 'wildkameras'], ['Wege Tageszeit', 'wild-und-stoerung'], ['Vegetation Setzzeit', 'rehwild-fruehling']]) {
    const results = search({ query, type: 'entry', category: 'jagdpraxis' }).results;
    assert.ok(results.some(result => result.href === `/lernen/wissen-fuers-revier?thema=${id}#revierwissen-inhalt`), query);
  }
  const courses = new Set(load('lib/course-catalog.js').courses.map(course => course.href));
  for (const topic of data.topics) for (const related of topic.related) {
    if (related.href.startsWith('/kurse/')) assert.ok(courses.has(related.href), related.href);
    else assert.ok(fs.existsSync(path.join(root, 'pages', related.href + '.js')), related.href);
  }
});

test('The real Next browser transform removes source preparation and the complete wildlife atlas', () => {
  const filename = path.join(root, 'pages/lernen/wissen-fuers-revier.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, isServerCompiler: false, disableNextSsg: false, pagesDir: path.join(root, 'pages'), jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'es6' } });
  assert.match(code, /__N_SSG/);
  assert.doesNotMatch(code, /practice-research-server|wildlife-photographs|getStaticProps/);
});
