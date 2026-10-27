const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const mod = { exports: {} };
  cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.')
    ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')))
    : pr(id), mod, mod.exports);
  cache.set(filename, mod.exports);
  return mod.exports;
}
const { europeanWildlife } = load('lib/european-wildlife.js');
const { wildYearCatalog } = load('lib/wild-year-catalog.js');
const { getWildYearOverview } = load('lib/wild-year-overview-server.js');
const oldReview = load('data/reviews/wildlife-biology-2026-10-04.json');
const depth = load('lib/wildlife-depth.js').wildlifeDepthBySlug;
const knowledge = load('lib/wildlife-knowledge.js').wildlifeKnowledgeBySlug;
const uniqueSources = items => [...new Map(items.map(item => [item.url, { label: item.label || item.title, url: item.url }])).values()];

test('Wildjahr selection covers the exact canonical 114 portraits with slim biological metadata', () => {
  assert.equal(wildYearCatalog.length, 114);
  assert.deepEqual(wildYearCatalog, europeanWildlife.map(({ slug, name, group, europeanOnly }) => ({ slug, name, group, europeanOnly: Boolean(europeanOnly) })));
  assert.equal(new Set(wildYearCatalog.map(item => item.slug)).size, wildYearCatalog.length);
  for (const item of wildYearCatalog) assert.deepEqual(Object.keys(item).sort(), ['slug', 'name', 'group', 'europeanOnly'].sort());
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'lib/wild-year-catalog.js'), 'utf8'), /^import\s/m);
  assert.equal(wildYearCatalog.filter(item => item.europeanOnly).length, 8);
});

