const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react');
const {renderToStaticMarkup} = pr('react-dom/server');
const sharp = pr('sharp');
const swc = pr('next/dist/build/swc');
function load(relative, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  if (cache.has(filename)) return cache.get(filename);
  const mod = {exports: {}};
  const {code} = swc.transformSync(fs.readFileSync(filename, 'utf8'), {filename, disableNextSsg: true, jsc: {parser: {syntax: 'ecmascript', jsx: true}, target: 'es2022', transform: {react: {runtime: 'automatic'}}}, module: {type: 'commonjs'}});
  const resolve = id => {
    if (id === 'next/link') return ({href, children, ...props}) => React.createElement('a', {href, ...props}, children);
    if (id === 'next/head') return ({children}) => children;
    if (id === 'next/image') return ({priority, fill, ...props}) => React.createElement('img', props);
    if (id === 'next/router') return {useRouter: () => ({isReady: true, query: {}, asPath: '/lernen', replace: async () => true})};
    if (id.endsWith('.module.css')) return {__esModule: true, default: new Proxy({}, {get: (_, key) => String(key)})};
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), (path.extname(id) ? id : id + '.js'))), cache);
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}

test('The learning overview exposes one search, twelve real photo categories, and complete optional learning paths', () => {
  const data = load('lib/learning-overview-server.js').getLearningOverviewData();
  const html = renderToStaticMarkup(React.createElement(load('components/LearningOverview.js').default, {data}));
  assert.equal((html.match(/type="search"/g) || []).length, 1);
  assert.doesNotMatch(html, /<input[^>]+id="learning-search"|<button[^>]*>Treffer anzeigen|<a[^>]+aria-label="Lerneinheit öffnen:/);
  assert.equal((html.match(/href="\/lernen\/[a-z-]+" class="cardLink"/g) || []).length, 12);
  const paths = load('lib/learning-curriculum.js').learningPaths.filter(item => !item.advanced);
  for (const path of paths) { assert.ok(html.includes(path.title)); for (const id of path.moduleIds) assert.ok(html.includes(`/kurse/${id}`)); }
  assert.ok(html.indexOf('Kategorien') < html.indexOf('all-search-title'));
});

test('Category pages put photographed courses before deduplicated extra resources, with no separate opening button', () => {
  const getData = load('lib/learning-overview-server.js').getLearningOverviewData;
  const Component = load('components/LearningOverview.js').default;
  for (const category of ['hundewesen', 'wildkunde', 'jagdrecht']) {
    const html = renderToStaticMarkup(React.createElement(Component, {data: getData(category)}));
    assert.equal((html.match(/type="search"/g) || []).length, 1);
    assert.ok(html.indexOf('learning-modules-heading') < html.indexOf('learning-resources-heading'));
    assert.doesNotMatch(html, /Lerneinheit öffnen|id="learning-country"/);
    const resourceHtml = html.split('id="learning-resources-heading"')[1]?.split('</ul>')[0] || '';
    const targets = new Set(load('lib/learning-experiences.js').learningExperiences.map(item => item.href));
    const links = [...resourceHtml.matchAll(/href="([^"]+)"/g)].map(match => match[1]).filter(href => targets.has(href));
    assert.equal(new Set(links).size, links.length);
  }
});

test('A lesson search link resolves to its actual lesson, including encoded IDs, while malformed links are ignored', () => {
  const navigation = load('lib/learning-lesson-navigation.js');
  const modules = load('lib/learning-curriculum.js').learningModules;
  for (const module of modules) module.lessons.forEach((lesson, index) => assert.equal(navigation.lessonIndexFromHash(module.lessons, navigation.lessonHash(lesson.id)), index));
  const lessons = [{id: 'test ä/ö'}];
  assert.equal(navigation.lessonIndexFromHash(lessons, navigation.lessonHash(lessons[0].id)), 0);
  for (const hash of ['#lesson-%E0%A4%A', '#other', '#lesson-missing', null]) assert.equal(navigation.lessonIndexFromHash(lessons, hash), -1);
});

test('All seven extensions appear once in existing categories and deep searches address real content', () => {
  const extensions = load('lib/learning-experiences.js').learningExperiences.filter(item => item.featured);
  assert.equal(extensions.length, 7);
  assert.equal(new Set(extensions.map(item => item.href)).size, 7);
  const categories = load('lib/learning-categories.js').learningCategoryDetails.map(item => item.slug);
  const getData = load('lib/learning-overview-server.js').getLearningOverviewData;
  const Component = load('components/LearningOverview.js').default;
  for (const tool of extensions) {
    assert.ok(fs.existsSync(path.join(root, 'pages', tool.href + '.js')), tool.href);
    for (const category of tool.categories) {
      assert.ok(categories.includes(category));
      const html = renderToStaticMarkup(React.createElement(Component, {data: getData(category)}));
      assert.equal((html.match(new RegExp('href="' + tool.href + '"', 'g')) || []).length, 1, `${category}: ${tool.href}`);
    }
  }
  const search = load('lib/learning-search.js').searchLearning;
  for (const [query, target] of [['Gams Wildjahr', '/lernen/wildjahr?art=gamswild'], ['Schulter', '/lernen/wildbret-stuecke?eintrag=schulter'], ['DWD', '/lernen/forschung-verstehen?datensatz=temperatur'], ['Collembola', '/lernen/kleines-revierleben?thema=springschwaenze'], ['Basset Fährtenende', '/lernen/jagdhund-videos?eintrag=basset-faehrtenende']]) {
    const results = search({query}).results;
    assert.ok(results.some(item => item.href.startsWith(target)), `${query}: ${target}`);
    assert.ok(results.every(item => !item.correct && !item.answers && !item.explain));
  }
});

test('New exact media paths are unique and resolve to delivered files', () => {
  const paths = load('lib/knowledge-expansion-assets.js').knowledgeExpansionAssetPaths;
  assert.equal(paths.length, new Set(paths).size);
  for (const src of paths) assert.ok(fs.statSync(path.join(root, 'public', src)).isFile(), src);
});

test('New dog photos decode, match provenance hashes, and are allowed as public learning photographs', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/lernen/hunde-2026/quellen.json'), 'utf8'));
  const paths = load('lib/learning-image-paths.js').learningImagePaths;
  assert.equal(manifest.assets.length, 3);
  for (const photo of manifest.assets) {
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src));
    const meta = await sharp(bytes).metadata();
    assert.ok(paths.includes(photo.src));
    assert.equal(meta.width, photo.width); assert.equal(meta.height, photo.height);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), photo.sha256);
    assert.equal(photo.aiGenerated, false); assert.equal(photo.provenance.type, 'documentary-photograph');
    assert.ok(photo.provenance.camera && photo.author && photo.licenseUrl && photo.modifications);
  }
  const breeds = load('lib/dog-compass.js').dogBreeds;
  for (const photo of manifest.assets) assert.equal(breeds.find(breed => breed.id === photo.id)?.photo.src, photo.src);
  const media = load('lib/learning-media.js').getLearningMedia;
  assert.equal(media({id: 'wissen-vertiefung-hunde-vorstehrassen', imageKey: 'hundewesen'}).src, '/lernen/hunde-2026/kurzhaar.jpg');
  assert.equal(media({id: 'wissen-vertiefung-hunde-retriever-spaniels', imageKey: 'hundewesen'}).src, '/lernen/hunde-2026/labrador.jpg');
});

test('Every expanded wildlife section renders its actual text, question and source without orphaned course links', () => {
  const profiles = load('lib/wildlife-depth.js').wildlifeDepthBySlug;
  const species = load('lib/dach-wildlife.js').dachWildlifeBySlug;
  const Component = load('components/WildlifeDepth.js').default;
  const getModule = load('lib/learning-curriculum.js').getLearningModule;
  const titles = load('lib/wildlife-depth-course-links.js').wildlifeDepthCourseTitles;
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'components/WildlifeDepth.js'), 'utf8'), /from ["'].*learning-curriculum/);
  for (const [slug, profile] of Object.entries(profiles)) {
    assert.ok(species[slug], slug);
    const html = renderToStaticMarkup(React.createElement(Component, {slug, name: species[slug].name}));
    assert.ok(html.includes('Wissen vertiefen'));
    for (const source of profile.sources) assert.ok(html.includes(source.url.replace(/&/g, '&amp;')));
    for (const id of profile.courseIds) { assert.ok(getModule(id), `${slug}: ${id}`); assert.equal(titles[id], getModule(id).title); assert.ok(html.includes(`/kurse/${id}`)); }
  }
});
