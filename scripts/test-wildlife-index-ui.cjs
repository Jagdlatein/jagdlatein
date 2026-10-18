const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const React = projectRequire('react');
const { renderToStaticMarkup } = projectRequire('react-dom/server');
const swc = projectRequire('next/dist/build/swc');

function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.resolve(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  });
  const resolve = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id === '../../components/LearningToolLayout') return { __esModule: true, default: ({ children }) => React.createElement('main', null, children) };
    if (id === '../../components/AppIcon') return { __esModule: true, default: () => null };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, cache);
    return projectRequire(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
function findAll(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => findAll(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...findAll(node.props?.children, predicate)];
}
function words(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(words).join('');
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function setup() {
  const slots = []; let cursor = 0, tree;
  const hooks = { ...React,
    useState(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: initial }; return [slots[index].value, value => { slots[index].value = value; }]; },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: { current: initial } }; return slots[index].value; },
    useMemo(callback) { return callback(); },
  };
  const Component = load('pages/wildkunde/index.js', { react: hooks }).default;
  function render() { cursor = 0; tree = Component(); }
  render();
  return { get tree() { return tree; }, render,
    rows() { return findAll(tree, node => node.props?.['data-wildlife-slug']); },
    change(type, value) { const field = findAll(tree, node => node.type === type)[0]; assert.ok(field); field.props.onChange({ target: { value } }); render(); },
    click(label) { const button = findAll(tree, node => node.type === 'button' && words(node) === label)[0]; assert.ok(button, label); button.props.onClick(); render(); },
  };
}

const inventory = load('lib/european-wildlife-discovery.js').europeanWildlife;

test('One alphabetic list exposes every existing entry, its real knowledge and one portrait link without paging', () => {
  const ui = setup();
  const expected = [...inventory].sort((left, right) => left.name.localeCompare(right.name, 'de'));
  assert.deepEqual(ui.rows().map(row => row.props['data-wildlife-slug']), expected.map(species => species.slug));
  assert.equal(ui.rows().length, 114);
  for (const [index, species] of expected.entries()) {
    const row = ui.rows()[index];
    const links = findAll(row, node => typeof node.props?.href === 'string');
    assert.equal(links.length, 1, species.slug);
    assert.equal(links[0].props.href, `/wildkunde/${species.slug}`);
    assert.ok(words(row).includes(species.identification), `${species.slug}: identification stays visible`);
    assert.ok(words(row).includes(species.habitat), `${species.slug}: habitat stays visible`);
    assert.equal(findAll(row, node => node.type === 'button' || node.type === 'details').length, 0);
  }
  assert.equal(findAll(ui.tree, node => node.type === 'input' && node.props.type === 'search').length, 1);
  assert.equal(findAll(ui.tree, node => node.type === 'select').length, 1);
  assert.equal(findAll(ui.tree, node => node.type === 'button').length, 0);
  assert.doesNotMatch(words(ui.tree), /Weitere Arten|Seite \d+ von/);
  const html = renderToStaticMarkup(React.createElement(load('pages/wildkunde/index.js').default));
  assert.equal((html.match(/data-wildlife-slug=/g) || []).length, inventory.length, 'All entries also exist before client hydration');
  assert.match(html, /Hybrid, keine eigene Art/);
  assert.match(html, /bedeutet keine Jagdfreigabe/);
});

test('Live name/alias and group filters combine, an empty result explains recovery, reset restores the full list', () => {
  const ui = setup();
  ui.change('input', 'Steinbock');
  assert.ok(ui.rows().some(row => row.props['data-wildlife-slug'] === 'steinwild'));
  assert.ok(ui.rows().length < inventory.length);
  ui.change('select', 'Enten');
  assert.equal(ui.rows().length, 0);
  assert.match(words(ui.tree), /Keine Wildart passt/);
  ui.click('Suche leeren');
  assert.equal(ui.rows().length, inventory.length);
  ui.change('select', 'Enten');
  const bySlug = Object.fromEntries(inventory.map(species => [species.slug, species]));
  assert.ok(ui.rows().length > 0);
  for (const row of ui.rows()) assert.equal(bySlug[row.props['data-wildlife-slug']].group, 'Enten');
});

test('A targeted biology search links to the existing section while submit alone moves focus to results', () => {
  const ui = setup(); const calls = [];
  findAll(ui.tree, node => node.props?.id === 'wildlife-results')[0].props.ref.current = {
    focus: options => calls.push(['focus', options]), scrollIntoView: options => calls.push(['scroll', options]),
  };
  ui.change('input', 'Zahnformel');
  assert.deepEqual(calls, [], 'Typing must not steal focus');
  const rehwild = ui.rows().find(row => row.props['data-wildlife-slug'] === 'rehwild');
  assert.ok(rehwild);
  assert.equal(findAll(rehwild, node => typeof node.props?.href === 'string')[0].props.href, '/wildkunde/rehwild#gebiss');
  let prevented = false;
  findAll(ui.tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { block: 'start', behavior: 'auto' }]]);
});
