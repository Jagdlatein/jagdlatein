// Isolated child lifecycles and synthetic radio changes only; no media playback,
// router mutation, accounts, or external requests are involved in these checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const lessons = createLoader()('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;

function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}

function childFixture(t, initialProps) {
  const slots = [], effects = [], cleanups = new Map();
  let props = initialProps, cursor = 0, tree, dirty = false, disposed = false;
  let stateWrites = 0, writesAfterDispose = 0;
  const hooks = {
    ...React,
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        stateWrites++;
        if (disposed) { writesAfterDispose++; return; }
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        dirty ||= !Object.is(slots[index].value, next);
        slots[index].value = next;
      }];
    },
    useEffect(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || !dependencies || !previous.dependencies || dependencies.length !== previous.dependencies.length || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        slots[index] = { dependencies };
        effects.push({ index, callback });
      }
    },
  };
  const { ObservationQuestion } = createLoader({ react: hooks })('components/HuntingDogVideos.js');
  assert.equal(typeof ObservationQuestion, 'function', 'Exercise the exported child itself, not an unrendered parent element');
  function render() {
    assert.equal(disposed, false, 'A disposed child cannot be rendered again');
    let passes = 0;
    do {
      assert.ok(passes++ < 10, 'Child state/effects must settle');
      dirty = false; cursor = 0; tree = ObservationQuestion(props);
      while (effects.length) {
        const { index, callback } = effects.shift();
        cleanups.get(index)?.();
        const cleanup = callback();
        if (typeof cleanup === 'function') cleanups.set(index, cleanup);
        else cleanups.delete(index);
      }
    } while (dirty);
    return tree;
  }
  function dispose() {
    if (disposed) return;
    for (const cleanup of cleanups.values()) cleanup();
    disposed = true;
  }
  function radios() { return nodes(tree, node => node.type === 'input' && node.props.type === 'radio'); }
  function selected() { return radios().filter(node => node.props.checked).map(node => Number(node.props.value)); }
  function feedback() { return nodes(tree, node => node.props?.role === 'status').map(text); }
  t.after(dispose);
  render();
  return {
    render, dispose, radios, selected, feedback,
    get stateWrites() { return stateWrites; }, get writesAfterDispose() { return writesAfterDispose; },
    update(nextProps) { props = nextProps; render(); },
    choose(index) { const radio = radios()[index]; assert.ok(radio, `Missing radio ${index}`); radio.props.onChange(); render(); },
    visibleText() { return text(tree); },
  };
}

function scopedProps(question, scope, parent) {
  return { question, scope, canInteract: () => parent.current === scope };
}

test('Every authored observation question preserves current wrong/correct feedback and remains deliberately revisable', t => {
  let count = 0;
  for (const lesson of lessons) for (const question of lesson.questions) {
    const scope = {}, parent = { current: scope };
    const props = scopedProps(question, scope, parent);
    const f = childFixture(t, props);
    assert.equal(f.radios().length, question.choices.length);
    assert.deepEqual(f.radios().map(node => node.props.name), question.choices.map(() => question.id));
    assert.deepEqual(f.selected(), []);
    assert.deepEqual(f.feedback(), []);
    const wrong = (question.answer + 1) % question.choices.length;
    f.choose(wrong);
    assert.deepEqual(f.selected(), [wrong]);
    assert.deepEqual(f.feedback(), [`Schau noch einmal auf den Ausschnitt. ${question.explanation}`]);
    f.update(scopedProps(question, scope, parent));
    assert.deepEqual(f.selected(), [wrong], 'Ordinary parent rerenders must not reset an answer');
    f.choose(question.answer);
    assert.deepEqual(f.selected(), [question.answer]);
    assert.deepEqual(f.feedback(), [`Richtig eingeordnet. ${question.explanation}`]);
    f.render();
    assert.deepEqual(f.selected(), [question.answer]);
    f.choose(wrong);
    assert.deepEqual(f.feedback(), [`Schau noch einmal auf den Ausschnitt. ${question.explanation}`]);
    f.dispose(); count++;
  }
  assert.equal(count, 8);
});

