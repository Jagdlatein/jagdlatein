const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
let router = { isReady: true, query: {}, asPath: '/lernen/jagdrecht' };
const load = createLoader({
  'next/router': { useRouter: () => router },
  'next/link': ({ href, children, prefetch, scroll, ...props }) => React.createElement('a', { href, ...props }, children),
  'next/head': ({ children }) => React.createElement(React.Fragment, null, children),
  'next/image': ({ fill, priority, ...props }) => React.createElement('img', props),
});
const { learningCategoryDetails } = load('lib/learning-categories.js');
const { legalCountries } = load('lib/regional-law-core.js');
const { getLearningOverviewData } = load('lib/learning-overview-server.js');
const Tree = load('components/LearningTopicTree.js').default;
const Overview = load('components/LearningOverview.js').default;
const htmlFor = (slug, query = {}, overview = false) => {
  const data = getLearningOverviewData(slug);
  router = { isReady: true, query, asPath: `/lernen/${slug}` };
  return renderToStaticMarkup(React.createElement(overview ? Overview : Tree, overview ? { data } : { category: data.categoryInfo, groups: data.topicGroups, modules: data.modules }));
};
const escape = text => text.replaceAll('&', '&amp;');

test('Jagdrecht exposes each existing country directly inside its subcategories before general legal foundations', () => {
  const html = htmlFor('jagdrecht', {}, true);
  const treeStart = html.indexOf('<section id="learning-modules"');
  const tree = html.slice(treeStart, html.indexOf('</section>', treeStart));
  assert.match(tree, /<h2[^>]*>Unterkategorien<\/h2>/);
  assert.match(tree, /<h3[^>]*><a href="\/jagdrecht">Land &amp; Region<\/a><\/h3>/, 'The existing country overview remains reachable inside the category');
  const list = tree.match(/<ul[^>]*aria-label="Jagdrecht nach Land und Region"[^>]*>(.*?)<\/ul>/s)?.[1];
  assert.ok(list, 'The country choice is visible without a new window, select or accordion');
  assert.deepEqual([...list.matchAll(/href="([^"]+)"/g)].map(match => match[1]), legalCountries.map(country => `/jagdrecht/${country.slug}`));
  for (const country of legalCountries) {
    assert.ok(list.includes(`<strong>${country.name}</strong>`));
    assert.ok(list.includes(`aria-label="Jagdrecht ${country.name}"`));
    assert.equal((tree.match(new RegExp(`href="/jagdrecht/${country.slug}"`, 'g')) || []).length, 1);
    assert.ok(tree.indexOf(`href="/jagdrecht/${country.slug}"`) < tree.indexOf('>Grundlagen</h3>'));
  }
  assert.doesNotMatch(list, /<select|<button|<details|target="_blank"/);
  const data = getLearningOverviewData('jagdrecht');
  const oldTargets = [...tree.matchAll(/href="([^"]*\?bereich=[^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(oldTargets, data.topicGroups.map(group => `/lernen/jagdrecht?bereich=${encodeURIComponent(group.id)}#learning-modules`));
  for (const group of data.topicGroups) assert.ok(tree.includes(escape(group.title)));
});

test('Existing legal branch and course deep links keep their exact lesson targets without inserting country choices into the lesson', () => {
  const data = getLearningOverviewData('jagdrecht');
  const byId = new Map(data.modules.map(module => [module.id, module]));
  for (const group of data.topicGroups) for (const id of group.moduleIds) {
    const course = byId.get(id);
    if (!course) continue;
    const html = htmlFor('jagdrecht', { bereich: group.id, kurs: id });
    assert.doesNotMatch(html, /Jagdrecht nach Land und Region|>Land &amp; Region<|>Grundlagen<\/h3>/);
    assert.equal((html.match(/<details[^>]* open=""/g) || []).length, 1, id);
    for (const topic of course.topics) assert.ok(html.includes(`href="${escape(topic.href)}"`), topic.href);
  }
});

test('The other eleven canonical learning categories receive no country division', () => {
  assert.equal(learningCategoryDetails.length, 12);
  for (const category of learningCategoryDetails.filter(item => item.slug !== 'jagdrecht')) {
    const html = htmlFor(category.slug);
    assert.doesNotMatch(html, /Jagdrecht nach Land und Region|href="\/jagdrecht\/(?:ch|de|at)"|>Land &amp; Region</, category.slug);
  }
});
