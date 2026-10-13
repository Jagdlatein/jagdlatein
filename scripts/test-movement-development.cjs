const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
function load(relative, overrides = {}) {
  const filename = path.resolve(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  const requireLocal = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id === 'next/image') return { __esModule: true, default: ({ unoptimized, ...props }) => React.createElement('img', props) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), /\.(js|json)$/.test(id) ? id : `${id}.js`)), overrides);
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(requireLocal, mod, mod.exports);
  return mod.exports;
}
const movement = load('lib/wild-movement.js');
const development = load('lib/development-photo-series.js');
const audit = load('public/lernen/bewegung-entwicklung-2026/bewegungsdaten-nachweis.json');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

test('Every displayed movement coordinate/time is an exact identified original CSV event', () => {
  const [header, ...lines] = fs.readFileSync(path.join(root, 'public/lernen/bewegung-entwicklung-2026/weissstorch-originalausschnitt.csv'), 'utf8').trim().split(/\r?\n/);
  // This retained excerpt has no commas or quotes inside values; fail if that changes.
  const columns = header.split(','); const rows = lines.map(line => { const values = line.split(','); assert.equal(values.length, columns.length); return Object.fromEntries(columns.map((key, i) => [key, values[i]])); });
  const dataset = movement.wildMovementDatasets[0];
  assert.equal(rows.length, 52); assert.equal(dataset.points.length, 52);
  assert.equal(new Set(dataset.points.map(point => point.eventId)).size, 52);
  for (const point of dataset.points) {
    const original = rows.find(row => row['event-id'] === point.eventId);
    assert.ok(original); assert.equal(point.timestamp, original.timestamp);
    assert.equal(point.longitude, Number(original['location-long'])); assert.equal(point.latitude, Number(original['location-lat']));
    assert.equal(point.horizontalAccuracyEstimateMetres, Number(original['eobs:horizontal-accuracy-estimate']));
    assert.equal(original['individual-local-identifier'], audit.animalIdentifier);
    assert.equal(original.visible, 'TRUE'); assert.equal(original['eobs:status'], 'A'); assert.equal(original['sensor-type'], 'gps');
  }
  assert.equal(audit.matchingOriginalEvents, 65998);
  assert.match(audit.timeBasis, /UTC or GPS/);
  assert.match(dataset.timeBasis, /keine lokale Uhrzeit/);
  assert.ok(dataset.points.some(point => point.longitude > 8 && point.latitude > 47));
  assert.ok(dataset.points.some(point => point.longitude > 6 && point.longitude < 9 && point.latitude > 46 && point.latitude < 47.6));
});
test('Thinning changes sampling only and preserves published events, chronology and file provenance', () => {
  const dataset = movement.wildMovementDatasets[0]; const snapshot = JSON.stringify(dataset.points);
  const daily = movement.selectMovementPoints(dataset, 'daily');
  assert.equal(daily.length, 13); assert.ok(daily.every(point => point.targetHour === 12));
  assert.ok(daily.every(point => dataset.points.includes(point)));
  assert.equal(movement.selectMovementPoints(dataset, 'unknown').length, 52);
  assert.deepEqual(movement.selectMovementPoints(null), []);
  for (let i = 1; i < dataset.points.length; i++) assert.ok(dataset.points[i].timestamp > dataset.points[i - 1].timestamp);
  assert.equal(JSON.stringify(dataset.points), snapshot);
  for (const [filename, expected] of Object.entries(audit.outputs)) assert.equal(hash(fs.readFileSync(path.join(root, 'public/lernen/bewegung-entwicklung-2026', filename))), expected, filename);
  assert.equal(audit.originalArchiveBytes, 422473815);
});
test('Map projection places historic points inside the overview and renders unconnected measurements', () => {
  const dataset = movement.wildMovementDatasets[0];
  for (const point of dataset.points) { const position = movement.projectMovementPoint(point.longitude, point.latitude); assert.ok(position.x >= 0 && position.x <= 760); assert.ok(position.y >= 0 && position.y <= 490); }
  assert.ok(movement.projectMovementPoint(0, 50).y < movement.projectMovementPoint(0, 40).y);
  assert.ok(movement.projectMovementPoint(10, 45).x > movement.projectMovementPoint(0, 45).x);
  const Graphic = load('components/WildMovementMap.js').MovementMapGraphic;
  const html = renderToStaticMarkup(React.createElement(Graphic, { points: dataset.points, index: 51 }));
  assert.equal((html.match(/<circle /g) || []).length, 52);
  assert.doesNotMatch(html, /<polyline|<polygon|flight-path/);
  assert.match(html, /keine Fluglinien/); assert.match(html, /Tabelle/);
  assert.match(html, /04\.09\.2014/);
});
test('Photo sequence preserves documented individual, chronological gaps, licence and actual image bytes', async () => {
  const sharp = pr('sharp'); const series = development.developmentPhotoSeries[0];
  assert.deepEqual(series.frames.map(frame => frame.dayAfterSowing), [29, 32, 39, 221, 227]);
  for (const frame of series.frames) {
    assert.match(frame.sourceUrl, /gland_1/); assert.equal(frame.author, 'Abaddon1337'); assert.equal(frame.aiGenerated, false);
    assert.equal(frame.license, 'CC BY-SA 4.0'); assert.equal(frame.reviewedOn, '2026-10-13');
    assert.equal(frame.visuallyInspectedOn, '2026-10-13');
    const bytes = fs.readFileSync(path.join(root, 'public', frame.src)); assert.equal(hash(bytes), frame.sha256);
    const metadata = await sharp(bytes).metadata(); assert.equal(metadata.width, frame.width); assert.equal(metadata.height, frame.height); assert.equal(metadata.format, 'webp');
    assert.match(frame.modifications, /Kein Ausschnitt/); assert.ok(frame.inputSha256.length === 64);
    if (frame.downloadedPreview) { assert.equal(frame.originalSha256, null); assert.equal(frame.originalCommonsSha1.length, 40); assert.match(frame.inputDownload, /^https:\/\/thumb\.wikimedia\.org\//); }
  }
  assert.match(series.boundaries.join(' '), /Tag 39 und Tag 221/);
  assert.match(series.scope, /Topf/); assert.match(series.scope, /kein Freilandkalender/);
  assert.equal(development.getDevelopmentFrame(series, 99).dayAfterSowing, 29);
  assert.equal(development.getDevelopmentFrame(series, 1.5).dayAfterSowing, 29);
});
test('Biological/methodical claims carry scoped independent references without treating a single sequence as repeat data', () => {
  for (const [claims, sources] of [[movement.wildMovementDatasets[0].facts, movement.wildMovementSources], [development.developmentPhotoSeries[0].facts, development.developmentSources]]) {
    for (const claim of claims) { assert.ok(claim.sourceIds.length >= 2, claim.id); assert.ok(new Set(claim.sourceIds.map(id => sources[id]?.organization)).size >= 2, claim.id); for (const id of claim.sourceIds) assert.match(sources[id].url, /^https:\/\//); }
  }
  assert.match(movement.wildMovementDatasets[0].boundaries.join(' '), /nicht unabhängig wiederholt/);
  assert.match(development.developmentPhotoSeries[0].identityEvidence, /keine wissenschaftliche Wiederholung/);
  assert.equal(development.developmentPhotoSeries[0].question.answer, 1);
});
function hooksEngine() {
  let cursor = 0; const slots = [];
  const hooks = { ...React, useId: () => 'test-movement', useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; } };
  return { hooks, render(Component) { cursor = 0; return Component({}); } };
}
function findNode(node, predicate) { if (!node || typeof node !== 'object') return null; if (predicate(node)) return node; return React.Children.toArray(node.props?.children).map(child => findNode(child, predicate)).find(Boolean) || null; }
test('Interactive movement timeline, sampling and learning answer update without purchase/network actions', () => {
  const engine = hooksEngine(); const Component = load('components/WildMovementMap.js', {react: engine.hooks}).default;
  let tree = engine.render(Component);
  findNode(tree, node => node.type === 'input' && node.props.type === 'range').props.onChange({target: {value: '51'}});
  tree = engine.render(Component); assert.match(renderToStaticMarkup(tree), /04\.09\.2014/);
  findNode(tree, node => node.type === 'select').props.onChange({target: {value: 'daily'}});
  tree = engine.render(Component); assert.equal(findNode(tree, node => node.type === 'input' && node.props.type === 'range').props.max, 12);
  assert.equal(findNode(tree, node => node.type === 'input' && node.props.type === 'range').props.value, 12);
  assert.match(renderToStaticMarkup(tree), /04\.09\.2014/);
  const radios = []; function collect(node) { if (!node || typeof node !== 'object') return; if (node.type === 'input' && node.props.type === 'radio') radios.push(node); React.Children.forEach(node.props?.children, collect); } collect(tree); radios[1].props.onChange();
  assert.match(renderToStaticMarkup(engine.render(Component)), /Richtig eingeordnet/);
});
test('Sampling keeps a nearest existing timestamp instead of returning to the first day or interpolating', () => {
  const points = [{ timestamp: '2014-08-23 12:00:00' }, { timestamp: '2014-08-24 12:00:00' }, { timestamp: '2014-08-25 12:00:00' }];
  assert.equal(movement.nearestMovementPointIndex(points, '2014-08-25 06:00:00'), 2);
  assert.equal(movement.nearestMovementPointIndex(points, '2014-08-24 12:00:00'), 1);
  assert.equal(movement.nearestMovementPointIndex(points, '2014-08-25 00:00:00'), 1);
  assert.equal(movement.nearestMovementPointIndex(points, 'invalid'), 0);
  assert.equal(movement.nearestMovementPointIndex([], '2014-08-25 06:00:00'), 0);
  assert.equal(points.length, 3);
});
test('Interactive development slider keeps exact documented day and provides answer feedback', () => {
  const engine = hooksEngine(); const Component = load('components/DevelopmentPhotoSeries.js', {react: engine.hooks}).default;
  let tree = engine.render(Component);
  findNode(tree, node => node.type === 'input' && node.props.type === 'range').props.onChange({target: {value: '3'}});
  tree = engine.render(Component); assert.match(renderToStaticMarkup(tree), /Tag 221/); assert.match(renderToStaticMarkup(tree), /15\.06\.2015/);
  const choices = []; function collect(node) { if (!node || typeof node !== 'object') return; if (node.type === 'input' && node.props.type === 'radio') choices.push(node); React.Children.forEach(node.props?.children, collect); } collect(tree); choices[1].props.onChange();
  assert.match(renderToStaticMarkup(engine.render(Component)), /Richtig eingeordnet/);
});
test('Search deep-links and registered local assets exist in the existing learning tools', () => {
  assert.match(movement.wildMovementSearchEntries[0].href, /^\/lernen\/forschung-verstehen\?datensatz=weissstorch-olea-2014#wildbewegung$/);
  assert.match(development.developmentSearchEntries[0].href, /^\/lernen\/pflanzenatlas\?entwicklung=stieleiche-gland1#pflanzen-entwicklung$/);
  for (const asset of [...movement.wildMovementAssetPaths, ...development.developmentAssetPaths]) assert.ok(fs.existsSync(path.join(root, 'public', asset)), asset);
});
