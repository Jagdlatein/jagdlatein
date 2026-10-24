// Actual ResearchQuestionRound hooks plus explicit parent element identity/path.
// This is a local integration harness, not a browser or device renderer.
const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const data = createLoader()('lib/practice-research-server.js').getPracticeResearchData();
const order = createLoader()('lib/answer-order.js');
const pathname = '/lernen/wissen-fuers-revier';

function childAt(node, path = []) {
  if (Array.isArray(node)) {
    for (const [index, child] of node.entries()) {
      const found = childAt(child, [...path, { slot: index }]); if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== 'object') return null;
  const next = [...path, { type: node.type, key: node.key ?? null }];
  if (node.type?.name === 'ResearchQuestionRound') return { element: node, path: next };
  return childAt(node.props?.children, next);
}
function samePath(left, right) {
  return left.length === right.length && left.every((part, index) => part.type === right[index].type && part.key === right[index].key && part.slot === right[index].slot);
}
function mountRound(initialProps) {
  const slots = [], cleanups = []; let cursor = 0, effects = [], dirty = false, tree, props = initialProps, alive = true;
  const hooks = { ...React,
    useReducer(reducer, value, init) {
      const index = cursor++;
      slots[index] ||= { state: init ? init(value) : value };
      return [slots[index].state, event => {
        assert.ok(alive, 'A removed round cannot receive state writes');
        const next = reducer(slots[index].state, event);
        dirty ||= !Object.is(next, slots[index].state); slots[index].state = next;
      }];
    },
    useRef(initial) { const index = cursor++; slots[index] ||= { current: initial }; return slots[index]; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !deps || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) {
        slots[index] = { deps }; effects.push(() => { cleanups[index]?.(); cleanups[index] = effect(); });
      }
    },
  };
  const Component = createLoader({ react: hooks,
    '../lib/answer-order': { ...order, newAnswerSeed(previous) { return order.newAnswerSeed(previous, () => 0.42); } },
  })('components/ResearchQuestionRound.js').default;
  function render(nextProps = props) {
    assert.ok(alive); props = nextProps;
    for (let pass = 0; pass < 8; pass++) {
      cursor = 0; dirty = false; tree = Component(props);
      const pending = effects; effects = []; pending.forEach(effect => effect());
      if (!dirty) return tree;
    }
    throw new Error('Round effects did not settle');
  }
  function button(label) {
    const found = nodes(tree, node => node.type === 'button' && text(node) === label)[0];
    assert.ok(found, label); assert.equal(!!found.props.disabled, false, label); return found;
  }
  function click(label) { button(label).props.onClick(); render(); }
  function state() { return slots[0].state; }
  function question() { return state().questions.find(item => item.id === state().ids[state().index]); }
  function snapshot() {
    const { generation, ids, remaining, index, selection, answers, finished } = state();
    return structuredClone({ generation, ids, remaining, index, selection, answers, finished });
  }
  function reach(format) {
    for (let step = 0; step < 25; step++) {
      if (state().finished) { click('Weitere Fragen'); continue; }
      if (question().format === format) return question();
      click('Weiß ich noch nicht'); click(state().index + 1 === state().ids.length ? 'Runde auswerten' : 'Nächste Frage');
    }
    throw new Error('Missing actual question format: ' + format);
  }
  render();
  return { render, click, reach, question, snapshot, state, get tree() { return tree; },
    dispose() { if (!alive) return; cleanups.forEach(cleanup => cleanup?.()); alive = false; },
  };
}
function fixture(t, options = {}) {
  const initial = { thema: 'wildkameras' };
  const parent = setup('components/ResearchForPractice.js', initial, { props: data, router: { pathname, asPath: `${pathname}?thema=wildkameras#revierwissen-fragen` }, ...options });
  let active = null, mounts = 0;
  function reconcile() {
    const descriptor = childAt(parent.tree);
    if (!descriptor) { active?.round.dispose(); active = null; return null; }
    if (!active || !samePath(active.path, descriptor.path)) {
      active?.round.dispose(); active = { path: descriptor.path, round: mountRound(descriptor.element.props) }; mounts++;
    } else active.round.render(descriptor.element.props);
    return active.round;
  }
  function sync() { parent.render(); return reconcile(); }
  function choose(id) { return parent.nodes(node => node.type === 'select' && node.props.id === 'revierwissen-topic')[0].props.onChange({ target: { value: id } }); }
  function route(id, hash = 'revierwissen-fragen') {
    parent.router.asPath = `${pathname}?thema=${encodeURIComponent(id)}#${hash}`;
    parent.router.query = { thema: id }; return sync();
  }
  t.after(() => { active?.round.dispose(); parent.dispose(); });
  reconcile();
  return { parent, choose, route, sync, reconcile, get round() { return active?.round || null; }, get mounts() { return mounts; }, get path() { return active?.path; } };
}
function prepare(round, format) {
  const question = round.reach(format);
  if (format === 'single') {
    round.click(question.options.find(option => option.id === question.correctIds[0]).text);
    assert.ok(text(round.tree).includes(question.explanation));
  } else if (format === 'multiple') {
    const option = question.options.find(option => option.id === question.correctIds[0]);
    const label = nodes(round.tree, node => node.type === 'label' && text(node) === option.text)[0];
    nodes(label, node => node.type === 'input')[0].props.onChange(); round.render();
    assert.ok(nodes(round.tree, node => node.type === 'input' && node.props.checked).length);
  } else {
    nodes(round.tree, node => node.type === 'select')[0].props.onChange({ target: { value: question.expectedOrder[0] } }); round.render();
    assert.equal(nodes(round.tree, node => node.type === 'select')[0].props.value, question.expectedOrder[0]);
  }
}

