const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const swc = projectRequire('next/dist/build/swc');
const React = projectRequire('react');
const { renderToStaticMarkup } = projectRequire('react-dom/server');
const css = new Proxy({}, { get: (_, key) => String(key) });

function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const mod = { exports: {} }, requireFile = createRequire(filename);
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/image') return ({ priority, ...props }) => React.createElement('img', props);
    if (id === './LearningToolLayout') return ({ children }) => React.createElement('main', {}, children);
    if (id === './LearningPhoto') return { LearningPhotoCredit: () => null };
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)), overrides);
    return requireFile(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  return mod.exports;
}

function engine() {
  const slots = []; let cursor = 0, effects = [];
  return {
    hooks: { ...React,
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
        return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
      },
      useEffect(callback, deps) {
        const index = cursor++, previous = slots[index];
        if (!previous || deps.some((value, depIndex) => !Object.is(value, previous.deps[depIndex]))) {
          slots[index] = { deps }; effects.push(callback);
        }
      },
    },
    render(callback) { cursor = 0; return callback(); },
    flush() { const pending = effects; effects = []; pending.forEach(callback => callback()); },
  };
}
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const match = find(child, predicate); if (match) return match; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function setup(query = {}, currentMonth = 10) {
  const state = engine(), router = { query };
  const Component = load('components/WildYear.js', { react: state.hooks, 'next/router': { useRouter: () => router } }).default;
  let props = { currentMonth }, tree;
  const render = () => { tree = state.render(() => Component(props)); };
  render();
  return {
    get tree() { return tree; },
    get month() { return find(tree, node => node.type === 'input' && node.props.id === 'wildjahr-month').props.value; },
    get species() { return find(tree, node => node.type === 'select').props.value; },
    hydrate() { state.flush(); render(); },
    navigate(query, nextMonth = currentMonth) { router.query = query; props = { currentMonth: nextMonth }; render(); state.flush(); render(); },
    chooseMonth(value) { find(tree, node => node.type === 'input' && node.props.id === 'wildjahr-month').props.onChange({ target: { value: String(value) } }); render(); },
  };
}

test('The server calendar follows Zurich month boundaries, including summer time and New Year', () => {
  const page = load('pages/lernen/wildjahr.js', { '../../components/WildYear': { __esModule: true, default: () => null } });
  for (const [iso, expected] of [
    ['2026-09-30T21:59:59Z', 9], ['2026-09-30T22:00:00Z', 10],
    ['2026-12-31T22:59:59Z', 12], ['2026-12-31T23:00:00Z', 1],
  ]) assert.equal(page.currentWildYearMonth(new Date(iso)), expected, iso);
  const result = page.getServerSideProps();
  assert.deepEqual(Object.keys(result.props), ['currentMonth']);
  assert.ok(result.props.currentMonth >= 1 && result.props.currentMonth <= 12);
});

test('Initial HTML and hydration use the supplied current month or the valid explicit month', () => {
  for (const [query, expected] of [[{}, 10], [{ art: 'rehwild', monat: '4' }, 4]]) {
    const state = setup(query);
    assert.equal(state.month, expected, 'month must be correct before effects run');
    state.hydrate(); assert.equal(state.month, expected);
    const Component = load('components/WildYear.js', { 'next/router': { useRouter: () => ({ query }) } }).default;
    const html = renderToStaticMarkup(React.createElement(Component, { currentMonth: 10 }));
    assert.match(html, new RegExp(`aria-valuetext="${expected === 10 ? 'Oktober' : 'April'}"`));
  }
});

test('Malformed, repeated and out-of-range URL months use the current month', () => {
  for (const monat of ['', ' ', '0', '13', '-1', '2.5', 'foo', ['4', '5'], ['4'], true, null]) {
    const state = setup({ monat });
    assert.equal(state.month, 10, JSON.stringify(monat));
    state.hydrate(); assert.equal(state.month, 10);
  }
});

test('Back and Forward restore explicit selections and removal restores the request current month', () => {
  const state = setup({ art: 'rehwild', monat: '4' }); state.hydrate();
  state.chooseMonth(7); assert.equal(state.month, 7);
  state.navigate({ art: 'rotwild', monat: '11' }); assert.equal(state.month, 11); assert.equal(state.species, 'rotwild');
  state.navigate({ art: 'rehwild', monat: '4' }); assert.equal(state.month, 4); assert.equal(state.species, 'rehwild');
  state.navigate({}); assert.equal(state.month, 10); assert.equal(state.species, 'gamswild');
  state.navigate({ monat: '11' }); assert.equal(state.month, 11);
  state.navigate({ monat: 'invalid' }); assert.equal(state.month, 10);
  state.navigate({}, 12); assert.equal(state.month, 12);
});
