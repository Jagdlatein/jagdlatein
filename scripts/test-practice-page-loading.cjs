const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');

function load(relative, overrides = {}, options = {}, cache = new Map()) {
  let filename = path.join(root, relative);
  if (!fs.existsSync(filename) && filename.endsWith('.js')) filename = filename.slice(0, -3) + '.jsx';
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const source = options.source ?? fs.readFileSync(filename, 'utf8');
  const { code } = swc.transformSync(source, {
    filename, disableNextSsg: !options.client,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, name) => name }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, {}, cache);
    return pr(id);
  }, mod, mod.exports);
  cache.set(filename, mod.exports);
  return mod.exports;
}

const scenarios = load('lib/practice-scenarios.js');
const slugs = Object.keys(scenarios.practiceModuleIds);
const pagePath = slug => `pages/jagdpraxis/${slug}.js`;
const layout = ({ children, title, result }) => React.createElement('main', { 'data-result': Boolean(result) }, React.createElement('h1', null, title), children);
const overrides = { '../../components/PracticeLayout': layout, '../../lib/practice-scenarios': scenarios };

test('All 26 practice pages assemble only their unchanged 25-question array at build time', () => {
  assert.equal(slugs.length, 26);
  for (const slug of slugs) {
    const calls = [];
    const page = load(pagePath(slug), { ...overrides, '../../lib/practice-scenarios': {
      getPracticeScenarios(id) { calls.push(id); return scenarios.getPracticeScenarios(id); },
    } });
    assert.equal(calls.length, 0, `${slug}: importing the page must not assemble the curriculum`);
    const result = page.getStaticProps();
    assert.deepEqual(calls, [slug]);
    const expected = scenarios.getPracticeScenarios(slug);
    assert.equal(result.props.scenarios.length, 25);
    assert.deepEqual(result.props.scenarios, expected, `${slug}: all questions, answers, ordering, explanations and sources stay intact`);
    assert.deepEqual(JSON.parse(JSON.stringify(result.props.scenarios)), expected, `${slug}: Next page data is serializable without dropping fields`);
  }
});

test('Next client compilation excludes the complete curriculum and its scenario assembler on all 26 pages', () => {
  for (const slug of slugs) {
    const page = load(pagePath(slug), { ...overrides, '../../lib/practice-scenarios': new Proxy({}, { get() { throw new Error(`${slug}: client imported the full curriculum`); } }) }, { client: true });
    assert.equal(page.__N_SSG, true, slug);
    assert.equal(page.getStaticProps, undefined, slug);
    assert.equal(typeof page.default, 'function', slug);
  }
});

test('Moving question data to static props preserves every visible round, explanation and final result exactly', () => {
  for (const slug of slugs) {
    const source = fs.readFileSync(path.join(root, pagePath(slug)), 'utf8');
    // Reconstruct the former module-level array boundary. The rendering code
    // is shared so this comparison isolates the data-loading change itself.
    const previous = source
      .replace(/export function getStaticProps\(\) \{\s*return \{ props: \{ scenarios: getPracticeScenarios\("([^"]+)"\) \} \};\s*\}/,
        'const scenarios = getPracticeScenarios("$1");')
      .replace(/export default function (\w+)\(\{ scenarios \}\)/, 'export default function $1()');
    assert.notEqual(previous, source, slug);
    let stateIndex = 0; let currentState;
    const hooks = { ...React, useState: () => [currentState[stateIndex++], () => {}], useRef: initial => ({ current: initial }), useEffect() {} };
    const current = load(pagePath(slug), { ...overrides, react: hooks });
    const legacy = load(pagePath(slug), { ...overrides, react: hooks }, { source: previous });
    const props = current.getStaticProps().props;
    for (let index = 0; index <= 25; index++) {
      currentState = [index, 23, index < 25 ? true : null, true];
      stateIndex = 0; const before = renderToStaticMarkup(React.createElement(legacy.default));
      stateIndex = 0; const after = renderToStaticMarkup(React.createElement(current.default, props));
      assert.equal(after, before, `${slug}: ${index < 25 ? 'question ' + (index + 1) : 'result'}`);
      if (index < 25) {
        const escapedExplanation = renderToStaticMarkup(React.createElement(React.Fragment, null, props.scenarios[index].explanation));
        assert.ok(after.includes(escapedExplanation), `${slug}: the complete explanation remains visible`);
      }
    }
  }
});

function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}

test('Static-data practice pages retain answer locking, ten-second feedback and all 25 score transitions', () => {
  const originals = { setTimeout: global.setTimeout, clearTimeout: global.clearTimeout };
  const timers = new Map(); let timerId = 0;
  global.setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  global.clearTimeout = id => timers.delete(id);
  try {
    for (const slug of slugs) {
      const slots = []; const effects = []; let cursor = 0;
      const hooks = { ...React,
        useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
        useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
        useEffect(fn, deps) { const index = cursor++; if (!(index in slots)) { slots[index] = { deps }; effects.push(() => { slots[index].cleanup = fn(); }); } },
      };
      const page = load(pagePath(slug), { ...overrides, react: hooks });
      const props = page.getStaticProps().props;
      const render = () => { cursor = 0; const tree = page.default(props); while (effects.length) effects.shift()(); return tree; };
      let tree = render(); let stale;
      for (let index = 0; index < 25; index++) {
        const label = props.scenarios[index].correct ? 'Aussage stimmt' : 'Aussage stimmt nicht';
        const answer = find(tree, node => node.props?.text === label);
        assert.ok(answer, `${slug}: answer ${index + 1}`);
        stale?.props.onClick();
        answer.props.onClick(); answer.props.onClick();
        tree = render();
        assert.equal(timers.size, 1, `${slug}: duplicate answers do not add timers`);
        assert.ok(find(tree, node => node.props?.isCorrect === true && node.props.scenario === props.scenarios[index]), `${slug}: feedback follows the supplied question`);
        const [id, timer] = timers.entries().next().value;
        assert.equal(timer.delay, 10000);
        timers.delete(id); timer.callback();
        stale = answer; tree = render();
      }
      const score = find(tree, node => node.type?.name === 'ScoreBox');
      assert.ok(score, `${slug}: final score`);
      assert.equal(score.props.score, 25); assert.equal(score.props.max, 25);
      for (const slot of slots) slot?.cleanup?.();
      assert.equal(timers.size, 0);
    }
  } finally { Object.assign(global, originals); }
});
