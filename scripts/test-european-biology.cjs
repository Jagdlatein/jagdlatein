// Structural/interaction checks; source interpretation is documented in the review data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
function load(relative, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const requireLocal = id => id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), cache) : pr(id);
  new Function('require', 'module', 'exports', code)(requireLocal, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}

test('Adult formulas count both sides, reject incomplete/fractional inputs and retain concrete evidence plus limits', () => {
  const data = load('lib/wildlife-dentition.js');
  assert.equal(data.dentalCount({}), null);
  assert.equal(data.dentalCount({ I: [3, 3], C: [1, 1], P: [4, 4], M: [2, NaN] }), null);
  assert.equal(data.dentalCount({ I: [3, 3], C: [1, 1], P: [4.5, 4], M: [2, 3] }), null);
  assert.ok(data.dentitionProfiles.length >= 28);
  const known = load('lib/european-wildlife.js').europeanWildlifeBySlug;
  for (const profile of data.dentitionProfiles) {
    assert.ok(known[profile.slug], profile.slug);
    const upper = ['I', 'C', 'P', 'M'].reduce((sum, key) => sum + profile.formula[key][0], 0);
    const lower = ['I', 'C', 'P', 'M'].reduce((sum, key) => sum + profile.formula[key][1], 0);
    assert.equal(profile.total, 2 * (upper + lower), profile.slug);
    assert.ok(profile.scope && profile.note && profile.reviewedOn === '2026-10-16', profile.slug);
    assert.ok(new Set(profile.sources.map(source => source.organization)).size >= 2, profile.slug);
    for (const source of profile.sources) assert.ok(source.title && /^https:\/\//.test(source.url) && source.supports?.length, `${profile.slug}:${source.id}`);
  }
  assert.match(data.dentitionBySlug.dachs.note, /nicht bei jedem|keine pauschale/);
  assert.equal(data.dentitionBySlug.wildkatze.total, 30);
  assert.equal(data.dentitionBySlug.luchs.total, 28);
  assert.match(data.dentitionBySlug.luchs.note, /Zusätzliche/);
  for (const withheld of data.dentitionWithheld) assert.ok(withheld.reason && !data.dentitionBySlug[withheld.slug]);
});

test('European biological portraits extend discovery without fabricating DACH legal entries', () => {
  const data = load('lib/european-wildlife.js');
  const dach = load('lib/dach-wildlife.js');
  assert.equal(data.europeanWildlife.length, dach.dachWildlife.length + data.europeanExpansion.length);
  assert.equal(data.europeanExpansion.length, 3);
  assert.equal(new Set(data.europeanWildlife.map(item => item.slug)).size, data.europeanWildlife.length);
  for (const species of data.europeanExpansion) {
    assert.equal(species.europeanOnly, true);
    assert.equal(dach.dachWildlifeBySlug[species.slug], undefined);
    assert.equal(species.legal, undefined);
    assert.ok(species.sections.length >= 5);
    assert.ok(species.limits?.length);
    for (const section of species.sections) {
      assert.ok(section.paragraphs.length > 0);
      assert.ok(new Set(section.sources.map(source => source.organization)).size >= 2, `${species.slug}:${section.id}`);
      for (const source of section.sources) assert.ok(source.url && source.supports?.length);
    }
    assert.ok(data.filterEuropeanWildlife({ query: species.scientificName }).some(item => item.slug === species.slug));
  }
  assert.ok(data.filterEuropeanWildlife({ query: 'Pyrenaengam' }).some(item => item.slug === 'pyrenaeengaemse'));
  const search = load('lib/learning-search.js').searchLearning;
  for (const query of ['Rangifer tarandus', 'Capra pyrenaica', 'Rupicapra pyrenaica', 'Rotwild Zahnformel']) assert.ok(search({ query, type: 'species' }).total > 0, query);
});

test('New teaching photos are exact attributed real assets and have matching local checksums', () => {
  for (const species of load('lib/european-wildlife.js').europeanExpansion) {
    const photo = species.photo;
    assert.ok(photo.src && photo.alt && photo.caption && photo.credit && photo.license && photo.licenseUrl && photo.sourcePage && photo.author, species.slug);
    assert.equal(photo.aiGenerated, false);
    assert.ok(photo.width > 500 && photo.height > 300 && photo.checkedAt === '2026-10-16');
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src));
    assert.ok(bytes.length < 1500000, `${species.slug}: optimized photo`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), photo.sha256);
  }
});

test('Shared dental UI includes full scope, accessible table, calculation and only its own review date', () => {
  const React = pr('react');
  const { renderToStaticMarkup } = pr('react-dom/server');
  const Dentition = load('components/WildlifeDentition.js').default;
  const html = renderToStaticMarkup(React.createElement(Dentition, { slug: 'dachs', name: 'Dachs' }));
  assert.match(html, /<caption>Zähne je Kieferseite<\/caption>/);
  assert.match(html, /<th scope="col">Oben<\/th>/);
  assert.match(html, /Beide Seiten zusammen/);
  assert.match(html, /Milchgebiss und Zahnwechsel/);
  assert.match(html, /nicht bei jedem Dachs/);
  assert.match(html, /Das Datum gilt für diesen Abschnitt/);
  assert.equal(renderToStaticMarkup(React.createElement(Dentition, { slug: 'erfunden' })), '');
  const birdHtml = renderToStaticMarkup(React.createElement(Dentition, { slug: 'gaensesaeger', name: 'Gänsesäger' }));
  assert.match(birdHtml, /keine echten Zähne/);
  assert.ok(!birdHtml.includes('<table'));
  assert.ok(!load('lib/wildlife-dentition.js').birdDentitionSlugs.has('seehund'));
  for (const record of load('lib/wildlife-dentition.js').dentitionWithheld) {
    const missing = renderToStaticMarkup(React.createElement(Dentition, { slug: record.slug, name: record.slug }));
    assert.match(missing, /noch keine neue Zahnformel/);
    assert.ok(!missing.includes('<table'));
  }
  const dachs = fs.readFileSync(path.join(root, 'pages/wildkunde/dachs.js'), 'utf8');
  assert.match(dachs, /wenn alle vier Prämolaren je Kieferseite vorhanden sind/);
  for (const filename of fs.readdirSync(path.join(root, 'pages/wildkunde')).filter(name => name.endsWith('.js'))) {
    assert.ok(!fs.readFileSync(path.join(root, 'pages/wildkunde', filename), 'utf8').includes('<li>Zahnformel:'), `No obsolete duplicate in ${filename}`);
  }
});

test('Abstract minigame is discoverable once in search and linked from both relevant categories', () => {
  const search = load('lib/learning-search.js').searchLearning;
  const results = search({ query: 'Scheiben-Minispiel', type: 'practice' });
  assert.equal(results.results.filter(item => item.href === '/jagdpraxis/trefferzonen').length, 1);
  const { practiceHighlights } = load('lib/practice-catalog.js');
  const game = practiceHighlights.find(item => item.href === '/jagdpraxis/trefferzonen');
  assert.deepEqual(game.categories, ['jagdpraxis', 'waffen-sicherheit']);
});
