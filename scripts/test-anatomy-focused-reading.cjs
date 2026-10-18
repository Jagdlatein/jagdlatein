const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean) || null;
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function words(node) {
  if (Array.isArray(node)) return node.map(words).join('');
  if (node == null || typeof node === 'boolean') return '';
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function setup() {
  const slots = []; let cursor = 0;
  const hooks = { ...React,
    useState(initial) { const index = cursor++; slots[index] ||= { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }]; },
    useRef(initial) { const index = cursor++; slots[index] ||= { value: { current: initial } }; return slots[index].value; },
    useEffect() {},
  };
  const load = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: false, query: {} }) } });
  const Component = load('components/AnatomyExplorer.js').default;
  const data = load('lib/anatomy-explorer.js'); let tree;
  function redraw() { cursor = 0; tree = Component(); }
  redraw();
  return { data, get tree() { return tree; }, redraw, text: () => words(tree),
    selector() { return find(tree, node => node.type === 'select'); },
    choose(id) { this.selector().props.onChange({ target: { value: id } }); redraw(); },
    quiz() { return find(tree, node => node.type === 'details' && words(node.props.children[0]).startsWith('Wissen zum Modell')); },
    toggle(open) { this.quiz().props.onToggle({ currentTarget: { open } }); redraw(); },
    button(text) { const button = find(tree, node => node.type === 'button' && words(node) === text); assert.ok(button, text); return button; },
    click(text) { const button = this.button(text); assert.ok(!button.props.disabled); button.props.onClick(); redraw(); },
  };
}

test('Anatomy initially renders only its chosen model knowledge, provenance and optional quiz label', () => {
  const s = setup();
  assert.equal(s.quiz().props.open, false);
  assert.ok(s.text().includes(s.data.anatomyModels[0].description));
  for (const question of s.data.anatomyQuestions) assert.ok(!s.text().includes(question.question));
  assert.ok(s.text().includes('Weißwedelhirsches')); assert.ok(s.text().includes('Fachliche Quellen und Modellnachweise'));
});

test('Each quiz uses only the explicitly authored modelId, preserves every explanation and counts its own answers', () => {
  const s = setup(); let visited = 0;
  for (const model of s.data.anatomyModels) {
    s.choose(model.id); assert.equal(s.quiz().props.open, false); s.toggle(true);
    const questions = s.data.anatomyQuestions.filter(question => question.modelId === model.id);
    assert.ok(questions.length);
    for (const [i, question] of questions.entries()) {
      assert.ok(s.text().includes(question.question));
      for (const other of s.data.anatomyQuestions.filter(item => item.modelId !== model.id)) assert.ok(!s.text().includes(other.question));
      s.click(question.choices[question.answer]); assert.ok(s.text().includes(question.explanation)); visited++;
      if (i < questions.length - 1) s.click('Nächste Frage');
    }
    assert.ok(s.text().includes(`Runde abgeschlossen: ${questions.length} von ${questions.length} richtig`));
  }
  assert.equal(visited, s.data.anatomyQuestions.length);
});

test('Changing models invalidates old answer, question and toggle handlers even before React commits and across A–B–A', () => {
  const s = setup(), [first, second] = s.data.anatomyModels;
  s.toggle(true);
  const q = s.data.anatomyQuestions.find(item => item.modelId === first.id);
  const staleAnswer = s.button(q.choices[q.answer]).props.onClick, staleToggle = s.quiz().props.onToggle;
  s.selector().props.onChange({ target: { value: second.id } });
  staleAnswer(); staleToggle({ currentTarget: { open: true } }); s.redraw();
  assert.equal(s.quiz().props.open, false);
  s.toggle(true); assert.match(s.text(), /0 beantwortet · 0 richtig/);
  s.choose(first.id); s.toggle(true); staleAnswer(); staleToggle({ currentTarget: { open: false } }); s.redraw();
  assert.equal(s.quiz().props.open, true); assert.match(s.text(), /0 beantwortet · 0 richtig/);
  s.click(q.choices[q.answer]);
  const staleNext = s.button('Nächste Frage').props.onClick;
  s.choose(second.id); s.toggle(true); staleNext(); s.redraw(); assert.match(s.text(), /Frage 1 von/);
});

test('Closing or leaving optional practice rejects detached events, while reselecting the same model preserves current practice', () => {
  const s = setup(), first = s.data.anatomyModels[0];
  const q = s.data.anatomyQuestions.find(item => item.modelId === first.id);
  s.toggle(true); const staleAnswer = s.button(q.choices[q.answer]).props.onClick;
  s.toggle(false); staleAnswer(); s.redraw(); s.toggle(true); assert.match(s.text(), /0 beantwortet · 0 richtig/);
  s.click(q.choices[q.answer]); s.choose(first.id); assert.equal(s.quiz().props.open, true); assert.match(s.text(), /1 beantwortet · 1 richtig/);
  const oldToggle = s.quiz().props.onToggle;
  s.choose('schwarzwild-verdauung'); staleAnswer(); oldToggle({ currentTarget: { open: true } }); s.redraw();
  assert.equal(s.quiz(), null);
  s.choose(first.id); assert.equal(s.quiz().props.open, false); s.toggle(true); assert.match(s.text(), /0 beantwortet · 0 richtig/);
});
