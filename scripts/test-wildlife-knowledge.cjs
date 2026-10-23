// Structure, source attachment, rendering and discovery checks. These are not
// a replacement for the claim-by-claim editorial source review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const swc = pr('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const resolve = id => {
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')));
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const dataset = load('data/wildlife-knowledge-expansion-2026-10-18.json');
const discovery = load('data/wildlife-knowledge-discovery-2026-10-18.json');
const fullCatalog = load('lib/european-wildlife.js');
const lightCatalog = load('lib/european-wildlife-discovery.js');
const sourceById = new Map(dataset.sources.map(source => [source.id, source]));
const { matchWildlifeSection } = load('lib/wildlife-section-match.js');

test('New knowledge belongs to real existing portraits and retains independent section evidence', () => {
  assert.equal(dataset.species.length, 6);
  assert.equal(new Set(dataset.species.map(species => species.slug)).size, dataset.species.length);
  assert.equal(sourceById.size, dataset.sources.length);
  for (const profile of dataset.species) {
    assert.ok(fullCatalog.europeanWildlifeBySlug[profile.slug], profile.slug);
    assert.equal(profile.reviewedOn, '2026-10-18');
    assert.ok(profile.sections.length >= 3);
    assert.equal(new Set(profile.sections.map(section => section.id)).size, profile.sections.length);
    for (const section of profile.sections) {
      assert.match(section.id, /^[a-z][a-z0-9-]+$/);
      assert.ok(section.title.length > 8);
      assert.ok(section.text.length > 120, `${profile.slug}:${section.id}`);
      const sources = section.sourceIds.map(id => sourceById.get(id));
      assert.ok(sources.every(Boolean), `${profile.slug}:${section.id}: source reference`);
      assert.ok(new Set(sources.map(source => source.organization)).size >= 2, `${profile.slug}:${section.id}: independent organizations`);
      for (const source of sources) {
        assert.equal(new URL(source.url).protocol, 'https:');
        assert.ok(source.title && source.supports?.length);
      }
    }
  }
});

test('The small discovery projection contains the exact teaching text, without source dossiers or quiz keys', () => {
  const expected = dataset.species.map(species => ({ slug: species.slug, sections: species.sections.map(section => ({ id: section.id, title: section.title, text: section.text, ...(section.observationNote ? { observationNote: section.observationNote } : {}) })) }));
  assert.deepEqual(discovery.species, expected);
  assert.doesNotMatch(JSON.stringify(discovery), /"(?:sources|sourceIds|questions|correct|answer|supports|limits)"\s*:/);
});

test('New text is visible without opening details; each claim block links its own sources and real section ID', () => {
  const Component = load('components/WildlifeKnowledgeExpansion.js').default;
  for (const profile of dataset.species) {
    const html = renderToStaticMarkup(React.createElement(Component, { slug: profile.slug, name: fullCatalog.europeanWildlifeBySlug[profile.slug].name }));
    assert.match(html, /id="artenwissen-vertiefung"/);
    assert.match(html, /18\. Oktober 2026/);
    for (const section of profile.sections) {
      assert.ok(html.includes(`id="art-wissen-${section.id}"`));
      assert.ok(html.includes(section.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')));
      for (const id of section.sourceIds) assert.ok(html.includes(sourceById.get(id).url.replace(/&/g, '&amp;')));
    }
    const beforeSources = html.split('<details')[0];
    assert.ok(beforeSources.includes('<p>'), 'Teaching text must precede optional source disclosure');
    for (const section of profile.sections) assert.ok(beforeSources.includes(section.text.slice(0, 50)), 'Every knowledge section remains directly visible before the source appendix');
    assert.match(html, /<details class="sources"><summary>Fachquellen und Prüfstand<\/summary>/);
    assert.doesNotMatch(beforeSources, /Diese Vertiefung wurde am/);
  }
  assert.equal(renderToStaticMarkup(React.createElement(Component, { slug: 'nicht-vorhanden' })), '');
});

test('Full and light species catalogs search new knowledge consistently and target actual knowledge sections', () => {
  for (const profile of dataset.species) for (const section of profile.sections) {
    const query = `${fullCatalog.europeanWildlifeBySlug[profile.slug].name} ${section.title}`;
    const full = fullCatalog.filterEuropeanWildlife({ query }).map(species => species.slug);
    const light = lightCatalog.filterEuropeanWildlife({ query }).map(species => species.slug);
    assert.deepEqual(light, full);
    assert.ok(light.includes(profile.slug), query);
    const target = matchWildlifeSection(fullCatalog.europeanWildlifeBySlug[profile.slug], query);
    assert.ok(profile.sections.some(candidate => target?.href === `/wildkunde/${profile.slug}#art-wissen-${candidate.id}`), query);
  }
  const species = fullCatalog.europeanWildlifeBySlug.loeffelente;
  assert.equal(matchWildlifeSection(species, 'Löffelente'), null);
});

test('The central learning search finds new species teaching text and opens the matching visible section', () => {
  const search = load('lib/learning-search.js').searchLearning;
  for (const [slug, term] of [['loeffelente', 'Lamellen'], ['bekassine', 'Nestflüchter'], ['schellente', 'Muscheln'], ['kolbenente', 'Armleuchteralgen'], ['knaekente', 'Sahara'], ['waldschnepfe', 'Regenwürmer']]) {
    const species = fullCatalog.europeanWildlifeBySlug[slug];
    const result = search({ query: `${species.name} ${term}`, type: 'species' }).results.find(item => item.id === `species:${slug}`);
    assert.ok(result, `${slug}: searchable teaching text`);
    const profile = dataset.species.find(item => item.slug === slug);
    assert.ok(profile.sections.some(section => result.href === `/wildkunde/${slug}#art-wissen-${section.id}`), `${slug}: real section destination`);
  }
});
