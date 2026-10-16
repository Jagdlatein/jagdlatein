const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), pr = createRequire(path.join(root, 'package.json'));
const React = pr('react'), swc = pr('next/dist/build/swc');
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(item => nodes(item, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function setup(search = '') {
  const slots = [], cache = new Map();
  let cursor = 0, effects = [], changed = false, tree;
  const hooks = { ...React,
    useState(initial) {
      const i = cursor++; if (!slots[i]) slots[i] = { value: initial };
      return [slots[i].value, input => { const next = typeof input === 'function' ? input(slots[i].value) : input; changed = changed || !Object.is(next, slots[i].value); slots[i].value = next; }];
    },
    useEffect(callback) { const i = cursor++; if (!slots[i]) { slots[i] = {}; effects.push(callback); } },
  };
  function load(relative) {
    const file = path.join(root, relative);
    if (cache.has(file)) return cache.get(file);
    const { code } = swc.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    const mod = { exports: {} };
    new Function('require', 'module', 'exports', 'window', code)(id => {
      if (id === 'react') return hooks;
      if (id === './LearningToolLayout') return () => null;
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), path.extname(id) ? id : `${id}.js`)));
      return pr(id);
    }, mod, mod.exports, { location: { search } });
    cache.set(file, mod.exports); return mod.exports;
  }
  const Page = load('components/VenisonCutGuide.js').default;
  function render() {
    for (let pass = 0; pass < 5; pass++) {
      cursor = 0; changed = false; tree = Page();
      const pending = effects; effects = []; pending.forEach(effect => effect());
      if (!changed) return tree;
    }
    throw new Error('Venison controls did not settle');
  }
  render();
  return {
    get tree() { return tree; },
    cuts: load('lib/venison-cut-guide.js').venisonCuts,
    photo: load('lib/venison-cut-guide.js').venisonCutPhoto,
    rail: () => nodes(tree, node => node.props?.className === 'cutRail')[0],
    locator: () => nodes(tree, node => node.props?.className === 'cutLocator')[0],
    buttons: () => nodes(tree, node => node.type === 'button'),
    select(id) { const button = this.buttons().find(node => node.props['aria-controls'] === `wildbret-${id}`); assert.ok(button); button.props.onClick(); render(); },
    query(value) { nodes(tree, node => node.type === 'input')[0].props.onChange({ target: { value } }); render(); },
    failImage() { nodes(tree, node => node.type === 'img' && node.props.src === this.photo.src)[0].props.onError(); render(); },
  };
}
function assertSelected(h, cut) {
  const locator = h.locator(); assert.ok(locator);
  assert.equal(locator.props['aria-hidden'], 'true');
  const line = nodes(locator, node => node.type === 'line'); assert.equal(line.length, 1);
  assert.deepEqual([line[0].props.x1, line[0].props.y1, line[0].props.x2, line[0].props.y2], [cut.marker.x, cut.marker.y, cut.marker.x, '100']);
  const ring = nodes(locator, node => node.type === 'span')[0];
  assert.deepEqual(ring.props.style, { left: `${cut.marker.x}%`, top: `${cut.marker.y}%` });
  assert.equal(text(locator), '');
  const pressed = h.buttons().filter(node => node.props['aria-pressed']); assert.equal(pressed.length, 1);
  assert.equal(pressed[0].props['aria-controls'], `wildbret-${cut.id}`);
  const selected = nodes(h.tree, node => node.type === 'article' && node.props.className.includes('cutCardSelected'));
  assert.equal(selected.length, 1); assert.equal(selected[0].props.id, `wildbret-${cut.id}`);
}

