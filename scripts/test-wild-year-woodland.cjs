const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const swc = local('next/dist/build/swc');
const load = createLoader();
const woodland = load('lib/wild-year-woodland-2026-10-27.js');
const current = load('lib/wild-year.js');
const catalog = load('lib/wild-year-catalog.js').wildYearCatalog;
const overview = load('lib/wild-year-overview-server.js').getWildYearOverview;

// Read all baseline imports from the pinned commit, never from the live files.
// Thus a changed old source/profile cannot accidentally become its own oracle.
function baselineLoader(revision) {
  const cache = new Map();
  return function read(relative) {
    const normalized = relative.replaceAll('\\', '/');
    if (cache.has(normalized)) return cache.get(normalized).exports;
    const source = execFileSync('git', ['show', `${revision}:${normalized}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(normalized, module);
    if (normalized.endsWith('.json')) { module.exports = JSON.parse(source); return module.exports; }
    const { code } = swc.transformSync(source, { filename: path.join(root, normalized), disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => {
      if (!id.startsWith('.')) return local(id);
      return read(path.posix.normalize(path.posix.join(path.posix.dirname(normalized), path.posix.extname(id) ? id : `${id}.js`)));
    }, module, module.exports);
    return module.exports;
  };
}

test('All 30 previous monthly profiles and all old sources remain complete and in their original relative order', () => {
  const before = baselineLoader('3983e1e')('lib/wild-year.js');
  assert.equal(before.wildYearSpecies.length, 30);
  assert.deepEqual(current.wildYearSpecies.slice(0, 30), before.wildYearSpecies);
  assert.deepEqual(current.wildYearSpecies.slice(30), woodland.wildYearWoodlandSpecies);
  const oldIds = Object.keys(before.wildYearSources);
  assert.deepEqual(Object.keys(current.wildYearSources).filter(id => oldIds.includes(id)), oldIds);
  for (const id of oldIds) assert.deepEqual(current.wildYearSources[id], before.wildYearSources[id], id);
  assert.deepEqual(Object.keys(current.wildYearSources).filter(id => !oldIds.includes(id)), Object.keys(woodland.wildYearWoodlandSources));
  assert.equal(current.wildYearReviewedOn, before.wildYearReviewedOn);
  assert.equal(current.smallGameYearReviewedOn, before.smallGameYearReviewedOn);
});

test('Two woodland calendars cover every month once per field and every phase has its exact independent source mapping', () => {
  assert.deepEqual(woodland.wildYearWoodlandSpecies.map(item => item.slug), ['wildkatze', 'eichhoernchen']);
  assert.equal(Object.keys(woodland.wildYearWoodlandSources).length, 11);
  const ids = new Set();
  for (const species of woodland.wildYearWoodlandSpecies) {
    assert.ok(catalog.some(item => item.slug === species.slug)); assert.equal(species.reviewedOn, '2026-10-27');
    assert.equal(species.coatLabel, 'Aussehen'); assert.equal(species.secondaryLabel, 'Nahrung');
    for (const field of ['coat', 'crown', 'reproduction', 'behavior']) {
      for (let month = 1; month <= 12; month++) assert.equal(species[field].filter(item => item.months.includes(month)).length, 1, `${species.slug}/${field}/${month}`);
      for (const phase of species[field]) {
        assert.ok(phase.id.startsWith('oct27w-')); assert.ok(!ids.has(phase.id)); ids.add(phase.id);
        assert.ok(phase.title && phase.text && phase.sourceIds.length >= 2);
        assert.ok(new Set(phase.sourceIds.map(id => {
          const source = woodland.wildYearWoodlandSources[id]; assert.ok(source, id);
          assert.match(source.url, /^https:\/\//); assert.ok(source.label); return source.organization;
        })).size >= 2);
      }
    }
    assert.ok(species.uncertainty.length > 100);
    const words = ['coat', 'crown', 'reproduction', 'behavior'].flatMap(field => species[field]).map(item => item.text).join(' ').split(/\s+/).length;
    assert.ok(words >= 120 && words <= 180, `${species.slug}: ${words}`);
  }
  assert.equal(ids.size, 13);
});

test('Early/late litters and the post-nest distinction retain concrete source roles without a hard independence clock', () => {
  const cat = woodland.wildYearWoodlandSpecies[0], squirrel = woodland.wildYearWoodlandSpecies[1];
  const claim = (species, month) => species.reproduction.find(item => item.months.includes(month));
  assert.match(claim(cat, 3).text, /Geburten.*März.*überlappen/);
  assert.match(claim(cat, 9).text, /Ersatzwürfe.*September/);
  assert.deepEqual(claim(cat, 10).sourceIds, ['oct27wCatEcology', 'oct27wCatDJV']);
  assert.match(cat.uncertainty, /weder.*festen Geburtstag.*einheitlichen Termin/);
  assert.match(claim(squirrel, 12).text, /können Ende Dezember/);
  assert.match(claim(squirrel, 2).text, /Februar bis August/);
  assert.match(claim(squirrel, 9).text, /Verlassen des Kobels.*nicht.*Milch/);
  assert.deepEqual(claim(squirrel, 9).sourceIds, ['oct27wSquirrelHofmann', 'oct27wSquirrelADW']);
  assert.match(squirrel.uncertainty, /keinen festen Altersstand oder Stilltermin im November/);
  assert.ok(!Object.hasOwn(woodland.wildYearWoodlandSources, 'oct27wSquirrelErlen'));
});

test('The canonical catalog remains 114 portraits: 32 monthly calendars, 30 annual overviews and 52 species overviews', () => {
  assert.equal(catalog.length, 114); assert.equal(current.wildYearSpecies.length, 32);
  const remaining = catalog.filter(item => !current.wildYearSpecies.some(species => species.slug === item.slug));
  assert.equal(remaining.filter(item => overview(item.slug).coverage === 'annual').length, 30);
  assert.equal(remaining.filter(item => overview(item.slug).coverage === 'species').length, 52);
  for (const species of woodland.wildYearWoodlandSpecies) {
    const entry = current.wildYearSearchEntries.find(item => item.speciesSlug === species.slug);
    assert.equal(entry.href, `/lernen/wildjahr?art=${species.slug}`); assert.match(entry.description, /Monat wählen/);
    for (let month = 1; month <= 12; month++) {
      const view = current.getWildYearProfile(species.slug, month);
      assert.equal(view.species, species); assert.equal(view.month, month); assert.equal(view.sections.length, 4);
      for (const section of view.sections) assert.ok(species[section.key].includes(section.claim));
    }
  }
});
