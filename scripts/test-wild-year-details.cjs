const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const swc = projectRequire('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2020' }, module: { type: 'commonjs' },
  });
  const localRequire = id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`))) : projectRequire(id);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  cache.set(filename, module.exports);
  return module.exports;
}
const year = load('lib/wild-year.js');
const atlas = load('lib/wild-detail-atlas.js');
function checkSources(claim, sources) {
  const organizations = new Set();
  assert.ok(claim.sourceIds.length >= 2, `${claim.id}: two evidence sources required`);
  for (const id of claim.sourceIds) {
    assert.ok(sources[id], `${claim.id}: unknown source ${id}`);
    assert.match(sources[id].url, /^https:\/\//);
    organizations.add(sources[id].organization);
  }
  assert.ok(organizations.size >= 2, `${claim.id}: two independent organizations required, not two pages of one publisher`);
}

test('All 96 species-month views contain exactly one phase per biological section', () => {
  assert.equal(year.wildYearSpecies.length, 8);
  assert.equal(new Set(year.wildYearSpecies.map(item => item.slug)).size, 8);
  const { dachWildlifeBySlug } = load('lib/dach-wildlife.js');
  const { wildlifePhotographs } = load('lib/wildlife-photographs.js');
  for (const item of year.wildYearSpecies) {
    assert.ok(dachWildlifeBySlug[item.slug], item.slug);
    assert.ok(item.uncertainty.length > 60, `${item.slug}: transitions need context`);
    const photo = wildlifePhotographs[item.slug];
    assert.equal(photo.aiGenerated, false);
    assert.ok(fs.existsSync(path.join(root, 'public', photo.src)), photo.src);
    for (const key of ['coat', 'crown', 'reproduction', 'behavior']) {
      for (const claim of item[key]) checkSources(claim, year.wildYearSources);
      for (let month = 1; month <= 12; month++) {
        assert.equal(item[key].filter(phase => phase.months.includes(month)).length, 1, `${item.slug}:${key}:${month} cannot be missing or ambiguous`);
        const view = year.getWildYearProfile(item.slug, month);
        assert.equal(view.sections.length, 4);
        assert.ok(view.sections.find(section => section.key === key).claim.text.length > 20);
      }
    }
  }
});

test('Applied seasonal cases preserve species differences and flexible wild-boar reproduction', () => {
  const section = (slug, month, key) => year.getWildYearProfile(slug, month).sections.find(item => item.key === key).claim;
  assert.equal(section('rehwild', 7, 'reproduction').id, 'reh-brunft');
  assert.equal(section('rehwild', 11, 'reproduction').id, 'reh-keimruhe');
  assert.equal(section('rotwild', 9, 'reproduction').id, 'rot-brunft');
  assert.equal(section('damwild', 10, 'reproduction').id, 'dam-brunft');
  assert.equal(section('gamswild', 11, 'reproduction').id, 'gams-brunft');
  assert.equal(section('steinwild', 12, 'reproduction').id, 'stein-brunft');
  assert.match(section('schwarzwild', 5, 'reproduction').text, /außerhalb/);
  assert.match(section('schwarzwild', 8, 'reproduction').text, /keine ausschließlich/);
  assert.match(section('muffelwild', 8, 'crown').text, /nicht jährlich abgeworfen/);
  assert.equal(year.getWildYearProfile('unbekannt', 99).species.slug, 'gamswild');
  assert.equal(year.getWildYearProfile('rehwild', 1.5).month, 1);
});

test('Detail topics preserve two independent evidence organizations per biological claim', () => {
  assert.equal(atlas.wildDetailTopics.length, 5);
  assert.equal(new Set(atlas.wildDetailTopics.map(topic => topic.id)).size, 5);
  for (const topic of atlas.wildDetailTopics) {
    assert.equal(topic.panels.length, 2);
    assert.ok(topic.claims.length >= 3);
    for (const claim of topic.claims) checkSources(claim, atlas.wildDetailSources);
    for (const panel of topic.panels) {
      assert.ok(atlas.wildDetailPhotos[panel.photoId]);
      assert.ok(panel.limitations.length > 60, `${topic.id}: visible and invisible features must be distinguished`);
      for (const marker of panel.markers) {
        assert.ok(marker.x > 0 && marker.x < 100 && marker.y > 0 && marker.y < 100, marker.label);
        assert.ok(marker.detail.length > 10);
      }
    }
  }
});

test('Exact documentary photo files retain verified provenance and licensed bytes', () => {
  assert.equal(atlas.wildDetailAssetPaths.length, 3);
  for (const photo of Object.values(atlas.wildDetailPhotos)) {
    assert.equal(photo.aiGenerated, false, photo.src);
    assert.ok(photo.license && photo.licenseUrl && photo.sourcePage && photo.author, photo.src);
    const filename = path.join(root, 'public', photo.src);
    assert.ok(fs.existsSync(filename), filename);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'), photo.sha256, photo.src);
  }
});

test('Incomplete skulls and microscopic feather structures cannot be presented as photographic proof', () => {
  const teeth = atlas.getWildDetailTopic('gebiss-und-schaedel');
  assert.match(teeth.panels.find(panel => panel.photoId === 'boarSkull').limitations, /unvollständig/);
  assert.match(teeth.panels.find(panel => panel.photoId === 'rehSkull').limitations, /nicht zum vollständigen Zählen/);
  const feather = atlas.getWildDetailTopic('federbau');
  assert.match(feather.panels[0].limitations, /Häkchen.*nicht.*erkennen/);
  assert.match(feather.panels[0].limitations, /Federkiel.*nicht im Bild/);
  assert.ok(!feather.panels[0].markers.some(marker => /Häkchen|Kiel/.test(marker.label)));
  assert.match(atlas.getWildDetailTopic('gams-und-steinbock').panels[1].limitations, /nicht als Lebensjahre/);
});

test('Search results link to selectable topics and species rather than an extra menu', () => {
  for (const item of year.wildYearSearchEntries) {
    const url = new URL(item.href, 'https://jagdlatein.de');
    assert.equal(url.pathname, '/lernen/wildjahr');
    assert.ok(year.wildYearSpecies.some(species => species.slug === url.searchParams.get('art')));
  }
  for (const item of atlas.wildDetailSearchEntries) {
    const url = new URL(item.href, 'https://jagdlatein.de');
    assert.equal(url.pathname, '/lernen/wildtier-details');
    assert.ok(atlas.wildDetailTopics.some(topic => topic.id === url.searchParams.get('thema')));
  }
});

test('Older species receive only explicit targeted aspect checks, not an all-species review badge', () => {
  const { wildlifeDepthBySlug, wildlifeDepthEvidenceChecks } = load('lib/wildlife-depth.js');
  assert.equal(Object.keys(wildlifeDepthEvidenceChecks).length, 8);
  assert.equal(Object.values(wildlifeDepthEvidenceChecks).flat().length, 22);
  for (const [slug, checks] of Object.entries(wildlifeDepthEvidenceChecks)) {
    const profile = wildlifeDepthBySlug[slug];
    assert.equal(profile.verifiedClaims.length, checks.length);
    for (const check of checks) {
      assert.ok(profile[check.section][check.index], `${slug}: source check must identify an existing paragraph`);
      assert.ok(check.verifiedAspect.length > 20);
      checkSources(check, year.wildYearSources);
      for (const id of check.sourceIds) assert.ok(profile.sources.some(source => source.url === year.wildYearSources[id].url));
    }
  }
  for (const [slug, profile] of Object.entries(wildlifeDepthBySlug)) {
    if (!(slug in wildlifeDepthEvidenceChecks)) assert.equal(profile.verifiedClaims, undefined, `${slug}: not newly audited`);
  }
});
