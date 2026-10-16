// Synthetic statements only. No live account, teaching facts, score or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react');
const swc = pr('next/dist/build/swc');
const { renderToStaticMarkup } = pr('react-dom/server');

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
function fixture(count = 3) {
  return Object.freeze(Array.from({ length: count }, (_, index) => Object.freeze({
    id: index + 1,
    title: `Synthetische Frage ${index + 1}?`,
    text: `Synthetische Aussage ${index + 1}.`,
    correct: index % 2 === 0,
    explanation: `Unveränderte Test-Erklärung ${index + 1}.`,
    source: `https://example.org/test-source-${index + 1}`,
    moduleTitle: 'Synthetische Lerneinheit', countryLabel: 'DE / AT / CH',
  })));
}

function setup(scenarios) {
  if (!arguments.length) scenarios = fixture();
  const slots = [], events = [];
  let cursor = 0, changed = false, pendingEffects = [], tree;
  let props = { scenarios };
  const hooks = { ...React,
    useReducer(reducer, initial, initialize) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initialize(initial) };
      return [slots[index].value, event => {
        events.push(event);
        const next = reducer(slots[index].value, event);
        if (next !== slots[index].value) changed = true;
        slots[index].value = next;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: { current: initial } };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || deps.some((value, at) => !Object.is(value, previous.deps[at]))) {
        slots[index] = { deps, cleanup: previous?.cleanup };
        pendingEffects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = callback(); });
      }
    },
  };
  const filename = path.join(root, 'components/PracticeStatementRound.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' } });
  const mod = { exports: {} };
  const forbidden = () => { throw new Error('The statement round must not use timers, network or persistent storage'); };
  const storage = new Proxy({}, { get: forbidden });
  new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'setInterval', 'localStorage', 'sessionStorage', 'window', code)(id => {
    if (id === 'react') return hooks;
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return pr(id);
  }, mod, mod.exports, forbidden, forbidden, forbidden, storage, storage, storage);

  function render(runEffects = true) {
    for (let pass = 0; pass < 15; pass++) {
      cursor = 0; changed = false; tree = mod.exports.default(props);
      if (!runEffects) return tree;
      const effects = pendingEffects; pendingEffects = []; effects.forEach(effect => effect());
      if (!changed && !pendingEffects.length) return tree;
    }
    throw new Error('Synthetic statement round did not settle');
  }
  render();
  return { events, render,
    get tree() { return tree; },
    get state() { return slots[0].value; },
    text: () => text(tree),
    html: () => renderToStaticMarkup(tree),
    button(label) {
      const button = nodes(tree, node => node.type === 'button' && text(node).trim() === label)[0];
      assert.ok(button, `Missing button: ${label}`); return button;
    },
    click(label) {
      const button = this.button(label); assert.equal(Boolean(button.props.disabled), false, `Disabled button: ${label}`);
      button.props.onClick(); render(); return button;
    },
    setScenarios(next, runEffects = true) { props = { scenarios: next }; render(runEffects); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

test('The unchanged statement is shown with two clear answers, finite progress and optional metadata', () => {
  const scenarios = fixture(), snapshot = JSON.stringify(scenarios), h = setup(scenarios);
  assert.match(h.text(), /Wissen & Sicherheit/);
  assert.match(h.text(), /Aussage 1 von 3/);
  assert.match(h.text(), /Synthetische Frage 1\?/);
  assert.match(h.text(), /Synthetische Aussage 1\./);
  assert.doesNotMatch(h.text(), /Unveränderte Test-Erklärung/);
  assert.deepEqual(nodes(h.tree, node => node.type === 'button').map(text), ['Stimmt', 'Stimmt nicht']);
  const progress = nodes(h.tree, node => node.type === 'progress')[0];
  assert.equal(progress.props.value, 0); assert.equal(progress.props.max, 3);
  assert.equal(progress.props['aria-label'], 'Bearbeitete Aussagen');
  assert.equal(nodes(h.tree, node => node.type === 'select').length, 0);
  assert.equal(nodes(h.tree, node => node.type === 'details').length, 1);
  assert.equal(JSON.stringify(scenarios), snapshot);
});

test('Feedback and source appear immediately and remain until Weiter; rapid answers cannot change the first result', () => {
  const scenarios = fixture(), h = setup(scenarios);
  const wrong = h.button('Stimmt nicht'), right = h.button('Stimmt');
  right.props.onClick(); wrong.props.onClick(); right.props.onClick(); h.render();
  assert.equal(h.state.answers.length, 1);
  assert.deepEqual(h.state.answers[0], { selection: true, correct: true });
  assert.match(h.text(), /Richtig eingeordnet/); assert.match(h.text(), /Die Aussage stimmt\./);
  assert.ok(h.text().includes(scenarios[0].explanation));
  assert.equal(nodes(h.tree, node => node.props?.role === 'status').length, 1);
  const source = nodes(h.tree, node => node.type === 'a')[0];
  assert.equal(source.props.href, scenarios[0].source);
  assert.equal(source.props.target, '_blank'); assert.equal(source.props.rel, 'noopener noreferrer');
  assert.equal(h.button('Stimmt').props.disabled, true); assert.equal(h.button('Stimmt nicht').props.disabled, true);
  assert.equal(h.button('Stimmt').props['aria-pressed'], true);
  const rendered = h.html();
  for (let count = 0; count < 10; count++) h.render();
  assert.equal(h.html(), rendered); assert.equal(h.state.index, 0);
  h.click('Weiter'); assert.equal(h.state.index, 1);
  assert.doesNotMatch(h.text(), /Unveränderte Test-Erklärung 1/);
});

test('Repeated and stale Weiter and answer handlers cannot skip or answer another statement', () => {
  const h = setup();
  const staleAnswer = h.button('Stimmt'); h.click('Stimmt');
  const next = h.button('Weiter');
  next.props.onClick(); next.props.onClick(); h.render();
  assert.equal(h.state.index, 1); assert.equal(h.state.answers.length, 1);
  next.props.onClick(); staleAnswer.props.onClick(); h.render();
  assert.equal(h.state.index, 1); assert.equal(h.state.answers.length, 1);
  h.click('Stimmt'); assert.equal(h.state.answers[1].correct, false);
  assert.match(h.text(), /Noch einmal nachlesen/); assert.match(h.text(), /Die Aussage stimmt nicht\./);
  h.click('Weiter'); assert.equal(h.state.index, 2);
});

test('The finite round has a neutral result and one restart; old-generation handlers stay invalid', () => {
  const h = setup(), firstAnswer = h.button('Stimmt');
  h.click('Stimmt'); h.click('Weiter'); h.click('Stimmt'); h.click('Weiter'); h.click('Stimmt');
  assert.match(h.text(), /Aussage 3 von 3/);
  h.click('Runde auswerten');
  assert.match(h.text(), /2 von 3 Aussagen richtig eingeordnet/);
  assert.match(h.text(), /nur diese Lernübung/);
  assert.doesNotMatch(h.text(), /bestanden|70\s*%|sicher beherrscht|Schießsicherheit|zertifiziert/i);
  assert.deepEqual(nodes(h.tree, node => node.type === 'button').map(text), ['Noch einmal üben']);
  const restart = h.click('Noch einmal üben');
  assert.equal(h.state.generation, 1); assert.equal(h.state.answers.length, 0);
  firstAnswer.props.onClick(); h.render(); assert.equal(h.state.answers.length, 0);
  h.click('Stimmt nicht'); assert.equal(h.state.answers[0].correct, false);
  restart.props.onClick(); h.render(); assert.equal(h.state.answers.length, 1);
  assert.equal(h.state.generation, 1);
});

test('Unmounted handlers perform no dispatch and cannot mutate an abandoned round', () => {
  const h = setup(), answer = h.button('Stimmt');
  h.click('Stimmt'); const next = h.button('Weiter'), previous = h.state, count = h.events.length;
  h.unmount(); answer.props.onClick(); next.props.onClick();
  assert.equal(h.events.length, count); assert.equal(h.state, previous);
});

test('A changed scenario pool resets the round and blocks stale handlers even before its effect runs', () => {
  const h = setup(), answer = h.button('Stimmt');
  h.click('Stimmt'); const next = h.button('Weiter');
  const replacement = fixture(1);
  h.setScenarios(replacement, false);
  const before = h.state, dispatchCount = h.events.length;
  answer.props.onClick(); next.props.onClick();
  assert.equal(h.state, before); assert.equal(h.events.length, dispatchCount);
  h.render(); assert.equal(h.state.scenarios, replacement);
  assert.equal(h.state.index, 0); assert.equal(h.state.answers.length, 0);
  assert.match(h.text(), /Aussage 1 von 1/);
  h.click('Stimmt'); h.click('Runde auswerten');
  assert.match(h.text(), /1 von 1 Aussagen richtig eingeordnet/);
});

test('An empty or missing pool stays stable without a score, progress division or action', () => {
  for (const scenarios of [[], undefined, null]) {
    const h = setup(scenarios);
    assert.match(h.text(), /keine Aussagen verfügbar/);
    assert.equal(nodes(h.tree, node => node.type === 'button' || node.type === 'progress').length, 0);
    const previous = h.state; h.render(); assert.equal(h.state, previous);
    assert.doesNotMatch(h.html(), /NaN|Infinity/);
  }
});
