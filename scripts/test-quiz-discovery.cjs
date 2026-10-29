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
  const file = path.join(root, relative);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file);
  const { code } = swc.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), path.extname(id) ? id : `${id}.js`)), overrides, cache);
    return pr(id);
  }, mod, mod.exports); cache.set(file, mod.exports); return mod.exports;
}
function text(node) { return node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node); }
function find(node, predicate) { if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean) || null; return !node || typeof node !== 'object' ? null : predicate(node) ? node : find(node.props?.children, predicate); }

test('Existing ranked quiz and leaderboard are discoverable without creating a second scoring flow', () => {
  const Entry = load('components/QuizLeagueEntry.js').default;
  const normal = renderToStaticMarkup(React.createElement(Entry));
  const research = renderToStaticMarkup(React.createElement(Entry, { practice: true }));
  assert.match(normal, /href="\/quiz-app"/);
  assert.match(normal, /href="\/quiz-app\/leaderboard"/);
  assert.match(research, /href="\/quiz-app\/run\?topic=Jagdpraxis"/);
  assert.doesNotMatch(research, /country=/);
  assert.match(research, /separate Lernübungen ohne Ranglistenpunkte/);
  assert.match(research, /öffentlichen Quiznamen/);
  assert.match(research, /auf dem Server geprüft/);
  assert.doesNotMatch(normal + research, /Wochenrangliste|<button/);
});

test('Quiz setup keeps its start action and legal-country controls without a duplicate page menu', () => {
  const { QUESTIONS } = load('data/questions-full.js');
  const options = load('lib/quiz-learning-scope.js').quizLearningOptions(QUESTIONS);
  const slots = []; let cursor = 0;
  const Setup = load('components/QuizSetup.js', { '../lib/use-exam-profile': { useExamProfile: () => ({ profile: null, ready: true }) }, './ExamProfileSummary': { __esModule: true, default: () => null }, react: { ...React, useState(initial) { const index = cursor++; slots[index] ??= initial; return [slots[index], value => { slots[index] = value; }]; } } }).default;
  const render = () => { cursor = 0; return Setup({ ...options, initialCountry: 'DE', initialTopic: 'Alle' }); };
  let tree = render();
  assert.doesNotMatch(renderToStaticMarkup(tree), /aria-label="Quizmenü"/);
  assert.match(renderToStaticMarkup(tree), /href="\/quiz-app\/run\?topic=Alle"/);
  assert.equal(find(tree, node => node.type === 'fieldset'), null);
  find(tree, node => node.type === 'select').props.onChange({ target: { value: 'Recht' } }); tree = render();
  assert.ok(find(tree, node => node.type === 'fieldset'));
  find(tree, node => node.type === 'button' && text(node).includes('Schweiz')).props.onClick(); tree = render();
  assert.match(renderToStaticMarkup(tree), /href="\/quiz-app\/run\?country=CH&amp;topic=Recht"/);
  find(tree, node => node.type === 'select').props.onChange({ target: { value: 'Jagdpraxis' } }); tree = render();
  assert.equal(find(tree, node => node.type === 'fieldset'), null);
  assert.match(renderToStaticMarkup(tree), /href="\/quiz-app\/run\?topic=Jagdpraxis"/);
  assert.match(renderToStaticMarkup(tree), /beste vollständig abgeschlossene Runde/);
});

test('Shared search finds the quiz and the leaderboard directly in existing learning categories', () => {
  const search = load('lib/learning-search.js').searchLearning;
  for (const query of ['Rangliste', 'Bestenliste']) {
    const found = search({ query, type: 'tool', category: 'jagdpraxis' }).results;
    assert.ok(found.some(item => item.href === '/quiz-app'), query);
    assert.ok(found.some(item => item.href === '/quiz-app/leaderboard'), query);
    assert.equal(new Set(found.map(item => item.href)).size, found.length);
  }
});
