// Local learning state and synthetic clicks only. No accounts or remote APIs.
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
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)), overrides, cache);
    return pr(id);
  }, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const data = load('lib/practice-research-server.js').getPracticeResearchData();
const { answerOrder } = load('lib/answer-order.js');
const { createResearchRound, currentResearchQuestion, canGradeResearchQuestion, gradeResearchQuestion, researchRoundReducer: reduce } = load('lib/research-question-round.js');
const token = state => ({ generation: state.generation, questionId: currentResearchQuestion(state).id });
function text(node) { return node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node); }
function nodes(node, predicate) { return Array.isArray(node) ? node.flatMap(child => nodes(child, predicate)) : !node || typeof node !== 'object' ? [] : [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)]; }
function grade(state, ids) {
  const question = currentResearchQuestion(state);
  if (question.format === 'multiple') for (const id of ids) state = reduce(state, { type: 'select', ...token(state), id });
  if (question.format === 'sequence') for (const [position, id] of ids.entries()) state = reduce(state, { type: 'select', ...token(state), position, id });
  return reduce(state, { type: 'answer', ...token(state), ids });
}
function finish(state, wrong = false) {
  while (!state.finished) {
    const question = currentResearchQuestion(state);
    state = wrong ? reduce(state, { type: 'skip', ...token(state) }) : grade(state, question.expectedOrder || question.correctIds);
    state = reduce(state, { type: 'next', ...token(state) });
  }
  return state;
}

test('Sixty distinct reviewed questions have valid source mappings and three genuine interaction formats', () => {
  assert.equal(data.questions.length, 60);
  assert.equal(new Set(data.questions.map(item => item.id)).size, 60);
  assert.equal(new Set(data.questions.map(item => `${item.prompt}\n${item.context || ''}`)).size, 60);
  const formats = new Set();
  for (const topic of data.topics) {
    const questions = data.questions.filter(item => item.topicId === topic.id);
    const sources = new Set(topic.sources.map(item => item.id));
    assert.equal(questions.length, 20);
    assert.ok(new Set(questions.map(item => item.skill)).size >= 4);
    assert.ok(questions.filter(item => item.format === 'multiple').length >= 6);
    for (const question of questions) {
      formats.add(question.format);
      assert.match(question.reviewedOn, /^2026-10-16$/);
      assert.ok(question.prompt.length > 30 && question.explanation.length > 100);
      assert.ok(question.sourceIds.length && question.sourceIds.every(id => sources.has(id)));
      const ids = question.options.map(item => item.id);
      assert.equal(new Set(ids).size, ids.length);
      assert.equal(new Set(question.options.map(item => item.text)).size, ids.length);
      const expected = question.expectedOrder || question.correctIds;
      assert.equal(new Set(expected).size, expected.length);
      assert.ok(expected.every(id => ids.includes(id)));
      if (question.format === 'single') assert.equal(expected.length, 1);
      if (question.format === 'multiple') assert.ok(expected.length > 1 && expected.length < ids.length);
      if (question.format === 'sequence') assert.equal(expected.length, ids.length);
    }
  }
  assert.deepEqual([...formats].sort(), ['multiple', 'sequence', 'single']);
});

test('Every possible answer combination is scored by original IDs, including exact multiple choice and ordered sequences', () => {
  for (const question of data.questions) {
    const ids = question.options.map(item => item.id);
    if (question.format === 'sequence') {
      assert.equal(gradeResearchQuestion(question, question.expectedOrder).correct, true);
      assert.equal(gradeResearchQuestion(question, [...question.expectedOrder].reverse()).correct, false);
      assert.equal(canGradeResearchQuestion(question, ids.map(() => ids[0])), false);
      assert.equal(canGradeResearchQuestion(question, ids.slice(1)), false);
    } else {
      for (let mask = 0; mask < 2 ** ids.length; mask++) {
        const selected = ids.filter((_, index) => mask & 1 << index);
        const result = gradeResearchQuestion(question, selected);
        if (!selected.length || question.format === 'single' && selected.length !== 1) assert.equal(result, null);
        else assert.equal(result.correct, selected.length === question.correctIds.length && question.correctIds.every(id => selected.includes(id)), question.id);
      }
    }
    assert.equal(gradeResearchQuestion(question, ['unknown']), null);
    assert.equal(gradeResearchQuestion(question, [ids[0], ids[0]]), null);
  }
});

test('Short batches exhaust all twenty questions once before a new mixed round; retry preserves the untouched queue', () => {
  for (const topic of data.topics) {
    const pool = data.questions.filter(item => item.topicId === topic.id);
    let state = createResearchRound(pool, 1234);
    const seen = [];
    while (true) {
      assert.ok(state.ids.length > 0 && state.ids.length <= 8);
      seen.push(...state.ids);
      state = finish(state);
      assert.ok(state.ids.every(id => state.answers[id].correct));
      if (!state.remaining.length) break;
      state = reduce(state, { type: 'continue', ...token(state), seed: 5678 });
    }
    assert.equal(seen.length, 20); assert.equal(new Set(seen).size, 20);
    assert.deepEqual([...seen].sort(), pool.map(item => item.id).sort());
    const again = reduce(state, { type: 'restart', ...token(state), seed: 9999 });
    assert.notDeepEqual(again.ids, seen.slice(0, 8));
    const failed = finish(createResearchRound(pool, 444), true);
    const retry = reduce(failed, { type: 'retry', ...token(failed), seed: 555 });
    assert.deepEqual(retry.ids, failed.ids); assert.deepEqual(retry.remaining, failed.remaining);
    assert.equal(Object.keys(retry.answers).length, 0);
  }
});

