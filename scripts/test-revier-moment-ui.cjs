// Synthetic learning cases only. No accounts, network, persistent storage or scores.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react'), swc = pr('next/dist/build/swc');
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
const sources = [{ id: 'source', title: 'Synthetische Testquelle', url: 'https://example.org/source' }];
function fixture(format = 'single') {
  return { id: `synthetic-${format}`, format, prompt: `Synthetischer ${format}-Lernfall?`,
    context: 'Ein ausschließlich für den Oberflächentest erstelltes Beispiel.', skill: 'Einordnen',
    options: ['a', 'b', 'c'].map(id => ({ id, text: `Aussage ${id}` })),
    ...(format === 'sequence' ? { expectedOrder: ['b', 'a', 'c'] } : { correctIds: format === 'multiple' ? ['a', 'c'] : ['c'] }),
    explanation: 'Synthetische Erklärung, die nach dem Bearbeiten sofort lesbar sein soll.', sourceIds: ['source'] };
}

function setup(questions, daily = true, hydrate = true) {
  const slots = [], events = [], cache = new Map();
  let cursor = 0, pendingEffects = [], changed = false, tree;
  const props = { questions, sources, daily };
  const hooks = { ...React,
    useReducer(reducer, initial, init) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: init(initial) };
      return [slots[i].value, event => {
        events.push(event);
        const next = reducer(slots[i].value, event);
        if (next !== slots[i].value) changed = true;
        slots[i].value = next;
      }];
    },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) {
      const i = cursor++, old = slots[i];
      if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) {
        slots[i] = { deps }; pendingEffects.push(callback);
      }
    },
  };
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    const mod = { exports: {} };
    const forbidden = () => { throw new Error('Daily learning must not use network, timers or persistent storage'); };
    new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'setInterval', 'localStorage', 'sessionStorage', code)(id => {
      if (id === 'react') return hooks;
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id.startsWith('.')) {
        const imported = load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
        return id === '../lib/answer-order' ? { ...imported, newAnswerSeed: seed => (seed || 0) + 17 } : imported;
      }
      return pr(id);
    }, mod, mod.exports, forbidden, forbidden, forbidden, new Proxy({}, { get: forbidden }), new Proxy({}, { get: forbidden }));
    cache.set(filename, mod.exports); return mod.exports;
  }
  const Page = load('components/ResearchQuestionRound.js').default;
  function render(runEffects = true) {
    for (let pass = 0; pass < 10; pass++) {
      cursor = 0; changed = false; tree = Page(props);
      if (!runEffects) return tree;
      const effects = pendingEffects; pendingEffects = []; effects.forEach(effect => effect());
      if (!changed && !pendingEffects.length) return tree;
    }
    throw new Error('Synthetic daily case did not settle');
  }
  render(hydrate);
  return { events, render, get tree() { return tree; }, get state() { return slots[0].value; }, text: () => text(tree),
    html: () => renderToStaticMarkup(tree),
    button(label) { const button = nodes(tree, node => node.type === 'button' && text(node).trim() === label)[0]; assert.ok(button, `Missing button: ${label}`); return button; },
    click(label) { const button = this.button(label); assert.equal(Boolean(button.props.disabled), false); button.props.onClick(); render(); return button; },
    select(id) {
      const label = nodes(tree, node => node.type === 'label' && text(node) === `Aussage ${id}`)[0];
      assert.ok(label); nodes(label, node => node.type === 'input')[0].props.onChange(); render();
    },
    sequence(ids) {
      ids.forEach((id, position) => { nodes(tree, node => node.type === 'select')[position].props.onChange({ target: { value: id } }); render(); });
    },
  };
}
function complete(h, question, ids = question.correctIds || question.expectedOrder) {
  if (question.format === 'single') h.click(`Aussage ${ids[0]}`);
  else {
    if (question.format === 'multiple') ids.forEach(id => h.select(id));
    else h.sequence(ids);
    h.click('Antwort prüfen');
  }
}

