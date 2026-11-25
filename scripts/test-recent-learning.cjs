const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
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

test('The overview exposes three quiet dated links; category roots show branches and selection exposes only the chosen knowledge', async () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  let route = { isReady: true, query: {}, asPath: '/lernen' };
  const pageLoad = createLoader({ 'next/router': { useRouter: () => route }, 'next/head': () => null,
    'next/link': { __esModule: true, default: ({ href, prefetch, scroll, children, ...props }) => React.createElement('a', { href, ...props }, children) },
    'next/image': { __esModule: true, default: ({ priority, fill, ...props }) => React.createElement('img', props) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
  });
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
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://jagdlatein.invalid/lernen' }), globals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  dom.window.Storage.prototype.getItem = dom.window.Storage.prototype.setItem = () => { throw Error('No personal storage permitted'); };
  const host = document.getElementById('root'), reactRoot = local('react-dom/client').createRoot(host);
  const label = pageLoad('lib/learning-navigation-labels.js').getLearningNavigationLabel;
  async function renderSelection(category, href) {
    const url = new URL(href, 'https://jagdlatein.invalid');
    route = { isReady: true, query: Object.fromEntries(url.searchParams), asPath: href };
    dom.window.history.replaceState({}, '', href);
    await React.act(async () => { reactRoot.render(React.createElement(Component, { data: category })); });
    return host.innerHTML;
  }
  try { for (const slug of ['wildkunde', 'wald-pflanzen', 'landwirtschaft-lebensraeume']) {
    const category = getLearningOverviewData(slug);
    const rendered = await renderSelection(category, `/lernen/${slug}`);
    assert.ok(!rendered.includes('learning-recent-heading'));
    assert.ok(rendered.includes('Unterkategorien'));
    assert.doesNotMatch(rendered, /href="\/kurse\//, 'A category root no longer dumps every course');
    for (const group of category.topicGroups) {
      assert.ok(rendered.includes(`/lernen/${slug}?bereich=${group.id}#learning-modules`));
      const selected = await renderSelection(category, `/lernen/${slug}?bereich=${group.id}#learning-modules`);
      assert.ok(!selected.includes('learning-recent-heading'));
      const courseDetails = [...host.querySelectorAll('#learning-modules .courseList > li > details[name="learning-topic-course"]')];
      const visibleIds = courseDetails.map(detail => {
        const matches = category.modules.filter(module => group.moduleIds.includes(module.id) && label(module) === detail.querySelector('summary').textContent);
        assert.equal(matches.length, 1, 'Each selected course retains its exact unambiguous keyword label');
        return matches[0].id;
      });
      assert.deepEqual(visibleIds, group.moduleIds, 'No other branch leaks into a selected topic');
      for (let index = 0; index < courseDetails.length; index++) {
        const detail = courseDetails[index], module = category.modules.find(item => item.id === visibleIds[index]);
        assert.equal(detail.open, false, 'Course content opens only after its explicit native summary selection');
        await React.act(async () => detail.querySelector('summary').click()); assert.equal(detail.open, true);
        assert.deepEqual([...detail.querySelectorAll('.lessonLinks a')].map(link => link.getAttribute('href')), module.topics.map(topic => topic.href));
        const allowed = new Set([...module.topics.map(topic => topic.href), module.practice?.quizHref, module.practice?.cardHref].filter(Boolean));
        assert.ok([...detail.querySelectorAll('a')].every(link => allowed.has(link.getAttribute('href'))), 'All content and practice links belong to this exact course');
      }
    }
  } } finally {
    await React.act(async () => reactRoot.unmount()); dom.window.close();
    for (const [key, descriptor] of globals) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
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
