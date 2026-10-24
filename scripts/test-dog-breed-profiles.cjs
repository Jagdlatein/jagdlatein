// Route and presentation tests reuse the existing authored breed corpus;
// they do not claim a new independent review of its breed statements.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react'), swc = local('next/dist/build/swc');
const { renderToStaticMarkup } = local('react-dom/server');
const Link = ({ href, children, prefetch, ...props }) => React.createElement('a', { href, ...props }, children);
const load = createLoader({ 'next/link': { __esModule: true, default: Link },
  'next/image': { __esModule: true, default: ({ priority, ...props }) => React.createElement('img', props) } });
const { dogBreeds, dogWorkTasks, dogCompassSources } = load('lib/dog-compass.js');
const { dogBreedProfileHref, legacyDogBreedTarget } = load('lib/dog-breed-routing.js');
const { createDogBreedTopics, default: DogBreedProfile } = load('components/DogBreedProfile.js');
const { resolveTopicSection } = load('components/TopicSectionReader.js');
const route = load('pages/lernen/jagdhunde/[rasse].js');
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean) || null;
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}

test('Every one of the 59 existing breeds has a unique static detail route with only its own profile and selected task props', async () => {
  assert.equal(dogBreeds.length, 59);
  assert.equal(new Set(dogBreeds.map(profile => profile.id)).size, dogBreeds.length);
  const paths = await route.getStaticPaths();
  assert.equal(paths.fallback, false);
  assert.deepEqual(paths.paths, dogBreeds.map(profile => ({ params: { rasse: profile.id } })));
  for (const profile of dogBreeds) {
    const { props } = await route.getStaticProps({ params: { rasse: profile.id } });
    assert.deepEqual(Object.keys(props).sort(), ['labrador', 'weimaraner'].includes(profile.id)
      ? ['contextSources', 'healthKnowledge', 'profile', 'tasks'] : ['contextSources', 'profile', 'tasks']);
    assert.deepEqual(props.profile, profile);
    assert.deepEqual(props.tasks, dogWorkTasks.filter(task => profile.tasks.includes(task.id)));
    assert.deepEqual(props.contextSources, dogCompassSources);
    assert.equal(Object.hasOwn(props, 'dogBreeds'), false);
    assert.ok(JSON.stringify(props).length < 14000, `${profile.id}: no complete breed corpus in one route`);
    const page = route.default(props);
    assert.equal(page.key, profile.id, 'Changing breed replaces the selected reader state');
  }
  for (const rasse of ['missing', '__proto__', ['pointer'], 'pointer/../../konto', undefined])
    assert.deepEqual(await route.getStaticProps({ params: { rasse } }), { notFound: true });
});

test('Each breed exposes exactly five own topics with unchanged teaching text, closed final sources and existing photo provenance', () => {
  const expected = ['rasse-erkennen', 'arbeitsprofil', 'ausbildung', 'alltag-pflege', 'grenzen'];
  let photoCount = 0;
  for (const profile of dogBreeds) {
    const tasks = dogWorkTasks.filter(task => profile.tasks.includes(task.id));
    const groups = createDogBreedTopics(profile, tasks, dogCompassSources);
    assert.equal(groups.length, 1); assert.equal(groups[0].title, profile.name);
    assert.deepEqual(groups[0].topics.map(topic => topic.id), expected);
    assert.equal(resolveTopicSection(groups, `#dog-${profile.id}`).topic.id, 'rasse-erkennen', 'Existing portrait hash remains an alias');
    for (const topic of groups[0].topics) {
      assert.equal(resolveTopicSection(groups, `#${topic.id}`).topic, topic);
      const tree = topic.render(), children = React.Children.toArray(tree.props.children);
      assert.equal(children.at(-1).type.name, 'BreedSources', `${profile.id}/${topic.id}: source block is last`);
      const html = renderToStaticMarkup(tree), sourceStart = html.indexOf('<details');
      assert.ok(sourceStart > 0); assert.match(html, /<details class="sources"><summary>Quellen und vorhandener Dokumentationsstand<\/summary>/);
      assert.ok(html.includes(escapeHTML(profile.source.url)));
      assert.ok(html.includes(profile.reviewedOn));
      assert.match(html, /keine neue vollständige fachliche Prüfung/);
      const teaching = html.slice(0, sourceStart);
      const fields = { 'rasse-erkennen': ['summary'], arbeitsprofil: ['work'], ausbildung: ['training'], 'alltag-pflege': ['everyday', 'care'], grenzen: ['boundary'] }[topic.id];
      for (const field of fields) assert.ok(teaching.includes(escapeHTML(profile[field])), `${profile.id}/${topic.id}: original ${field} remains immediately readable`);
      assert.equal(teaching.includes('fci.be'), false);
      if (topic.id === 'rasse-erkennen') {
        assert.equal((html.match(/<img /g) || []).length, profile.photo ? 1 : 0);
        if (profile.photo) { photoCount++; assert.ok(html.includes(profile.photo.src)); assert.ok(html.includes(escapeHTML(profile.photo.author))); }
      }
    }
    const layout = DogBreedProfile({ profile, tasks, contextSources: dogCompassSources });
    assert.equal(layout.props.title, profile.name); assert.equal(layout.props.headingOnly, true);
    const reader = find(layout, node => node.type?.name === 'TopicSectionReader');
    assert.equal(reader.props.menuFooter.props.href, '/lernen/jagdhunde');
  }
  assert.equal(photoCount, 7, 'Unphotographed breeds do not acquire substitute pictures');
});

