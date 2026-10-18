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
const routerStateByCache = new WeakMap();
const htmlValue = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function knowledgeSection(html) {
  const start = html.indexOf('<section id="learning-modules"');
  assert.ok(start >= 0, 'The knowledge tree has its own stable section anchor');
  return html.slice(start, html.indexOf('</section>', start) + '</section>'.length);
}
function load(relative, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  if (cache.has(filename)) return cache.get(filename);
  const mod = {exports: {}};
  const {code} = swc.transformSync(fs.readFileSync(filename, 'utf8'), {filename, disableNextSsg: true, jsc: {parser: {syntax: 'ecmascript', jsx: true}, target: 'es2022', transform: {react: {runtime: 'automatic'}}}, module: {type: 'commonjs'}});
  const resolve = id => {
    if (id === 'next/link') return ({href, children, prefetch, ...props}) => React.createElement('a', {href, ...props}, children);
    if (id === 'next/head') return ({children}) => children;
    if (id === 'next/image') return ({priority, fill, ...props}) => React.createElement('img', props);
    if (id === 'next/router') return {useRouter: () => routerStateByCache.get(cache) || ({isReady: true, query: {}, asPath: '/lernen', replace: async () => true})};
    if (id.endsWith('.module.css')) return {__esModule: true, default: new Proxy({}, {get: (_, key) => String(key)})};
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), (path.extname(id) ? id : id + '.js'))), cache);
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}

