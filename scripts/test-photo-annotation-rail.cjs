// Real photo metadata and synthetic clicks only; no account, API or scoring writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react'), swc = pr('next/dist/build/swc');
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function load(relative, hooks = React, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react') return hooks;
    if (id === 'next/image') return { __esModule: true, default: props => React.createElement('img', props) };
    if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (id === './AppIcon') return { __esModule: true, default: () => null };
    if (id === './LearningToolLayout') return { __esModule: true, default: ({ children }) => React.createElement('main', null, children) };
    if (id === './LearningPhoto') return { LearningPhotoCredit: () => null };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)), hooks, cache);
    return pr(id);
  }, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const rounds = load('lib/photo-detective.js').photoDetectiveRounds;
function setup() {
  const slots = []; let cursor = 0, tree;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => slots[i].value = typeof value === 'function' ? value(slots[i].value) : value]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
  };
  const Page = load('components/PhotoDetective.js', hooks).default;
  function render() { cursor = 0; tree = Page(); return tree; }
  render();
  return { render, get tree() { return tree; },
    button(label) { const button = nodes(tree, node => node.type === 'button' && text(node).trim() === label)[0]; assert.ok(button, `Missing button: ${label}`); return button; },
    click(label) { const button = this.button(label); assert.ok(!button.props.disabled); button.props.onClick(); render(); return button; },
    photo() { const entry = nodes(tree, node => node.type?.name === 'PhotoEvidence')[0]; assert.ok(entry); return entry.type(entry.props); },
    details() { const entry = nodes(tree, node => node.type?.name === 'EvidenceDetails')[0]; return entry?.type(entry.props) || null; },
    marker(index) { const button = nodes(this.photo(), node => node.type === 'button' && node.props['aria-label']?.startsWith(`Merkmal ${index + 1}:`))[0]; assert.ok(button); return button; },
    chooseSpecies(id) { const select = nodes(tree, node => node.type === 'select' && node.props.id === 'photo-species')[0]; assert.ok(select); select.props.onChange({ target: { value: id } }); render(); },
  };
}

test('Before quiz reveal the photo has neutral alt text, no controls, locator, line or trait explanation', () => {
  const h = setup(), photo = h.photo();
  assert.equal(nodes(photo, node => node.type === 'button').length, 0);
  assert.equal(nodes(photo, node => node.type === 'svg' || node.props?.className === 'locator').length, 0);
  assert.equal(h.details(), null);
  const plane = nodes(photo, node => node.props?.className === 'imagePlane')[0];
  assert.equal(plane.props.children[0].props.alt, rounds[0].neutralAlt);
  for (const trait of rounds[0].traits) assert.ok(!text(h.tree).includes(trait.text));
});

test('Revealed numbered controls sit below the full-aspect image, with one line and hollow locator for the selected original coordinate', () => {
  const h = setup(); h.click('Merkmale als Hilfe anzeigen');
  assert.equal(nodes(h.photo(), node => node.type === 'line' || node.props?.className === 'locator').length, 0);
  assert.equal(nodes(h.photo(), node => node.type === 'button' && node.props['aria-pressed']).length, 0);
  for (let index = 0; index < rounds[0].traits.length; index++) {
    h.marker(index).props.onClick(); h.render();
    const photo = h.photo(), trait = rounds[0].traits[index];
    const plane = nodes(photo, node => node.props?.className === 'imagePlane')[0];
    assert.equal(nodes(plane, node => node.type === 'button').length, 0);
    const rail = nodes(photo, node => node.props?.className === 'markerRail')[0];
    assert.ok(rail); assert.ok(!nodes(plane, node => node === rail).length);
    const image = plane.props.children[0];
    assert.equal(image.props.src, rounds[0].photo.src);
    assert.equal(image.props.width, rounds[0].photo.width); assert.equal(image.props.height, rounds[0].photo.height);
    assert.equal(image.props.alt, rounds[0].photo.alt);
    const controls = nodes(rail, node => node.type === 'button');
    assert.equal(controls.length, rounds[0].traits.length);
    assert.equal(controls.filter(node => node.props['aria-pressed']).length, 1);
    assert.equal(controls[index].props['aria-pressed'], true);
    assert.equal(controls[index].props['aria-controls'], 'photo-trait-detail');
    const lines = nodes(plane, node => node.type === 'line'); assert.equal(lines.length, 1);
    assert.equal(lines[0].props.x1, trait.x); assert.equal(lines[0].props.y1, trait.y);
    assert.equal(lines[0].props.x2, ((index + .5) / rounds[0].traits.length) * 100);
    assert.equal(lines[0].props.y2, '100'); assert.equal(lines[0].props.vectorEffect, 'non-scaling-stroke');
    const locator = nodes(plane, node => node.props?.className === 'locator')[0];
    assert.deepEqual(locator.props.style, { left: `${trait.x}%`, top: `${trait.y}%` });
    assert.equal(locator.props['aria-hidden'], 'true');
    assert.ok(text(h.details()).includes(trait.text));
  }
});

