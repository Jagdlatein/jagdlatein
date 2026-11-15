// Independent photo identity, display, preservation and real-hook lifecycle checks.
// This test reads published curriculum/media only; it never reads account storage.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const sharp = local('sharp');
const load = createLoader();
const baseline = '603ba099230d7f40fd57d969cd792930b55e0a42';
const { wildYearCatalog: catalog } = load('lib/wild-year-catalog.js');
const { wildYearPhotographs: photos, getWildYearPhotograph: photograph } = load('lib/wild-year-photographs.js');
const Picker = load('components/WildYearSpeciesPicker.js').default;
const Credits = load('components/WildYearPhotoCredits.js').default;
const page = load('pages/lernen/wildjahr.js');
const evidencePath = path.join(root, 'data/reviews/wild-year-photographs-2026-11-15.json');
const evidence = () => JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const address = query => '/lernen/wildjahr?' + new URLSearchParams(query) + '#wildjahr-top';
const choices = tree => nodes(tree, node => node.type === 'button' && node.props['data-wildjahr-species']);
const images = tree => nodes(tree, node => typeof node.props?.src === 'string' && Number.isInteger(node.props.width) && Number.isInteger(node.props.height));
const selected = h => h.nodes(node => node.type === 'figure' && node.props['data-wildjahr-photo'])[0];
const selectedImage = h => selected(h) ? images(selected(h))[0] : undefined;
function baselineLoader() {
  const cache = new Map();
  function old(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (name.endsWith('.json')) return JSON.parse(source);
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? old(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return old;
}
function fixture(t, query = { art: 'rehwild', monat: '6' }, options = {}) {
  const props = { ...(options.props || page.getServerSideProps({ query }).props) };
  const h = setup('components/WildYear.js', query, { ...options, props, router: { asPath: address(query), ...options.router } });
  h.requests = [];
  h.router.push = (href, as, options) => {
    const request = { href, as, options }; h.calls.push(request); h.requests.push(request);
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  };
  h.route = (next, updateProps = true) => {
    h.router.query = next; h.router.asPath = address(next);
    if (updateProps) Object.assign(props, page.getServerSideProps({ query: next }).props);
    h.render();
  };
  h.propsFor = next => { Object.assign(props, page.getServerSideProps({ query: next }).props); h.render(); };
  h.choose = slug => {
    const child = h.nodes(node => node.type?.name === 'WildYearSpeciesPicker')[0];
    return choices(child.type(child.props)).find(button => button.props['data-wildjahr-species'] === slug).props.onClick();
  };
  t.after(() => h.dispose()); return h;
}
const ssrLoad = createLoader({
  'next/router': { useRouter: () => ({ isReady: false, query: {}, asPath: '/lernen/wildjahr' }) },
  'next/image': { __esModule: true, default: ({ priority, ...props }) => React.createElement('img', props) },
  'next/link': { __esModule: true, default: ({ href, prefetch, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
  './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-page-menu': true }, children), openPageMenu() {}, closePageMenu() {} },
});
const SSRWildYear = ssrLoad('components/WildYear.js').default;

test('The exact 114-species photo inventory has complete source records, matching decodable bytes and no fallback animal', async () => {
  assert.equal(catalog.length, 114); assert.deepEqual(Object.keys(photos).sort(), catalog.map(entry => entry.slug).sort());
  const report = evidence(); assert.equal(report.baselineCommit, baseline); assert.equal(report.records.length, 114);
  assert.equal(new Set(report.records.map(record => record.slug)).size, 114);
  for (const entry of catalog) {
    const photo = photograph(entry.slug), record = report.records.find(item => item.slug === entry.slug);
    assert.equal(photo, photos[entry.slug]); assert.ok(photo && record, entry.slug); assert.equal(photo.slug, entry.slug);
    for (const key of ['src', 'width', 'height', 'author', 'license', 'licenseUrl', 'creditUrl', 'modifications']) assert.equal(photo[key], record[key], `${entry.slug}: ${key}`);
    assert.ok(photo.name.trim() && photo.author.trim() && photo.license.trim());
    assert.match(photo.src, /^\/(?:lernen|wildkunde)\/.+\.jpg$/); assert.ok(Number.isInteger(photo.width) && photo.width > 0 && Number.isInteger(photo.height) && photo.height > 0);
    assert.ok(record.sourcePage && record.sourceKind && record.sha256); assert.match(record.sha256, /^[a-f0-9]{64}$/i);
    assert.equal(record.aiGenerated, false, entry.slug);
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src)); assert.equal(bytes.length, record.bytes); assert.equal(sha(bytes), record.sha256);
    const image = sharp(bytes), metadata = await image.metadata(); assert.equal(metadata.format, 'jpeg'); assert.deepEqual([metadata.width, metadata.height], [photo.width, photo.height]);
    const decoded = await image.raw().toBuffer({ resolveWithObject: true }); assert.equal(decoded.data.length, photo.width * photo.height * decoded.info.channels);
  }
  for (const invalid of [null, undefined, {}, [], ['rehwild'], 1, '', 'unknown', 'constructor', '__proto__', 'toString']) assert.equal(photograph(invalid), null);
});

