const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const overrides = {
  'next/image': ({ priority, fill, ...props }) => React.createElement('img', props),
  'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
};
const load = createLoader(overrides);
const mediaApi = load('lib/learning-media.js'), curriculum = load('lib/learning-curriculum.js');
const components = load('components/LearningMedia.js'), photoComponents = load('components/LearningPhoto.js');
const { breedPictures } = mediaApi;
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
function original(file, dependencies = {}) {
  const filename = path.join(root, file);
  const source = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id];
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id);
  }, module, module.exports);
  return module.exports;
}
const oldPhotos = original('components/LearningPhoto.js');
const oldMedia = original('components/LearningMedia.js', { './LearningPhoto': oldPhotos });
const actualMedia = id => mediaApi.getLearningMedia(curriculum.getLearningModule(id));

test('Existing cover, credit and both galleries retain exactly the HEAD default HTML for every audited placement', () => {
  for (const id of Object.keys(mediaApi.coursePhotoUses)) {
    const media = actualMedia(id);
    for (const compact of [false, true]) for (const imageHref of [undefined, `/kurse/${id}`]) {
      const props = { media, compact, imageHref };
      assert.equal(render(photoComponents.LearningCover, props), render(oldPhotos.LearningCover, props), id);
    }
    assert.equal(render(photoComponents.LearningPhotoCredit, { media }), render(oldPhotos.LearningPhotoCredit, { media }), id);
    assert.equal(render(components.WildlifeGallery, { pictures: media.pictures }), render(oldMedia.WildlifeGallery, { pictures: media.pictures }), id);
  }
  assert.equal(render(components.BreedGallery), render(oldMedia.BreedGallery));
  assert.equal(render(photoComponents.LearningCover, { media: null }), '');
});

test('Deferred covers keep their caption and readable author/license attribution but no external links or modification notes', () => {
  for (const id of ['wissen-rehwild-jahreslauf', 'wissen-vertiefung-hunde-vorstehrassen']) {
    const media = actualMedia(id), html = render(photoComponents.LearningCover, { media, deferCredits: true });
    assert.ok(html.includes(media.caption)); assert.ok(html.includes(media.author)); assert.ok(html.includes(media.license));
    assert.match(html, /<img/); assert.doesNotMatch(html, /<a\b|Bildquelle|Bildausschnitt|proportional verkleinert/);
  }
});

test('Deferred wildlife filtering removes only explicitly inline sources and keeps one remaining comparison photograph', () => {
  const media = actualMedia('wissen-gams-steinbock'), before = JSON.stringify(media);
  const html = render(components.WildlifeGallery, { pictures: media.pictures, excludeSources: [media.pictures[0].src], deferCredits: true });
  assert.equal((html.match(/<img\b/g) || []).length, 1); assert.ok(html.includes(media.pictures[1].src)); assert.ok(!html.includes(media.pictures[0].src));
  assert.match(html, /© Giles Laurent, gileslaurent\.com/); assert.match(html, /License CC BY-SA 4\.0/);
  assert.doesNotMatch(html, /<a\b|Bildquelle|Lizenz<|Commons-Vorschaubild/);
  assert.equal(JSON.stringify(media), before);
  assert.equal(render(components.WildlifeGallery, { pictures: media.pictures, excludeSources: media.pictures.map(photo => photo.src), deferCredits: true }), '');
});

test('Deferred breed galleries preserve every remaining name and plain credit while excluding already explained photos without mutation', () => {
  const before = JSON.stringify(breedPictures), excluded = breedPictures.slice(0, 2).map(photo => photo.src);
  const tree = components.BreedGallery({ deferCredits: true, excludeSources: excluded });
  assert.deepEqual(nodes(tree, node => node.type === 'figure').map(node => node.props.children[0].props.src), breedPictures.slice(2).map(photo => photo.src));
  const html = render(components.BreedGallery, { deferCredits: true, excludeSources: excluded });
  assert.equal((html.match(/<img\b/g) || []).length, breedPictures.length - 2);
  for (const photo of breedPictures.slice(2)) { assert.ok(html.includes(photo.name)); assert.ok(html.includes(photo.author)); assert.ok(html.includes(photo.license)); }
  assert.doesNotMatch(html, /<a\b|Bildquelle|Unveränderte Originalaufnahme|höchstens 1400/);
  assert.equal(JSON.stringify(breedPictures), before);
  assert.equal(render(components.BreedGallery, { excludeSources: breedPictures.map(photo => photo.src) }), '');
});

