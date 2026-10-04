const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const requireLocal = id => Object.hasOwn(overrides, id) ? overrides[id] : id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, cache) : pr(id);
  new Function('require', 'module', 'exports', code)(requireLocal, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}

test('Canonical DACH catalog is unique, preserves every legacy portrait and provides learning facts plus sourced legal entries', () => {
  const { dachWildlife, dachWildlifeBySlug, legalSources, legalStatusLabels, legacyWildlifeSlugs } = load('lib/dach-wildlife.js');
  assert.ok(dachWildlife.length >= 100);
  assert.equal(new Set(dachWildlife.map(species => species.slug)).size, dachWildlife.length);
  const catalogSlugs = load('lib/wildlife-catalog.js').wildlifeCategories.flatMap(group => group.items.map(species => species.slug));
  assert.deepEqual([...catalogSlugs].sort(), dachWildlife.map(species => species.slug).sort());
  assert.equal(legacyWildlifeSlugs.length, 47);
  for (const slug of legacyWildlifeSlugs) {
    assert.ok(dachWildlifeBySlug[slug]);
    const source = fs.readFileSync(path.join(root, 'pages/wildkunde', slug + '.js'), 'utf8');
    assert.ok(source.includes('WildlifePortraitLayout'), slug);
    assert.ok(source.includes('const quiz ='), `Existing quiz preserved: ${slug}`);
  }
  for (const species of dachWildlife) {
    for (const key of ['name', 'scientificName', 'group', 'identification', 'habitat', 'confusion', 'voice']) assert.ok(typeof species[key] === 'string' && species[key].length > 0, `${species.slug}:${key}`);
    assert.ok(species.biologySources.length > 0);
    for (const source of species.biologySources) assert.ok(source.title && /^https:\/\//.test(source.url));
    for (const country of ['DE', 'AT', 'CH']) {
      const entry = species.legal[country]; assert.ok(legalStatusLabels[entry.status] && entry.note && entry.sources.length > 0, `${species.slug}:${country}`);
      for (const id of entry.sources) assert.ok(legalSources[id]?.title && /^https:\/\//.test(legalSources[id].url), `${species.slug}:${country}:${id}`);
    }
  }
});

test('Hunting-law listing is separated from actual seasons, protected species and authority-only measures', () => {
  const { dachWildlifeBySlug: bySlug } = load('lib/dach-wildlife.js');
  for (const slug of ['rebhuhn', 'moorente']) { assert.equal(bySlug[slug].legal.CH.status, 'protected'); assert.match(bySlug[slug].legal.CH.note, /3bis/); }
  for (const slug of ['wolf', 'steinwild']) assert.equal(bySlug[slug].legal.CH.status, 'special');
  assert.equal(bySlug.wolf.legal.DE.status, 'special'); assert.match(bySlug.wolf.legal.DE.note, /22b/);
  assert.equal(bySlug.auerhuhn.legal.DE.status, 'protected');
  assert.equal(bySlug.birkhuhn.legal.CH.status, 'season'); assert.match(bySlug.birkhuhn.legal.CH.note, /Birkhahn/);
  assert.equal(bySlug.loeffelente.legal.CH.status, 'season'); assert.equal(bySlug.loeffelente.legal.DE.status, 'protected');
  for (const slug of ['wachtel', 'bekassine']) assert.equal(bySlug[slug].legal.AT.status, 'regional');
  assert.equal(bySlug.kormoran.legal.DE.status, 'special');
  assert.equal(bySlug.kolbenente.legal.CH.status, 'protected');
  assert.equal(bySlug.mink.legal.AT.status, 'season');
});

test('Every recorded species and new portrait resolves, including regional game and non-huntable observation species', async () => {
  const data = load('lib/dach-wildlife.js');
  for (const sound of load('lib/animal-sounds.js').animalSounds) assert.ok(data.dachWildlifeBySlug[sound.speciesSlug], `${sound.name} links to ${sound.speciesSlug}`);
  const { getStaticPaths, getStaticProps } = load('pages/wildkunde/[art].js');
  const { paths, fallback } = await getStaticPaths(); assert.equal(fallback, false);
  const newSlugs = data.dachWildlife.filter(species => !data.legacyWildlifeSlugs.includes(species.slug)).map(species => species.slug);
  assert.deepEqual(paths.map(item => item.params.art).sort(), newSlugs.sort());
  for (const slug of newSlugs) { const result = await getStaticProps({ params: { art: slug } }); assert.ok(result.props, slug); }
  assert.equal((await getStaticProps({ params: { art: 'erfundene-art' } })).notFound, true);
});

test('Wildlife and sound discovery support aliases and primary facts while country choice stays in law', () => {
  const { filterDachWildlife } = load('lib/dach-wildlife.js');
  assert.deepEqual(filterDachWildlife({ query: 'Blässgans' }).map(item => item.slug), filterDachWildlife({ query: 'Blaessgans' }).map(item => item.slug));
  assert.ok(filterDachWildlife({ query: 'Marmota marmota' }).some(item => item.slug === 'murmeltier'));
  for (const item of filterDachWildlife({ country: 'CH', status: 'season' })) assert.equal(item.legal.CH.status, 'season');
  assert.equal(filterDachWildlife({ query: 'zzznichtvorhanden' }).length, 0);
  const search = load('lib/learning-search.js').searchLearning;
  for (const query of ['Alpenmurmeltier', 'Haselhuhn', 'Löffelente', 'Waldschnepfe']) assert.ok(search({ query, type: 'species' }).total > 0, query);
  const voices = load('lib/animal-sounds.js').animalSounds;
  const entries = Array.from({ length: search({ type: 'entry' }).pages }, (_, index) => search({ type: 'entry', page: index + 1 }).results).flat();
  for (const sound of voices) assert.ok(entries.some(item => item.href === `/lernen/tierstimmen?stimme=${encodeURIComponent(sound.id)}`));
  const indexSource = fs.readFileSync(path.join(root, 'pages/wildkunde/index.js'), 'utf8');
  assert.ok(!indexSource.includes('setCountry') && !indexSource.includes('dachCountries'));
});