test('Every existing photo file, biological object, source date and all 384 monthly profiles remain unchanged from the release', () => {
  const old = baselineLoader(), previous = old('lib/wild-year.js'), current = load('lib/wild-year.js');
  assert.deepEqual(catalog, old('lib/wild-year-catalog.js').wildYearCatalog);
  assert.deepEqual(current.wildYearSpecies, previous.wildYearSpecies); assert.deepEqual(current.wildYearSources, previous.wildYearSources); assert.deepEqual(current.wildYearSearchEntries, previous.wildYearSearchEntries);
  assert.equal(current.wildYearSpecies.length, 32);
  let viewed = 0;
  for (const species of current.wildYearSpecies) for (let month = 1; month <= 12; month++) { assert.deepEqual(current.getWildYearProfile(species.slug, month), previous.getWildYearProfile(species.slug, month)); viewed++; }
  assert.equal(viewed, 384);
  const oldPhotos = old('lib/wildlife-photographs.js').wildlifePhotographs;
  assert.deepEqual(load('lib/wildlife-photographs.js').wildlifePhotographs, oldPhotos);
  for (const photo of Object.values(oldPhotos)) assert.equal(sha(fs.readFileSync(path.join(root, 'public', photo.src))), photo.sha256, photo.src);
  const beforeOverview = old('lib/wild-year-overview-server.js'), afterOverview = load('lib/wild-year-overview-server.js');
  for (const entry of catalog) assert.deepEqual(afterOverview.getWildYearOverview(entry.slug), beforeOverview.getWildYearOverview(entry.slug), entry.slug);
});

test('Each of the 114 native picker buttons keeps its short accessible name and owns one lazy, dimensioned decorative animal photo', () => {
  const calls = [], tree = Picker({ selectedSlug: 'rehwild', disabled: false, onSelect: slug => calls.push(slug) }), buttons = choices(tree);
  const groups = [...new Set(catalog.map(entry => entry.group))];
  assert.deepEqual(buttons.map(button => button.props['data-wildjahr-species']), groups.flatMap(group => catalog.filter(entry => entry.group === group).map(entry => entry.slug)));
  assert.equal(buttons.length, 114); assert.equal(buttons.filter(button => button.props['aria-pressed']).length, 1);
  for (const entry of catalog) {
    const button = buttons.find(item => item.props['data-wildjahr-species'] === entry.slug), [image] = images(button), photo = photograph(entry.slug);
    assert.equal(text(button), entry.name); assert.equal(button.props.type, 'button'); assert.equal(button.props.disabled, false); assert.equal(images(button).length, 1);
    assert.equal(image.props.src, photo.src); assert.equal(image.props.alt, ''); assert.equal(image.props.loading, 'lazy'); assert.equal(image.props.priority, undefined);
    assert.deepEqual([image.props.width, image.props.height], [photo.width, photo.height]); assert.ok(image.props.sizes);
    assert.equal(image.props.onLoad, undefined); assert.equal(image.props.onClick, undefined);
    button.props.onClick();
  }
  assert.deepEqual(calls, catalog.map(entry => entry.slug), 'Each deliberately invoked button delegates its own slug in invocation order');
  assert.equal(buttons.find(button => button.props['aria-pressed']).props['data-wildjahr-species'], 'rehwild', 'Clicks do not optimistically alter the committed selection');
  const disabled = Picker({ selectedSlug: 'rehwild', disabled: true }); assert.ok(choices(disabled).every(button => button.props.disabled));
  assert.equal(nodes(tree, node => ['input', 'select', 'option', 'dialog', 'form', 'a'].includes(node.type)).length, 0);
  const html = renderToStaticMarkup(React.createElement(ssrLoad('components/WildYearSpeciesPicker.js').default, { selectedSlug: 'rehwild', disabled: false }));
  assert.equal((html.match(/<img\b/g) || []).length, 114); assert.equal((html.match(/<button\b/g) || []).length, 114); assert.doesNotMatch(html, /<dialog|<select|<input/);
  const css = local('postcss').parse(fs.readFileSync(path.join(root, 'styles/WildYear.module.css'), 'utf8'));
  for (const selector of ['.speciesThumbnail', '.portrait img']) {
    const values = []; css.walkRules(rule => { if (rule.selector === selector) rule.walkDecls('object-fit', value => values.push(value.value)); });
    assert.ok(values.includes('contain'), `${selector}: no unrecorded display crop`);
  }
});

