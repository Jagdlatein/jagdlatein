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

test('All 360 detailed species-month views contain exactly one phase per biological section', () => {
  assert.equal(year.wildYearSpecies.length, 30);
  assert.equal(new Set(year.wildYearSpecies.map(item => item.slug)).size, 30);
  const { dachWildlifeBySlug } = load('lib/dach-wildlife.js');
  const { wildlifePhotographs } = load('lib/wildlife-photographs.js');
  for (const item of year.wildYearSpecies) {
    assert.ok(dachWildlifeBySlug[item.slug], item.slug);
    assert.ok(item.uncertainty.length > 60, `${item.slug}: transitions need context`);
    const photo = wildlifePhotographs[item.slug];
    if (photo) {
      assert.equal(photo.aiGenerated, false);
      assert.ok(fs.existsSync(path.join(root, 'public', photo.src)), photo.src);
    } else assert.ok(['murmeltier', 'waldschnepfe'].includes(item.slug), 'No other selected profile may lose its existing photograph');
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
    assert.ok(load('lib/wild-year-catalog.js').wildYearCatalog.some(species => species.slug === url.searchParams.get('art')));
  }
  for (const item of atlas.wildDetailSearchEntries) {
    const url = new URL(item.href, 'https://jagdlatein.de');
    assert.equal(url.pathname, '/lernen/wildtier-details');
    assert.ok(atlas.wildDetailTopics.some(topic => topic.id === url.searchParams.get('thema')));
  }
});

test('Older species receive only explicit targeted aspect checks, not an all-species review badge', () => {
  const { wildlifeDepthBySlug, wildlifeDepthEvidenceChecks } = load('lib/wildlife-depth.js');
  assert.equal(Object.keys(wildlifeDepthEvidenceChecks).length, 9);
  assert.equal(Object.values(wildlifeDepthEvidenceChecks).flat().length, 23);
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

test('Hare and badger use meaningful food fields and preserve seasonal uncertainty', () => {
  for (const slug of ['feldhase', 'dachs']) {
    const profile = year.wildYearSpecies.find(item => item.slug === slug);
    assert.equal(profile.reviewedOn, '2026-10-13');
    for (let month = 1; month <= 12; month++) {
      const view = year.getWildYearProfile(slug, month);
      assert.equal(view.sections.find(section => section.key === 'crown').label, 'Nahrung');
      assert.ok(!view.sections.some(section => /Horn|Hörner|Geweih|Kopfschmuck/.test(section.label)), `${slug}: no invented crown field`);
    }
    const { wildlifePhotographs } = load('lib/wildlife-photographs.js');
    const photograph = wildlifePhotographs[slug];
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'public', photograph.src))).digest('hex'), photograph.sha256);
  }
  const view = (slug, month, key) => year.getWildYearProfile(slug, month).sections.find(item => item.key === key).claim;
  assert.match(view('dachs', 7, 'reproduction').text, /nicht nur im Juli\/August/);
  assert.match(view('dachs', 1, 'crown').text, /schließt.*nicht aus/);
  assert.match(view('feldhase', 7, 'reproduction').text, /Muttermilch/);
  assert.match(view('feldhase', 9, 'reproduction').text, /Paarungs- und Geburtszeit/);
  assert.match(year.wildYearSpecies.find(item => item.slug === 'dachs').uncertainty, /Januar–März.*Ende Februar–Anfang April/);
  const newClaims = year.wildYearSpecies.filter(item => ['feldhase','dachs'].includes(item.slug)).flatMap(item => ['coat','crown','reproduction','behavior'].flatMap(key => item[key]));
  assert.equal(newClaims.length, 18);
  assert.equal(new Set(newClaims.map(item => item.id)).size, 18);
  assert.ok(!newClaims.some(item => /Jagdzeit|Schonzeit|bejah?g(?:en|t)/i.test(item.text)), 'Biological calendar cannot authorize hunting');
});

test('Targeted badger correction does not recertify old profiles or ungulate seasons', () => {
  const { wildlifeDepthBySlug, wildlifeDepthEvidenceChecks } = load('lib/wildlife-depth.js');
  assert.match(wildlifeDepthBySlug.dachs.seasonalLife[1], /Spätwinter oder frühen Frühjahr/);
  assert.equal(wildlifeDepthBySlug.dachs.reviewedOn, '2026-10-12');
  assert.equal(wildlifeDepthEvidenceChecks.dachs[0].reviewedOn, '2026-10-13');
  for (const species of year.wildYearSpecies.slice(0, 10).filter(item => !['feldhase','dachs'].includes(item.slug))) assert.equal(species.reviewedOn, '2026-10-12');
});

test('New biological blocks and the editorial audit keep the same exact source scope', () => {
  const report = JSON.parse(fs.readFileSync(path.join(root, 'docs/wild-year-small-game-audit-oct13.json'), 'utf8'));
  assert.equal(report.reviewedOn, year.smallGameYearReviewedOn);
  const sourcesRead = new Map(report.sourcesRead.map(item => [item.id, item]));
  const claims = year.wildYearSpecies.filter(item => ['feldhase','dachs'].includes(item.slug)).flatMap(item => ['coat','crown','reproduction','behavior'].flatMap(key => item[key]));
  assert.equal(Object.keys(report.newBlockSources).length, claims.length);
  for (const claim of claims) {
    assert.deepEqual(report.newBlockSources[claim.id], claim.sourceIds, `${claim.id}: audit must follow the published block`);
    for (const sourceId of claim.sourceIds) {
      assert.equal(sourcesRead.get(sourceId)?.url, year.wildYearSources[sourceId].url);
      assert.ok(sourcesRead.get(sourceId).supports.length > 0);
    }
  }
  const independentlyCounted = new Set(['haseBayern', 'haseLfL'].map(id => year.wildYearSources[id].organization));
  assert.equal(independentlyCounted.size, 1, 'Two Bavarian ministry pages cannot substitute for independent source checks');
});