test('The final source section deduplicates cover and breed sources, preserves full attribution and transfers exact modification records', () => {
  const media = actualMedia('wissen-vertiefung-hunde-retriever-spaniels');
  const before = JSON.stringify([media, breedPictures]);
  const tree = components.CoursePhotoSources({ media, breeds: true });
  const entries = nodes(tree, node => node.type === 'li');
  assert.equal(entries.length, new Set([media.src, ...breedPictures.map(photo => photo.src)]).size);
  const html = render(components.CoursePhotoSources, { media, breeds: true });
  assert.doesNotMatch(html, /<img\b|<details\b/);
  for (const photo of breedPictures) { assert.ok(html.includes(photo.author)); assert.ok(html.includes(photo.license)); assert.ok(html.includes(photo.url.replaceAll('&', '&amp;'))); if (photo.modifications) assert.ok(html.includes(photo.modifications)); }
  assert.match(html, /Dateititel der Originalquelle: Labrador-retriever\.jpg/);
  assert.equal(JSON.stringify([media, breedPictures]), before);
});

test('The final wildlife credit includes Giles required attribution, original source/license and exact changes without modifying global records', () => {
  const media = actualMedia('wissen-gams-steinbock'), before = JSON.stringify(media);
  const html = render(components.CoursePhotoSources, { media });
  assert.equal((html.match(/<li\b/g) || []).length, 2);
  for (const photo of media.pictures) {
    assert.ok(html.includes(photo.name)); assert.ok(html.includes(photo.credit)); assert.ok(html.includes(photo.modifications));
    assert.ok(html.includes(photo.creditUrl.replaceAll('&', '&amp;'))); assert.ok(html.includes(photo.licenseUrl));
  }
  assert.equal((html.match(/© Giles Laurent, gileslaurent\.com/g) || []).length, 2);
  assert.match(html, /License CC BY-SA 4\.0/); assert.match(html, /Originaldatei/);
  assert.equal(JSON.stringify(media), before);
});

test('Already inline-attributed sources disappear from legacy final credits and unillustrated category covers never gain phantom credits', () => {
  const media = actualMedia('wissen-gams-steinbock');
  const html = render(components.CoursePhotoSources, { media, excludeSources: [media.pictures[0].src] });
  assert.equal((html.match(/<li\b/g) || []).length, 1); assert.ok(html.includes(media.pictures[1].creditUrl)); assert.ok(!html.includes(media.pictures[0].creditUrl));
  assert.equal(render(components.CoursePhotoSources, { media, excludeSources: media.pictures.map(photo => photo.src) }), '');
  for (const id of ['wissen-rotwild-sozialverhalten', 'wissen-ausbau-oekologie-holzaufbau-2026', 'wissen-ausbau-biologie-wiederkaeuer-2026']) assert.equal(render(components.CoursePhotoSources, { media: actualMedia(id) }), '', id);
  assert.equal(render(components.CoursePhotoSources, {}), '');
});

test('Default source and photo metadata files remain unchanged; the footer renderer does not create review or capture dates', () => {
  for (const file of ['lib/learning-media.js', 'lib/learning-wildlife-photos.js', 'lib/dog-photographs.js']) {
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
  }
  for (const file of ['components/LearningMedia.js', 'components/LearningPhoto.js']) assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /new Date|reviewedOn\s*:|checkedAt\s*:|photoDate\s*:/);
});
