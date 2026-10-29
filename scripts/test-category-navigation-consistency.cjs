const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const Link = ({ href, children }) => React.createElement('a', { href }, children);
const overrides = { 'next/link': Link };
const load = createLoader(overrides);
const { learningCategoryDetails } = load('lib/learning-categories.js');
const { QUESTIONS, PACK_INFO } = load('data/questions-full.js');
const { quizLearningPool } = load('lib/quiz-learning-scope.js');
const titles = learningCategoryDetails.map(category => category.title);
const escaped = text => text.replaceAll('&', '&amp;');
function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
function words(tree) {
  if (Array.isArray(tree)) return tree.map(words).join('');
  if (tree == null || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? words(tree.props?.children) : String(tree);
}

test('The learning category grid and quiz select expose the same twelve category names in menu order', async () => {
  const Menu = load('components/LearningCategoryMenu.js').default;
  const menu = Menu({ counts: {} });
  assert.deepEqual(nodes(menu, node => node.type === 'strong').map(words), titles);
  assert.deepEqual(nodes(menu, node => node.type === Link).map(node => node.props.href), learningCategoryDetails.map(category => `/lernen/${category.slug}`));
  const Page = load('app/quiz-app/page.jsx').default;
  const page = await Page({});
  const html = renderToStaticMarkup(page);
  const options = [...html.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g)];
  assert.deepEqual(options.slice(1).map(option => option[2].replace(/ \(\d+ Fragen\)$/, '')), titles.map(escaped));
  assert.equal(options.length, 13, 'One all-category option plus the twelve canonical categories');
  assert.equal(options[7][1], 'Recht', 'The established law pool keeps its internal value at the canonical Jagdrecht position');
});

test('Every supported old quiz-topic link keeps its exact question pool without creating a new category', async () => {
  const Page = load('app/quiz-app/page.jsx').default;
  let legacyCount = 0;
  for (const topic of PACK_INFO.topics) {
    const page = await Page({ searchParams: { topic, country: 'CH' } });
    assert.equal(page.props.commonOptions.topics.length, 11);
    if (!page.props.legacyTopic) continue;
    legacyCount++;
    const legacy = page.props.legacyTopic;
    assert.ok([...titles, 'Alle'].includes(legacy.category), `${topic}: visible parent must exist in the category menu`);
    assert.equal(legacy.name, topic);
    assert.equal(legacy.count, quizLearningPool(QUESTIONS, { topic }).length);
    const html = renderToStaticMarkup(page);
    assert.ok(html.includes(`href="/quiz-app/run?topic=${encodeURIComponent(topic)}"`), topic);
    assert.ok(html.includes(`value="${escaped(legacy.category)}" selected=""`), topic);
    assert.ok(html.includes(`aus ${legacy.count} verfügbaren Fragen`), topic);
    assert.equal((html.match(/<option /g) || []).length, 13, topic);
  }
  assert.ok(legacyCount > 5, 'Exercise all actual supported legacy topics, not just one illustrative alias');
});

test('Expanding an old narrow quiz topic changes the real start link and question count to its visible category', async () => {
  const Page = load('app/quiz-app/page.jsx').default;
  const page = await Page({ searchParams: { topic: 'Waffensicherheit' } });
  assert.equal(page.props.legacyTopic.category, 'Waffen & Sicherheit');
  const state = [];
  let cursor = 0;
  const ui = createLoader({ ...overrides, '../lib/use-exam-profile': { useExamProfile: () => ({ profile: null, ready: true }) }, './ExamProfileSummary': { __esModule: true, default: () => null }, react: { ...React, useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
  } } });
  const Setup = ui('components/QuizSetup.js').default;
  const render = () => { cursor = 0; return Setup(page.props); };
  const narrow = render();
  const button = nodes(narrow, node => node.type === 'button' && words(node) === 'Ganze Kategorie')[0];
  assert.ok(button);
  assert.equal(nodes(narrow, node => node.type === Link)[0].props.href, '/quiz-app/run?topic=Waffensicherheit');
  button.props.onClick();
  const broad = render();
  assert.equal(nodes(broad, node => node.type === 'select')[0].props.value, 'Waffen & Sicherheit');
  assert.equal(nodes(broad, node => node.type === Link)[0].props.href, '/quiz-app/run?topic=Waffen%20%26%20Sicherheit');
  assert.equal(nodes(broad, node => node.type === 'button' && words(node) === 'Ganze Kategorie').length, 0);
  const available = page.props.commonOptions.topics.find(topic => topic.name === 'Waffen & Sicherheit').count;
  assert.ok(words(broad).includes(`aus ${available} verfügbaren Fragen`));
});