for (const format of ['single', 'multiple', 'sequence']) test(`A real ${format} answer/selection and its mounted parent path survive pending, failure, re-selection and hash-only navigation`, async t => {
  const h = fixture(t), round = h.round;
  prepare(round, format);
  const snapshot = round.snapshot(), path = h.path;
  let reject;
  h.parent.router.push = () => new Promise((resolve, fail) => { reject = fail; });
  const pending = h.choose('wild-und-stoerung'); h.sync();
  assert.strictEqual(h.round, round); assert.equal(h.mounts, 1); assert.ok(samePath(h.path, path));
  assert.deepEqual(h.round.snapshot(), snapshot);
  reject(new Error('offline')); await pending; h.sync();
  assert.strictEqual(h.round, round); assert.deepEqual(h.round.snapshot(), snapshot);
  assert.equal(h.parent.nodes(node => node.props?.role === 'alert').length, 1);
  await h.choose('wildkameras'); h.sync();
  assert.strictEqual(h.round, round); assert.deepEqual(h.round.snapshot(), snapshot); assert.equal(h.mounts, 1);
  assert.equal(h.parent.nodes(node => node.props?.role === 'alert').length, 0);
  h.route('wildkameras', 'revierwissen-inhalt');
  assert.strictEqual(h.round, round); assert.deepEqual(h.round.snapshot(), snapshot);
  h.route('wildkameras', 'revierwissen-fragen');
  assert.strictEqual(h.round, round); assert.deepEqual(h.round.snapshot(), snapshot); assert.ok(samePath(h.path, path));
  assert.match(text(h.round.tree), /Lernübung auf diesem Gerät\. Keine Prüfung und keine Prognose/);
});

test('A genuine topic commit remounts only its own actual question pool; Back/Forward start fresh local topic rounds', async t => {
  const h = fixture(t), first = h.round;
  prepare(first, 'single'); assert.ok(Object.keys(first.snapshot().answers).length > 0);
  const pending = h.choose('wild-und-stoerung'); h.sync(); await pending; h.sync();
  assert.notStrictEqual(h.round, first); assert.equal(h.mounts, 2);
  assert.deepEqual(h.round.state().questions.map(item => item.id).sort(), data.questions.filter(item => item.topicId === 'wild-und-stoerung').map(item => item.id).sort());
  assert.deepEqual(h.round.snapshot().answers, {}); assert.deepEqual(h.round.snapshot().selection, []);
  h.round.click('Weiß ich noch nicht'); const second = h.round;
  h.route('wildkameras');
  assert.notStrictEqual(h.round, first); assert.notStrictEqual(h.round, second); assert.equal(h.mounts, 3);
  assert.deepEqual(h.round.snapshot().answers, {}); assert.ok(h.round.state().questions.every(item => item.topicId === 'wildkameras'));
  h.route('wild-und-stoerung'); assert.equal(h.mounts, 4); assert.deepEqual(h.round.snapshot().answers, {});
  assert.ok(h.round.state().questions.every(item => item.topicId === 'wild-und-stoerung'));
});

test('Cancelling a pending switch by re-selecting the committed topic retains the actual answered quiz', async t => {
  const h = fixture(t), round = h.round; prepare(round, 'single'); const snapshot = round.snapshot(); const rejects = [];
  h.parent.router.push = () => new Promise((resolve, reject) => rejects.push(reject));
  const pending = h.choose('wild-und-stoerung'); const restore = h.choose('wildkameras'); h.sync();
  assert.equal(rejects.length, 2);
  rejects[0](Object.assign(new Error('superseded'), { cancelled: true })); await pending; h.sync();
  rejects[1](Object.assign(new Error('cancelled'), { cancelled: true })); await restore; h.sync();
  assert.strictEqual(h.round, round); assert.equal(h.mounts, 1); assert.deepEqual(h.round.snapshot(), snapshot);
});

test('An unready or explicitly invalid URL never mounts another topic quiz', t => {
  const h = fixture(t, { ready: false });
  assert.equal(h.round, null); assert.equal(h.mounts, 0);
  h.parent.router.isReady = true; h.route('rehwild-fruehling');
  assert.equal(h.mounts, 1); assert.ok(h.round.state().questions.every(item => item.topicId === 'rehwild-fruehling'));
  h.route('unknown'); assert.equal(h.round, null);
  h.route('wildkameras'); assert.equal(h.mounts, 2); assert.deepEqual(h.round.snapshot().answers, {});
});