test('All 114 selection credits are complete, closed and last within the same menu, including the bare entry', t => {
  const tree = Credits(); assert.equal(tree.type, 'details'); assert.equal(tree.props.id, 'wildjahr-photo-credits'); assert.equal(tree.props.open, undefined);
  const records = nodes(tree, node => node.props?.['data-wildjahr-photo-credit']); assert.equal(records.length, 114);
  assert.deepEqual(records.map(record => record.props['data-wildjahr-photo-credit']), catalog.map(entry => entry.slug));
  const html = renderToStaticMarkup(React.createElement(Credits)); assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/);
  for (const entry of catalog) {
    const photo = photograph(entry.slug); assert.ok(html.includes(escape(entry.name))); assert.ok(html.includes(escape(photo.creditUrl))); assert.ok(html.includes(escape(photo.licenseUrl)));
    assert.ok(html.includes(escape(photo.author))); assert.ok(html.includes(escape(photo.license))); assert.ok(html.includes(escape(photo.modifications)));
  }
  assert.ok(html.includes('gileslaurent.com'), 'Preserve the existing explicit photographer attribution');
  for (const query of [{}, { art: 'rehwild', monat: '6' }, { art: 'wolf', monat: '6' }, { art: 'unknown', monat: '6' }]) {
    const h = fixture(t, query), menu = h.nodes(node => node.type?.name === 'PageMenu')[0], content = nodes(menu, node => node.type?.name === 'WildYearPhotoCredits');
    assert.equal(content.length, 1); const children = React.Children.toArray(menu.props.children.props.children).filter(React.isValidElement);
    assert.equal(children.at(-1).type.name, 'WildYearPhotoCredits');
    const picker = h.nodes(node => node.type?.name === 'WildYearSpeciesPicker')[0]; assert.ok(nodes(menu, () => true).indexOf(picker) < nodes(menu, () => true).indexOf(content[0]));
  }
});