test('A new question object with the same ID starts a clean answer session and rejects old radio handlers, including object away/back', t => {
  const original = lessons[0].questions[0];
  const replacement = { ...original, choices: [...original.choices], answer: 1, explanation: 'Synthetic replacement explanation for the child lifecycle check.' };
  const scope = {}, parent = { current: scope };
  const f = childFixture(t, scopedProps(original, scope, parent));
  const oldHandlers = f.radios().map(node => node.props.onChange);
  f.choose(original.answer);
  f.update(scopedProps(replacement, scope, parent));
  assert.deepEqual(f.selected(), []);
  assert.deepEqual(f.feedback(), []);
  let before = f.stateWrites;
  for (const choose of oldHandlers) choose();
  assert.equal(f.stateWrites, before, 'Old callbacks must be rejected before calling the setter');
  f.render();
  assert.deepEqual(f.selected(), []);
  const replacementHandlers = f.radios().map(node => node.props.onChange);
  f.choose(replacement.answer);
  assert.deepEqual(f.feedback(), [`Richtig eingeordnet. ${replacement.explanation}`]);
  f.update(scopedProps(original, scope, parent));
  assert.deepEqual(f.selected(), [], 'Returning to the same object creates a new session after a different object');
  before = f.stateWrites;
  for (const choose of [...oldHandlers, ...replacementHandlers]) choose();
  assert.equal(f.stateWrites, before);
  f.render();
  assert.deepEqual(f.feedback(), []);
  f.choose(original.answer);
  assert.deepEqual(f.feedback(), [`Richtig eingeordnet. ${original.explanation}`]);
});

test('A different authored question resets only its own answer and cannot receive the old question radio action', t => {
  const [first, second] = lessons[0].questions;
  const scope = {}, parent = { current: scope };
  const f = childFixture(t, scopedProps(first, scope, parent));
  const oldHandler = f.radios()[first.answer].props.onChange;
  f.choose(first.answer);
  f.update(scopedProps(second, scope, parent));
  assert.deepEqual(f.selected(), []);
  assert.ok(f.visibleText().includes(second.question));
  assert.ok(!f.visibleText().includes(first.explanation));
  const before = f.stateWrites; oldHandler();
  assert.equal(f.stateWrites, before);
  f.render();
  f.choose(second.answer);
  assert.deepEqual(f.feedback(), [`Richtig eingeordnet. ${second.explanation}`]);
});

test('Parent origin invalidates old radio handlers before the child rerenders, while a fresh scope preserves the same question answer', t => {
  const question = lessons[1].questions[0];
  const initial = {}, next = {}, returned = {}, parent = { current: initial };
  const f = childFixture(t, scopedProps(question, initial, parent));
  const oldHandler = f.radios()[question.answer].props.onChange;
  const wrong = (question.answer + 1) % question.choices.length;
  f.choose(wrong);
  parent.current = next;
  let before = f.stateWrites; oldHandler();
  assert.equal(f.stateWrites, before, 'The parent guard must reject before a child rerender');
  f.render();
  assert.deepEqual(f.selected(), [wrong]);
  f.update(scopedProps(question, next, parent));
  assert.deepEqual(f.selected(), [wrong], 'A URL scope change alone does not erase the same question answer');
  before = f.stateWrites; oldHandler();
  assert.equal(f.stateWrites, before, 'An old scope stays invalid after the child commits the new scope');
  const nextHandler = f.radios()[wrong].props.onChange;
  f.choose(question.answer);
  parent.current = returned;
  f.update(scopedProps(question, returned, parent));
  assert.deepEqual(f.selected(), [question.answer]);
  before = f.stateWrites;
  oldHandler(); nextHandler();
  assert.equal(f.stateWrites, before, 'History away/back must not revive either earlier scope');
  f.render();
  assert.deepEqual(f.feedback(), [`Richtig eingeordnet. ${question.explanation}`]);
});

test('The current child requires a live parent guard and retained radio handlers do not write after unmount', t => {
  const question = lessons[2].questions[0], scope = {};
  let enabled = false, guardCalls = 0;
  const props = { question, scope, canInteract: () => { guardCalls++; return enabled; } };
  const f = childFixture(t, props);
  let before = f.stateWrites;
  f.radios()[question.answer].props.onChange();
  assert.equal(f.stateWrites, before);
  f.render(); assert.deepEqual(f.feedback(), []);
  enabled = true; f.choose(question.answer);
  assert.deepEqual(f.selected(), [question.answer]);
  f.update({ question, scope, canInteract: undefined });
  before = f.stateWrites;
  f.radios()[0].props.onChange();
  assert.equal(f.stateWrites, before);
  f.render(); assert.deepEqual(f.selected(), [question.answer]);
  f.update(props);
  const retained = f.radios().map(node => node.props.onChange);
  f.dispose();
  const calls = guardCalls;
  before = f.stateWrites;
  for (const choose of retained) choose();
  assert.equal(f.stateWrites, before);
  assert.equal(f.writesAfterDispose, 0);
  assert.equal(guardCalls, calls, 'Unmount is rejected before consulting the parent callback');
});