test('Daily cases reveal the complete explanation, sources and completion immediately for all three formats', () => {
  for (const format of ['single', 'multiple', 'sequence']) {
    const question = fixture(format), h = setup([question]);
    assert.match(h.text(), /Dein Fall des Tages/);
    assert.doesNotMatch(h.text(), /Frage 1 von|Fragen im Thema|kurze Runden|Für heute bearbeitet/);
    assert.equal(nodes(h.tree, node => node.type === 'progress').length, 0);
    assert.ok(!h.text().includes(question.explanation));
    complete(h, question);
    assert.match(h.text(), /Richtig eingeordnet/);
    assert.ok(h.text().includes(question.explanation));
    assert.match(h.text(), /Für heute bearbeitet/);
    assert.match(h.text(), /Ein Lernfall, keine Ranglistenpunkte/);
    assert.match(h.text(), /Beim Neuladen beginnt der heutige Fall erneut/);
    const source = nodes(h.tree, node => node.type === 'a' && node.props.href === sources[0].url)[0];
    assert.equal(source.props.target, '_blank'); assert.equal(source.props.rel, 'noopener noreferrer');
    const sourcePanel = nodes(h.tree, node => node.type === 'details' && text(node).startsWith('Quellen zur aktuellen Frage'))[0];
    assert.ok(sourcePanel && !sourcePanel.props.open);
    assert.equal(nodes(sourcePanel, node => node.type === 'a' && node.props.href === sources[0].url)[0], source);
    assert.equal(nodes(sourcePanel, node => node.type === 'p' && text(node) === question.explanation).length, 0, 'The complete explanation stays outside source disclosure');
    assert.equal(nodes(h.tree, node => node.type === 'button' && !node.props.disabled).length, 0);
    assert.equal(h.state.index, 0); assert.equal(h.state.finished, false);
    assert.ok(!h.events.some(event => ['next', 'restart', 'retry', 'continue'].includes(event.type)));
    const html = h.html(); h.render(); assert.equal(h.html(), html);
  }
});

test('Daily multiple choice requires the exact correct set and sequences require every step exactly once', () => {
  const multiple = fixture('multiple'), h = setup([multiple]);
  assert.equal(h.button('Antwort prüfen').props.disabled, true);
  h.select('a'); h.click('Antwort prüfen');
  assert.equal(h.state.answers[multiple.id].correct, false);
  assert.match(h.text(), /Das schauen wir genauer an/);
  assert.match(h.text(), /Für heute bearbeitet/);
  const sequence = fixture('sequence'), s = setup([sequence]);
  s.sequence(['a', 'a', 'c']);
  assert.equal(s.button('Antwort prüfen').props.disabled, true);
  assert.match(s.text(), /Ein Schritt ist mehrfach gewählt/);
  s.sequence(['a', 'b', 'c']); s.click('Antwort prüfen');
  assert.equal(s.state.answers[sequence.id].correct, false);
  assert.deepEqual(nodes(s.tree, node => node.type === 'ol')[0].props.children.map(text), ['Aussage b', 'Aussage a', 'Aussage c']);
  assert.match(s.text(), /Für heute bearbeitet/);
});

test('Skipping any daily format reveals the same useful feedback without a result click or a new question', () => {
  for (const format of ['single', 'multiple', 'sequence']) {
    const question = fixture(format), h = setup([question]);
    const skip = h.click('Weiß ich noch nicht'), answered = h.state;
    assert.match(h.text(), /Zum Nachlesen und Wiederholen/);
    assert.ok(h.text().includes(question.explanation));
    assert.match(h.text(), /Für heute bearbeitet/);
    assert.equal(nodes(h.tree, node => node.type === 'a').length, 1);
    assert.equal(nodes(h.tree, node => node.type === 'button' && !node.props.disabled).length, 0);
    skip.props.onClick(); h.render(); assert.equal(h.state, answered);
  }
});

test('Daily repeated and pre-hydration stale handlers cannot replace the first accepted answer', () => {
  const question = fixture(), h = setup([question], true, false);
  const beforeHydration = h.button('Aussage a');
  h.render(); const fresh = h.state;
  beforeHydration.props.onClick(); h.render(); assert.equal(h.state, fresh);
  const wrong = h.button('Aussage a'), correct = h.button('Aussage c');
  correct.props.onClick(); wrong.props.onClick(); correct.props.onClick(); h.render();
  assert.equal(h.state.answers[question.id].correct, true);
  assert.deepEqual(h.state.answers[question.id].selectedIds, ['c']);
  assert.equal(Object.keys(h.state.answers).length, 1);
});

test('The original practice round still advances manually and offers its result and further questions', () => {
  const questions = Array.from({ length: 9 }, (_, index) => ({ ...fixture(), id: `synthetic-practice-${index}` }));
  const h = setup(questions, false);
  assert.match(h.text(), /Dein Praxischeck/); assert.match(h.text(), /9 Fragen im Thema/);
  for (let index = 0; index < 8; index++) {
    h.click('Aussage c');
    assert.ok(!h.text().includes('Für heute bearbeitet'));
    assert.match(h.text(), new RegExp(`Frage ${index + 1} von 8`));
    h.click(index === 7 ? 'Runde auswerten' : 'Nächste Frage');
  }
  assert.match(h.text(), /8 von 8 richtig/); assert.match(h.text(), /Weitere Fragen/);
  h.click('Weitere Fragen'); assert.match(h.text(), /Frage 1 von 1/);
});

test('Daily mode refuses a zero-question or multi-question pool instead of silently offering more cases', () => {
  assert.equal(setup([]).tree, null);
  assert.equal(setup([fixture(), { ...fixture(), id: 'other' }]).tree, null);
});