test('Every canonical portrait has useful selected-species reading and honest annual or species-only scope', () => {
  for (const species of europeanWildlife) {
    const view = getWildYearOverview(species.slug);
    assert.equal(view.slug, species.slug);
    assert.equal(view.name, species.name);
    assert.equal(view.scientificName, species.scientificName);
    assert.ok(['annual', 'species'].includes(view.coverage));
    assert.match(view.scopeNote, /Monat.*verändert.*nicht/);
    assert.ok(view.sections.length > 0, species.slug);
    for (const section of view.sections) {
      assert.ok(section.id && section.title && section.paragraphs.length > 0, species.slug);
      assert.ok(section.paragraphs.every(text => typeof text === 'string' && text.length > 15), species.slug);
      assert.equal(new Set(section.paragraphs).size, section.paragraphs.length, species.slug);
      assert.ok(section.sources.length > 0, species.slug);
      for (const source of section.sources) assert.ok(source.label && /^https:\/\//.test(source.url), species.slug);
      assert.ok(!Object.hasOwn(section, 'months'), `${species.slug} has no invented month band`);
    }
    assert.deepEqual(Object.keys(view).sort(), ['slug', 'name', 'scientificName', 'sections', 'coverage', 'scopeNote'].sort());
    assert.ok(!JSON.stringify(view).includes('2026-10-27'), `${species.slug} must not acquire a new factual review date`);
  }
});

test('Existing old portrait annual statements, dates and original source references stay exact', () => {
  let checked = 0;
  for (const original of oldReview.species) {
    const annual = original.sections.find(section => section.heading === 'Fortpflanzung und Jahresverlauf');
    if (!annual || knowledge[original.slug]) continue;
    const view = getWildYearOverview(original.slug);
    assert.equal(view.coverage, 'annual');
    assert.equal(view.sections.length, 1);
    assert.deepEqual(view.sections[0].paragraphs, annual.claims, original.slug);
    assert.equal(view.sections[0].reviewedOn, '2026-10-04');
    assert.deepEqual(view.sections[0].sources.map(source => source.url), [...new Set(annual.sourceRefs)], original.slug);
    const actualPortrait = fs.readFileSync(path.join(root, original.file), 'utf8');
    for (const claim of annual.claims) assert.ok(actualPortrait.includes(claim), `Current ${original.slug} must still contain the inherited statement`);
    checked++;
  }
  assert.equal(checked, 46);
});

test('Six newer source-bound bird annual blocks retain complete text, interpretation notes and only their own sources', () => {
  assert.equal(Object.keys(knowledge).length, 6);
  for (const [slug, original] of Object.entries(knowledge)) {
    const annual = original.sections.filter(section => /brut|jahres|zug|mauser|fortpflanz/.test(section.id));
    const view = getWildYearOverview(slug);
    assert.equal(view.coverage, 'annual');
    assert.deepEqual(view.sections, annual.map(section => ({ id: section.id, title: section.title,
      paragraphs: [section.text, ...(section.observationNote ? [section.observationNote] : [])],
      sources: uniqueSources(section.sources), reviewedOn: '2026-10-18' })));
  }
});

test('European readings preserve actual seasonal sections and source roles without a DACH-presence or hunting assertion', () => {
  const expectedIds = {
    rentier: ['nahrung', 'jahreslauf', 'fortpflanzung'],
    pyrenaeengaemse: ['lebensraum', 'nahrung', 'sozialverhalten', 'fortpflanzung'],
    iberiensteinbock: ['lebensraum', 'sozialverhalten', 'fortpflanzung'],
    rothuhn: ['jahreslauf', 'fortpflanzung'], chukarhuhn: ['sozial-jahreslauf', 'fortpflanzung'],
    moorschneehuhn: ['sozial-jahreslauf', 'fortpflanzung', 'winter-tarnung'],
    kegelrobbe: ['verhalten', 'nachwuchs'], 'iberischer-hase': ['verhalten', 'fortpflanzung'],
  };
  for (const species of europeanWildlife.filter(item => item.europeanOnly)) {
    const view = getWildYearOverview(species.slug);
    assert.match(view.scopeNote, /weder ein DACH-Vorkommen noch eine Jagdfreigabe/);
    assert.deepEqual(view.sections.map(section => section.id), expectedIds[species.slug]);
    for (const section of view.sections) {
      const original = species.sections.find(item => item.id === section.id);
      assert.deepEqual(section.paragraphs, original.paragraphs);
      assert.deepEqual(section.sources, uniqueSources(original.sources));
      assert.equal(section.reviewedOn, '2026-10-16');
    }
  }
});

test('Depth-only seasonal readings retain their original published sentences and review date', () => {
  const inheritedAnnualSlugs = new Set(oldReview.species.filter(item => item.sections.some(section => section.heading === 'Fortpflanzung und Jahresverlauf')).map(item => item.slug));
  const slugs = Object.keys(depth).filter(slug => !inheritedAnnualSlugs.has(slug) && !knowledge[slug]);
  assert.deepEqual(slugs.sort(), ['bisam', 'murmeltier']);
  for (const slug of slugs) {
    const section = getWildYearOverview(slug).sections[0];
    assert.deepEqual(section.paragraphs, depth[slug].seasonalLife);
    assert.deepEqual(section.sources, uniqueSources(depth[slug].sources));
    assert.equal(section.reviewedOn, '2026-10-12');
  }
});

test('Species-only fallback uses original biology instead of invented seasonal facts or review dates', () => {
  const views = europeanWildlife.map(species => [species, getWildYearOverview(species.slug)]).filter(([, view]) => view.coverage === 'species');
  assert.equal(views.length, 52);
  for (const [species, view] of views) {
    assert.match(view.scopeNote, /noch kein geprüfter Monatskalender/);
    const originalParagraphs = [...new Set(species.biology?.length ? species.biology : [species.identification, species.habitat])];
    assert.deepEqual(view.sections[0].paragraphs, originalParagraphs);
    assert.deepEqual(view.sections[0].sources, uniqueSources(species.biologySources));
    assert.equal(Object.hasOwn(view.sections[0], 'reviewedOn'), false);
  }
});

test('Unknown and prototype-like inputs are rejected; projections expose no legal, quiz or answer payload and do not mutate originals', () => {
  for (const invalid of [undefined, null, '', 'unknown', 'constructor', '__proto__', ['fuchs'], {}]) assert.equal(getWildYearOverview(invalid), null);
  for (const species of europeanWildlife) {
    const inspect = value => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        assert.ok(!['quiz', 'correct', 'correctAnswer', 'answer', 'legal', 'countryNotes', 'learningQuestions'].includes(key), `${species.slug}:${key}`);
        inspect(child);
      }
    };
    inspect(getWildYearOverview(species.slug));
  }
  const before = JSON.stringify(getWildYearOverview('fuchs'));
  const projected = getWildYearOverview('fuchs');
  projected.sections[0].paragraphs[0] = 'changed';
  projected.sections[0].sources[0].url = 'changed';
  assert.equal(JSON.stringify(getWildYearOverview('fuchs')), before);
});