test('All 114 server selections and first hydrations show only their own current photo before full learning cards and final sources', t => {
  for (const entry of catalog) {
    const query = { art: entry.slug, monat: '6' }, props = page.getServerSideProps({ query }).props, photo = photograph(entry.slug);
    const html = renderToStaticMarkup(React.createElement(SSRWildYear, props)), h = fixture(t, {}, { ready: false, props });
    const figure = selected(h), image = selectedImage(h), sequence = h.nodes(() => true), heading = h.nodes(node => node.props?.id === 'wildjahr-current')[0], cards = h.nodes(node => node.type === 'article');
    assert.ok(figure && image && heading, entry.slug); assert.equal(figure.props['data-wildjahr-photo'], entry.slug); assert.equal(figure.key, entry.slug);
    assert.equal(image.props.src, photo.src); assert.deepEqual([image.props.width, image.props.height], [photo.width, photo.height]); assert.equal(image.props.priority, true); assert.match(image.props.alt, /unabhängig vom ausgewählten Monat/);
    assert.ok(sequence.indexOf(heading) < sequence.indexOf(figure)); assert.ok(cards.length > 0 && sequence.indexOf(figure) < sequence.indexOf(cards[0]), entry.slug);
    assert.ok(html.includes(`data-wildjahr-photo="${entry.slug}"`)); assert.ok(html.includes(escape(photo.src)));
    const body = h.nodes(node => node.props?.id === 'wildjahr-top')[0], bodyNodes = nodes(body, () => true), footer = nodes(body, node => node.type === 'details').at(-1);
    assert.equal(text(nodes(footer, node => node.type === 'summary')[0]), 'Quellen und Bildnachweis'); assert.equal(footer.props.open, undefined);
    assert.ok(bodyNodes.indexOf(figure) < bodyNodes.indexOf(footer)); assert.ok(bodyNodes.indexOf(cards.at(-1)) < bodyNodes.indexOf(footer));
    const calendar = load('lib/wild-year.js'), monthly = calendar.wildYearSpecies.some(species => species.slug === entry.slug) ? calendar.getWildYearProfile(entry.slug, 6) : null;
    const paragraphs = monthly ? monthly.sections.map(section => section.claim.text) : props.annualOverview.sections.flatMap(section => section.paragraphs);
    for (const paragraph of paragraphs) assert.ok(html.indexOf(`data-wildjahr-photo="${entry.slug}"`) < html.indexOf(escape(paragraph)), entry.slug);
    h.router.isReady = true; h.route(query); assert.equal(selectedImage(h).props.src, photo.src); assert.equal(h.calls.length, 0);
  }
});

test('Bare, invalid, unready and mismatched server selections never borrow an arbitrary current portrait', t => {
  for (const query of [{}, { art: '' }, { art: 'unknown' }, { art: ['rehwild'] }, { art: 'rehwild', monat: ['6'] }, { art: 'rehwild', monat: '13' }]) {
    const h = fixture(t, query); assert.equal(selected(h), undefined); assert.equal(h.calls.length, 0);
  }
  const initial = fixture(t, { art: 'rehwild', monat: '6' }, { ready: false, props: { currentMonth: 6, initialSelection: null, annualOverview: null } }); assert.equal(selected(initial), undefined);
  const h = fixture(t, { art: 'wolf', monat: '6' }); assert.equal(selected(h).props['data-wildjahr-photo'], 'wolf');
  h.route({ art: 'kolbenente', monat: '6' }, false); assert.equal(selected(h), undefined); assert.match(text(h.tree), /wird geladen/);
  h.propsFor({ art: 'kolbenente', monat: '6' }); assert.equal(selected(h).props['data-wildjahr-photo'], 'kolbenente');
});

test('Pending, refused and rejected photo selections retain the committed animal; matching URL plus props performs the real switch', async t => {
  for (const result of ['false', 'reject']) {
    const h = fixture(t), before = selectedImage(h).props.src, action = h.choose('wolf'); h.render();
    assert.equal(selectedImage(h).props.src, before); assert.equal(h.requests.length, 1); assert.equal(h.requests[0].href.hash, 'wildjahr-top');
    assert.deepEqual(h.requests[0].options, { shallow: false, scroll: false });
    if (result === 'false') h.requests[0].resolve(false); else h.requests[0].reject(new Error('isolated refusal'));
    await action; h.render(); assert.equal(selectedImage(h).props.src, before); assert.equal(h.router.query.art, 'rehwild');
    const retry = h.choose('wolf'), request = h.requests[1]; h.route(request.href.query, false);
    assert.equal(selected(h), undefined, 'No old photo under the newly committed overview URL while its own props are pending');
    request.resolve(true); await retry; h.render(); assert.equal(selected(h), undefined);
    h.propsFor(request.href.query); assert.equal(selected(h).props['data-wildjahr-photo'], 'wolf'); assert.equal(selectedImage(h).props.src, photograph('wolf').src);
  }
});