test('All existing rasse query links redirect to the exact canonical profile; invalid values never form an external or foreign destination', async () => {
  const legacy = load('pages/lernen/jagdhund-kompass.js');
  for (const profile of dogBreeds) {
    const href = dogBreedProfileHref(profile.id);
    assert.equal(href, `/lernen/jagdhunde/${profile.id}#rasse-erkennen`);
    assert.equal(legacyDogBreedTarget({ rasse: profile.id }, dogBreeds), href);
    assert.deepEqual(await legacy.getServerSideProps({ query: { rasse: profile.id } }), { redirect: { destination: href, permanent: false } });
  }
  for (const rasse of [undefined, '', ['pointer'], 'missing', '__proto__', '//evil.invalid', '../konto', 'javascript:alert(1)']) {
    assert.equal(legacyDogBreedTarget({ rasse }, dogBreeds), '/lernen/jagdhunde');
    assert.deepEqual(await legacy.getServerSideProps({ query: { rasse } }), { redirect: { destination: '/lernen/jagdhunde', permanent: false } });
  }
});

test('Directory lists compact direct links while the Hundewesen catalog and search point to the new breed hub and profiles', () => {
  const compassLoad = createLoader({ react: { ...React, useEffect() {} }, 'next/link': { __esModule: true, default: Link } });
  const Compass = compassLoad('components/DogCompass.js').default;
  const html = renderToStaticMarkup(React.createElement(Compass));
  for (const profile of dogBreeds) assert.ok(html.includes(escapeHTML(dogBreedProfileHref(profile.id))), profile.id);
  assert.doesNotMatch(html, /class="breedDetails"|class="breedContent"|<img /);
  assert.equal((html.match(/aria-label="[^"]+ vergleichen"/g) || []).length, dogBreeds.length);
  const overview = load('lib/learning-overview-server.js').getLearningOverviewData('hundewesen');
  assert.ok(overview.resources.some(tool => tool.href === '/lernen/jagdhunde'));
  const { searchLearning } = load('lib/learning-search.js');
  for (const profile of dogBreeds) {
    const item = searchLearning({ query: profile.name, category: 'hundewesen', type: 'entry' }).results.find(item => item.id === `breed:${profile.id}`);
    assert.ok(item); assert.equal(item.href, dogBreedProfileHref(profile.id));
  }
});

test('The real browser page transform removes all server profile imports and the client profile component imports no giant curriculum or breed corpus', () => {
  const filename = path.join(root, 'pages/lernen/jagdhunde/[rasse].js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, isServerCompiler: false, disableNextSsg: false,
    pagesDir: path.join(root, 'pages'), jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'es6' } });
  assert.match(code, /__N_SSG/);
  assert.doesNotMatch(code, /dog-compass|dogWorkTasks|dogCompassSources|getStaticProps|getStaticPaths/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'components/DogBreedProfile.js'), 'utf8'), /import.*(?:dog-compass|dog-breed-expansion|learning-curriculum|learning-media)/);
});