test('Double clicks, stale questions, invalid inputs and previous rounds cannot change scores or skip a question', () => {
  const pool = data.questions.filter(item => item.topicId === 'wildkameras');
  let state = createResearchRound(pool, 7);
  const stale = token(state), question = currentResearchQuestion(state);
  assert.equal(reduce(state, { type: 'next', ...stale }), state);
  assert.equal(reduce(state, { type: 'answer', ...stale, ids: ['unknown'] }), state);
  state = grade(state, question.expectedOrder || question.correctIds);
  assert.equal(reduce(state, { type: 'skip', ...stale }), state);
  state = reduce(state, { type: 'next', ...stale });
  assert.equal(reduce(state, { type: 'next', ...stale }), state);
  assert.equal(reduce(state, { type: 'answer', ...stale, ids: question.correctIds }), state);
  const finished = finish(state);
  const next = reduce(finished, { type: 'continue', ...token(finished), seed: 8 });
  assert.equal(reduce(next, { type: 'continue', ...token(finished), seed: 9 }), next);
});

test('A guarded post-hydration mix refreshes visits without replacing an answer or selection already made', () => {
  const pool = data.questions.filter(item => item.topicId === 'wildkameras');
  const initial = createResearchRound(pool);
  const mixed = reduce(initial, { type: 'freshen', generation: 0, seed: 456 });
  assert.equal(mixed.generation, 1);
  assert.notDeepEqual(mixed.ids, initial.ids);
  assert.equal(reduce(mixed, { type: 'freshen', generation: 0, seed: 789 }), mixed);
  const answered = reduce(initial, { type: 'skip', ...token(initial) });
  assert.equal(reduce(answered, { type: 'freshen', generation: 0, seed: 456 }), answered);
  const question = data.questions.find(item => item.format === 'multiple');
  let choosing = createResearchRound([question]);
  choosing = reduce(choosing, { type: 'select', ...token(choosing), id: question.options[0].id });
  assert.equal(reduce(choosing, { type: 'freshen', generation: 0, seed: 456 }), choosing);
});

test('SSR order is stable, correct positions vary and changed seeds never alter answer identities or grading', () => {
  const positions = new Set();
  for (const question of data.questions) {
    assert.deepEqual(answerOrder(question.options, question.id), answerOrder(question.options, question.id));
    for (const seed of [0, 1, 42, 8765]) {
      const ordered = answerOrder(question.options, question.id, seed).map(index => question.options[index]);
      assert.deepEqual(ordered.map(item => item.id).sort(), question.options.map(item => item.id).sort());
      if (question.format === 'single') positions.add(ordered.findIndex(option => option.id === question.correctIds[0]));
      assert.equal(gradeResearchQuestion(question, question.correctIds || question.expectedOrder).correct, true);
    }
  }
  assert.ok(positions.size >= 4);
});

test('Actual UI submits original IDs, reveals explanations only after answering and supports every question format', () => {
  for (const format of ['single', 'multiple', 'sequence']) {
    const question = data.questions.find(item => item.format === format);
    let state;
    const Page = load('components/ResearchQuestionRound.js', { react: { ...React, useRef: () => ({ current: null }), useEffect() {}, useReducer(reducer, arg, init) { state ||= init(arg); return [state, event => { state = reducer(state, event); }]; } } }).default;
    const props = { questions: [question], sources: data.topics.find(topic => topic.id === question.topicId).sources };
    const render = () => renderToStaticMarkup(React.createElement(Page, props));
    const before = render();
    assert.ok(before.includes(question.prompt));
    assert.ok(!before.includes(question.explanation));
    assert.match(before, /Weiß ich noch nicht/);
    if (format === 'multiple') assert.equal((before.match(/type="checkbox"/g) || []).length, question.options.length);
    if (format === 'sequence') assert.equal((before.match(/<select/g) || []).length, question.options.length);
    if (format === 'single') {
      const answerText = question.options.find(option => option.id === question.correctIds[0]).text;
      nodes(Page(props), node => node.type === 'button' && text(node) === answerText)[0].props.onClick();
    } else if (format === 'multiple') {
      for (const id of question.correctIds) {
        const optionText = question.options.find(option => option.id === id).text;
        const label = nodes(Page(props), node => node.type === 'label' && text(node) === optionText)[0];
        nodes(label, node => node.type === 'input')[0].props.onChange();
      }
    } else {
      for (const [position, id] of question.expectedOrder.entries()) {
        nodes(Page(props), node => node.type === 'select')[position].props.onChange({ target: { value: id } });
      }
    }
    if (format !== 'single') {
      const submit = nodes(Page(props), node => node.type === 'button' && text(node) === 'Antwort prüfen')[0];
      assert.equal(submit.props.disabled, false);
      submit.props.onClick();
    }
    const after = render();
    assert.ok(after.includes(question.explanation.replaceAll('&', '&amp;')));
    assert.match(after, /Richtig eingeordnet/);
    assert.match(after, /Runde auswerten/);
    assert.match(after, /disabled/);
  }
});