test('History restores the correct animal and stale or unmounted picker actions cannot create a later photo switch', async t => {
  const h = fixture(t), picker = h.nodes(node => node.type?.name === 'WildYearSpeciesPicker')[0], stale = choices(picker.type(picker.props)).find(button => button.props['data-wildjahr-species'] === 'wolf').props.onClick;
  const action = h.choose('wolf'); h.route({ art: 'murmeltier', monat: '8' }); assert.equal(selectedImage(h).props.src, photograph('murmeltier').src);
  h.requests[0].reject(new Error('obsolete selection')); await action; h.render(); assert.equal(selected(h).props['data-wildjahr-photo'], 'murmeltier');
  await stale(); assert.equal(h.requests.length, 1);
  h.route({ art: 'rehwild', monat: '6' }); assert.equal(selectedImage(h).props.src, photograph('rehwild').src);
  const currentPicker = h.nodes(node => node.type?.name === 'WildYearSpeciesPicker')[0], current = choices(currentPicker.type(currentPicker.props)).find(button => button.props['data-wildjahr-species'] === 'wolf').props.onClick;
  h.dispose(); await current(); assert.equal(h.requests.length, 1); assert.equal(selectedImage(h).props.src, photograph('rehwild').src);
});

test('All exact photo files remain anonymously loadable while lesson pages, source neighbours and unknown image paths stay protected', async () => {
  const middleware = load('middleware.js').middleware, request = value => { const nextUrl = new URL(value, 'https://jagdlatein.de'); return { nextUrl, url: nextUrl.href, cookies: { get() { return undefined; } } }; };
  for (const photo of Object.values(photos)) { const response = await middleware(request(photo.src)); assert.equal(response.headers.get('x-middleware-next'), '1', photo.src); }
  const firstNew = Object.values(photos).find(photo => photo.src.includes('2026-11-15') && !photo.src.includes('/videos-'));
  assert.ok(firstNew, 'The new explicit image files are part of this package');
  const directory = path.posix.dirname(firstNew.src);
  for (const value of ['/lernen/wildjahr?art=wolf', '/kurse/wissen-spuren-systematisch', directory, `${directory}/answers.json`, `${directory}/unknown.jpg`, `${firstNew.src}/extra`]) {
    const response = await middleware(request(value)); assert.equal(new URL(response.headers.get('location')).pathname, '/preise', value);
  }
});

test('Only the two documented close crops override old portrait paths, with valid source geometry and the original attribution and licence', async () => {
  const oldPhotos = baselineLoader()('lib/wildlife-photographs.js').wildlifePhotographs, records = evidence().records;
  const cropped = records.filter(record => record.derivedFrom);
  assert.deepEqual(cropped.map(record => record.slug).sort(), ['birkhuhn', 'nebelkraehe']);
  for (const record of cropped) {
    const old = oldPhotos[record.slug], rectangle = record.crop, sourceBytes = fs.readFileSync(path.join(root, 'public', old.src));
    assert.equal(record.derivedFrom, old.src); assert.equal(record.derivedFromSha256, sha(sourceBytes)); assert.equal(record.derivedFromSha256, old.sha256);
    assert.notEqual(record.src, old.src); assert.notEqual(record.sha256, old.sha256);
    for (const key of ['author', 'license', 'licenseUrl', 'sourcePage']) assert.equal(record[key], old[key]);
    for (const value of Object.values(rectangle)) assert.ok(Number.isInteger(value) && value >= 0);
    assert.ok(rectangle.width > 0 && rectangle.height > 0 && rectangle.left + rectangle.width <= old.width && rectangle.top + rectangle.height <= old.height);
    const actual = await sharp(path.join(root, 'public', record.src)).metadata(); assert.deepEqual([actual.width, actual.height], [rectangle.width, rectangle.height]);
    assert.match(record.modifications, /Bildausschnitt/); assert.match(record.modifications, /derselben Bildlizenz/);
  }
  for (const [slug, previous] of Object.entries(oldPhotos)) if (!['birkhuhn', 'nebelkraehe'].includes(slug)) assert.equal(photograph(slug).src, previous.src, slug);
});
