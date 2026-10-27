// Real media containers and component output with isolated URL state only.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const load = createLoader();
const { wildlifeVideoCases } = load('lib/wildlife-video-cases.js');
const { wildlifeVideoExpansionCases } = load('lib/wildlife-video-expansion-2026-10-26.js');
const { wildYearSpecies } = load('lib/wild-year.js');
const { getWildlifeVideoLinks } = load('lib/learning-video-links.js');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/lernen/videos-2026-10-26/mediennachweise.json'), 'utf8'));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
let router;
const ui = createLoader({
  'next/router': { useRouter: () => router },
  'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href }, children),
  './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
  './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-menu': true }, children), closePageMenu() {}, openPageMenu() {} },
});

test('All six new MP4s and extracted posters match their original-source license manifest and permit streaming from the front', () => {
  assert.equal(manifest.length, 6);
  assert.deepEqual(manifest.map(item => item.id), wildlifeVideoExpansionCases.map(item => item.id));
  for (const entry of manifest) {
    const scene = wildlifeVideoExpansionCases.find(item => item.id === entry.id);
    for (const field of ['source', 'author', 'license', 'licenseUrl']) assert.equal(entry[field], scene[field]);
    assert.equal(entry.file, scene.src); assert.equal(entry.poster, scene.poster);
    assert.equal(entry.aiGenerated, false); assert.equal(entry.checked, scene.reviewedOn);
    const film = fs.readFileSync(path.join(root, 'public', entry.file));
    assert.equal(film.length, entry.bytes); assert.equal(hash(film), entry.sha256);
    assert.equal(film.subarray(4, 8).toString(), 'ftyp');
    const atoms = []; let offset = 0;
    while (offset + 8 <= film.length) {
      let size = film.readUInt32BE(offset); const type = film.subarray(offset + 4, offset + 8).toString();
      if (size === 1) size = Number(film.readBigUInt64BE(offset + 8));
      if (size === 0) size = film.length - offset;
      assert.ok(size >= 8 && offset + size <= film.length, `${entry.id}: valid MP4 atom`);
      atoms.push(type); offset += size;
    }
    assert.equal(offset, film.length);
    assert.ok(atoms.indexOf('moov') > 0 && atoms.indexOf('moov') < atoms.indexOf('mdat'), 'Metadata precedes video bytes for deliberate on-demand playback');
    const poster = fs.readFileSync(path.join(root, 'public', entry.poster));
    assert.equal(poster.length, entry.posterBytes); assert.equal(hash(poster), entry.posterSha256);
    assert.equal(poster.subarray(0, 2).toString('hex'), 'ffd8');
    assert.match(entry.modifications, /MP4\/H.264/);
  }
});

test('Actual old and new scene pages use the right MIME, complete transcript, honest date and a closed final source panel', () => {
  const Cases = ui('components/WildlifeVideoCases.js').default;
  for (const scene of wildlifeVideoCases) {
    router = { isReady: true, query: { eintrag: scene.id }, asPath: `/lernen/wildtier-videofaelle?eintrag=${scene.id}` };
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Cases)));
    try {
      const document = dom.window.document, body = document.querySelector('section[aria-labelledby="video-fall"]');
      const player = body.querySelector('video');
      assert.equal(player.querySelector('source').getAttribute('src'), scene.src);
      assert.equal(player.querySelector('source').getAttribute('type'), scene.mimeType || 'video/webm');
      assert.equal(player.preload, 'none'); assert.ok(player.hasAttribute('controls') && player.hasAttribute('playsinline'));
      assert.equal(player.hasAttribute('autoplay'), false);
      assert.ok(body.querySelector('#video-textfassung').textContent.includes(scene.transcript));
      const footer = body.lastElementChild;
      assert.equal(footer.tagName, 'DETAILS'); assert.equal(footer.open, false);
      assert.ok(footer.textContent.includes(scene.author));
      assert.ok(footer.querySelector(`a[href="${scene.source}"]`));
      if (scene.reviewedOn) { assert.match(footer.textContent, /26\. Oktober 2026/); assert.doesNotMatch(footer.textContent, /4\. Oktober 2026|Rothirsch – waldwissen/); }
      else assert.match(footer.textContent, /4\. Oktober 2026/);
      assert.ok(document.querySelector(`aside a[href="${scene.course}"]`));
    } finally { dom.window.close(); }
  }
});

test('All 312 detailed Wildjahr selections link only their displayed species and never pretend that a film proves the selected month', t => {
  const h = setup('components/WildYear.js', { art: 'rehwild', monat: '1' }, { props: { currentMonth: 10 } });
  t.after(() => h.dispose());
  for (const species of wildYearSpecies) for (let month = 1; month <= 12; month++) {
    h.navigate({ art: species.slug, monat: String(month) });
    const nav = h.nodes(node => node.type === 'nav' && node.props['aria-label'] === 'Wildjahr vertiefen')[0];
    const destinations = nodes(nav, node => node.props?.href).map(node => node.props.href);
    assert.deepEqual(destinations, [`/wildkunde/${species.slug}`, `/jagdrecht/wildarten?art=${species.slug}`, ...getWildlifeVideoLinks(species.slug).map(item => item.href)]);
    if (getWildlifeVideoLinks(species.slug).length) assert.match(text(nav), /nicht automatisch den gewählten Monat/);
    assert.equal(h.calls.length, 0);
  }
  h.navigate({ art: 'invalid', monat: '3' });
  assert.equal(h.nodes(node => node.props?.['aria-label'] === 'Wildjahr vertiefen').length, 0);
});

test('Failed and pending species changes retain the displayed video links until a real URL commit, including browser history', async t => {
  const h = setup('components/WildYear.js', { art: 'rehwild', monat: '1' }, { props: { currentMonth: 10 } });
  t.after(() => h.dispose());
  const destinations = () => nodes(h.tree, node => node.props?.['aria-label'] === 'Wildjahr vertiefen').flatMap(nav => nodes(nav, node => node.props?.href).map(node => node.props.href));
  const before = destinations(); let reject;
  h.router.push = () => new Promise((_, no) => { reject = no; });
  const action = h.nodes(node => node.props?.id === 'wildjahr-species')[0].props.onChange({ target: { value: 'dachs' } });
  h.render(); assert.deepEqual(destinations(), before);
  reject(new Error('isolated navigation failure')); await action; h.render(); assert.deepEqual(destinations(), before);
  h.navigate({ art: 'dachs', monat: '2' });
  assert.ok(destinations().includes('/lernen/wildtier-videofaelle?eintrag=dachs-fellpflege#video-fall'));
  assert.ok(!destinations().includes('/wildkunde/rehwild'));
  h.navigate({ art: 'rehwild', monat: '1' }); assert.deepEqual(destinations(), before);
});