test('A second tap on the same number hides its pointer while its explanation remains readable', () => {
  const h = setup(); h.click('Merkmale entdecken');
  assert.equal(nodes(h.photo(), node => node.type === 'line').length, 0);
  h.marker(1).props.onClick(); h.render();
  assert.equal(nodes(h.photo(), node => node.type === 'line').length, 1);
  assert.equal(h.marker(1).props['aria-pressed'], true);
  h.marker(1).props.onClick(); h.render();
  assert.equal(nodes(h.photo(), node => node.type === 'line' || node.props?.className === 'locator').length, 0);
  assert.equal(nodes(h.photo(), node => node.type === 'button' && node.props['aria-pressed']).length, 0);
  assert.ok(text(h.details()).includes(rounds[0].traits[1].text));
  const selectedDetail = nodes(h.details(), node => node.type === 'button' && node.props['aria-pressed'])[0];
  assert.ok(text(selectedDetail).endsWith(rounds[0].traits[1].title));
  selectedDetail.props.onClick(); h.render();
  assert.equal(h.marker(1).props['aria-pressed'], true);
  h.chooseSpecies(rounds[1].id);
  assert.equal(nodes(h.photo(), node => node.type === 'line').length, 0);
  assert.equal(nodes(h.photo(), node => node.type === 'button' && node.props['aria-pressed']).length, 0);
  assert.ok(text(h.details()).includes(rounds[1].traits[0].text));
});

test('Text trait buttons and outside numbers select the same original trait for every explorable photo', () => {
  const h = setup(); h.click('Merkmale entdecken');
  for (const round of rounds) {
    h.chooseSpecies(round.id);
    for (const [index, trait] of round.traits.entries()) {
      const detailButton = nodes(h.details(), node => node.type === 'button' && text(node).endsWith(trait.title))[0];
      assert.ok(detailButton); detailButton.props.onClick(); h.render();
      assert.equal(h.marker(index).props['aria-pressed'], true);
      const line = nodes(h.photo(), node => node.type === 'line')[0];
      assert.deepEqual([line.props.x1, line.props.y1], [trait.x, trait.y]);
      assert.ok(text(h.details()).includes(trait.text));
    }
  }
  assert.match(text(h.details()), /Zahl unter dem Foto/);
});

test('Hints retain assisted scoring, normal answers reveal traits and the following photo starts concealed', () => {
  const h = setup();
  h.click('Merkmale als Hilfe anzeigen'); h.marker(1).props.onClick(); h.render(); h.click(rounds[0].name);
  assert.match(text(h.tree), /Mit Merkmals-Hilfe beantwortet/);
  assert.match(text(h.tree), /0 richtig ohne Hilfe/);
  h.click('Nächstes Foto');
  assert.equal(nodes(h.photo(), node => node.type === 'button' || node.type === 'line').length, 0);
  assert.equal(h.details(), null);
  h.click(rounds[1].name);
  assert.match(text(h.tree), /1 richtig ohne Hilfe/);
  assert.equal(nodes(h.photo(), node => node.type === 'line').length, 0);
  h.marker(0).props.onClick(); h.render();
  assert.equal(nodes(h.photo(), node => node.type === 'line').length, 1);
});

test('Styles preserve the original photo aspect ratio, transparent locator and at least 44px touch targets outside it', () => {
  const css = fs.readFileSync(path.join(root, 'styles/PhotoDetective.module.css'), 'utf8');
  const block = selector => css.match(new RegExp(`\\.${selector.replaceAll('.', '\\.')}\\s*\\{([^}]+)\\}`))?.[1] || '';
  assert.match(block('photo img'), /height:\s*auto/);
  assert.doesNotMatch(block('photo img'), /object-fit|crop|max-height/);
  assert.match(block('marker'), /width:\s*44px/); assert.match(block('marker'), /min-height:\s*44px/);
  assert.doesNotMatch(block('marker'), /position:\s*absolute|translate/);
  assert.match(block('markerRail'), /min-height:\s*44px/);
  assert.match(block('locator'), /background:\s*transparent/);
  assert.match(block('locator'), /pointer-events:\s*none/);
  assert.match(block('leader'), /pointer-events:\s*none/);
  assert.doesNotMatch(css, /\.marker\s*\{[^}]*width:\s*3[0-9]px/);
});
