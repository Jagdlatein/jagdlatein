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
const css = new Proxy({}, { get: (_, key) => String(key) });
function load(relative, overrides = {}, expose = '') {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, req = createRequire(filename);
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ query: {}, isReady: false }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'object' ? href.pathname : href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/image') return ({ priority, loading, sizes, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), /\.(js|json)$/.test(id) ? id : `${id}.js`)), overrides);
    return req(id);
  }
  new Function('require', 'module', 'exports', code + (expose ? `\nmodule.exports.__test = ${expose};` : ''))(resolve, mod, mod.exports);
  return mod.exports;
}
function engine() {
  const slots = [], effects = []; let cursor = 0;
  const hooks = { ...React,
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useCallback(fn) { return fn; },
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useEffect(fn, deps) { const i = cursor++; const old = slots[i]; if (!old || !deps || deps.some((dep, j) => !Object.is(dep, old.deps[j]))) { slots[i] = { deps }; effects.push(fn); } },
  };
  return { hooks, render(fn) { cursor = 0; return fn(); }, effects() { for (const effect of effects.splice(0)) effect(); } };
}
function find(node, predicate) { if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; } if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
function text(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(text).join(''); return typeof node === 'object' ? text(node.props?.children) : String(node); }
function setup(file, props = {}, exposed = '', router = { query: {}, isReady: false }) {
  const e = engine(); const mod = load(file, { react: e.hooks, 'next/router': { useRouter: () => router } }, exposed); const Component = exposed ? mod.__test : mod.default; let tree;
  const render = () => tree = e.render(() => Component(props)); render();
  return { e, render, router, get tree() { return tree; }, html() { return renderToStaticMarkup(tree); } };
}

