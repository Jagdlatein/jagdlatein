const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
let router = { isReady: true, query: {}, asPath: '/lernen/wildkunde' };
const Link = ({ href, children, prefetch, scroll, ...props }) => React.createElement('a', { ...props, href }, children);
const load = createLoader({
  'next/router': { useRouter: () => router },
  'next/link': Link,
  'next/head': ({ children }) => React.createElement(React.Fragment, null, children),
  'next/image': ({ priority, fill, ...props }) => React.createElement('img', props),
});
const { learningExperiences } = load('lib/learning-experiences.js');
const { learningCategoryDetails } = load('lib/learning-categories.js');
const { getLearningOverviewData } = load('lib/learning-overview-server.js');
const Overview = load('components/LearningOverview.js').default;
const tool = learningExperiences.find(item => item.href === '/lernen/wildjahr');
function overview(slug, query = {}) {
  router = { isReady: true, query, asPath: `/lernen/${slug}` };
  return new JSDOM(renderToStaticMarkup(React.createElement(Overview, { data: getLearningOverviewData(slug) })));
}

test('Wildjahr has one canonical short entry under the existing Wildkunde category and preserves its older search name', () => {
  assert.equal(learningCategoryDetails.length, 12, 'The existing main categories are unchanged');
  assert.equal(learningCategoryDetails.some(category => category.slug === 'wildjahr'), false);
  assert.equal(learningExperiences.filter(item => item.href === tool.href).length, 1);
  assert.equal(tool.title, 'Wildjahr');
  assert.equal(tool.subcategoryOf, 'wildkunde');
  assert.deepEqual(tool.categories, ['wildkunde', 'natur-revier']);
  assert.ok(tool.aliases.includes('Das Wildjahr'));
  assert.deepEqual(getLearningOverviewData('wildkunde').subcategoryTools, [{ href: tool.href, title: tool.title }]);
});

test('The actual Wildkunde overview shows eight keyword subcategories with one direct Wildjahr link before the optional directory', () => {
  const dom = overview('wildkunde');
  try {
    const document = dom.window.document;
    const tree = document.getElementById('learning-modules');
    const choices = [...tree.querySelectorAll('ul.branches > li > a')];
    const groups = getLearningOverviewData('wildkunde').topicGroups;
    assert.equal(choices.length, 8);
    assert.equal(choices[0].textContent, tool.title);
    assert.equal(choices[0].getAttribute('href'), tool.href);
    assert.equal(choices[0].closest('details'), null, 'The direct entry is visible with the other subcategories');
    assert.deepEqual(choices.slice(1).map(link => link.getAttribute('href')), groups.map(group => `/lernen/wildkunde?bereich=${group.id}#learning-modules`));
    assert.equal(document.querySelectorAll(`a[href="${tool.href}"]`).length, 1, 'No duplicate in the optional tool directory');
    assert.equal(tree.querySelectorAll('details, select, button, input, img').length, 0, 'The entry adds no window, chooser, search or picture');
    assert.equal(choices[0].getAttribute('target'), null);
    const data = getLearningOverviewData('wildkunde');
    assert.equal(data.resources.some(item => item.href === tool.href), false);
    assert.equal(Object.hasOwn(data.featuredMedia, tool.href), false, 'The simple entry transfers no unused photo');
  } finally { dom.window.close(); }
});

test('Existing course branches and Natur & Revier retain their original destinations without a second Wildjahr subcategory', () => {
  for (const category of learningCategoryDetails) {
    const data = getLearningOverviewData(category.slug);
    if (category.slug !== 'wildkunde') assert.deepEqual(data.subcategoryTools, [], category.slug);
  }
  const nature = getLearningOverviewData('natur-revier');
  assert.equal(nature.resources.filter(item => item.href === tool.href).length, 1);
  assert.equal(nature.resources.find(item => item.href === tool.href).title, tool.title);
  assert.ok(nature.featuredMedia[tool.href]);
  const data = getLearningOverviewData('wildkunde');
  for (const group of data.topicGroups) {
    const dom = overview('wildkunde', { bereich: group.id });
    try {
      const tree = dom.window.document.getElementById('learning-modules');
      assert.equal(tree.querySelector(`a[href="${tool.href}"]`), null, 'An opened course branch remains that branch');
      for (const module of data.modules.filter(module => group.moduleIds.includes(module.id))) {
        for (const topic of module.topics) assert.ok([...tree.querySelectorAll('a')].some(link => link.getAttribute('href') === topic.href), topic.href);
      }
    } finally { dom.window.close(); }
  }
});

test('The shared learning search uses the same Wildjahr title, direct route and established aliases in both existing categories', () => {
  const { searchLearning } = load('lib/learning-search.js');
  for (const category of ['all', 'wildkunde', 'natur-revier']) {
    for (const query of ['Wildjahr', 'Das Wildjahr', 'Wildkalender']) {
      const matches = searchLearning({ query, category, type: 'tool' }).results.filter(item => item.href === tool.href);
      assert.equal(matches.length, 1, `${category}/${query}`);
      assert.equal(matches[0].title, tool.title);
      assert.deepEqual(matches[0].categories, tool.categories);
    }
  }
});

test('The direct category entry requests normal top scrolling and the unchanged Wildjahr target focuses only its ready committed result', t => {
  const data = getLearningOverviewData('wildkunde');
  const direct = createLoader({
    react: { ...React, useRef: initial => ({ current: initial }), useEffect() {} },
    'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
  })('components/LearningTopicTree.js').default;
  const tree = direct({ category: data.categoryInfo, groups: data.topicGroups, modules: data.modules, entries: data.subcategoryTools });
  const link = nodes(tree, node => node.props?.href === tool.href)[0];
  assert.ok(link);
  assert.equal(text(link), tool.title);
  assert.equal(link.props.scroll, true, 'Next navigation resets to the destination top');
  assert.equal(link.props.shallow, undefined);
  assert.equal(link.props.target, undefined);
  assert.equal(link.props.onClick, undefined, 'No custom selection handler or extra intermediate view');
  const h = setup('components/WildYear.js', { art: 'gamswild' }, { ready: false, router: { asPath: `${tool.href}?art=gamswild` }, props: { currentMonth: 10, initialSelection: { slug: 'gamswild', month: 10 } } });
  t.after(() => h.dispose());
  const calls = [];
  h.nodes(node => node.props?.id === 'wildjahr-current')[0].props.ref.current = {
    focus(options) { calls.push(['focus', options]); },
    scrollIntoView(options) { calls.push(['scroll', options]); },
  };
  h.render();
  assert.deepEqual(calls, [], 'The unready router does not jump to a provisional selection');
  h.router.isReady = true;
  h.render();
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { block: 'start', behavior: 'auto' }]]);
  assert.match(text(h.nodes(node => node.props?.id === 'wildjahr-current')[0]), /Oktober/);
  assert.equal(h.calls.length, 0, 'Opening the direct entry does not rewrite valid art/month links');
});