test('The learning overview exposes one search, twelve direct categories, and complete optional learning paths', () => {
  const data = load('lib/learning-overview-server.js').getLearningOverviewData();
  const html = renderToStaticMarkup(React.createElement(load('components/LearningOverview.js').default, {data}));
  assert.equal((html.match(/type="search"/g) || []).length, 1);
  assert.doesNotMatch(html, /<input[^>]+id="learning-search"|<button[^>]*>Treffer anzeigen|<a[^>]+aria-label="Lerneinheit öffnen:/);
  assert.equal((html.match(/href="\/lernen\/[a-z-]+" class="cardLink"/g) || []).length, 12);
  const paths = load('lib/learning-curriculum.js').learningPaths.filter(item => !item.advanced);
  for (const path of paths) { assert.ok(html.includes(path.title)); for (const id of path.moduleIds) assert.ok(html.includes(`/kurse/${id}`)); }
  assert.ok(html.indexOf('Kategorien') < html.indexOf('all-search-title'));
});

test('All twelve category roots expose their real topic branches before optional practice, without a flat course directory', () => {
  const cache = new Map();
  const getData = load('lib/learning-overview-server.js', cache).getLearningOverviewData;
  const Component = load('components/LearningOverview.js', cache).default;
  for (const category of load('lib/learning-categories.js', cache).learningCategoryDetails.map(item => item.slug)) {
    const data = getData(category);
    assert.deepEqual(data.covers, [], 'Reading lists do not transfer unused course photo summaries');
    routerStateByCache.set(cache, {isReady: true, query: {}, asPath: `/lernen/${category}`});
    const html = renderToStaticMarkup(React.createElement(Component, {data}));
    const tree = knowledgeSection(html);
    assert.ok(html.indexOf('id="learning-modules"') < html.indexOf('id="lernen-suche"'), 'Category navigation precedes the optional search route');
    assert.equal((html.match(/type="search"/g) || []).length, 1);
    if (data.resources.some(tool => !tool.featured)) assert.ok(html.indexOf('id="learning-modules-heading"') < html.indexOf('id="learning-resources-heading"'));
    if (data.resources.some(tool => tool.featured)) {
      assert.ok(html.indexOf('id="learning-modules-heading"') < html.indexOf('id="learning-featured-heading"'));
      assert.ok(html.indexOf('id="learning-featured-heading"') < html.indexOf('aria-label="Deine Kurse"'));
    }
    if (data.resources.length) assert.ok(html.includes('<summary>Videos, Stimmen und Übungen in dieser Kategorie</summary>'));
    assert.doesNotMatch(html, /Lerneinheit öffnen|id="learning-country"/);
    assert.doesNotMatch(html, /class="lessonPreview"/);
    assert.ok(tree.includes('Unterkategorien'));
    assert.doesNotMatch(tree, /href="\/kurse\/|<details|<button|<img/, `${category}: start with a compact branch choice`);
    const branchTargets = [...tree.matchAll(/href="([^"]*\?bereich=[^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(branchTargets, data.topicGroups.map(group => `/lernen/${category}?bereich=${encodeURIComponent(group.id)}#learning-modules`));
    const byId = new Map(data.modules.map(module => [module.id, module]));
    for (const group of data.topicGroups) {
      assert.ok(tree.includes(htmlValue(group.title)), group.id);
      const courses = group.moduleIds.map(id => byId.get(id));
      const lessonCount = courses.reduce((sum, module) => sum + module.lessonCount, 0);
      assert.ok(tree.includes(`${courses.length} Themenbereiche · ${lessonCount} Wissenstexte`), `${category}/${group.id}: actual branch counts`);
    }
    const resourceHtml = html.split('id="learning-resources-heading"')[1]?.split('</ul>')[0] || '';
    const targets = new Set(load('lib/learning-experiences.js').learningExperiences.map(item => item.href));
    const links = [...resourceHtml.matchAll(/href="([^"]+)"/g)].map(match => match[1]).filter(href => targets.has(href));
    assert.equal(new Set(links).size, links.length);
  }
});

test('Every selected category branch shows exactly its own courses and all exact lesson links, including after another route was rendered', () => {
  const cache = new Map();
  const { getLearningOverviewData } = load('lib/learning-overview-server.js', cache);
  const Component = load('components/LearningOverview.js', cache).default;
  const { getLearningModule } = load('lib/learning-curriculum.js', cache);
  const { lessonHash } = load('lib/learning-lesson-navigation.js', cache);
  for (const category of load('lib/learning-categories.js', cache).learningCategoryDetails) {
    const data = getLearningOverviewData(category.slug);
    const byId = new Map(data.modules.map(module => [module.id, module]));
    for (const group of data.topicGroups) {
      routerStateByCache.set(cache, {isReady: true, query: {bereich: group.id}, asPath: `/lernen/${category.slug}?bereich=${group.id}#learning-modules`});
      const tree = knowledgeSection(renderToStaticMarkup(React.createElement(Component, {data})));
      assert.ok(tree.includes(`aria-current="page">${htmlValue(group.title)}`), `${category.slug}/${group.id}: current breadcrumb`);
      assert.ok(tree.includes(`href="/lernen/${category.slug}"`), 'The category parent is directly reachable');
      const expected = group.moduleIds.flatMap(id => {
        const module = byId.get(id);
        const original = getLearningModule(id);
        assert.equal(module.topics.length, original.lessons.length, id);
        assert.ok(tree.includes(`<h3>${htmlValue(module.title)}</h3>`), id);
        return original.lessons.map((lesson, index) => {
          const href = `/kurse/${id}${lessonHash(lesson.id)}`;
          assert.deepEqual(module.topics[index], {title: lesson.title, href});
          assert.ok(tree.includes(htmlValue(lesson.title)), `${id}/${lesson.id}`);
          return htmlValue(href);
        });
      });
      const actual = [...tree.matchAll(/href="(\/kurse\/[^\"]+)"/g)].map(match => match[1]);
      assert.deepEqual(actual, expected, `${category.slug}/${group.id}: no hidden, duplicated or foreign lesson links`);
      assert.doesNotMatch(tree, /<details|<button|<img/, 'Every selected knowledge topic is a direct readable lesson link');
    }
  }
});

test('Invalid or array-valued branch queries return the category root safely rather than opening an arbitrary first branch', () => {
  const cache = new Map();
  const { getLearningOverviewData } = load('lib/learning-overview-server.js', cache);
  const Component = load('components/LearningOverview.js', cache).default;
  for (const category of load('lib/learning-categories.js', cache).learningCategoryDetails) {
    const data = getLearningOverviewData(category.slug);
    for (const bereich of ['unknown-branch', '<script>alert(1)</script>', [data.topicGroups[0].id], [data.topicGroups[0].id, data.topicGroups[1].id]]) {
      routerStateByCache.set(cache, {isReady: true, query: {bereich}, asPath: `/lernen/${category.slug}`});
      const tree = knowledgeSection(renderToStaticMarkup(React.createElement(Component, {data})));
      assert.ok(tree.includes('Unterkategorien'));
      assert.doesNotMatch(tree, /href="\/kurse\/|<script/);
      assert.equal((tree.match(/\?bereich=/g) || []).length, data.topicGroups.length);
      if (typeof bereich === 'string') assert.ok(tree.includes('role="status"'), 'Unknown branches explain how to continue');
    }
  }
});

test('Overview photo summaries preserve exact delivered media and attribution without transferring full lesson datasets', async () => {
  const summaries = load('lib/learning-featured-media.js').learningFeaturedMedia;
  const getData = load('lib/learning-overview-server.js').getLearningOverviewData;
  assert.equal(Object.keys(summaries).length, 5);
  assert.deepEqual(getData().featuredMedia, {});
  assert.ok(getData().modules.every(module => module.topics === undefined), 'The complete directory does not load every lesson title');
  assert.equal(new Set(Object.values(summaries).map(photo => photo.src)).size, 5);
  for (const [href, photo] of Object.entries(summaries)) {
    const dimensions = await sharp(path.join(root, 'public', photo.src)).metadata();
    assert.equal(dimensions.width, photo.width, href); assert.equal(dimensions.height, photo.height, href);
    assert.ok(photo.purpose && photo.credit && photo.alt && photo.creditUrl.startsWith('https://') && photo.licenseUrl.startsWith('https://'), href);
    assert.ok(Object.values(photo).every(value => typeof value === 'string' || typeof value === 'number'));
  }
  for (const category of ['hundewesen', 'wildkunde', 'natur-revier']) {
    const data = getData(category);
    const expected = load('lib/learning-experiences.js').learningExperiences.filter(tool => tool.featured && tool.categories.includes(category) && summaries[tool.href]?.purpose).map(tool => tool.href).sort();
    assert.deepEqual(Object.keys(data.featuredMedia).sort(), expected);
    assert.ok(data.modules.every(module => !module.lessons && !module.questions));
    for (const module of data.modules) {
      assert.ok(module.topics.every(topic => Object.keys(topic).sort().join(',') === 'href,title'), 'Category links transfer only titles and destinations');
    }
  }
});

test('Every overview photo keeps its delivered image, fitting and full visible credit while sharing repeated covers', () => {
  const cache = new Map();
  const { getLearningOverviewData } = load('lib/learning-overview-server.js', cache);
  const { getLearningMedia } = load('lib/learning-media.js', cache);
  const { learningCategoryDetails } = load('lib/learning-categories.js', cache);
  const { learningPaths } = load('lib/learning-curriculum.js', cache);
  const { learningExperiences } = load('lib/learning-experiences.js', cache);
  const { practiceHighlights } = load('lib/practice-catalog.js', cache);
  const { learningTools, legalLearningHubs } = load('lib/learning-tool-catalog.js', cache);
  const { LearningCover, LearningPhotoCredit } = load('components/LearningPhoto.js', cache);
  const renderCover = media => renderToStaticMarkup(React.createElement(LearningCover, { media, compact: true }));
  const renderCredit = media => renderToStaticMarkup(React.createElement(LearningPhotoCredit, { media }));
  for (const slug of [undefined, ...learningCategoryDetails.map(category => category.slug)]) {
    const data = getLearningOverviewData(slug);
    assert.ok(data.covers.length < data.modules.length, slug || 'all');
    assert.equal(new Set(data.covers.map(cover => JSON.stringify(cover))).size, data.covers.length);
    for (const module of data.modules) {
      const media = getLearningMedia(module);
      assert.equal(renderCover(data.covers[module.coverIndex]), !slug && media?.coursePhotoUse ? renderCover(media) : '', module.id);
    }
    assert.deepEqual(data.categoryCovers, {}, 'The compact category menu needs no photo payload');
    const selectedIds = new Set(data.modules.map(module => module.id));
    const expectedPaths = learningPaths.filter(path => !slug || path.advanced)
      .map(path => ({ ...path, moduleIds: path.moduleIds.filter(id => selectedIds.has(id)) })).filter(path => path.moduleIds.length);
    assert.deepEqual(data.paths, expectedPaths);
    const expectedResources = slug ? [...practiceHighlights, ...learningExperiences, ...learningTools, ...(slug === 'jagdrecht' ? legalLearningHubs : [])]
      .filter(tool => tool.categories.includes(slug)).filter((tool, index, all) => all.findIndex(item => item.href === tool.href) === index)
      .map(({ href, icon, title, description, featured }) => ({ href, icon, title, description, ...(featured ? { featured: true } : {}) })) : [];
    assert.deepEqual(data.resources, expectedResources);
    assert.ok(data.covers.every(cover => !cover.pictures && !cover.diagram && !cover.caption && !cover.originalWidth && !cover.verification));
    assert.doesNotThrow(() => JSON.stringify(data));
  }
  assert.equal(getLearningOverviewData('unknown-category'), null);
});

test('Rendering the overview and simple photo credits never imports complete media or learning catalogs into the browser', () => {
  for (const entry of ['components/LearningOverview.js', 'components/LearningPhoto.js', 'components/WildlifePhoto.js']) {
    const graph = new Map();
    load(entry, graph);
    for (const filename of graph.keys()) {
      assert.doesNotMatch(filename.replaceAll('\\', '/'), /\/lib\/(?:learning-curriculum|learning-media|learning-wildlife-photos|learning-category-photos|dog-photographs|learning-experiences|learning-tool-catalog)\.js$/, entry);
    }
  }
});

test('Practice and law discovery cards retain their original three courses and counts with only server-prepared summaries', () => {
  const cache = new Map();
  const { learningModules } = load('lib/learning-curriculum.js', cache);
  for (const [filename, category, title] of [
    ['pages/jagdpraxis/index.js', 'Jagdpraxis', 'Vor den Simulatoren: Praxiswissen vertiefen'],
    ['pages/jagdrecht/index.js', 'Jagdrecht', 'Jagdrecht Schritt für Schritt lernen'],
  ]) {
    const Page = load(filename, cache);
    const props = Page.getStaticProps().props;
    const original = learningModules.filter(module => module.category === category).slice(0, 3);
    assert.deepEqual(props.discoveryModules, original.map(module => ({ id: module.id, title: module.title, lessonCount: module.lessons.length, questionCount: module.questions.length })));
    assert.ok(props.discoveryModules.every(module => Object.keys(module).sort().join(',') === 'id,lessonCount,questionCount,title'));
    const html = renderToStaticMarkup(React.createElement(Page.default, props));
    assert.ok(html.includes(title));
    for (const module of original) {
      assert.ok(html.includes(`href="/kurse/${module.id}"`));
      assert.ok(html.includes(module.title));
      assert.ok(html.includes(`${module.lessons.length} Lektionen · ${module.questions.length} Fragen`));
    }
    const categorySlug = category === 'Jagdrecht' ? 'jagdrecht' : 'jagdpraxis';
    assert.ok(html.includes(`href="/lernen/${categorySlug}"`));
  }
  const graph = new Map();
  load('components/LearningDiscovery.js', graph);
  assert.ok([...graph.keys()].every(filename => !filename.replaceAll('\\', '/').endsWith('/lib/learning-curriculum.js')));
});

test('A lesson search link resolves to its actual lesson, including encoded IDs, while malformed links are ignored', () => {
  const navigation = load('lib/learning-lesson-navigation.js');
  const modules = load('lib/learning-curriculum.js').learningModules;
  for (const module of modules) module.lessons.forEach((lesson, index) => assert.equal(navigation.lessonIndexFromHash(module.lessons, navigation.lessonHash(lesson.id)), index));
  const lessons = [{id: 'test ä/ö'}];
  assert.equal(navigation.lessonIndexFromHash(lessons, navigation.lessonHash(lessons[0].id)), 0);
  for (const hash of ['#lesson-%E0%A4%A', '#other', '#lesson-missing', null]) assert.equal(navigation.lessonIndexFromHash(lessons, hash), -1);
});

test('All eight extensions appear once in existing categories and deep searches address real content', () => {
  const extensions = load('lib/learning-experiences.js').learningExperiences.filter(item => item.featured);
  assert.equal(extensions.length, 8);
  assert.equal(new Set(extensions.map(item => item.href)).size, 8);
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

test('Every expanded wildlife portrait keeps its actual text and sources in its reader topics, with each deep course linked once', () => {
  const profiles = load('lib/wildlife-depth.js').wildlifeDepthBySlug;
  const species = load('lib/dach-wildlife.js').dachWildlifeBySlug;
  const Component = load('components/WildlifePortraitLayout.js').default;
  const getModule = load('lib/learning-curriculum.js').getLearningModule;
  const titles = load('lib/wildlife-depth-course-links.js').wildlifeDepthCourseTitles;
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'components/WildlifeDepth.js'), 'utf8'), /from ["'].*learning-curriculum/);
  for (const [slug, profile] of Object.entries(profiles)) {
    assert.ok(species[slug], slug);
    const layout = Component({slug, title: species[slug].name});
    const reader = React.Children.toArray(layout.props.children).find(child => React.isValidElement(child) && Array.isArray(child.props.groups));
    assert.ok(reader, `${slug}: actual authored reader groups are reachable`);
    const topics = reader.props.groups.flatMap(group => group.topics);
    assert.equal(new Set(topics.map(topic => topic.id)).size, topics.length, `${slug}: each reader topic has an unambiguous anchor`);
    const html = topics.map(topic => renderToStaticMarkup(topic.render())).join('');
    for (const field of ['seasonalLife', 'fieldSigns', 'comparisons', 'observation']) {
      for (const text of profile[field]) assert.ok(html.includes(htmlValue(text)), `${slug}: ${field} retains its exact authored text`);
    }
    for (const question of profile.learningQuestions) {
      assert.ok(html.includes(htmlValue(question.q)), `${slug}: the question stays in its reader topic`);
      assert.ok(html.includes(htmlValue(question.answer)));
      assert.ok(html.includes(htmlValue(question.explain)));
    }
    for (const source of profile.sources) assert.ok(html.includes(source.url.replace(/&/g, '&amp;')));
    for (const id of profile.courseIds) { assert.ok(getModule(id), `${slug}: ${id}`); assert.equal(titles[id], getModule(id).title); assert.equal(html.split(`href="/kurse/${id}"`).length - 1, 1, `${slug}: one clear course entry`); }
  }
});
