const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const React = projectRequire('react');
const { renderToStaticMarkup } = projectRequire('react-dom/server');
const swc = projectRequire('next/dist/build/swc');
const loaded = new Set();
function load(relative, cache = new Map()) {
  const filename = path.resolve(root, relative); loaded.add(path.relative(root, filename).replaceAll('\\', '/'));
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  });
  const resolve = id => {
    if (id === 'next/link') return { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), cache);
    return projectRequire(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const { getWildlifeLearningGuide: guide, wildlifeGuideTargets: targets } = load('lib/wildlife-learning-guide.js');
const guideDependencies = [...loaded];
const inventory = load('lib/european-wildlife-discovery.js').europeanWildlife;
const curriculum = load('lib/learning-curriculum.js').learningModules;
const byId = Object.fromEntries(curriculum.map(course => [course.id, course]));

test('Every existing portrait receives at most three unique real course/lesson targets, with exact copied display metadata', () => {
  assert.equal(inventory.length, 114);
  for (const species of inventory) {
    const links = guide(species.slug);
    assert.ok(links.length >= 1 && links.length <= 3, species.slug);
    assert.equal(new Set(links.map(link => link.href)).size, links.length, species.slug);
    for (const link of links) {
      const course = byId[link.moduleId]; assert.ok(course, `${species.slug}: ${link.moduleId}`);
      const lesson = link.lessonId ? course.lessons.find(record => record.id === link.lessonId) : null;
      if (link.lessonId) assert.ok(lesson, `${species.slug}: ${link.lessonId}`);
      assert.equal(link.title, (lesson || course).title);
      assert.equal(link.description, lesson ? lesson.takeaway : course.description);
      assert.equal(link.href, `/kurse/${course.id}${lesson ? `#lesson-${encodeURIComponent(lesson.id)}` : ''}`);
      assert.ok(['Vertiefung zur Art', 'Biologische Grundlagen'].includes(link.label));
      assert.equal(link.scope === 'species', link.label === 'Vertiefung zur Art');
      assert.doesNotMatch(link.moduleId, /hunde|hundesinne|hundegebiss/);
    }
  }
  for (const slug of [undefined, '', 'nicht-vorhanden', '__proto__', 'constructor']) assert.deepEqual(guide(slug), []);
});

test('All recorded species-specific deep courses remain linked and known core species get their dedicated course', () => {
  const depth = load('lib/wildlife-depth.js').wildlifeDepthBySlug;
  for (const [slug, profile] of Object.entries(depth)) {
    const specific = guide(slug).filter(link => link.scope === 'species').map(link => link.moduleId);
    for (const courseId of profile.courseIds) assert.ok(specific.includes(courseId), `${slug}: ${courseId}`);
  }
  for (const [slug, moduleId] of Object.entries({ rehwild: 'wissen-rehwild-jahreslauf', rotwild: 'wissen-rotwild-sozialverhalten', schwarzwild: 'wissen-schwarzwild-lebensweise', gamswild: 'wissen-gams-steinbock', steinwild: 'wissen-gams-steinbock' })) {
    assert.ok(guide(slug).some(link => link.moduleId === moduleId && link.scope === 'species'));
  }
  assert.ok(guide('feldhase').some(link => link.lessonId === 'blinddarm' && link.scope === 'species'));
});

test('Biology foundations keep birds, explicit ruminants and Schwarzwild separate and retain the bird model scope', () => {
  const birds = load('lib/wildlife-dentition.js').birdDentitionSlugs;
  const ruminants = new Set(['rehwild', 'rotwild', 'damwild', 'sikawild', 'elchwild', 'rentier', 'muffelwild', 'gamswild', 'steinwild', 'wisent', 'pyrenaeengaemse', 'iberiensteinbock']);
  for (const species of inventory) {
    const links = guide(species.slug);
    assert.equal(links.some(link => link.moduleId === targets.rumination.moduleId), ruminants.has(species.slug), species.slug);
    if (birds.has(species.slug)) {
      assert.ok(links.some(link => link.moduleId === targets.birdBody.moduleId && link.scope === 'foundation'), species.slug);
      for (const link of links.filter(link => link.scope === 'foundation')) assert.ok([targets.birdBody.moduleId, targets.birdStomach.moduleId, targets.birdEgg.moduleId].includes(link.moduleId));
    } else assert.ok(!links.some(link => link.moduleId === targets.birdBody.moduleId), species.slug);
  }
  assert.ok(guide('schwarzwild').some(link => link.lessonId === 'schweinemagen' && link.scope === 'foundation'));
  assert.ok(guide('wolf').every(link => link.scope === 'foundation'));
  assert.match(targets.birdStomach.modelNote, /Modell Huhn/);
  assert.ok(byId[targets.birdStomach.moduleId].lessons.find(lesson => lesson.id === 'vogelmagen').paragraphs.some(text => text.includes('Das Huhn erklärt hier den Grundbauplan')));
});

test('Guide renders knowledge previews as quiet links with scope labels and a stable section anchor, without hidden content or buttons', () => {
  const Component = load('components/WildlifeLearningGuide.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { slug: 'rehwild', name: 'Rehwild' }));
  assert.match(html, /id="art-weiterlernen"/);
  assert.match(html, /Rehwild: weiterlernen/);
  assert.match(html, /Vertiefung zur Art/); assert.match(html, /Biologische Grundlagen/);
  assert.equal((html.match(/<a /g) || []).length, 3);
  assert.doesNotMatch(html, /<button|<details|<img|<video/);
  assert.ok(html.includes(targets.roe.description));
  assert.equal(renderToStaticMarkup(React.createElement(Component, { slug: 'erfunden', name: 'Erfunden' })), '');
});

test('Browser guide keeps its own metadata small and does not import complete course or quiz datasets', () => {
  assert.ok(Buffer.byteLength(fs.readFileSync(path.join(root, 'lib/wildlife-learning-guide.js'))) < 20000);
  for (const filename of guideDependencies) assert.doesNotMatch(filename, /learning-curriculum|learning-wildlife\.js|learning-wildlife-depth|mini-course-details|learning-expansion-|european-wildlife-expansion|wildlife-depth\.js/);
});
