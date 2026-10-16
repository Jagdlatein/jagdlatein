const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc'), React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} }, req = createRequire(filename);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/head') return ({ children }) => children;
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/router') return { useRouter: () => ({ query: {}, asPath: '', replace: async () => true }) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)), overrides, cache);
    return req(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
function words(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(words).join(''); return typeof node === 'object' ? words(node.props?.children) : String(node); }
function findAll(node, predicate) { if (Array.isArray(node)) return node.flatMap(child => findAll(child, predicate)); if (!node || typeof node !== 'object') return []; return [...(predicate(node) ? [node] : []), ...findAll(node.props?.children, predicate)]; }
function setup(file, props, extra = {}) {
  const slots = []; let cursor = 0;
  const hooks = { ...React,
    useState(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, value => slots[index].value = typeof value === 'function' ? value(slots[index].value) : value]; },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: { current: initial } }; return slots[index].value; }, useEffect() {},
  };
  const Component = load(file, { react: hooks, '../hooks/useCourseProgress': () => ({}), ...extra }).default;
  let tree;
  const h = { render() { cursor = 0; tree = Component(props); if (tree?.type?.name === 'LearningContent') tree = tree.type(tree.props); return tree; }, get tree() { return tree; },
    button(label) { const found = findAll(tree, node => node.type === 'button' && words(node).trim() === label)[0]; assert.ok(found, label); return found; },
    click(label) { const button = h.button(label); assert.equal(Boolean(button.props.disabled), false); button.props.onClick(); h.render(); },
    choices() { return findAll(tree, node => node.type === 'button' && /choice|answer/.test(node.props.className || '')); },
  };
  h.render(); return h;
}
const { answerOrder, newAnswerSeed } = load('lib/answer-order.js');

test('Answer display ordering is a stable permutation without random reads during rendering or changing answer records', () => {
  const answers = Object.freeze(['a', 'b', 'c', 'd'].map(id => Object.freeze({ id, text: `Option ${id}` })));
  const previous = Math.random;
  try {
    Math.random = () => { throw new Error('Randomness during render'); };
    for (let seed = 0; seed < 40; seed++) {
      const order = answerOrder(answers, 'fixture', seed);
      assert.deepEqual(order.slice().sort(), [0, 1, 2, 3]);
      assert.deepEqual(answerOrder(answers, 'fixture', seed), order);
      assert.deepEqual(order.map(index => answers[index].id).sort(), ['a', 'b', 'c', 'd']);
    }
    assert.deepEqual(answerOrder([], 'empty'), []);
    assert.deepEqual(answerOrder(['one'], 'one'), [0]);
  } finally { Math.random = previous; }
  assert.notEqual(newAnswerSeed(0, () => 0), 0);
  assert.notEqual(newAnswerSeed(0xffffffff, () => 1 - Number.EPSILON), 0xffffffff);
});

test('Neither the original answer slot nor a question number predicts the displayed correct position', () => {
  const positions = [0, 0, 0, 0];
  for (let id = 0; id < 1000; id++) positions[answerOrder(['correct', 'wrong 1', 'wrong 2', 'wrong 3'], `example-${id}`).indexOf(0)]++;
  for (const count of positions) assert.ok(count > 180 && count < 320, JSON.stringify(positions));
  assert.equal(new Set(Array.from({ length: 30 }, (_, seed) => answerOrder([0, 1, 2, 3], 'same-question', seed).indexOf(0))).size, 4);
});

test('Nature answers retain original scoring and option-specific explanations after display reordering and re-render', () => {
  const entry = { id: 'nature-fixture', title: 'Testfall', question: 'Was trifft zu?', options: ['Falsch A', 'Falsch B', 'Richtig', 'Falsch D'], answer: 2,
    wrong: ['Begründung für A', 'Begründung für B', '', 'Begründung für D'], explanation: 'Fachliche Gesamterklärung.' };
  const h = setup('components/NatureQuestionRound.js', { entries: [entry] });
  const order = h.choices().map(words); h.render(); assert.deepEqual(h.choices().map(words), order);
  h.click('Falsch B');
  assert.match(words(h.tree), /Begründung für B/); assert.match(words(h.tree), /Fachliche Gesamterklärung/);
  assert.match(words(h.tree), /Richtig · Richtige Antwort/);
  assert.deepEqual(h.choices().map(node => words(node).split(' · ')[0]), order);
  h.click('Auswertung ansehen'); assert.match(words(h.tree), /0 von 1 Fragen richtig/); assert.match(words(h.tree), /Deine Antwort: Falsch B/);
  h.click('Alle Fragen neu üben'); h.click('Richtig'); h.click('Auswertung ansehen'); assert.match(words(h.tree), /1 von 1 Fragen richtig/);
  assert.equal(entry.answer, 2); assert.deepEqual(entry.options, ['Falsch A', 'Falsch B', 'Richtig', 'Falsch D']);
});