test('Numbers and named controls sit below the full-aspect photo; only one hollow locator uses original coordinates', () => {
  const h = setup();
  assert.equal(h.locator(), undefined);
  assert.equal(h.buttons().filter(node => node.props['aria-pressed']).length, 0);
  const map = nodes(h.tree, node => node.props?.className === 'photoMap')[0];
  assert.equal(nodes(map, node => node.type === 'button').length, 0);
  assert.equal(nodes(map, node => node.type === 'span' && text(node)).length, 0);
  const image = nodes(map, node => node.type === 'img')[0];
  assert.equal(image.props.src, h.photo.src); assert.equal(image.props.width, '1920'); assert.equal(image.props.height, '1080');
  const figure = nodes(h.tree, node => node.type === 'figure' && node.props.className === 'overview')[0];
  assert.ok(figure.props.children.indexOf(map) < figure.props.children.indexOf(h.rail()));
  assert.equal(h.rail().props.role, 'group'); assert.equal(h.buttons().length, 5);
  for (const cut of h.cuts) {
    h.select(cut.id); assertSelected(h, cut);
    assert.equal(h.buttons().length, 5);
    const button = h.buttons().find(node => node.props['aria-controls'] === `wildbret-${cut.id}`);
    assert.equal(button.props.type, 'button'); assert.match(text(button), new RegExp(cut.title.replace('/', '\\/')));
    h.select(cut.id);
    assert.equal(h.locator(), undefined);
    assert.equal(h.buttons().filter(node => node.props['aria-pressed']).length, 0);
  }
});

test('Multi-match filters keep one selected cut and an empty filter hides all locators and controls', () => {
  const h = setup(); h.query('Gulasch');
  assert.deepEqual(h.buttons().map(node => node.props['aria-controls']), ['wildbret-schulter', 'wildbret-hals']);
  assert.equal(h.locator(), undefined); h.select('schulter'); assertSelected(h, h.cuts[0]); h.select('hals'); assertSelected(h, h.cuts[4]);
  assert.equal(nodes(h.tree, node => node.type === 'article').length, 2);
  h.query('Rücken'); assert.equal(h.locator(), undefined); h.select('ruecken'); assertSelected(h, h.cuts[3]);
  h.query('Banane'); assert.equal(h.locator(), undefined); assert.equal(h.rail(), undefined); assert.equal(h.buttons().length, 0);
  assert.match(text(h.tree), /Kein passendes Stück gefunden/);
  h.query(''); assert.equal(h.buttons().length, 5); assert.equal(h.locator(), undefined);
});

test('Existing entry links select their cut and photo failure retains readable names, selection and details', () => {
  const h = setup('?eintrag=ruecken'); assert.equal(h.locator(), undefined); assert.equal(h.buttons().length, 1);
  assert.equal(h.buttons()[0].props['aria-pressed'], false);
  assert.equal(nodes(h.tree, node => node.type === 'input')[0].props.value, h.cuts[3].title);
  h.select('ruecken'); assertSelected(h, h.cuts[3]);
  h.failImage(); assert.equal(h.locator(), undefined); assert.equal(h.buttons().length, 1);
  assert.equal(h.buttons()[0].props['aria-pressed'], false);
  assert.match(text(h.tree), /Aufnahme ist gerade nicht verfügbar/);
  assert.match(text(h.tree), /Ausgewählt: 4 · Rücken/);
  assert.ok(nodes(h.tree, node => node.type === 'article' && node.props.id === 'wildbret-ruecken').length);
  assert.equal(setup('?eintrag=unknown').buttons().length, 5);
});

test('Controls meet touch sizing, keep focus styles and leave the photo uncropped with a transparent locator', () => {
  const css = fs.readFileSync(path.join(root, 'styles/DogCutLearning.module.css'), 'utf8');
  assert.match(css, /\.photoMap img\s*\{[^}]*width: 100%;[^}]*height: auto;/);
  assert.match(css, /\.cutRail button\s*\{[^}]*min-width: 44px;[^}]*min-height: 44px;/);
  assert.match(css, /\.cutRail button:focus-visible\s*\{[^}]*outline:/);
  assert.match(css, /\.cutLocator > span\s*\{[^}]*width: 10px;[^}]*background: transparent;/);
  assert.match(css, /\.cutLocator\s*\{[^}]*pointer-events: none;/);
  assert.doesNotMatch(css, /\.marker\s*\{/);
});