const sounds = load('lib/animal-sounds.js').animalSounds;
const spectra = load('lib/sound-spectrograms.js');
const weekly = load('lib/community-weekly-case.js');
test('Every Klangbild is traceable to its exact complete original recording', async () => {
  const sharp = pr('sharp');
  assert.equal(Object.keys(spectra.soundSpectrograms).length, sounds.length);
  for (const sound of sounds) {
    const chart = spectra.soundSpectrograms[sound.id];
    assert.equal(chart.originalSrc, sound.src);
    assert.equal(chart.author, sound.author);
    assert.equal(chart.licenseUrl, sound.licenseUrl);
    assert.equal(chart.originalSha256, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'public', sound.src))).digest('hex'));
    const imagePath = path.join(root, 'public', chart.src);
    assert.equal(chart.sha256, crypto.createHash('sha256').update(fs.readFileSync(imagePath)).digest('hex'));
    const image = await sharp(imagePath).metadata();
    assert.equal(image.width, 1296); assert.equal(image.height, 528);
    assert.ok(chart.durationSeconds > 0 && chart.sampleRate >= 16000);
    assert.ok(Math.abs(chart.durationSeconds - sound.duration) < 0.25, sound.id);
    assert.ok(chart.maxFrequencyHz <= chart.sampleRate / 2);
    assert.deepEqual(chart.displayRangeDb, [-80, 0]);
  }
});
test('Spectrum loads only after opening, closes without changing the original player, and has a readable fallback', () => {
  const s = setup('components/SoundSpectrogram.js', { sound: sounds[0] });
  assert.doesNotMatch(s.html(), /<img/);
  find(s.tree, node => node.type === 'details').props.onToggle({ currentTarget: { open: true } }); s.render();
  assert.match(s.html(), /Zeit in Sekunden/); assert.match(s.html(), /Hann/);
  find(s.tree, node => node.type === 'img').props.onError(); s.render();
  assert.match(s.html(), /nicht geladen/);
});
test('Weekly cases switch at Monday midnight in Zurich, including winter and daylight-saving dates', () => {
  assert.equal(weekly.weeklyCaseIndex(new Date('2026-10-18T21:59:59Z')), 0);
  assert.equal(weekly.weeklyCaseIndex(new Date('2026-10-18T22:00:00Z')), 1);
  assert.equal(weekly.weeklyCaseIndex(new Date('2026-10-25T22:59:59Z')), 1);
  assert.equal(weekly.weeklyCaseIndex(new Date('2026-10-25T23:00:00Z')), 2);
  assert.equal(weekly.weeklyCaseIndex(new Date('2026-11-15T23:00:00Z')), 5);
  assert.equal(weekly.weeklyCaseIndex(new Date('2026-12-13T23:00:00Z')), 0);
  assert.equal(weekly.weeklyCaseIndex(new Date('bad')), 0);
});
test('Weekly case feedback and discussion preserve topic, real credit, independent sources, and moderation', () => {
  assert.equal(weekly.communityWeeklyCases.length, 9);
  for (const item of weekly.communityWeeklyCases) {
    assert.ok(item.question && item.choices[item.answer] && item.photo.author);
    assert.ok(new Set(item.sources.map(source => source.organization)).size >= 2);
    assert.ok(item.discussionTitle.length <= 140);
  }
  const calls = [];
  const s = setup('components/CommunityWeeklyCase.js', { canDiscuss: true, onDiscuss: item => calls.push(item) });
  assert.match(s.html(), /Bildnachweis/);
  find(s.tree, node => node.type === 'input' && node.props.type === 'radio').props.onChange(); s.render();
  assert.match(s.html(), /Richtig eingeordnet\.|Passend ist:/);
  find(s.tree, node => node.type === 'select').props.onChange({ target: { value: weekly.communityWeeklyCases[1].id } }); s.render();
  assert.doesNotMatch(s.html(), /Richtig eingeordnet\.|Passend ist:/);
  find(s.tree, node => node.type === 'button').props.onClick();
  assert.equal(calls[0].id, weekly.communityWeeklyCases[1].id);
});
test('A selected community learning case survives login and unknown case IDs are discarded', () => {
  const router = { query: { fall: 'bachflohkrebse' }, isReady: true };
  const s = setup('components/Community.js', { signedIn: false }, '', router);
  const href = find(s.tree, node => node.props?.href?.startsWith?.('/login?')).props.href;
  assert.equal(new URL(href, 'https://test.invalid').searchParams.get('next'), '/community?fall=bachflohkrebse#community-wochenfall');
  router.query.fall = 'not-a-case'; s.render();
  const invalid = find(s.tree, node => node.props?.href?.startsWith?.('/login?')).props.href;
  assert.equal(new URL(invalid, 'https://test.invalid').searchParams.get('next'), '/community');
});
test('All eight additions are reachable through existing tools and exact media paths', () => {
  const assets = load('lib/knowledge-expansion-assets.js').knowledgeExpansionAssetPaths;
  for (const relative of assets) assert.ok(fs.existsSync(path.join(root, 'public', relative)), relative);
  assert.ok(spectra.soundSpectrogramAssetPaths.every(relative => assets.includes(relative)));
  const entries = load('lib/knowledge-expansion-search.js').knowledgeExpansionSearchEntries;
  for (const prefix of ['verdauung-', 'parasiten-', 'revierleben:nahrungsnetz', 'bewegung:', 'entwicklung:', 'community-fall:']) {
    assert.ok(entries.some(entry => entry.id.startsWith(prefix)), prefix);
  }
  const experiences = load('lib/learning-experiences.js').learningExperiences;
  // On October 26, the published HEAD already has 26 entries including the
  // later video library; excluding Wissen fürs Revier preserves 25 entries.
  assert.equal(experiences.filter(item => item.href !== '/lernen/wissen-fuers-revier').length, 25);
});
test('Confirmed Schwarzwild anatomy contradiction is corrected in both existing pursuit cases', () => {
  const text = fs.readFileSync(path.join(root, 'pages/jagdpraxis/nachsuche.js'), 'utf8');
  assert.doesNotMatch(text, /Keiler[^\n]*Pansen|Sau[^\n]*Pansenschweiß/);
  assert.match(text, /Keiler – dunkler Schweiß \+ Magen-\/Darminhalt/);
  assert.match(text, /Sau – Schweiß mit Magen-\/Darminhalt/);
});