test('Mini-course display indexes never change correctness, progress or saved answer review', () => {
  const questions = [{ frage: 'Testfrage', antworten: [{ text: 'Falsch', richtig: false }, { text: 'Richtig', richtig: true }, { text: 'Auch falsch', richtig: false }] }];
  const h = setup('components/MiniCourse.js', { courseId: 'fixture', questions, details: { modules: [], category: { slug: 'wildkunde' } } });
  h.click('Richtig'); assert.match(words(h.tree), /Richtig beantwortet/);
  h.click('Ergebnis ansehen'); assert.match(words(h.tree), /1 von 1/); assert.match(words(h.tree), /Deine Antwort: Richtig/);
  h.click('Mini-Kurs wiederholen'); h.click('Falsch'); h.click('Ergebnis ansehen'); assert.match(words(h.tree), /0 von 1/); assert.match(words(h.tree), /Deine Antwort: Falsch/);
});

test('Daily research case keeps visible answer order stable and grades the original option ID', () => {
  const question = { id: 'fixture', format: 'single', skill: 'Einordnen', prompt: 'Welche Antwort?',
    options: ['a', 'b', 'c', 'd'].map(id => ({ id, text: `Antwort ${id}` })), correctIds: ['c'],
    explanation: 'Eine synthetische Erklärung.', sourceIds: ['fixture-source'] };
  const props = { daily: true, questions: [question], sources: [{ id: 'fixture-source', title: 'Testquelle', url: 'https://example.org/source' }] };
  let state;
  const Page = load('components/ResearchQuestionRound.js', { react: { ...React, useRef: () => ({ current: null }), useEffect() {},
    useReducer(reducer, initial, init) { state ||= init(initial); return [state, event => { state = reducer(state, event); }]; } } }).default;
  let tree = Page(props), first = renderToStaticMarkup(tree);
  tree = Page(props); assert.equal(renderToStaticMarkup(tree), first);
  const answers = () => findAll(tree, node => node.type === 'button' && /answerOption/.test(node.props.className || ''));
  assert.deepEqual(answers().map(words).sort(), question.options.map(option => option.text).sort());
  const correct = answers().find(node => words(node) === 'Antwort c'); correct.props.onClick(); tree = Page(props);
  assert.equal(state.answers.fixture.correct, true); assert.deepEqual(state.answers.fixture.selectedIds, ['c']);
  assert.match(words(tree), /Für heute bearbeitet/);
  assert.ok(answers().every(node => node.props.disabled));
});

test('Detailed course runs preserve correct IDs, feedback and review history through a fresh practice round', () => {
  const { learningModules } = load('lib/learning-curriculum.js');
  const module = { ...learningModules[0], questions: learningModules[0].questions.slice(0, 2) }, records = [];
  const h = setup('components/LearningCourse.js', { module }, { '../lib/daily-review': { recordReviewAnswer: (...args) => records.push(args) } });
  const answerText = question => question.answers.find(answer => question.correct.includes(answer.id)).text;
  h.click('Wissen prüfen'); h.click(answerText(module.questions[0]));
  assert.match(words(h.tree), /Richtig beantwortet/);
  h.click('Nächste Frage'); h.click(answerText(module.questions[1])); h.click('Ergebnis ansehen');
  assert.match(words(h.tree), /2 von 2 richtig/); assert.deepEqual(records, module.questions.map(question => [question.id, true]));
  h.click('Alle Fragen wiederholen'); h.click(answerText(module.questions[0])); assert.match(words(h.tree), /Richtig beantwortet/);
});

test('Actual course and legacy inventories keep answer IDs valid with every displayed position represented', t => {
  const cache = new Map(), { learningModules, learningQuestions } = load('lib/learning-curriculum.js', {}, cache);
  const { QUESTIONS } = load('data/questions-full.js', {}, cache);
  const histogram = questions => { const count = [0, 0, 0, 0]; for (const question of questions) { const ordered = answerOrder(question.answers, question.id).map(index => question.answers[index]); for (const id of question.correct) { const position = ordered.findIndex(answer => answer.id === id); assert.ok(position >= 0); count[position]++; } } return count; };
  const coursePositions = histogram(learningQuestions), allPositions = histogram(QUESTIONS);
  assert.ok(coursePositions.every(count => count > learningQuestions.length / 8));
  assert.ok(allPositions.every(count => count > QUESTIONS.length / 8));
  t.diagnostic(`${learningModules.length} detailed courses / ${learningQuestions.length} questions; displayed correct positions ${coursePositions.join('/')}. Overall quiz pool ${QUESTIONS.length}; positions ${allPositions.join('/')}.`);
  const stored = [0, 0, 0, 0]; for (const question of QUESTIONS) stored[question.answers.findIndex(answer => question.correct.includes(answer.id))]++;
  t.diagnostic(`Before this change, stored pool positions were ${stored.join('/')}; ranked quiz already randomized server-side, course checks used one static rotation.`);
});
