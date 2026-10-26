// Actual link and component rendering only; no video playback, browser or account data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const Link = ({ href, children, prefetch, ...props }) => React.createElement('a', { href, ...props }, children);
const load = createLoader({ 'next/link': { __esModule: true, default: Link } });
const { learningVideoLinks: links, getWildlifeVideoLinks, getDogBreedVideoLinks, getCourseVideoLinks } = load('lib/learning-video-links.js');
const { wildlifeVideoCases } = load('lib/wildlife-video-cases.js');
const { huntingDogVideoLessons } = load('lib/hunting-dog-video-lessons.js');
const { getLearningVideoLibrary } = load('lib/learning-video-library.js');
const { filterLearningVideos } = load('lib/video-library-search.js');
const { learningModules } = load('lib/learning-curriculum.js');
const { europeanWildlifeBySlug } = load('lib/european-wildlife-discovery.js');
const { dogBreeds, dogWorkTasks, dogCompassSources } = load('lib/dog-compass.js');
const Portrait = load('components/WildlifePortraitLayout.js').default;
const { createDogBreedTopics } = load('components/DogBreedProfile.js');
const { resolveTopicSection } = load('components/TopicSectionReader.js');
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function portraitGroups(slug) {
  return nodes(Portrait({ slug, title: europeanWildlifeBySlug[slug]?.name }), node => node.type?.name === 'TopicSectionReader')[0].props.groups;
}
const legacyHashes = {
  fuchs: '2bf4ecb22838db055767efa01c0f9672cc090013a41009bc092a4c2af4fd8a08',
  rotwild: 'e388c245bac20b4d31057629958445e1fa585bb1aafcb037a2ab17a3eafebfc2',
  schwarzwild: '2ed264121e3e13f92c3ca104de2b6205e5d54e8858c398ba75447fb62d1bfd4d',
  stockente: '1b3de1ce3fe4c168d7f08581303a740737e52ed11dcfd0bb5ab409cdaad9a2dc',
  rehwild: '18027569048a7881ff1abb2e9c09b468ce9cd5dbb959c293ab3d9f7e4eb54411',
  'basset-faehrtenende': '142095a928d473e1efd2b43a2f724d08b626c51271912371f46695715eacf705',
  'labrador-signal': '48834d2ef8ffd47d206e8e8bd51e99fce7bc053a9a774394e3384141f141e633',
  'golden-wasser': '2f5b02d2014fcddb36c28f8632f6b0171d23fd9701feafd4902d75597f2cce66',
  'rute-kontext': '780e7416ba3af2149cae7d8e15beba8e7e4417816ecd22e33d02c5bded27fdc8',
};

