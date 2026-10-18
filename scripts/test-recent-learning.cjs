const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const load = createLoader();
const { getRecentLearningModules } = load('lib/recent-learning.js');

test('Recent courses prefer the latest actual addition date, diversify ties, and reject invalid dates or duplicates', () => {
  const rows = [
    { id: 'a', category: 'Wildkunde', contentAddedOn: '2026-10-18' },
    { id: 'b', category: 'Wildkunde', contentAddedOn: '2026-10-18' },
    { id: 'c', category: 'Hundewesen', contentAddedOn: '2026-10-18' },
    { id: 'older', category: 'Natur & Revier', contentAddedOn: '2026-10-17' },
    { id: 'invalid', category: 'Natur & Revier', contentAddedOn: '2026-02-30' },
    { id: 'missing', category: 'Natur & Revier' },
    { id: 'a', category: 'Wildkunde', contentAddedOn: '2026-10-18' },
  ];
  const original = JSON.stringify(rows);
  assert.deepEqual(getRecentLearningModules(rows).map(m => m.id), ['a', 'c', 'b']);
  assert.deepEqual(getRecentLearningModules(rows, 6).map(m => m.id), ['a', 'c', 'b', 'older']);
  assert.deepEqual(getRecentLearningModules(rows, 0), []);
  assert.deepEqual(getRecentLearningModules(rows, 7), []);
  assert.deepEqual(getRecentLearningModules([], 3), []);
  assert.equal(JSON.stringify(rows), original);
});

test('The actual overview exposes at most three quiet dated links after categories and search; category pages keep their own complete list', () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const pageLoad = createLoader({ 'next/router': { useRouter: () => ({ query: {}, asPath: '/lernen' }) }, 'next/head': () => null });
  const { getLearningOverviewData } = pageLoad('lib/learning-overview-server.js');
  const Component = pageLoad('components/LearningOverview.js').default;
  const data = getLearningOverviewData();
  const html = renderToStaticMarkup(React.createElement(Component, { data }));
  const section = html.split('aria-labelledby="learning-recent-heading"')[1].split('</section>')[0];
  assert.equal((section.match(/<a /g) || []).length, 3);
  assert.equal((section.match(/<time /g) || []).length, 3);
  assert.doesNotMatch(section, /<button|<img|<details/);
  for (const module of getRecentLearningModules(data.modules)) {
    assert.ok(section.includes(`/kurse/${module.id}`));
    assert.ok(section.includes(module.title.replaceAll('&', '&amp;')));
  }
  assert.ok(html.indexOf('learning-categories-heading') < html.indexOf('learning-recent-heading'));
  assert.ok(html.indexOf('all-search-title') < html.indexOf('learning-recent-heading'));
  for (const slug of ['wildkunde', 'wald-pflanzen', 'landwirtschaft-lebensraeume']) {
    const category = getLearningOverviewData(slug);
    const rendered = renderToStaticMarkup(React.createElement(Component, { data: category }));
    assert.ok(!rendered.includes('learning-recent-heading'));
    assert.ok(category.modules.every(m => rendered.includes(`/kurse/${m.id}`)));
  }
});

test('Every course explicitly marked as advanced appears in its category path regardless of its naming convention', () => {
  const { learningModules, learningPaths } = load('lib/learning-curriculum.js');
  const { getLearningCategoryByTitle } = load('lib/learning-categories.js');
  for (const module of learningModules.filter(m => /\bVertiefung\b/.test(m.level || ''))) {
    const category = getLearningCategoryByTitle(module.category);
    const path = learningPaths.find(p => p.id === `vertiefung-${category.slug}`);
    assert.ok(path.moduleIds.includes(module.id), module.id);
  }
  for (const path of learningPaths) {
    assert.equal(new Set(path.moduleIds).size, path.moduleIds.length);
    assert.ok(path.moduleIds.every(id => learningModules.some(module => module.id === id)));
  }
});