test('The lightweight catalog resolves every real clip once without importing any video, quiz or curriculum module', () => {
  const source = fs.readFileSync(path.join(root, 'lib/learning-video-links.js'), 'utf8');
  assert.doesNotMatch(source, /^\s*import\b|\brequire\s*\(/m);
  assert.doesNotMatch(source, /sourceIds|correctIds|questions:|\.webm|\.mp4|\.vtt/);
  const actual = [...wildlifeVideoCases.map(item => ({ ...item, kind: 'wild' })), ...huntingDogVideoLessons.map(item => ({ ...item, kind: 'hund' }))];
  assert.equal(links.length, actual.length);
  assert.equal(new Set(links.map(link => `${link.kind}:${link.id}`)).size, links.length);
  for (const item of actual) {
    const link = links.find(link => link.kind === item.kind && link.id === item.id);
    assert.ok(link, item.id); assert.equal(link.title, item.title);
    assert.ok(link.moduleIds.length > 0, `${item.id}: no orphan video`);
    assert.ok(link.moduleIds.every(id => learningModules.some(module => module.id === id)), item.id);
    assert.ok(link.speciesSlugs.every(slug => europeanWildlifeBySlug[slug]), item.id);
    assert.ok(link.breedIds.every(id => dogBreeds.some(profile => profile.id === id)), item.id);
    const url = new URL(link.href, 'https://jagdlatein.test');
    assert.equal(url.origin, 'https://jagdlatein.test');
    assert.equal(url.searchParams.get('eintrag'), item.id);
    assert.equal(url.pathname, item.kind === 'wild' ? '/lernen/wildtier-videofaelle' : '/lernen/jagdhund-videos');
    assert.equal(url.hash, item.kind === 'wild' ? '#video-fall' : '#hundevideo-film');
    if (item.kind === 'wild') assert.ok(link.moduleIds.includes(item.course.slice('/kurse/'.length)));
  }
});

test('All nine original full video objects retain their texts, questions, assets, licensing and review metadata exactly', () => {
  for (const [id, expected] of Object.entries(legacyHashes)) {
    const item = [...wildlifeVideoCases, ...huntingDogVideoLessons].find(item => item.id === id);
    assert.ok(item, id);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex'), expected, id);
  }
});

test('Exact species assignment adds one Videos topic to the existing portrait menu and no empty topics to other species', () => {
  for (const slug of Object.keys(europeanWildlifeBySlug)) {
    const groups = portraitGroups(slug), expected = getWildlifeVideoLinks(slug);
    const matches = groups.flatMap(group => group.topics).filter(topic => topic.id === 'portrait-videos');
    assert.equal(matches.length, expected.length ? 1 : 0, slug);
    assert.ok(!groups.some(group => group.id === 'portrait-videos'), 'No extra menu branch');
    for (const id of ['portrait-sounds', 'art-weiterlernen', 'portrait-jagdstatus'])
      assert.equal(resolveTopicSection(groups, `#${id}`).topic.id, id, `${slug}:${id}`);
    if (!expected.length) continue;
    const topic = matches[0]; assert.equal(topic.title, 'Videos');
    assert.equal(resolveTopicSection(groups, '#portrait-videos').topic, topic);
    const tree = topic.render(), anchors = nodes(tree, node => node.type === Link);
    assert.deepEqual(anchors.map(anchor => anchor.props.href), expected.map(link => link.href));
    assert.ok(anchors.every(anchor => anchor.props.prefetch === false && !anchor.props.target));
    const html = renderToStaticMarkup(tree);
    assert.doesNotMatch(html, /<video\b|<iframe\b|<dialog\b|target="_blank"|<details\b/);
  }
});

test('Only source-named Labrador and Golden profiles gain a Videos topic; no unnamed or absent Basset breed is invented', () => {
  for (const profile of dogBreeds) {
    const expected = getDogBreedVideoLinks(profile.id);
    const groups = createDogBreedTopics(profile, dogWorkTasks.filter(task => profile.tasks.includes(task.id)), dogCompassSources);
    assert.equal(groups.length, 1, profile.id);
    assert.deepEqual(groups[0].topics.slice(0, 5).map(topic => topic.id), ['rasse-erkennen', 'arbeitsprofil', 'ausbildung', 'alltag-pflege', 'grenzen']);
    const videoTopics = groups[0].topics.filter(topic => topic.id === 'videos');
    assert.equal(videoTopics.length, expected.length ? 1 : 0, profile.id);
    assert.equal(resolveTopicSection(groups, `#dog-${profile.id}`).topic.id, 'rasse-erkennen');
    if (expected.length) {
      assert.ok(['labrador', 'golden'].includes(profile.id));
      assert.equal(resolveTopicSection(groups, '#videos').topic, videoTopics[0]);
      const html = renderToStaticMarkup(videoTopics[0].render());
      for (const link of expected) assert.ok(html.includes(link.href));
      assert.doesNotMatch(html, /<video\b|<iframe\b|<dialog\b|target="_blank"/);
    }
  }
  assert.deepEqual(links.find(link => link.id === 'rute-kontext').breedIds, []);
  assert.deepEqual(links.find(link => link.id === 'basset-faehrtenende').breedIds, []);
});

test('Actual course rendering exposes exact direct video links only inside the existing lower menu, with no second player', () => {
  const noop = () => null;
  const Course = createLoader({
    'next/link': { __esModule: true, default: Link },
    'next/router': { useRouter: () => ({ asPath: '/kurse/test' }) },
    '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) },
    './CourseProgressNotice': { __esModule: true, default: noop },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-lower-menu': true }, children), closePageMenu() {} },
    '../lib/learning-media': { getLearningMedia: () => null },
    './LearningMedia': { LearningCover: noop, LearningDiagram: noop, BreedGallery: noop, WildlifeGallery: noop },
  })('components/LearningCourse.js').default;
  const selected = learningModules.filter(module => getCourseVideoLinks(module.id).length);
  const unmatched = learningModules.find(module => !getCourseVideoLinks(module.id).length);
  for (const module of [...selected, unmatched]) {
    const html = renderToStaticMarkup(React.createElement(Course, { module }));
    const menuEnd = html.indexOf('</aside>'), menu = html.slice(0, menuEnd), learning = html.slice(menuEnd);
    const expected = getCourseVideoLinks(module.id);
    for (const link of expected) {
      assert.ok(menu.includes(`href="${link.href}"`), `${module.id}:${link.id}`);
      assert.equal(learning.includes(link.href), false, 'Course body stays on its selected lesson');
    }
    assert.equal(menu.includes('aria-label="Videos"'), expected.length > 0);
    assert.doesNotMatch(html, /<video\b|<iframe\b|<dialog\b/);
    assert.ok(learning.includes(module.lessons[0].title.replaceAll('&', '&amp;')));
    assert.ok(learning.indexOf('learning-sources') > learning.indexOf('current-lesson-heading'));
  }
});

test('Existing combined video directory and search automatically include every linked clip with its canonical player URL', () => {
  const library = getLearningVideoLibrary();
  const { searchLearning } = load('lib/learning-search.js');
  assert.equal(library.length, links.length);
  for (const link of links) {
    const entry = library.find(entry => entry.id === `${link.kind === 'wild' ? 'wild' : 'hund'}-${link.id}`);
    assert.ok(entry, link.id); assert.equal(entry.href, link.href);
    assert.ok(filterLearningVideos(library, link.title).some(item => item.id === entry.id));
    assert.ok(searchLearning({ query: link.title }).results.some(item => item.href.split('#')[0] === link.href.split('#')[0]), `${link.id}: shared learning search`);
  }
});

test('Unknown, array and prototype-shaped selectors never return unrelated videos', () => {
  for (const value of [undefined, null, '', ['rehwild'], '__proto__', 'constructor', 'not-found'])
    for (const select of [getWildlifeVideoLinks, getDogBreedVideoLinks, getCourseVideoLinks]) assert.deepEqual(select(value), []);
});
